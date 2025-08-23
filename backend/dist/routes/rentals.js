"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../middleware/permissions");
const websocket_service_1 = require("../services/websocket-service");
const router = (0, express_1.Router)();
// 🔍 CONTEXT FUNCTIONS
const getRentalContext = async (req) => {
    const rentalId = req.params.id;
    if (!rentalId)
        return {};
    const rental = await postgres_database_1.postgresDatabase.getRental(rentalId);
    if (!rental || !rental.vehicleId)
        return {};
    // Získaj vehicle pre company context
    const vehicle = await postgres_database_1.postgresDatabase.getVehicle(rental.vehicleId);
    return {
        resourceCompanyId: vehicle?.ownerCompanyId,
        amount: rental.totalPrice
    };
};
// GET /api/rentals/paginated - Získanie prenájmov s pagination a filtrami
router.get('/paginated', auth_1.authenticateToken, (0, permissions_1.checkPermission)('rentals', 'read'), async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '', dateFilter = 'all', dateFrom = '', dateTo = '', company = 'all', status = 'all', protocolStatus = 'all', paymentMethod = 'all', paymentStatus = 'all', vehicleBrand = 'all', priceMin = '', priceMax = '' } = req.query;
        console.log('🚗 Rentals PAGINATED GET - params:', {
            page, limit, search, dateFilter, company, status,
            role: req.user?.role,
            userId: req.user?.id
        });
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        // Získaj paginated rentals s filtrami
        const result = await postgres_database_1.postgresDatabase.getRentalsPaginated({
            limit: limitNum,
            offset,
            search: search,
            dateFilter: dateFilter,
            dateFrom: dateFrom,
            dateTo: dateTo,
            company: company,
            status: status,
            protocolStatus: protocolStatus,
            paymentMethod: paymentMethod,
            paymentStatus: paymentStatus,
            vehicleBrand: vehicleBrand,
            priceMin: priceMin,
            priceMax: priceMax,
            userId: req.user?.id,
            userRole: req.user?.role
        });
        console.log(`📊 Found ${result.rentals.length}/${result.total} rentals (page ${pageNum})`);
        res.json({
            success: true,
            data: {
                rentals: result.rentals,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(result.total / limitNum),
                    totalItems: result.total,
                    hasMore: (pageNum * limitNum) < result.total,
                    itemsPerPage: limitNum
                }
            }
        });
    }
    catch (error) {
        console.error('Get paginated rentals error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní prenájmov'
        });
    }
});
// GET /api/rentals - Získanie všetkých prenájmov
router.get('/', auth_1.authenticateToken, (0, permissions_1.checkPermission)('rentals', 'read'), async (req, res) => {
    try {
        let rentals = await postgres_database_1.postgresDatabase.getRentals();
        console.log('🚗 Rentals GET - user:', {
            role: req.user?.role,
            userId: req.user?.id,
            totalRentals: rentals.length
        });
        // 🎯 CLEAN SOLUTION: Rental má svoj company field - žiadny enrichment potrebný! ✅
        console.log('🚀 CLEAN: Rentals already have company field from database');
        // 🔐 PERMISSION FILTERING - Apply company-based filtering for non-admin users
        if (req.user?.role !== 'admin' && req.user) {
            const user = req.user; // TypeScript safe assignment
            const originalCount = rentals.length;
            // Získaj company access pre používateľa
            const userCompanyAccess = await postgres_database_1.postgresDatabase.getUserCompanyAccess(user.id);
            const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
            // Get allowed company names once
            const allowedCompanyNames = await Promise.all(allowedCompanyIds.map(async (companyId) => {
                try {
                    return await postgres_database_1.postgresDatabase.getCompanyNameById(companyId);
                }
                catch (error) {
                    return null;
                }
            }));
            const validCompanyNames = allowedCompanyNames.filter(name => name !== null);
            // Filter rentals based on (now corrected) historical ownership
            rentals = rentals.filter(rental => {
                if (rental.vehicle && rental.vehicle.ownerCompanyId) {
                    return allowedCompanyIds.includes(rental.vehicle.ownerCompanyId);
                }
                else if (rental.vehicle && rental.vehicle.company) {
                    return validCompanyNames.includes(rental.vehicle.company);
                }
                return false; // If no vehicle or company info, don't show
            });
            console.log('🔐 Rentals Permission Filter:', {
                userId: user.id,
                allowedCompanyIds,
                originalCount,
                filteredCount: rentals.length,
                filterType: 'historical_ownership_based'
            });
        }
        // 🔧 DEBUG: Log final response data (first rental)
        console.log('🔍 FINAL RESPONSE DATA (first rental):');
        if (rentals.length > 0) {
            console.log('  Response:', {
                customer: rentals[0].customerName,
                company: rentals[0].company,
                vehicleId: rentals[0].vehicleId,
                vehicle_exists: !!rentals[0].vehicle,
                vehicle_brand: rentals[0].vehicle?.brand || 'NULL',
                vehicle_json: JSON.stringify(rentals[0].vehicle, null, 2)
            });
        }
        res.json({
            success: true,
            data: rentals
        });
    }
    catch (error) {
        console.error('Get rentals error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní prenájmov'
        });
    }
});
// GET /api/rentals/:id - Získanie konkrétneho prenájmu
router.get('/:id', auth_1.authenticateToken, (0, permissions_1.checkPermission)('rentals', 'read', { getContext: getRentalContext }), async (req, res) => {
    try {
        const { id } = req.params;
        const rental = await postgres_database_1.postgresDatabase.getRental(id);
        if (!rental) {
            return res.status(404).json({
                success: false,
                error: 'Prenájom nenájdený'
            });
        }
        res.json({
            success: true,
            data: rental
        });
    }
    catch (error) {
        console.error('Get rental error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní prenájmu'
        });
    }
});
// POST /api/rentals - Vytvorenie nového prenájmu
router.post('/', auth_1.authenticateToken, 
// checkPermission('rentals', 'create'), // dočasne vypnuté
async (req, res) => {
    try {
        const { vehicleId, customerId, customerName, startDate, endDate, totalPrice, commission, paymentMethod, discount, customCommission, extraKmCharge, paid, status, handoverPlace, confirmed, payments, history, orderNumber, deposit, allowedKilometers, dailyKilometers, extraKilometerRate, returnConditions, fuelLevel, odometer, returnFuelLevel, returnOdometer, actualKilometers, fuelRefillCost, handoverProtocolId, returnProtocolId, 
        // 🔄 OPTIMALIZOVANÉ: Flexibilné prenájmy (zjednodušené)
        isFlexible, flexibleEndDate } = req.body;
        // 🔄 NOVÁ VALIDÁCIA: Pre flexibilné prenájmy endDate nie je povinné
        if (!customerName || !startDate) {
            return res.status(400).json({
                success: false,
                error: 'Meno zákazníka a dátum začiatku sú povinné'
            });
        }
        // Pre flexibilné prenájmy nastavíme endDate automaticky ak nie je zadané
        let finalEndDate = endDate;
        if (isFlexible && !endDate) {
            // Pre flexibilné prenájmy nastavíme endDate na flexibleEndDate alebo +365 dní
            if (flexibleEndDate) {
                finalEndDate = flexibleEndDate;
            }
            else {
                const oneYearFromStart = new Date(new Date(startDate).getTime() + 365 * 24 * 60 * 60 * 1000);
                finalEndDate = oneYearFromStart.toISOString();
            }
            console.log('🔄 Flexibilný prenájom: Automaticky nastavený endDate na', finalEndDate);
        }
        if (!finalEndDate) {
            return res.status(400).json({
                success: false,
                error: 'Dátum ukončenia je povinný pre štandardné prenájmy'
            });
        }
        const createdRental = await postgres_database_1.postgresDatabase.createRental({
            vehicleId,
            customerId,
            customerName,
            startDate: new Date(startDate),
            endDate: new Date(finalEndDate),
            totalPrice: totalPrice || 0,
            commission: commission || 0,
            paymentMethod: paymentMethod || 'cash',
            discount,
            customCommission,
            extraKmCharge,
            paid: paid || false,
            status: status || 'pending',
            handoverPlace,
            confirmed: confirmed || false,
            payments,
            history,
            orderNumber,
            deposit,
            allowedKilometers,
            dailyKilometers,
            extraKilometerRate,
            returnConditions,
            fuelLevel,
            odometer,
            returnFuelLevel,
            returnOdometer,
            actualKilometers,
            fuelRefillCost,
            handoverProtocolId,
            returnProtocolId,
            // 🔄 OPTIMALIZOVANÉ: Flexibilné prenájmy (zjednodušené)
            isFlexible: isFlexible || false,
            flexibleEndDate: flexibleEndDate ? new Date(flexibleEndDate) : undefined
        });
        // 🔴 Real-time broadcast: Nový prenájom vytvorený
        const websocketService = (0, websocket_service_1.getWebSocketService)();
        if (websocketService) {
            const userName = req.user?.username || 'Neznámy užívateľ';
            websocketService.broadcastRentalCreated(createdRental, userName);
        }
        res.status(201).json({
            success: true,
            message: 'Prenájom úspešne vytvorený',
            data: createdRental
        });
    }
    catch (error) {
        console.error('Create rental error:', error);
        console.error('Request body:', JSON.stringify(req.body, null, 2));
        res.status(500).json({
            success: false,
            error: `Chyba pri vytváraní prenájmu: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
        });
    }
});
// PUT /api/rentals/:id - Aktualizácia prenájmu (simplified for debugging)
router.put('/:id', auth_1.authenticateToken, 
// checkPermission('rentals', 'update', { getContext: getRentalContext }), // dočasne vypnuté
async (req, res) => {
    try {
        console.log('🚀 RENTAL UPDATE ENDPOINT HIT - ID:', req.params.id);
        const { id } = req.params;
        const updateData = req.body;
        console.log('🔄 RENTAL UPDATE request:', {
            rentalId: id,
            userId: req.user?.id,
            updateFields: Object.keys(updateData),
            vehicleId: updateData.vehicleId,
            customerName: updateData.customerName,
            totalPrice: updateData.totalPrice,
            paid: updateData.paid,
            status: updateData.status,
            fullUpdateData: updateData
        });
        // Skontroluj, či prenájom existuje
        const existingRental = await postgres_database_1.postgresDatabase.getRental(id);
        if (!existingRental) {
            console.log('❌ Rental not found:', id);
            return res.status(404).json({
                success: false,
                error: 'Prenájom nenájdený'
            });
        }
        console.log('📋 Existing rental data:', {
            id: existingRental.id,
            vehicleId: existingRental.vehicleId,
            customerName: existingRental.customerName,
            hasVehicle: !!existingRental.vehicle
        });
        const updatedRental = {
            ...existingRental,
            ...updateData,
            id,
            startDate: updateData.startDate ? new Date(updateData.startDate) : existingRental.startDate,
            endDate: updateData.endDate ? new Date(updateData.endDate) : existingRental.endDate
        };
        console.log('💾 Saving updated rental:', {
            id: updatedRental.id,
            vehicleId: updatedRental.vehicleId,
            customerName: updatedRental.customerName
        });
        await postgres_database_1.postgresDatabase.updateRental(updatedRental);
        // Znovu načítaj prenájom z databázy pre overenie
        const savedRental = await postgres_database_1.postgresDatabase.getRental(id);
        console.log('✅ Rental saved successfully:', {
            id: savedRental?.id,
            vehicleId: savedRental?.vehicleId,
            hasVehicle: !!savedRental?.vehicle
        });
        // 🔴 Real-time broadcast: Prenájom aktualizovaný
        const websocketService = (0, websocket_service_1.getWebSocketService)();
        if (websocketService && savedRental) {
            const userName = req.user?.username || 'Neznámy užívateľ';
            websocketService.broadcastRentalUpdated(savedRental, userName);
        }
        res.json({
            success: true,
            message: 'Prenájom úspešne aktualizovaný',
            data: savedRental || updatedRental
        });
    }
    catch (error) {
        console.error('Update rental error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri aktualizácii prenájmu'
        });
    }
});
// DELETE /api/rentals/:id - Vymazanie prenájmu
router.delete('/:id', auth_1.authenticateToken, 
// checkPermission('rentals', 'delete', { getContext: getRentalContext }), // dočasne vypnuté
async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        console.log(`🗑️ Pokus o vymazanie prenájmu ID: ${id}, používateľ: ${userId}, rola: ${userRole}`);
        // Skontroluj, či prenájom existuje
        const existingRental = await postgres_database_1.postgresDatabase.getRental(id);
        if (!existingRental) {
            console.log(`❌ Prenájom ${id} nenájdený v databáze`);
            return res.status(404).json({
                success: false,
                error: 'Prenájom nenájdený'
            });
        }
        console.log(`✅ Prenájom ${id} nájdený, vymazávam...`);
        await postgres_database_1.postgresDatabase.deleteRental(id);
        console.log(`🎉 Prenájom ${id} úspešne vymazaný`);
        // 🔴 Real-time broadcast: Prenájom zmazaný
        const websocketService = (0, websocket_service_1.getWebSocketService)();
        if (websocketService) {
            const userName = req.user?.username || 'Neznámy užívateľ';
            websocketService.broadcastRentalDeleted(id, existingRental.customerName, userName);
        }
        res.json({
            success: true,
            message: 'Prenájom úspešne vymazaný'
        });
    }
    catch (error) {
        console.error('Delete rental error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vymazávaní prenájmu'
        });
    }
});
// 📥 BATCH CSV IMPORT - Rýchly import viacerých prenájmov naraz
router.post('/batch-import', auth_1.authenticateToken, (0, permissions_1.checkPermission)('rentals', 'create'), async (req, res) => {
    try {
        console.log('📥 Starting batch rental import...');
        const { rentals } = req.body;
        if (!rentals || !Array.isArray(rentals)) {
            return res.status(400).json({
                success: false,
                error: 'Rentals array je povinný'
            });
        }
        console.log(`📊 Processing ${rentals.length} rentals in batch...`);
        const results = [];
        const errors = [];
        let processed = 0;
        // Progress tracking
        const progressInterval = Math.max(1, Math.floor(rentals.length / 10));
        for (let i = 0; i < rentals.length; i++) {
            // Progress logging
            if (i % progressInterval === 0 || i === rentals.length - 1) {
                const progress = Math.round(((i + 1) / rentals.length) * 100);
                console.log(`📊 Batch Import Progress: ${progress}% (${i + 1}/${rentals.length})`);
            }
            try {
                const rentalData = rentals[i];
                // 🔍 DEBUG: Log price data
                console.log(`🔍 BATCH IMPORT PRICE DEBUG [${i}]:`, {
                    customerName: rentalData.customerName,
                    totalPrice: rentalData.totalPrice,
                    typeOf: typeof rentalData.totalPrice
                });
                const createdRental = await postgres_database_1.postgresDatabase.createRental(rentalData);
                results.push({
                    index: i,
                    id: createdRental.id,
                    customerName: rentalData.customerName,
                    totalPrice: rentalData.totalPrice,
                    action: 'created'
                });
                processed++;
            }
            catch (error) {
                console.error(`❌ Error processing rental ${i}:`, error);
                errors.push({
                    index: i,
                    customerName: rentals[i]?.customerName || 'Unknown',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        console.log(`✅ Batch import completed: ${processed}/${rentals.length} successful`);
        res.json({
            success: true,
            data: {
                processed,
                total: rentals.length,
                results,
                errors,
                successRate: Math.round((processed / rentals.length) * 100)
            }
        });
    }
    catch (error) {
        console.error('Batch import error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri batch importe prenájmov'
        });
    }
});
exports.default = router;
//# sourceMappingURL=rentals.js.map