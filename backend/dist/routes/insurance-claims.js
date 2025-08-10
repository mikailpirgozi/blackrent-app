"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../middleware/permissions");
const textNormalization_1 = require("../utils/textNormalization");
const router = (0, express_1.Router)();
// GET /api/insurance-claims/paginated - Paginated insurance claims with filters
router.get('/paginated', auth_1.authenticateToken, (0, permissions_1.checkPermission)('insurances', 'read'), async (req, res) => {
    try {
        const { page = '1', limit = '50', search = '', status = '', insuranceId = '', dateFrom = '', dateTo = '', minAmount = '', maxAmount = '' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;
        let claims = await postgres_database_1.postgresDatabase.getInsuranceClaims();
        console.log('🚨 Insurance Claims PAGINATED GET - user:', {
            role: req.user?.role,
            userId: req.user?.id,
            totalClaims: claims.length,
            page: pageNum,
            limit: limitNum
        });
        // 🏢 COMPANY OWNER - filter len udalosti vlastných vozidiel
        if (req.user?.role === 'company_owner' && req.user.companyId) {
            const vehicles = await postgres_database_1.postgresDatabase.getVehicles();
            const companyVehicleIds = vehicles
                .filter(v => v.ownerCompanyId === req.user?.companyId)
                .map(v => v.id);
            claims = claims.filter(c => c.vehicleId && companyVehicleIds.includes(c.vehicleId));
        }
        // 🔍 Apply filters
        let filteredClaims = [...claims];
        // Search filter - bez diakritiky
        if (search) {
            const searchTerm = search.toString();
            filteredClaims = filteredClaims.filter(c => (0, textNormalization_1.textIncludes)(c.description, searchTerm) ||
                (0, textNormalization_1.textIncludes)(c.claimNumber, searchTerm) ||
                (0, textNormalization_1.textIncludes)(c.location, searchTerm) ||
                (0, textNormalization_1.textIncludes)(c.incidentType, searchTerm));
        }
        // Status filter
        if (status) {
            filteredClaims = filteredClaims.filter(c => c.status === status.toString());
        }
        // Insurance filter
        if (insuranceId) {
            filteredClaims = filteredClaims.filter(c => c.insuranceId === insuranceId.toString());
        }
        // Date filters
        if (dateFrom) {
            const fromDate = new Date(dateFrom.toString());
            filteredClaims = filteredClaims.filter(c => {
                if (!c.incidentDate)
                    return false;
                const claimDate = new Date(c.incidentDate);
                return claimDate >= fromDate;
            });
        }
        if (dateTo) {
            const toDate = new Date(dateTo.toString());
            filteredClaims = filteredClaims.filter(c => {
                if (!c.incidentDate)
                    return false;
                const claimDate = new Date(c.incidentDate);
                return claimDate <= toDate;
            });
        }
        // Amount filters
        if (minAmount) {
            const min = parseFloat(minAmount.toString());
            filteredClaims = filteredClaims.filter(c => (c.estimatedDamage || 0) >= min);
        }
        if (maxAmount) {
            const max = parseFloat(maxAmount.toString());
            filteredClaims = filteredClaims.filter(c => (c.estimatedDamage || 0) <= max);
        }
        // Sort by incident date (newest first)
        filteredClaims.sort((a, b) => {
            const dateA = a.incidentDate ? new Date(a.incidentDate).getTime() : 0;
            const dateB = b.incidentDate ? new Date(b.incidentDate).getTime() : 0;
            return dateB - dateA;
        });
        // Calculate pagination
        const totalItems = filteredClaims.length;
        const totalPages = Math.ceil(totalItems / limitNum);
        const hasMore = pageNum < totalPages;
        // Get paginated results
        const paginatedClaims = filteredClaims.slice(offset, offset + limitNum);
        console.log('📄 Paginated insurance claims:', {
            totalItems,
            currentPage: pageNum,
            totalPages,
            hasMore,
            resultsCount: paginatedClaims.length
        });
        res.json({
            success: true,
            claims: paginatedClaims,
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
        console.error('Get paginated insurance claims error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní poistných udalostí'
        });
    }
});
// GET /api/insurance-claims - Získanie všetkých poistných udalostí
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { vehicleId } = req.query;
        const claims = await postgres_database_1.postgresDatabase.getInsuranceClaims(vehicleId);
        res.json({
            success: true,
            data: claims
        });
    }
    catch (error) {
        console.error('Get insurance claims error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní poistných udalostí'
        });
    }
});
// POST /api/insurance-claims - Vytvorenie novej poistnej udalosti
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { vehicleId, insuranceId, incidentDate, description, location, incidentType, estimatedDamage, deductible, payoutAmount, status, claimNumber, filePaths, policeReportNumber, otherPartyInfo, notes } = req.body;
        if (!vehicleId || !incidentDate || !description || !incidentType) {
            return res.status(400).json({
                success: false,
                error: 'vehicleId, incidentDate, description a incidentType sú povinné polia'
            });
        }
        const createdClaim = await postgres_database_1.postgresDatabase.createInsuranceClaim({
            vehicleId,
            insuranceId,
            incidentDate: new Date(incidentDate),
            description,
            location,
            incidentType,
            estimatedDamage,
            deductible,
            payoutAmount,
            status,
            claimNumber,
            filePaths,
            policeReportNumber,
            otherPartyInfo,
            notes
        });
        res.status(201).json({
            success: true,
            message: 'Poistná udalosť úspešne vytvorená',
            data: createdClaim
        });
    }
    catch (error) {
        console.error('Create insurance claim error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vytváraní poistnej udalosti'
        });
    }
});
// PUT /api/insurance-claims/:id - Aktualizácia poistnej udalosti
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { vehicleId, insuranceId, incidentDate, description, location, incidentType, estimatedDamage, deductible, payoutAmount, status, claimNumber, filePaths, policeReportNumber, otherPartyInfo, notes } = req.body;
        if (!vehicleId || !incidentDate || !description || !incidentType) {
            return res.status(400).json({
                success: false,
                error: 'vehicleId, incidentDate, description a incidentType sú povinné polia'
            });
        }
        const updatedClaim = await postgres_database_1.postgresDatabase.updateInsuranceClaim(id, {
            vehicleId,
            insuranceId,
            incidentDate: new Date(incidentDate),
            description,
            location,
            incidentType,
            estimatedDamage,
            deductible,
            payoutAmount,
            status,
            claimNumber,
            filePaths,
            policeReportNumber,
            otherPartyInfo,
            notes
        });
        res.json({
            success: true,
            message: 'Poistná udalosť úspešne aktualizovaná',
            data: updatedClaim
        });
    }
    catch (error) {
        console.error('Update insurance claim error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri aktualizácii poistnej udalosti'
        });
    }
});
// DELETE /api/insurance-claims/:id - Vymazanie poistnej udalosti
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await postgres_database_1.postgresDatabase.deleteInsuranceClaim(id);
        res.json({
            success: true,
            message: 'Poistná udalosť úspešne vymazaná'
        });
    }
    catch (error) {
        console.error('Delete insurance claim error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vymazávaní poistnej udalosti'
        });
    }
});
exports.default = router;
//# sourceMappingURL=insurance-claims.js.map