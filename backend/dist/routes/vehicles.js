"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../middleware/permissions");
const router = (0, express_1.Router)();
// 🔍 CONTEXT FUNCTIONS
const getVehicleContext = async (req) => {
    const vehicleId = req.params.id;
    if (!vehicleId)
        return {};
    const vehicle = await postgres_database_1.postgresDatabase.getVehicle(vehicleId);
    return {
        resourceOwnerId: vehicle?.assignedMechanicId,
        resourceCompanyId: vehicle?.ownerCompanyId
    };
};
// GET /api/vehicles - Získanie všetkých vozidiel
router.get('/', auth_1.authenticateToken, (0, permissions_1.checkPermission)('vehicles', 'read'), async (req, res) => {
    try {
        let vehicles = await postgres_database_1.postgresDatabase.getVehicles();
        console.log('🚗 Vehicles GET - user:', {
            role: req.user?.role,
            userId: req.user?.id,
            totalVehicles: vehicles.length
        });
        // 🔐 NON-ADMIN USERS - filter podľa company permissions
        if (req.user?.role !== 'admin' && req.user) {
            const user = req.user; // TypeScript safe assignment
            const originalCount = vehicles.length;
            // Získaj company access pre používateľa
            const userCompanyAccess = await postgres_database_1.postgresDatabase.getUserCompanyAccess(user.id);
            const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
            // Filter vozidlá len pre firmy, ku ktorým má používateľ prístup
            // ✅ Všetky vozidlá majú teraz owner_company_id - používame len to
            vehicles = vehicles.filter(v => {
                return v.ownerCompanyId && allowedCompanyIds.includes(v.ownerCompanyId);
            });
            console.log('🔐 Company Permission Filter:', {
                userId: user.id,
                allowedCompanyIds,
                userCompanyAccess: userCompanyAccess.map(a => ({ id: a.companyId, name: a.companyName })),
                originalCount,
                filteredCount: vehicles.length,
                sampleResults: vehicles.slice(0, 3).map(v => ({
                    licensePlate: v.licensePlate,
                    company: v.company,
                    ownerCompanyId: v.ownerCompanyId
                }))
            });
        }
        res.json({
            success: true,
            data: vehicles
        });
    }
    catch (error) {
        console.error('Get vehicles error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní vozidiel'
        });
    }
});
// GET /api/vehicles/:id - Získanie konkrétneho vozidla
router.get('/:id', auth_1.authenticateToken, (0, permissions_1.checkPermission)('vehicles', 'read', { getContext: getVehicleContext }), async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await postgres_database_1.postgresDatabase.getVehicle(id);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                error: 'Vozidlo nenájdené'
            });
        }
        res.json({
            success: true,
            data: vehicle
        });
    }
    catch (error) {
        console.error('Get vehicle error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní vozidla'
        });
    }
});
// POST /api/vehicles - Vytvorenie nového vozidla
router.post('/', auth_1.authenticateToken, (0, permissions_1.checkPermission)('vehicles', 'create'), async (req, res) => {
    try {
        const { brand, model, licensePlate, company, pricing, commission, status, year } = req.body;
        if (!brand || !model || !company) {
            return res.status(400).json({
                success: false,
                error: 'Všetky povinné polia musia byť vyplnené'
            });
        }
        const createdVehicle = await postgres_database_1.postgresDatabase.createVehicle({
            brand,
            model,
            year: year || 2024,
            licensePlate: licensePlate || '',
            company,
            pricing: pricing || [],
            commission: commission || { type: 'percentage', value: 0 },
            status: status || 'available'
        });
        res.status(201).json({
            success: true,
            message: 'Vozidlo úspešne vytvorené',
            data: createdVehicle
        });
    }
    catch (error) {
        console.error('Create vehicle error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Chyba pri vytváraní vozidla';
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
});
// PUT /api/vehicles/:id - Aktualizácia vozidla
router.put('/:id', auth_1.authenticateToken, (0, permissions_1.checkPermission)('vehicles', 'update', { getContext: getVehicleContext }), async (req, res) => {
    try {
        const { id } = req.params;
        const { brand, model, licensePlate, company, pricing, commission, status, year, stk } = req.body;
        // Skontroluj, či vozidlo existuje
        const existingVehicle = await postgres_database_1.postgresDatabase.getVehicle(id);
        if (!existingVehicle) {
            return res.status(404).json({
                success: false,
                error: 'Vozidlo nenájdené'
            });
        }
        const updatedVehicle = {
            id,
            brand: brand || existingVehicle.brand,
            model: model || existingVehicle.model,
            licensePlate: licensePlate || existingVehicle.licensePlate,
            company: company || existingVehicle.company,
            pricing: pricing || existingVehicle.pricing,
            commission: commission || existingVehicle.commission,
            status: status || existingVehicle.status,
            year: year !== undefined ? year : existingVehicle.year,
            stk: stk !== undefined ? (stk ? new Date(stk) : undefined) : existingVehicle.stk,
            ownerCompanyId: existingVehicle.ownerCompanyId,
            assignedMechanicId: existingVehicle.assignedMechanicId,
            createdAt: existingVehicle.createdAt
        };
        await postgres_database_1.postgresDatabase.updateVehicle(updatedVehicle);
        res.json({
            success: true,
            message: 'Vozidlo úspešne aktualizované',
            data: updatedVehicle
        });
    }
    catch (error) {
        console.error('Update vehicle error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri aktualizácii vozidla'
        });
    }
});
// DELETE /api/vehicles/:id - Vymazanie vozidla
router.delete('/:id', auth_1.authenticateToken, (0, permissions_1.checkPermission)('vehicles', 'delete', { getContext: getVehicleContext }), async (req, res) => {
    try {
        const { id } = req.params;
        // Skontroluj, či vozidlo existuje
        const existingVehicle = await postgres_database_1.postgresDatabase.getVehicle(id);
        if (!existingVehicle) {
            return res.status(404).json({
                success: false,
                error: 'Vozidlo nenájdené'
            });
        }
        await postgres_database_1.postgresDatabase.deleteVehicle(id);
        res.json({
            success: true,
            message: 'Vozidlo úspešne vymazané'
        });
    }
    catch (error) {
        console.error('Delete vehicle error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vymazávaní vozidla'
        });
    }
});
// 🔧 ADMIN TOOL - Priradenie vozidiel k firme
router.post('/assign-to-company', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { vehicleIds, companyId } = req.body;
        if (!vehicleIds || !Array.isArray(vehicleIds) || !companyId) {
            return res.status(400).json({
                success: false,
                error: 'vehicleIds (array) a companyId sú povinné'
            });
        }
        // Verify company exists
        const companies = await postgres_database_1.postgresDatabase.getCompanies();
        const company = companies.find(c => c.id === companyId);
        if (!company) {
            return res.status(404).json({
                success: false,
                error: 'Firma nenájdená'
            });
        }
        // Update vehicles using database method
        await postgres_database_1.postgresDatabase.assignVehiclesToCompany(vehicleIds, companyId);
        console.log(`🏢 Assigned ${vehicleIds.length} vehicles to company ${company.name}`);
        res.json({
            success: true,
            message: `${vehicleIds.length} vozidiel úspešne priradených k firme ${company.name}`,
            data: {
                companyId,
                companyName: company.name,
                assignedVehicleIds: vehicleIds
            }
        });
    }
    catch (error) {
        console.error('Assign vehicles to company error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri priradzovaní vozidiel'
        });
    }
});
exports.default = router;
//# sourceMappingURL=vehicles.js.map