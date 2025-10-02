/**
 * 🗄️ CACHE STATS ROUTE
 * 
 * Backend endpoint pre cache monitoring
 */

import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { cacheStatsMiddleware } from '../middleware/cache-middleware';

const router = Router();

// GET /api/cache/stats - Cache statistics (admin only)
router.get('/stats', 
  authenticateToken,
  requireRole(['admin']),
  cacheStatsMiddleware
);

// POST /api/cache/clear - Clear all caches (admin only)
router.post('/clear', 
  authenticateToken,
  requireRole(['admin']),
  (req, res) => {
    try {
      // Import cache instances
      const { cacheInstances } = require('../utils/cache-service');
      
      // Clear all cache instances
      let totalCleared = 0;
      Object.entries(cacheInstances).forEach(([name, cache]: [string, any]) => {
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
    } catch (error) {
      console.error('Cache clear error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear caches'
      });
    }
  }
);

export default router;