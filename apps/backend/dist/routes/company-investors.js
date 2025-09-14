"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../middleware/permissions");
const router = (0, express_1.Router)();
// GET /api/company-investors - Získanie všetkých spoluinvestorov
router.get('/', auth_1.authenticateToken, (0, permissions_1.checkPermission)('companies', 'read'), async (req, res) => {
    try {
        const investors = await postgres_database_1.postgresDatabase.getCompanyInvestors();
        console.log('🤝 Company Investors GET:', {
            role: req.user?.role,
            totalInvestors: investors.length
        });
        res.json({
            success: true,
            data: investors
        });
    }
    catch (error) {
        console.error('Get company investors error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní spoluinvestorov'
        });
    }
});
// POST /api/company-investors - Vytvorenie nového spoluinvestora
router.post('/', auth_1.authenticateToken, (0, permissions_1.checkPermission)('companies', 'create'), async (req, res) => {
    try {
        const { firstName, lastName, email, phone, personalId, address, notes } = req.body;
        if (!firstName || !lastName) {
            return res.status(400).json({
                success: false,
                error: 'Meno a priezvisko sú povinné'
            });
        }
        const createdInvestor = await postgres_database_1.postgresDatabase.createCompanyInvestor({
            firstName,
            lastName,
            email,
            phone,
            personalId,
            address,
            notes
        });
        res.status(201).json({
            success: true,
            message: 'Spoluinvestor úspešne vytvorený',
            data: createdInvestor
        });
    }
    catch (error) {
        console.error('Create company investor error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vytváraní spoluinvestora'
        });
    }
});
// PUT /api/company-investors/:id - Aktualizácia spoluinvestora
router.put('/:id', auth_1.authenticateToken, (0, permissions_1.checkPermission)('companies', 'update'), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updatedInvestor = await postgres_database_1.postgresDatabase.updateCompanyInvestor(id, updateData);
        res.json({
            success: true,
            message: 'Spoluinvestor úspešne aktualizovaný',
            data: updatedInvestor
        });
    }
    catch (error) {
        console.error('Update company investor error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri aktualizácii spoluinvestora'
        });
    }
});
// DELETE /api/company-investors/:id - Vymazanie spoluinvestora
router.delete('/:id', auth_1.authenticateToken, (0, permissions_1.checkPermission)('companies', 'delete'), async (req, res) => {
    try {
        const { id } = req.params;
        await postgres_database_1.postgresDatabase.deleteCompanyInvestor(id);
        res.json({
            success: true,
            message: 'Spoluinvestor úspešne vymazaný'
        });
    }
    catch (error) {
        console.error('Delete company investor error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vymazávaní spoluinvestora'
        });
    }
});
// GET /api/company-investors/:companyId/shares - Získanie podielov pre firmu
router.get('/:companyId/shares', auth_1.authenticateToken, (0, permissions_1.checkPermission)('companies', 'read'), async (req, res) => {
    try {
        const { companyId } = req.params;
        const shares = await postgres_database_1.postgresDatabase.getCompanyInvestorShares(companyId);
        res.json({
            success: true,
            data: shares
        });
    }
    catch (error) {
        console.error('Get company investor shares error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní podielov'
        });
    }
});
// POST /api/company-investors/shares - Priradenie spoluinvestora k firme
router.post('/shares', auth_1.authenticateToken, (0, permissions_1.checkPermission)('companies', 'update'), async (req, res) => {
    try {
        const { companyId, investorId, ownershipPercentage, investmentAmount, isPrimaryContact, profitSharePercentage } = req.body;
        if (!companyId || !investorId || ownershipPercentage === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Company ID, investor ID a ownership percentage sú povinné'
            });
        }
        const createdShare = await postgres_database_1.postgresDatabase.createCompanyInvestorShare({
            companyId,
            investorId,
            ownershipPercentage,
            investmentAmount,
            isPrimaryContact: isPrimaryContact || false,
            profitSharePercentage
        });
        res.status(201).json({
            success: true,
            message: 'Podiel spoluinvestora úspešne vytvorený',
            data: createdShare
        });
    }
    catch (error) {
        console.error('Create company investor share error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vytváraní podielu'
        });
    }
});
// PUT /api/company-investors/shares/:id - Aktualizácia podielu
router.put('/shares/:id', auth_1.authenticateToken, (0, permissions_1.checkPermission)('companies', 'update'), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updatedShare = await postgres_database_1.postgresDatabase.updateCompanyInvestorShare(id, updateData);
        res.json({
            success: true,
            message: 'Podiel úspešne aktualizovaný',
            data: updatedShare
        });
    }
    catch (error) {
        console.error('Update company investor share error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri aktualizácii podielu'
        });
    }
});
// DELETE /api/company-investors/shares/:id - Vymazanie podielu
router.delete('/shares/:id', auth_1.authenticateToken, (0, permissions_1.checkPermission)('companies', 'delete'), async (req, res) => {
    try {
        const { id } = req.params;
        await postgres_database_1.postgresDatabase.deleteCompanyInvestorShare(id);
        res.json({
            success: true,
            message: 'Podiel úspešne vymazaný'
        });
    }
    catch (error) {
        console.error('Delete company investor share error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vymazávaní podielu'
        });
    }
});
exports.default = router;
//# sourceMappingURL=company-investors.js.map