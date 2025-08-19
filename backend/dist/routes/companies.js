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
        console.log('🏢 POST /api/companies - Creating company');
        console.log('🏢 Request body:', req.body);
        console.log('🏢 User:', req.user);
        const { name } = req.body;
        if (!name) {
            console.log('❌ Company name is missing');
            return res.status(400).json({
                success: false,
                error: 'Názov firmy je povinný'
            });
        }
        console.log('🏢 Creating company with name:', name);
        const createdCompany = await postgres_database_1.postgresDatabase.createCompany({ name });
        console.log('🏢 Company created:', createdCompany);
        res.status(201).json({
            success: true,
            message: 'Firma úspešne vytvorená',
            data: createdCompany
        });
    }
    catch (error) {
        console.error('❌ Create company error:', error);
        res.status(500).json({
            success: false,
            error: `Chyba pri vytváraní firmy: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
        });
    }
});
// PUT /api/companies/:id - Aktualizácia firmy
router.put('/:id', auth_1.authenticateToken, (0, permissions_1.checkPermission)('companies', 'update'), async (req, res) => {
    try {
        const { id } = req.params;
        const companyData = req.body;
        console.log('🏢 PUT /api/companies/:id - Updating company', id, companyData);
        const updatedCompany = await postgres_database_1.postgresDatabase.updateCompany(id, companyData);
        res.json({
            success: true,
            message: 'Firma úspešne aktualizovaná',
            data: updatedCompany
        });
    }
    catch (error) {
        console.error('❌ Update company error:', error);
        res.status(500).json({
            success: false,
            error: `Chyba pri aktualizácii firmy: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
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
// 🚀 GMAIL APPROACH: GET /api/companies/paginated - Rýchle vyhľadávanie firiem
router.get('/paginated', auth_1.authenticateToken, (0, permissions_1.checkPermission)('companies', 'read'), async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '', city = 'all', country = 'all', status = 'all' } = req.query;
        console.log('🏢 Companies PAGINATED GET - params:', {
            page, limit, search, city, country, status,
            role: req.user?.role,
            userId: req.user?.id
        });
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        // Získaj paginated companies s filtrami
        const result = await postgres_database_1.postgresDatabase.getCompaniesPaginated({
            limit: limitNum,
            offset,
            search: search,
            city: city,
            country: country,
            status: status,
            userId: req.user?.id,
            userRole: req.user?.role
        });
        console.log(`📊 Found ${result.companies.length}/${result.total} companies (page ${pageNum})`);
        res.json({
            success: true,
            data: {
                companies: result.companies,
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
        console.error('Get paginated companies error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní firiem'
        });
    }
});
exports.default = router;
//# sourceMappingURL=companies.js.map