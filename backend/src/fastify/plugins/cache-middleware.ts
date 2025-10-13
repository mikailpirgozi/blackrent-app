/**
 * 🗄️ CACHE MIDDLEWARE FOR FASTIFY
 * 
 * Fastify plugin for automatic caching API responses
 * 100% Express equivalent from backend/src/middleware/cache-middleware.ts
 */

import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { cacheInstances, invalidateRelatedCache } from '../../utils/cache-service';
import type { CacheOptions } from '../../utils/cache-service';

interface CacheMiddlewareOptions extends CacheOptions {
  cacheKey?: (request: FastifyRequest) => string;
  shouldCache?: (request: FastifyRequest) => boolean;
  entity?: string; // For invalidation
}

// Store cache metadata in request context
interface CacheContext {
  cacheKey: string;
  cacheName: keyof typeof cacheInstances;
  options: CacheMiddlewareOptions;
  shouldCache: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    cacheContext?: CacheContext;
  }
}

/**
 * Cache response hook for Fastify (onRequest phase)
 */
export function cacheResponseHook(
  cacheName: keyof typeof cacheInstances,
  options: CacheMiddlewareOptions = {}
) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const cache = cacheInstances[cacheName];

    // Generate cache key
    const defaultCacheKey = `${request.method}:${request.url}:${request.user?.id || 'anonymous'}`;
    const cacheKey = options.cacheKey ? options.cacheKey(request) : defaultCacheKey;

    // Check if should cache
    const shouldCache = options.shouldCache ? options.shouldCache(request) : request.method === 'GET';

    // Store cache context for onSend hook
    request.cacheContext = {
      cacheKey,
      cacheName,
      options,
      shouldCache
    };

    if (!shouldCache) {
      return;
    }

    // Try to get from cache
    const cached = cache.get(cacheKey);
    if (cached) {
      request.log.info(`🗄️ Cache HIT: ${cacheKey}`);
      // Send cached response and skip handler
      reply.send(cached);
    }
  };
}

/**
 * Invalidate cache on write operations (onResponse hook)
 */
export function invalidateCacheHook(entity: string) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Only invalidate on successful write operations
    if (reply.statusCode >= 200 && reply.statusCode < 300) {
      let action: 'create' | 'update' | 'delete' = 'update';

      switch (request.method) {
        case 'POST':
          action = 'create';
          break;
        case 'PUT':
        case 'PATCH':
          action = 'update';
          break;
        case 'DELETE':
          action = 'delete';
          break;
      }

      invalidateRelatedCache(entity, action);
      request.log.info(`🗄️ Cache INVALIDATED: ${entity} (${action})`);
    }
  };
}

/**
 * User-specific cache key generator
 */
export const userSpecificCache = (request: FastifyRequest): string => {
  const userId = request.user?.id || 'anonymous';
  const userRole = request.user?.role || 'guest';
  const companyId = request.user?.companyId || 'none';

  return `${request.method}:${request.url}:${userId}:${userRole}:${companyId}`;
};

/**
 * Cache stats helper
 */
export const getCacheStats = () => {
  const stats = Object.entries(cacheInstances).reduce((acc, [name, cache]) => {
    acc[name] = cache.getStats();
    return acc;
  }, {} as Record<string, unknown>);

  const statsArray = Object.values(stats) as Array<Record<string, unknown>>;

  return {
    totalCaches: Object.keys(cacheInstances).length,
    totalEntries: statsArray.reduce((sum: number, stat: Record<string, unknown>) => sum + ((stat.totalEntries as number) || 0), 0),
    overallHitRate: statsArray.reduce((sum: number, stat: Record<string, unknown>) => sum + ((stat.hitRate as number) || 0), 0) / Object.keys(stats).length,
    totalMemoryUsage: statsArray.reduce((sum: number, stat: Record<string, unknown>) => sum + ((stat.memoryUsage as number) || 0), 0),
    caches: stats
  };
};

/**
 * onSend hook to store responses in cache
 */
const onSendCacheHook = async (
  request: FastifyRequest,
  reply: FastifyReply,
  payload: unknown
): Promise<unknown> => {
  const cacheContext = request.cacheContext;

  if (!cacheContext || !cacheContext.shouldCache) {
    return payload;
  }

  // Only cache successful responses
  if (reply.statusCode >= 200 && reply.statusCode < 300) {
    try {
      const cache = cacheInstances[cacheContext.cacheName];
      const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
      cache.set(cacheContext.cacheKey, data, cacheContext.options);
      request.log.info(`🗄️ Cache SET: ${cacheContext.cacheKey}`);
    } catch (error) {
      request.log.error(error, 'Cache set failed');
    }
  }

  return payload;
};

/**
 * Fastify plugin to register cache helpers and global hooks
 */
const cachePlugin: FastifyPluginAsync = async (fastify) => {
  // Register global onSend hook for caching
  fastify.addHook('onSend', onSendCacheHook);

  // Decorate fastify with cache helpers
  fastify.decorate('cacheResponseHook', cacheResponseHook);
  fastify.decorate('invalidateCacheHook', invalidateCacheHook);
  fastify.decorate('userSpecificCache', userSpecificCache);
  fastify.decorate('getCacheStats', getCacheStats);

  fastify.log.info('✅ Cache middleware plugin registered with onSend hook');
};

export default fp(cachePlugin, {
  name: 'cache-middleware',
  fastify: '5.x'
});

// TypeScript declarations
declare module 'fastify' {
  interface FastifyInstance {
    cacheResponseHook: typeof cacheResponseHook;
    invalidateCacheHook: typeof invalidateCacheHook;
    userSpecificCache: typeof userSpecificCache;
    getCacheStats: typeof getCacheStats;
  }
}


