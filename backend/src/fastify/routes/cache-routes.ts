/**
 * 🗄️ CACHE STATS ROUTES - Fastify Migration
 * 
 * Migrated from: backend/src/routes/cache.ts
 * Purpose: Cache monitoring and management
 */

import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { authenticateFastify } from '../decorators/auth';
import { requireRoleFastify } from '../decorators/auth';
import { cacheInstances } from '../../utils/cache-service';

const cacheRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/cache/stats - Cache statistics (admin only)
  fastify.get('/stats', {
    preHandler: [
      authenticateFastify,
      requireRoleFastify(['admin', 'super_admin'])
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Use the getCacheStats helper from cache-middleware plugin
      const totalStats = fastify.getCacheStats();

      return reply.send({
        success: true,
        data: totalStats
      });
    } catch (error) {
      request.log.error(error, 'Cache stats error');
      return reply.status(500).send({
        success: false,
        error: 'Failed to get cache stats'
      });
    }
  });

  // POST /api/cache/clear - Clear all caches (admin only)
  fastify.post('/clear', {
    preHandler: [
      authenticateFastify,
      requireRoleFastify(['admin', 'super_admin'])
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Clear all cache instances
      let totalCleared = 0;
      
      Object.entries(cacheInstances).forEach(([name, cache]) => {
        const stats = cache.getStats();
        const size = stats.totalEntries || 0;
        totalCleared += size;
        cache.clear();
        request.log.info({ name, entries: size }, '🗄️ Cleared cache');
      });

      return reply.send({
        success: true,
        message: `Cleared ${totalCleared} cache entries across all caches`,
        data: { clearedEntries: totalCleared }
      });
    } catch (error) {
      request.log.error(error, 'Cache clear error');
      return reply.status(500).send({
        success: false,
        error: 'Failed to clear caches'
      });
    }
  });
};

export default cacheRoutes;

