"use strict";
/**
 * 🗄️ CACHE MIDDLEWARE
 *
 * Express middleware pre automatic caching API responses
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheStatsMiddleware = exports.warmCache = exports.userSpecificCache = exports.invalidateCache = exports.cacheResponse = void 0;
const cache_service_1 = require("../utils/cache-service");
/**
 * Cache response middleware
 */
const cacheResponse = (cacheName, options = {}) => {
    return (req, res, next) => {
        const cache = cache_service_1.cacheInstances[cacheName];
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
            console.log(`🗄️ Cache HIT: ${cacheKey}`);
            return res.json(cached);
        }
        // Store original json method
        const originalJson = res.json.bind(res);
        // Override json method to cache response
        res.json = function (data) {
            // Only cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cache.set(cacheKey, data, options);
                console.log(`🗄️ Cache SET: ${cacheKey}`);
            }
            return originalJson(data);
        };
        next();
    };
};
exports.cacheResponse = cacheResponse;
/**
 * Invalidate cache on write operations
 */
const invalidateCache = (entity) => {
    return (req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = function (data) {
            // Only invalidate on successful write operations
            if (res.statusCode >= 200 && res.statusCode < 300) {
                let action = 'update';
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
                (0, cache_service_1.invalidateRelatedCache)(entity, action);
            }
            return originalJson(data);
        };
        next();
    };
};
exports.invalidateCache = invalidateCache;
/**
 * User-specific cache key generator
 */
const userSpecificCache = (req) => {
    const userId = req.user?.id || 'anonymous';
    const userRole = req.user?.role || 'guest';
    const companyId = req.user?.companyId || 'none';
    return `${req.method}:${req.originalUrl}:${userId}:${userRole}:${companyId}`;
};
exports.userSpecificCache = userSpecificCache;
/**
 * Cache warming middleware for app startup
 */
const warmCache = async () => {
    console.log('🔥 Warming cache...');
    try {
        // Import database here to avoid circular dependencies
        const { postgresDatabase } = await Promise.resolve().then(() => __importStar(require('../models/postgres-database')));
        // Warm companies cache (rarely changes)
        await cache_service_1.cacheInstances.companies.warm([
            {
                key: 'companies:all',
                fetchFn: () => postgresDatabase.getCompanies(),
                options: { ttl: 30 * 60 * 1000 } // 30 minutes
            }
        ]);
        // Warm vehicles cache
        await cache_service_1.cacheInstances.vehicles.warm([
            {
                key: 'vehicles:all',
                fetchFn: () => postgresDatabase.getVehicles(),
                options: { ttl: 10 * 60 * 1000 } // 10 minutes
            }
        ]);
        console.log('🔥 Cache warming completed');
    }
    catch (error) {
        console.warn('🔥 Cache warming failed:', error);
    }
};
exports.warmCache = warmCache;
/**
 * Cache stats endpoint middleware
 */
const cacheStatsMiddleware = (req, res) => {
    const stats = Object.entries(cache_service_1.cacheInstances).reduce((acc, [name, cache]) => {
        acc[name] = cache.getStats();
        return acc;
    }, {});
    const totalStats = {
        totalCaches: Object.keys(cache_service_1.cacheInstances).length,
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
exports.cacheStatsMiddleware = cacheStatsMiddleware;
exports.default = {
    cacheResponse: exports.cacheResponse,
    invalidateCache: exports.invalidateCache,
    userSpecificCache: exports.userSpecificCache,
    warmCache: exports.warmCache,
    cacheStatsMiddleware: exports.cacheStatsMiddleware
};
//# sourceMappingURL=cache-middleware.js.map