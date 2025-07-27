"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const postgres_database_1 = require("../models/postgres-database");
const router = express_1.default.Router();
// GET /api/permissions/user/:userId - Získanie práv používateľa
router.get('/user/:userId', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { userId } = req.params;
        const permissions = await postgres_database_1.postgresDatabase.getUserPermissions(userId);
        res.json({
            success: true,
            data: permissions,
            message: 'Práva používateľa úspešne načítané'
        });
    }
    catch (error) {
        console.error('❌ Chyba pri získavaní práv používateľa:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní práv používateľa'
        });
    }
});
// GET /api/permissions/user/:userId/access - Získanie prístupu používateľa k firmám
router.get('/user/:userId/access', auth_1.authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        // Kontrola - používateľ môže vidieť len svoje práva, admin všetky
        if (req.user?.role !== 'admin' && req.user?.id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Nemáte oprávnenie na zobrazenie týchto práv'
            });
        }
        const access = await postgres_database_1.postgresDatabase.getUserCompanyAccess(userId);
        res.json({
            success: true,
            data: access,
            message: 'Prístup k firmám úspešne načítaný'
        });
    }
    catch (error) {
        console.error('❌ Chyba pri získavaní prístupu k firmám:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní prístupu k firmám'
        });
    }
});
// POST /api/permissions/user/:userId/company/:companyId - Nastavenie práv používateľa na firmu
router.post('/user/:userId/company/:companyId', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { userId, companyId } = req.params;
        const permissions = req.body.permissions;
        if (!permissions) {
            return res.status(400).json({
                success: false,
                error: 'Práva sú povinné'
            });
        }
        await postgres_database_1.postgresDatabase.setUserPermission(userId, companyId, permissions);
        res.json({
            success: true,
            message: 'Práva používateľa úspešne nastavené'
        });
    }
    catch (error) {
        console.error('❌ Chyba pri nastavovaní práv:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri nastavovaní práv'
        });
    }
});
// DELETE /api/permissions/user/:userId/company/:companyId - Odstránenie práv používateľa na firmu
router.delete('/user/:userId/company/:companyId', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { userId, companyId } = req.params;
        await postgres_database_1.postgresDatabase.removeUserPermission(userId, companyId);
        res.json({
            success: true,
            message: 'Práva používateľa úspešne odstránené'
        });
    }
    catch (error) {
        console.error('❌ Chyba pri odstraňovaní práv:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri odstraňovaní práv'
        });
    }
});
// GET /api/permissions/company/:companyId/users - Získanie používateľov s prístupom k firme
router.get('/company/:companyId/users', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { companyId } = req.params;
        const users = await postgres_database_1.postgresDatabase.getUsersWithCompanyAccess(companyId);
        res.json({
            success: true,
            data: users,
            message: 'Používatelia s prístupom k firme úspešne načítaní'
        });
    }
    catch (error) {
        console.error('❌ Chyba pri získavaní používateľov firmy:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní používateľov firmy'
        });
    }
});
// POST /api/permissions/bulk - Hromadné nastavenie práv
router.post('/bulk', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { assignments } = req.body;
        if (!Array.isArray(assignments)) {
            return res.status(400).json({
                success: false,
                error: 'Assignments musí byť pole'
            });
        }
        const results = [];
        const errors = [];
        for (const assignment of assignments) {
            try {
                const { userId, companyId, permissions } = assignment;
                await postgres_database_1.postgresDatabase.setUserPermission(userId, companyId, permissions);
                results.push({ userId, companyId, success: true });
            }
            catch (error) {
                errors.push({
                    userId: assignment.userId,
                    companyId: assignment.companyId,
                    error: error.message
                });
            }
        }
        res.json({
            success: true,
            data: { results, errors },
            message: `Hromadné nastavenie práv dokončené: ${results.length} úspešných, ${errors.length} chýb`
        });
    }
    catch (error) {
        console.error('❌ Chyba pri hromadnom nastavovaní práv:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri hromadnom nastavovaní práv'
        });
    }
});
exports.default = router;
//# sourceMappingURL=permissions.js.map