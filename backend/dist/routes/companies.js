"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../middleware/permissions");
const router = (0, express_1.Router)();
// GET /api/companies - Získanie všetkých firiem
router.get('/', auth_1.authenticateToken, (0, permissions_1.checkPermission)('companies', 'read'), async (req, res) => {
    try {
        let companies = await postgres_database_1.postgresDatabase.getCompanies();
        console.log('🏢 Companies GET - user:', {
            role: req.user?.role,
            companyId: req.user?.companyId,
            totalCompanies: companies.length
        });
        // 🏢 COMPANY OWNER - filter len svoju vlastnú firmu
        if (req.user?.role === 'company_owner' && req.user.companyId) {
            const originalCount = companies.length;
            companies = companies.filter(c => c.id === req.user?.companyId);
            console.log('🏢 Company Owner Filter:', {
                userCompanyId: req.user.companyId,
                originalCount,
                filteredCount: companies.length,
                userCompany: companies[0]?.name || 'Not found'
            });
        }
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
router.post('/', auth_1.authenticateToken, (0, permissions_1.checkPermission)('companies', 'create'), async (req, res) => {
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
router.delete('/:id', auth_1.authenticateToken, (0, permissions_1.checkPermission)('companies', 'delete'), async (req, res) => {
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