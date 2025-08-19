"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const date_fns_1 = require("date-fns");
const router = (0, express_1.Router)();
// 🚀 FÁZA 2.4: DATA STRUCTURE OPTIMIZATION helper function
function optimizeDataStructure(data) {
    const startTime = Date.now();
    const originalSize = JSON.stringify(data).length;
    // Create vehicle lookup map
    const vehicleLookup = {};
    const compactVehicles = data.vehicles.map((vehicle, index) => {
        vehicleLookup[vehicle.id] = index;
        return {
            id: vehicle.id,
            b: vehicle.brand, // brand
            m: vehicle.model, // model  
            lp: vehicle.licensePlate, // licensePlate
            s: vehicle.status // status
        };
    });
    // Optimize calendar structure
    const compactCalendar = data.calendar.map((day) => ({
        d: day.date, // date
        v: day.vehicles.map((vehicle) => ({
            vi: vehicleLookup[vehicle.vehicleId], // vehicle index
            s: vehicle.status, // status
            ...(vehicle.rentalId && { ri: vehicle.rentalId }),
            ...(vehicle.customerName && { cn: vehicle.customerName }),
            ...(vehicle.isFlexible && { f: 1 }),
            ...(vehicle.unavailabilityType && { ut: vehicle.unavailabilityType })
        }))
    }));
    const optimizedData = {
        calendar: compactCalendar,
        vehicles: compactVehicles,
        ...(data.rentals && { rentals: data.rentals }),
        ...(data.unavailabilities && { unavailabilities: data.unavailabilities }),
        ...(data.period && { period: data.period })
    };
    const optimizedSize = JSON.stringify(optimizedData).length;
    const sizeSaved = originalSize - optimizedSize;
    const compressionRatio = ((sizeSaved / originalSize) * 100).toFixed(1);
    const processingTime = Date.now() - startTime;
    return {
        data: optimizedData,
        meta: {
            originalSize,
            optimizedSize,
            sizeSaved,
            compressionRatio: compressionRatio + '%',
            processingTime: processingTime + 'ms'
        }
    };
}
// GET /api/availability/calendar - Kalendárne dáta pre mesiac
router.get('/calendar', auth_1.authenticateToken, async (req, res) => {
    try {
        // 🚀 FÁZA 2.4: FIELD SELECTION a OPTIMIZATION - umožni vybrať len potrebné polia a optimalizovať štruktúru
        const { year, month, startDate: customStartDate, endDate: customEndDate, phase, fields, optimize } = req.query;
        console.log('🗓️ Availability calendar request:', { year, month, customStartDate, customEndDate, phase });
        let startDate;
        let endDate;
        if (customStartDate && customEndDate) {
            // Custom date range (od-do)
            startDate = (0, date_fns_1.startOfDay)(new Date(customStartDate));
            endDate = (0, date_fns_1.startOfDay)(new Date(customEndDate));
            console.log('📅 Using custom date range:', { startDate, endDate });
        }
        else if (year && month) {
            // Ak sú zadané rok a mesiac, zobraziť celý mesiac (pre navigáciu)
            const targetYear = Number(year);
            const targetMonth = Number(month) - 1;
            startDate = (0, date_fns_1.startOfMonth)(new Date(targetYear, targetMonth));
            endDate = (0, date_fns_1.endOfMonth)(startDate);
            console.log('📅 Using month navigation:', { startDate, endDate });
        }
        else {
            // 🚀 PROGRESSIVE LOADING: Optimalizované načítanie podľa fázy
            const today = (0, date_fns_1.startOfDay)(new Date());
            const currentMonth = (0, date_fns_1.startOfMonth)(today);
            const endOfCurrentMonth = (0, date_fns_1.endOfMonth)(today);
            switch (phase) {
                case 'current':
                    // FÁZA 1: Len aktuálny mesiac (najrýchlejšie)
                    startDate = currentMonth;
                    endDate = endOfCurrentMonth;
                    console.log('🎯 PHASE 1: Loading current month only:', { startDate, endDate });
                    break;
                case 'past':
                    // FÁZA 2: Minulé dáta (3 mesiace dozadu)
                    startDate = (0, date_fns_1.addDays)(today, -90);
                    endDate = (0, date_fns_1.addDays)(currentMonth, -1); // Do konca predchádzajúceho mesiaca
                    console.log('📜 PHASE 2: Loading past data (-90 days to current month):', { startDate, endDate });
                    break;
                case 'future':
                    // FÁZA 3: Budúce dáta (6 mesiacov dopredu)
                    startDate = (0, date_fns_1.addDays)(endOfCurrentMonth, 1); // Od začiatku nasledujúceho mesiaca
                    endDate = (0, date_fns_1.addDays)(today, 180);
                    console.log('🔮 PHASE 3: Loading future data (next month to +180 days):', { startDate, endDate });
                    break;
                default:
                    // PÔVODNÉ SPRÁVANIE: Celý rozšírený rozsah (pre backward compatibility)
                    startDate = (0, date_fns_1.addDays)(today, -90);
                    endDate = (0, date_fns_1.addDays)(today, 180);
                    console.log('📅 FULL RANGE: Loading complete extended range (-90 to +180 days):', { startDate, endDate });
            }
        }
        console.log('📅 Date range:', { startDate, endDate });
        // 🚀 FÁZA 1.2: UNIFIED SQL QUERY - 1 optimalizovaný query namiesto 3 + JS processing
        console.log('🚀 Using unified calendar data query...');
        const unifiedResult = await postgres_database_1.postgresDatabase.getCalendarDataUnified(startDate, endDate);
        console.log('✅ Unified calendar data loaded:', {
            calendarDays: unifiedResult.calendar.length,
            vehicles: unifiedResult.vehicles.length,
            unavailabilities: unifiedResult.unavailabilities.length
        });
        // Extrakcia dát z unified result
        const calendarData = unifiedResult.calendar;
        const vehicles = unifiedResult.vehicles;
        const monthRentals = unifiedResult.rentals;
        const monthUnavailabilities = unifiedResult.unavailabilities;
        // 🚀 FÁZA 2.4: FIELD SELECTION - optimalizuj response size
        const requestedFields = fields ? fields.split(',').map(f => f.trim()) : [];
        const includeAllFields = requestedFields.length === 0;
        // Vytvor optimalizovaný response na základe requested fields
        const responseData = {};
        if (includeAllFields || requestedFields.includes('calendar')) {
            responseData.calendar = calendarData;
        }
        if (includeAllFields || requestedFields.includes('vehicles')) {
            responseData.vehicles = vehicles;
        }
        if (includeAllFields || requestedFields.includes('rentals')) {
            responseData.rentals = monthRentals;
        }
        if (includeAllFields || requestedFields.includes('unavailabilities')) {
            responseData.unavailabilities = monthUnavailabilities;
        }
        if (includeAllFields || requestedFields.includes('period')) {
            responseData.period = {
                startDate: (0, date_fns_1.format)(startDate, 'yyyy-MM-dd'),
                endDate: (0, date_fns_1.format)(endDate, 'yyyy-MM-dd'),
                type: (year && month) ? 'month' : 'days',
                year: year ? Number(year) : startDate.getFullYear(),
                month: month ? Number(month) : startDate.getMonth() + 1,
                // 🚀 PROGRESSIVE LOADING: Metadata o fáze
                phase: phase || 'full',
                isProgressive: !!phase,
                dayCount: Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1
            };
        }
        // 🚀 FÁZA 2.4: RESPONSE SIZE LOGGING
        const originalSize = JSON.stringify({
            calendar: calendarData,
            vehicles: vehicles,
            rentals: monthRentals,
            unavailabilities: monthUnavailabilities,
            period: responseData.period || {}
        }).length;
        const optimizedSize = JSON.stringify(responseData).length;
        const sizeSaved = originalSize - optimizedSize;
        const percentSaved = sizeSaved > 0 ? ((sizeSaved / originalSize) * 100).toFixed(1) : '0';
        if (sizeSaved > 0) {
            console.log(`📦 RESPONSE OPTIMIZED: ${originalSize} → ${optimizedSize} bytes (${percentSaved}% smaller)`);
        }
        // 🚀 FÁZA 2.4: STRUCTURE OPTIMIZATION (if requested)
        let finalResponseData = responseData;
        let structureOptimization = null;
        if (optimize === 'true' && responseData.calendar && responseData.vehicles) {
            const structureOptimized = optimizeDataStructure(responseData);
            finalResponseData = structureOptimized.data;
            structureOptimization = structureOptimized.meta;
            console.log(`🎯 STRUCTURE OPTIMIZED: Additional ${structureOptimization.compressionRatio} size reduction`);
        }
        res.json({
            success: true,
            data: finalResponseData,
            // 🚀 FÁZA 2.4: Response metadata
            _meta: {
                originalSize: originalSize,
                optimizedSize: optimizedSize,
                compressionRatio: percentSaved + '%',
                requestedFields: requestedFields.length > 0 ? requestedFields : 'all',
                ...(structureOptimization && { structureOptimization })
            }
        });
    }
    catch (error) {
        console.error('❌ Get availability calendar error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní kalendárnych dát'
        });
    }
});
// GET /api/availability/test - Jednoduchý test endpoint BEZ autentifikácie
router.get('/test', async (req, res) => {
    try {
        console.log('🧪 Availability test endpoint called');
        // SIMPLIFIED: Test without getRentals()
        const vehicles = await postgres_database_1.postgresDatabase.getVehicles();
        res.json({
            success: true,
            message: 'Availability API funguje!',
            data: {
                vehicleCount: vehicles.length,
                rentalCount: 0, // Simplified for now
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('❌ Availability test error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri testovaní availability API'
        });
    }
});
exports.default = router;
//# sourceMappingURL=availability.js.map