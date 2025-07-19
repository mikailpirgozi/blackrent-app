"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/insurances - Získanie všetkých poistiek
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const insurances = await postgres_database_1.postgresDatabase.getInsurances();
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
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { vehicleId, type, policyNumber, validFrom, validTo, price, company } = req.body;
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
            company
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
exports.default = router;
//# sourceMappingURL=insurances.js.map