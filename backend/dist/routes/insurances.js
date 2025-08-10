"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../middleware/permissions");
const textNormalization_1 = require("../utils/textNormalization");
const router = (0, express_1.Router)();
// GET /api/insurances/paginated - Paginated insurances with filters
router.get('/paginated', auth_1.authenticateToken, (0, permissions_1.checkPermission)('insurances', 'read'), async (req, res) => {
    try {
        const { page = '1', limit = '50', search = '', type = '', insurerId = '', vehicleId = '', status = '', dateFrom = '', dateTo = '' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;
        let insurances = await postgres_database_1.postgresDatabase.getInsurances();
        console.log('🛡️ Insurances PAGINATED GET - user:', {
            role: req.user?.role,
            userId: req.user?.id,
            totalInsurances: insurances.length,
            page: pageNum,
            limit: limitNum
        });
        // 🏢 COMPANY OWNER - filter len poistky vlastných vozidiel
        if (req.user?.role === 'company_owner' && req.user.companyId) {
            const vehicles = await postgres_database_1.postgresDatabase.getVehicles();
            const companyVehicleIds = vehicles
                .filter(v => v.ownerCompanyId === req.user?.companyId)
                .map(v => v.id);
            insurances = insurances.filter(i => i.vehicleId && companyVehicleIds.includes(i.vehicleId));
        }
        // 🔍 Apply filters
        let filteredInsurances = [...insurances];
        // Search filter - bez diakritiky
        if (search) {
            const searchTerm = search.toString();
            filteredInsurances = filteredInsurances.filter(i => (0, textNormalization_1.textIncludes)(i.policyNumber, searchTerm) ||
                (0, textNormalization_1.textIncludes)(i.type, searchTerm) ||
                (0, textNormalization_1.textIncludes)(i.note, searchTerm));
        }
        // Type filter
        if (type) {
            filteredInsurances = filteredInsurances.filter(i => i.type === type.toString());
        }
        // Insurer filter
        if (insurerId) {
            filteredInsurances = filteredInsurances.filter(i => i.insurerId === insurerId.toString());
        }
        // Vehicle filter
        if (vehicleId) {
            filteredInsurances = filteredInsurances.filter(i => i.vehicleId === vehicleId.toString());
        }
        // Status filter
        if (status) {
            filteredInsurances = filteredInsurances.filter(i => i.status === status.toString());
        }
        // Date filters
        if (dateFrom) {
            const fromDate = new Date(dateFrom.toString());
            filteredInsurances = filteredInsurances.filter(i => {
                if (!i.startDate)
                    return false;
                const insuranceDate = new Date(i.startDate);
                return insuranceDate >= fromDate;
            });
        }
        if (dateTo) {
            const toDate = new Date(dateTo.toString());
            filteredInsurances = filteredInsurances.filter(i => {
                if (!i.endDate)
                    return false;
                const insuranceDate = new Date(i.endDate);
                return insuranceDate <= toDate;
            });
        }
        // Sort by start date (newest first)
        filteredInsurances.sort((a, b) => {
            const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
            const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
            return dateB - dateA;
        });
        // Calculate pagination
        const totalItems = filteredInsurances.length;
        const totalPages = Math.ceil(totalItems / limitNum);
        const hasMore = pageNum < totalPages;
        // Get paginated results
        const paginatedInsurances = filteredInsurances.slice(offset, offset + limitNum);
        console.log('📄 Paginated insurances:', {
            totalItems,
            currentPage: pageNum,
            totalPages,
            hasMore,
            resultsCount: paginatedInsurances.length
        });
        res.json({
            success: true,
            insurances: paginatedInsurances,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems,
                hasMore,
                itemsPerPage: limitNum
            }
        });
    }
    catch (error) {
        console.error('Get paginated insurances error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní poistení'
        });
    }
});
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