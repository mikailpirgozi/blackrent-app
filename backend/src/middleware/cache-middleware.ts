/**
 * 🗄️ CACHE MIDDLEWARE
 * 
 * Express middleware pre automatic caching API responses
 */

import type { NextFunction, Request, Response } from 'express';
import type { CacheOptions } from '../utils/cache-service';
import { cacheInstances, invalidateRelatedCache } from '../utils/cache-service';

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
      // console.log(`🗄️ Cache HIT: ${cacheKey}`);
      return res.json(cached);
    }
    
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to cache response
    res.json = function(data: unknown) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data, options);
        // console.log(`🗄️ Cache SET: ${cacheKey}`);
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
    
    res.json = function(data: unknown) {
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
 * Cache warming middleware for app startup
 */
export const warmCache = async (): Promise<void> => {
  // console.log('🔥 Warming cache...');
  
  try {
    // Import database here to avoid circular dependencies
    const { postgresDatabase } = await import('../models/postgres-database');
    
    // Warm companies cache (rarely changes)
    await cacheInstances.companies.warm([
      {
        key: 'companies:all',
        fetchFn: () => postgresDatabase.getCompanies(),
        options: { ttl: 30 * 60 * 1000 } // 30 minutes
      }
    ]);
    
    // Warm vehicles cache
    await cacheInstances.vehicles.warm([
      {
        key: 'vehicles:all',
        fetchFn: () => postgresDatabase.getVehicles(),
        options: { ttl: 10 * 60 * 1000 } // 10 minutes
      }
    ]);
    
    // console.log('🔥 Cache warming completed');
  } catch (error) {
    console.warn('🔥 Cache warming failed:', error);
  }
};

/**
 * Cache stats endpoint middleware
 */
export const cacheStatsMiddleware = (req: Request, res: Response) => {
  const stats = Object.entries(cacheInstances).reduce((acc, [name, cache]) => {
    acc[name] = cache.getStats();
    return acc;
  }, {} as Record<string, unknown>);
  
  const totalStats = {
    totalCaches: Object.keys(cacheInstances).length,
    totalEntries: Object.values(stats).reduce((sum, stat) => sum + (stat as any).totalEntries, 0),
    overallHitRate: Object.values(stats).reduce((sum, stat) => sum + (stat as any).hitRate, 0) / Object.keys(stats).length,
    totalMemoryUsage: Object.values(stats).reduce((sum, stat) => sum + (stat as any).memoryUsage, 0),
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