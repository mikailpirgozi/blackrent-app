"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const date_fns_1 = require("date-fns");
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const postgres_database_1 = require("../models/postgres-database");
const rentalDaysCalculator_1 = require("../utils/rentalDaysCalculator");
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
        // Availability request debug removed
        let startDate;
        let endDate;
        if (customStartDate && customEndDate) {
            // Custom date range (od-do)
            startDate = (0, date_fns_1.startOfDay)(new Date(customStartDate));
            endDate = (0, date_fns_1.startOfDay)(new Date(customEndDate));
            // Custom date range debug removed
        }
        else if (year && month) {
            // Ak sú zadané rok a mesiac, zobraziť celý mesiac (pre navigáciu)
            const targetYear = Number(year);
            const targetMonth = Number(month) - 1;
            startDate = (0, date_fns_1.startOfMonth)(new Date(targetYear, targetMonth));
            endDate = (0, date_fns_1.endOfMonth)(startDate);
            // Month navigation debug removed
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
                    // Phase 1 debug removed
                    break;
                case 'past':
                    // FÁZA 2: Minulé dáta (3 mesiace dozadu)
                    startDate = (0, date_fns_1.addDays)(today, -90);
                    endDate = (0, date_fns_1.addDays)(currentMonth, -1); // Do konca predchádzajúceho mesiaca
                    // Phase 2 debug removed
                    break;
                case 'future':
                    // FÁZA 3: Budúce dáta (6 mesiacov dopredu)
                    startDate = (0, date_fns_1.addDays)(endOfCurrentMonth, 1); // Od začiatku nasledujúceho mesiaca
                    endDate = (0, date_fns_1.addDays)(today, 180);
                    // Phase 3 debug removed
                    break;
                default:
                    // PÔVODNÉ SPRÁVANIE: Celý rozšírený rozsah (pre backward compatibility)
                    startDate = (0, date_fns_1.addDays)(today, -90);
                    endDate = (0, date_fns_1.addDays)(today, 180);
                // Full range debug removed
            }
        }
        // Date range debug removed
        // 🚀 FÁZA 1.2: UNIFIED SQL QUERY - 1 optimalizovaný query namiesto 3 + JS processing
        // Unified query debug removed
        const unifiedResult = await postgres_database_1.postgresDatabase.getCalendarDataUnified(startDate, endDate);
        // Calendar data loaded debug removed
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
                // ✅ MIGRÁCIA: Používame centrálnu utility funkciu calculateRentalDays (bez +1)
                dayCount: (0, rentalDaysCalculator_1.calculateRentalDays)(startDate, endDate)
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
            // Response optimization debug removed
        }
        // 🚀 FÁZA 2.4: STRUCTURE OPTIMIZATION (if requested)
        let finalResponseData = responseData;
        let structureOptimization = null;
        if (optimize === 'true' && responseData.calendar && responseData.vehicles) {
            const structureOptimized = optimizeDataStructure(responseData);
            finalResponseData = structureOptimized.data;
            structureOptimization = structureOptimized.meta;
            // Structure optimization debug removed
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
        // Test endpoint debug removed
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