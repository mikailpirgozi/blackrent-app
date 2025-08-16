"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/insurers - Získanie všetkých poisťovní
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const insurers = await postgres_database_1.postgresDatabase.getInsurers();
        res.json({
            success: true,
            data: insurers
        });
    }
    catch (error) {
        console.error('Get insurers error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní poisťovní'
        });
    }
});
// POST /api/insurers - Vytvorenie novej poisťovne
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Názov poisťovne je povinný'
            });
        }
        const createdInsurer = await postgres_database_1.postgresDatabase.createInsurer({ name });
        res.status(201).json({
            success: true,
            message: 'Poisťovňa úspešne vytvorená',
            data: createdInsurer
        });
    }
    catch (error) {
        console.error('Create insurer error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vytváraní poisťovne'
        });
    }
});
// DELETE /api/insurers/:id - Vymazanie poisťovne
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await postgres_database_1.postgresDatabase.deleteInsurer(id);
        res.json({
            success: true,
            message: 'Poisťovňa úspešne vymazaná'
        });
    }
    catch (error) {
        console.error('Delete insurer error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vymazávaní poisťovne'
        });
    }
});
exports.default = router;
//# sourceMappingURL=insurers.js.map