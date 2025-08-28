"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const postgres_database_js_1 = require("../models/postgres-database.js");
const auth_js_1 = require("../middleware/auth.js");
const logger_js_1 = require("../utils/logger.js");
const router = express_1.default.Router();
// 🔍 GET /api/customer-merge/duplicates - Nájdi duplicitných zákazníkov
router.get('/duplicates', auth_js_1.authenticateToken, async (req, res) => {
    try {
        logger_js_1.logger.info('🔍 Finding duplicate customers...');
        const duplicates = await postgres_database_js_1.postgresDatabase.findDuplicateCustomers();
        // Pridaj štatistiky pre každého zákazníka
        const duplicatesWithStats = await Promise.all(duplicates.map(async (duplicate) => {
            const customer1Stats = await postgres_database_js_1.postgresDatabase.getCustomerStats(duplicate.group[0].id);
            const customer2Stats = await postgres_database_js_1.postgresDatabase.getCustomerStats(duplicate.group[1].id);
            return {
                ...duplicate,
                group: [
                    { ...duplicate.group[0], stats: customer1Stats },
                    { ...duplicate.group[1], stats: customer2Stats }
                ]
            };
        }));
        logger_js_1.logger.info(`✅ Found ${duplicatesWithStats.length} potential duplicate groups`);
        res.json({
            success: true,
            data: duplicatesWithStats
        });
    }
    catch (error) {
        logger_js_1.logger.error(`❌ Error finding duplicates: ${error}`);
        res.status(500).json({
            success: false,
            error: 'Chyba pri hľadaní duplicitných zákazníkov'
        });
    }
});
// 🔄 POST /api/customer-merge/merge - Zjednoť zákazníkov
router.post('/merge', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { targetCustomerId, sourceCustomerId, mergedData } = req.body;
        // Validácia vstupných údajov
        if (!targetCustomerId || !sourceCustomerId || !mergedData) {
            return res.status(400).json({
                success: false,
                error: 'Chýbajú povinné údaje pre merge'
            });
        }
        if (targetCustomerId === sourceCustomerId) {
            return res.status(400).json({
                success: false,
                error: 'Nemožno zjednotiť zákazníka so sebou samým'
            });
        }
        if (!mergedData.name || !mergedData.name.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Meno zákazníka je povinné'
            });
        }
        logger_js_1.logger.info(`🔄 Merging customer ${sourceCustomerId} into ${targetCustomerId}`);
        // Získaj štatistiky pred merge
        const sourceStats = await postgres_database_js_1.postgresDatabase.getCustomerStats(sourceCustomerId);
        const targetStats = await postgres_database_js_1.postgresDatabase.getCustomerStats(targetCustomerId);
        // Vykonaj merge
        await postgres_database_js_1.postgresDatabase.mergeCustomers(targetCustomerId, sourceCustomerId, {
            name: mergedData.name.trim(),
            email: mergedData.email?.trim() || '',
            phone: mergedData.phone?.trim() || ''
        });
        // Získaj finálne štatistiky
        const finalStats = await postgres_database_js_1.postgresDatabase.getCustomerStats(targetCustomerId);
        logger_js_1.logger.info(`✅ Customer merge completed: ${sourceStats.rentalCount + targetStats.rentalCount} rentals merged`);
        res.json({
            success: true,
            data: {
                mergedCustomerId: targetCustomerId,
                mergedRentals: sourceStats.rentalCount + targetStats.rentalCount,
                finalStats
            }
        });
    }
    catch (error) {
        logger_js_1.logger.error(`❌ Error merging customers: ${error}`);
        res.status(500).json({
            success: false,
            error: 'Chyba pri zjednocovaní zákazníkov'
        });
    }
});
// 📊 GET /api/customer-merge/stats/:customerId - Získaj štatistiky zákazníka
router.get('/stats/:customerId', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { customerId } = req.params;
        const stats = await postgres_database_js_1.postgresDatabase.getCustomerStats(customerId);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger_js_1.logger.error(`❌ Error getting customer stats: ${error}`);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní štatistík zákazníka'
        });
    }
});
exports.default = router;
//# sourceMappingURL=customer-merge.js.map