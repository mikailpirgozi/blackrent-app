"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../middleware/permissions");
const router = (0, express_1.Router)();
// 🔍 CONTEXT FUNCTIONS
const getInsuranceContext = async (req) => {
    const insuranceId = req.params.id;
    if (!insuranceId)
        return {};
    const insurances = await postgres_database_1.postgresDatabase.getInsurances();
    const insurance = insurances.find(i => i.id === insuranceId);
    if (!insurance || !insurance.vehicleId)
        return {};
    // Získaj vehicle pre company context
    const vehicle = await postgres_database_1.postgresDatabase.getVehicle(insurance.vehicleId);
    return {
        resourceCompanyId: vehicle?.ownerCompanyId,
        amount: insurance.price
    };
};
// GET /api/insurances - Získanie všetkých poistiek
router.get('/', auth_1.authenticateToken, (0, permissions_1.checkPermission)('insurances', 'read'), async (req, res) => {
    try {
        let insurances = await postgres_database_1.postgresDatabase.getInsurances();
        // 🏢 COMPANY OWNER - filter len poistky vlastných vozidiel
        if (req.user?.role === 'company_owner' && req.user.companyId) {
            const vehicles = await postgres_database_1.postgresDatabase.getVehicles();
            const companyVehicleIds = vehicles
                .filter(v => v.ownerCompanyId === req.user?.companyId)
                .map(v => v.id);
            insurances = insurances.filter(i => i.vehicleId && companyVehicleIds.includes(i.vehicleId));
        }
        res.json({
            success: true,
            data: insurances
        });
    }
    catch (error) {
        console.error('Get insurances error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní poistiek'
        });
    }
});
// POST /api/insurances - Vytvorenie novej poistky
router.post('/', auth_1.authenticateToken, (0, permissions_1.checkPermission)('insurances', 'create'), async (req, res) => {
    try {
        const { vehicleId, type, policyNumber, validFrom, validTo, price, company, paymentFrequency, filePath } = req.body;
        if (!vehicleId || !type || !policyNumber || !validFrom || !validTo || !price || !company) {
            return res.status(400).json({
                success: false,
                error: 'Všetky povinné polia musia byť vyplnené'
            });
        }
        const createdInsurance = await postgres_database_1.postgresDatabase.createInsurance({
            vehicleId,
            type,
            policyNumber,
            validFrom: new Date(validFrom),
            validTo: new Date(validTo),
            price,
            company,
            paymentFrequency,
            filePath
        });
        res.status(201).json({
            success: true,
            message: 'Poistka úspešne vytvorená',
            data: createdInsurance
        });
    }
    catch (error) {
        console.error('Create insurance error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vytváraní poistky'
        });
    }
});
// PUT /api/insurances/:id - Aktualizácia poistky
router.put('/:id', auth_1.authenticateToken, (0, permissions_1.checkPermission)('insurances', 'update', { getContext: getInsuranceContext }), async (req, res) => {
    try {
        const { id } = req.params;
        const { vehicleId, type, policyNumber, validFrom, validTo, price, company, paymentFrequency, filePath } = req.body;
        if (!vehicleId || !type || !policyNumber || !validFrom || !validTo || !price || !company) {
            return res.status(400).json({
                success: false,
                error: 'Všetky povinné polia musia byť vyplnené'
            });
        }
        const updatedInsurance = await postgres_database_1.postgresDatabase.updateInsurance(id, {
            vehicleId,
            type,
            policyNumber,
            validFrom: new Date(validFrom),
            validTo: new Date(validTo),
            price,
            company,
            paymentFrequency,
            filePath
        });
        res.json({
            success: true,
            message: 'Poistka úspešne aktualizovaná',
            data: updatedInsurance
        });
    }
    catch (error) {
        console.error('❌ UPDATE INSURANCE ERROR:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri aktualizácii poistky'
        });
    }
});
// DELETE /api/insurances/:id - Zmazanie poistky
router.delete('/:id', auth_1.authenticateToken, (0, permissions_1.checkPermission)('insurances', 'delete', { getContext: getInsuranceContext }), async (req, res) => {
    try {
        const { id } = req.params;
        await postgres_database_1.postgresDatabase.deleteInsurance(id);
        res.json({
            success: true,
            message: 'Poistka úspešne zmazaná'
        });
    }
    catch (error) {
        console.error('Delete insurance error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri mazaní poistky'
        });
    }
});
exports.default = router;
//# sourceMappingURL=insurances.js.map