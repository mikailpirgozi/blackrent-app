/**
 * 🗄️ CACHE MIDDLEWARE
 * 
 * Express middleware pre automatic caching API responses
 */

import type { Request, Response, NextFunction } from 'express';
import { cacheInstances, invalidateRelatedCache } from '../utils/cache-service';
import type { CacheOptions } from '../utils/cache-service';
import { logger } from '../utils/logger';

interface CacheMiddlewareOptions extends CacheOptions {
  cacheKey?: (req: Request) => string;
  shouldCache?: (req: Request, res: Response) => boolean;
  entity?: string; // For invalidation
}

/**
 * Cache response middleware
 */
export const cacheResponse = (cacheName: keyof typeof cacheInstances, options: CacheMiddlewareOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const cache = cacheInstances[cacheName];
    
    // Generate cache key
    const defaultCacheKey = `${req.method}:${req.originalUrl}:${req.user?.id || 'anonymous'}`;
    const cacheKey = options.cacheKey ? options.cacheKey(req) : defaultCacheKey;
    
    // Check if should cache
    const shouldCache = options.shouldCache ? options.shouldCache(req, res) : req.method === 'GET';
    
    if (!shouldCache) {
      return next();
    }
    
    // Try to get from cache
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.cache(`🗄️ Cache HIT: ${cacheKey}`);
      return res.json(cached);
    }
    
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to cache response
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data, options);
        logger.cache(`🗄️ Cache SET: ${cacheKey}`);
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Invalidate cache on write operations
 */
export const invalidateCache = (entity: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data: any) {
      // Only invalidate on successful write operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        let action: 'create' | 'update' | 'delete' = 'update';
        
        switch (req.method) {
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
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * User-specific cache key generator
 */
export const userSpecificCache = (req: Request): string => {
  const userId = req.user?.id || 'anonymous';
  const userRole = req.user?.role || 'guest';
  const companyId = req.user?.companyId || 'none';
  
  return `${req.method}:${req.originalUrl}:${userId}:${userRole}:${companyId}`;
};

/**
 * ✅ OPTIMIZED: Lazy cache warming - only warm on first request
 * Cache warming je teraz LAZY - načíta sa automaticky pri prvom requeste
 */
export const warmCache = async (): Promise<void> => {
  // ✅ OPTIMIZATION: Removed automatic cache warming
  // Cache sa teraz načíta lazy pri prvom API requeste
  // Toto zrýchli startup o ~2-3 sekundy
  logger.startup('🚀 Cache warming: LAZY MODE (načíta sa pri prvom requeste)');
};

/**
 * Cache stats endpoint middleware
 */
export const cacheStatsMiddleware = (req: Request, res: Response) => {
  const stats = Object.entries(cacheInstances).reduce((acc, [name, cache]) => {
    acc[name] = cache.getStats();
    return acc;
  }, {} as Record<string, any>);
  
  const totalStats = {
    totalCaches: Object.keys(cacheInstances).length,
    totalEntries: Object.values(stats).reduce((sum, stat) => sum + stat.totalEntries, 0),
    overallHitRate: Object.values(stats).reduce((sum, stat) => sum + stat.hitRate, 0) / Object.keys(stats).length,
    totalMemoryUsage: Object.values(stats).reduce((sum, stat) => sum + stat.memoryUsage, 0),
    caches: stats
  };
  
  res.json({
    success: true,
    data: totalStats
  });
};

export default {
  cacheResponse,
  invalidateCache,
  userSpecificCache,
  warmCache,
  cacheStatsMiddleware
};