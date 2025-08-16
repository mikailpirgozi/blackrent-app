"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../middleware/permissions");
const router = (0, express_1.Router)();
// Helper function for filtering insurances based on query parameters
const filterInsurances = (insurances, query) => {
    let filtered = [...insurances];
    // Search filter
    if (query.search) {
        const searchTerm = query.search.toLowerCase();
        filtered = filtered.filter(insurance => insurance.type?.toLowerCase().includes(searchTerm) ||
            insurance.company?.toLowerCase().includes(searchTerm) ||
            insurance.policyNumber?.toLowerCase().includes(searchTerm));
    }
    // Type filter
    if (query.type) {
        filtered = filtered.filter(insurance => insurance.type === query.type);
    }
    // Company filter
    if (query.company) {
        filtered = filtered.filter(insurance => insurance.company === query.company);
    }
    // Status filter (valid, expiring, expired)
    if (query.status && query.status !== 'all') {
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(insurance => {
            const validTo = new Date(insurance.validTo);
            switch (query.status) {
                case 'valid':
                    return validTo > thirtyDaysFromNow;
                case 'expiring':
                    return validTo > today && validTo <= thirtyDaysFromNow;
                case 'expired':
                    return validTo <= today;
                default:
                    return true;
            }
        });
    }
    // Vehicle filter
    if (query.vehicleId) {
        filtered = filtered.filter(insurance => insurance.vehicleId === query.vehicleId);
    }
    return filtered;
};
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
// GET /api/insurances/paginated - Získanie poistiek s pagináciou a filtrovaním
router.get('/paginated', auth_1.authenticateToken, (0, permissions_1.checkPermission)('insurances', 'read'), async (req, res) => {
    try {
        console.log('📄 INSURANCES: Paginated request:', req.query);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        // Load all insurances first
        let allInsurances = await postgres_database_1.postgresDatabase.getInsurances();
        // 🏢 COMPANY OWNER - filter len poistky vlastných vozidiel
        if (req.user?.role === 'company_owner' && req.user.companyId) {
            const vehicles = await postgres_database_1.postgresDatabase.getVehicles();
            const companyVehicleIds = vehicles
                .filter(v => v.ownerCompanyId === req.user?.companyId)
                .map(v => v.id);
            allInsurances = allInsurances.filter(i => i.vehicleId && companyVehicleIds.includes(i.vehicleId));
        }
        // Apply filters
        const filteredInsurances = filterInsurances(allInsurances, req.query);
        // Sort by valid to date (newest first) since createdAt might not exist
        filteredInsurances.sort((a, b) => new Date(b.validTo).getTime() - new Date(a.validTo).getTime());
        // Apply pagination
        const paginatedInsurances = filteredInsurances.slice(offset, offset + limit);
        const totalCount = filteredInsurances.length;
        const totalPages = Math.ceil(totalCount / limit);
        console.log(`📄 INSURANCES: Returning page ${page}/${totalPages} (${paginatedInsurances.length}/${totalCount} items)`);
        res.json({
            success: true,
            data: {
                data: paginatedInsurances,
                pagination: {
                    page,
                    limit,
                    total: totalCount,
                    totalPages,
                    hasMore: page < totalPages
                }
            }
        });
    }
    catch (error) {
        console.error('❌ INSURANCES: Paginated error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri načítavaní poistiek'
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
        const { vehicleId, type, policyNumber, validFrom, validTo, price, company, insurerId, paymentFrequency, filePath } = req.body;
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
            insurerId, // Nový parameter
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
        console.error('Update insurance error:', error);
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