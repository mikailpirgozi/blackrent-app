"use strict";
/**
 * 🗄️ CACHE STATS ROUTE
 *
 * Backend endpoint pre cache monitoring
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const cache_middleware_1 = require("../middleware/cache-middleware");
const router = (0, express_1.Router)();
// GET /api/cache/stats - Cache statistics (admin only)
router.get('/stats', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), cache_middleware_1.cacheStatsMiddleware);
// POST /api/cache/clear - Clear all caches (admin only)
router.post('/clear', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), (req, res) => {
    try {
        // Import cache instances
        const { cacheInstances } = require('../utils/cache-service');
        // Clear all cache instances
        let totalCleared = 0;
        Object.entries(cacheInstances).forEach(([name, cache]) => {
            const size = cache.cache?.size || 0;
            totalCleared += size;
            cache.clear();
            console.log(`🗄️ Cleared ${name} cache: ${size} entries`);
        });
        res.json({
            success: true,
            message: `Cleared ${totalCleared} cache entries across all caches`,
            data: { clearedEntries: totalCleared }
        });
    }
    catch (error) {
        console.error('Cache clear error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear caches'
        });
    }
});
exports.default = router;
//# sourceMappingURL=cache.js.map