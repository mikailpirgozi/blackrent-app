"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/companies - Získanie všetkých firiem
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const companies = await postgres_database_1.postgresDatabase.getCompanies();
        res.json({
            success: true,
            data: companies
        });
    }
    catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní firiem'
        });
    }
});
// POST /api/companies - Vytvorenie novej firmy
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Názov firmy je povinný'
            });
        }
        const createdCompany = await postgres_database_1.postgresDatabase.createCompany({ name });
        res.status(201).json({
            success: true,
            message: 'Firma úspešne vytvorená',
            data: createdCompany
        });
    }
    catch (error) {
        console.error('Create company error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vytváraní firmy'
        });
    }
});
// DELETE /api/companies/:id - Vymazanie firmy
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await postgres_database_1.postgresDatabase.deleteCompany(id);
        res.json({
            success: true,
            message: 'Firma úspešne vymazaná'
        });
    }
    catch (error) {
        console.error('Delete company error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vymazávaní firmy'
        });
    }
});
exports.default = router;
//# sourceMappingURL=companies.js.map