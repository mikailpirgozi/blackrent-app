"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const migrate_to_r2_js_1 = require("../utils/migrate-to-r2.js");
const r2_storage_js_1 = require("../utils/r2-storage.js");
const router = express_1.default.Router();
// Kontrola R2 konfigurácie
router.get('/r2-status', async (req, res) => {
    try {
        const isConfigured = r2_storage_js_1.r2Storage.isConfigured();
        res.json({
            success: true,
            configured: isConfigured,
            message: isConfigured ? 'R2 Storage je nakonfigurované' : 'R2 Storage nie je nakonfigurované',
            missingVariables: isConfigured ? [] : [
                'R2_ENDPOINT',
                'R2_ACCESS_KEY_ID',
                'R2_SECRET_ACCESS_KEY',
                'R2_BUCKET_NAME',
                'R2_PUBLIC_URL'
            ]
        });
    }
    catch (error) {
        console.error('❌ Error checking R2 status:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri kontrole R2 stavu'
        });
    }
});
// Spustenie migrácie
router.post('/migrate-to-r2', async (req, res) => {
    try {
        console.log('🚀 Spúšťam migráciu do R2...');
        // Kontrola či je R2 nakonfigurované
        if (!r2_storage_js_1.r2Storage.isConfigured()) {
            return res.status(400).json({
                success: false,
                error: 'R2 Storage nie je nakonfigurované',
                message: 'Nastavte environment variables v Railway'
            });
        }
        // Spustenie migrácie asynchrónne
        migrate_to_r2_js_1.r2Migration.migrateAllProtocols().catch(error => {
            console.error('❌ Chyba pri migrácii:', error);
        });
        res.json({
            success: true,
            message: 'Migrácia bola spustená. Kontrolujte logy pre progress.',
            note: 'Migrácia beží na pozadí. Môže trvať niekoľko minút.'
        });
    }
    catch (error) {
        console.error('❌ Error starting migration:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri spúšťaní migrácie'
        });
    }
});
// Kontrola stavu migrácie
router.get('/migration-status', async (req, res) => {
    try {
        await migrate_to_r2_js_1.r2Migration.checkMigrationStatus();
        res.json({
            success: true,
            message: 'Stav migrácie bol skontrolovaný. Pozrite si server logy.'
        });
    }
    catch (error) {
        console.error('❌ Error checking migration status:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri kontrole stavu migrácie'
        });
    }
});
exports.default = router;
//# sourceMappingURL=migration.js.map