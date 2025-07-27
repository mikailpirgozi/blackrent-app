"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../middleware/permissions");
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
// GET /api/rentals - Získanie všetkých prenájmov
router.get('/', auth_1.authenticateToken, (0, permissions_1.checkPermission)('rentals', 'read'), async (req, res) => {
    try {
        let rentals = await postgres_database_1.postgresDatabase.getRentals();
        console.log('🚗 Rentals GET - user:', {
            role: req.user?.role,
            userId: req.user?.id,
            totalRentals: rentals.length
        });
        // 🔄 HISTORICAL OWNERSHIP LOGIC - Applied for ALL USERS (including admins)
        // This ensures that rental statistics show the correct historical owner
        console.log('🚀 BULK: Enriching all rentals with historical ownership data...');
        const enrichmentStartTime = Date.now();
        // 1. Filter rentals with valid vehicle and date
        const validRentals = rentals.filter(rental => rental.vehicleId && rental.startDate);
        console.log(`📊 Valid rentals for ownership enrichment: ${validRentals.length}/${rentals.length}`);
        if (validRentals.length > 0) {
            // 2. Bulk historical ownership checking for all rentals
            const ownershipChecks = validRentals.map(rental => ({
                vehicleId: rental.vehicleId,
                timestamp: new Date(rental.startDate)
            }));
            const [historicalOwners, currentOwners] = await Promise.all([
                postgres_database_1.postgresDatabase.getBulkVehicleOwnersAtTime(ownershipChecks),
                postgres_database_1.postgresDatabase.getBulkCurrentVehicleOwners(validRentals.map(r => r.vehicleId))
            ]);
            // 3. Create lookup maps
            const historicalOwnerMap = new Map();
            historicalOwners.forEach(result => {
                const key = `${result.vehicleId}-${result.timestamp.toISOString()}`;
                historicalOwnerMap.set(key, result.owner);
            });
            const currentOwnerMap = new Map();
            currentOwners.forEach(result => {
                currentOwnerMap.set(result.vehicleId, result.owner);
            });
            // 4. Enrich all rentals with correct historical ownership data
            for (const rental of validRentals) {
                const rentalStart = new Date(rental.startDate);
                const historicalKey = `${rental.vehicleId}-${rentalStart.toISOString()}`;
                const historicalOwner = historicalOwnerMap.get(historicalKey);
                if (historicalOwner) {
                    // Use historical owner from the time of rental
                    if (rental.vehicle) {
                        rental.vehicle.company = historicalOwner.ownerCompanyName;
                        rental.vehicle.ownerCompanyId = historicalOwner.ownerCompanyId;
                    }
                }
                else {
                    // FALLBACK: Use current owner if historical not found
                    const currentOwner = currentOwnerMap.get(rental.vehicleId);
                    if (currentOwner && rental.vehicle) {
                        console.log(`📝 Using current ownership for rental ${rental.id} (historical not found)`);
                        rental.vehicle.company = currentOwner.ownerCompanyName;
                        rental.vehicle.ownerCompanyId = currentOwner.ownerCompanyId;
                    }
                }
            }
            const enrichmentTime = Date.now() - enrichmentStartTime;
            console.log(`✅ BULK: Enriched ${validRentals.length} rentals with historical ownership in ${enrichmentTime}ms`);
        }
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
router.post('/', auth_1.authenticateToken, (0, permissions_1.checkPermission)('rentals', 'create'), async (req, res) => {
    try {
        const { vehicleId, customerId, customerName, startDate, endDate, totalPrice, commission, paymentMethod, discount, customCommission, extraKmCharge, paid, status, handoverPlace, confirmed, payments, history, orderNumber, deposit, allowedKilometers, dailyKilometers, extraKilometerRate, returnConditions, fuelLevel, odometer, returnFuelLevel, returnOdometer, actualKilometers, fuelRefillCost, handoverProtocolId, returnProtocolId } = req.body;
        if (!customerName || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Všetky povinné polia musia byť vyplnené'
            });
        }
        const createdRental = await postgres_database_1.postgresDatabase.createRental({
            vehicleId,
            customerId,
            customerName,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
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
            returnProtocolId
        });
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
// PUT /api/rentals/:id - Aktualizácia prenájmu
router.put('/:id', auth_1.authenticateToken, (0, permissions_1.checkPermission)('rentals', 'update', { getContext: getRentalContext }), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        console.log('🔄 Rental UPDATE request:', {
            rentalId: id,
            userId: req.user?.id,
            updateFields: Object.keys(updateData),
            vehicleId: updateData.vehicleId,
            customerName: updateData.customerName
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
router.delete('/:id', auth_1.authenticateToken, (0, permissions_1.checkPermission)('rentals', 'delete', { getContext: getRentalContext }), async (req, res) => {
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
exports.default = router;
//# sourceMappingURL=rentals.js.map