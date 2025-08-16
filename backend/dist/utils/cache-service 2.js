"use strict";
/**
 * 🗄️ CACHE SERVICE
 *
 * Intelligent in-memory caching system pre BlackRent API:
 * - TTL-based expiration
 * - Smart invalidation strategies
 * - Performance monitoring
 * - Memory management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateRelatedCache = exports.cacheInstances = exports.CacheService = void 0;
const events_1 = require("events");
class CacheService extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            startTime: Date.now()
        };
        this.defaultOptions = {
            ttl: 5 * 60 * 1000, // 5 minutes default
            maxSize: 1000,
            tags: [],
            refreshOnAccess: true,
            serialize: true,
            onExpire: () => { }
        };
        this.defaultOptions = { ...this.defaultOptions, ...options };
        // Start automatic cleanup
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000); // Run cleanup every minute
        console.log('🗄️ Cache Service initialized');
    }
    /**
     * Set cache entry
     */
    set(key, value, options = {}) {
        const opts = { ...this.defaultOptions, ...options };
        const now = Date.now();
        // Check cache size limit
        if (this.cache.size >= opts.maxSize && !this.cache.has(key)) {
            this.evictLRU();
        }
        const entry = {
            key,
            value: opts.serialize ? JSON.parse(JSON.stringify(value)) : value,
            createdAt: now,
            expiresAt: now + opts.ttl,
            accessedAt: now,
            accessCount: 0,
            tags: [...opts.tags],
            size: this.calculateSize(value)
        };
        // Remove old entry if exists
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        this.cache.set(key, entry);
        this.stats.sets++;
        // Set expiration callback
        if (opts.onExpire) {
            setTimeout(() => {
                if (this.cache.has(key)) {
                    const currentEntry = this.cache.get(key);
                    if (currentEntry && currentEntry.expiresAt <= Date.now()) {
                        opts.onExpire(key, currentEntry.value);
                        this.delete(key);
                    }
                }
            }, opts.ttl);
        }
        this.emit('set', { key, value, options: opts });
    }
    /**
     * Get cache entry
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            this.stats.misses++;
            this.emit('miss', { key });
            return undefined;
        }
        const now = Date.now();
        // Check expiration
        if (entry.expiresAt <= now) {
            this.delete(key);
            this.stats.misses++;
            this.emit('miss', { key, reason: 'expired' });
            return undefined;
        }
        // Update access info
        entry.accessedAt = now;
        entry.accessCount++;
        // Refresh TTL if enabled
        if (this.defaultOptions.refreshOnAccess) {
            entry.expiresAt = now + this.defaultOptions.ttl;
        }
        this.stats.hits++;
        this.emit('hit', { key, entry });
        return entry.value;
    }
    /**
     * Check if key exists and is not expired
     */
    has(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        if (entry.expiresAt <= Date.now()) {
            this.delete(key);
            return false;
        }
        return true;
    }
    /**
     * Delete cache entry
     */
    delete(key) {
        const existed = this.cache.delete(key);
        if (existed) {
            this.stats.deletes++;
            this.emit('delete', { key });
        }
        return existed;
    }
    /**
     * Clear all cache entries
     */
    clear() {
        const count = this.cache.size;
        this.cache.clear();
        this.emit('clear', { count });
        console.log(`🗄️ Cache cleared: ${count} entries removed`);
    }
    /**
     * Clear entries by tags
     */
    clearByTags(tags) {
        let cleared = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.tags.some(tag => tags.includes(tag))) {
                this.cache.delete(key);
                cleared++;
            }
        }
        this.emit('clearByTags', { tags, cleared });
        console.log(`🗄️ Cache cleared by tags [${tags.join(', ')}]: ${cleared} entries`);
        return cleared;
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const now = Date.now();
        const totalRequests = this.stats.hits + this.stats.misses;
        const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
        // Calculate memory usage
        let memoryUsage = 0;
        const topKeys = [];
        for (const [key, entry] of this.cache.entries()) {
            memoryUsage += entry.size;
            topKeys.push({
                key,
                hits: entry.accessCount,
                size: entry.size
            });
        }
        // Sort by hits and take top 10
        topKeys.sort((a, b) => b.hits - a.hits).splice(10);
        return {
            totalEntries: this.cache.size,
            hitRate: Math.round(hitRate * 100) / 100,
            totalHits: this.stats.hits,
            totalMisses: this.stats.misses,
            totalSets: this.stats.sets,
            totalDeletes: this.stats.deletes,
            memoryUsage,
            uptime: now - this.stats.startTime,
            topKeys
        };
    }
    /**
     * Get or set with callback
     */
    async getOrSet(key, fetchFn, options = {}) {
        const cached = this.get(key);
        if (cached !== undefined) {
            return cached;
        }
        try {
            const value = await fetchFn();
            this.set(key, value, options);
            return value;
        }
        catch (error) {
            this.emit('fetchError', { key, error });
            throw error;
        }
    }
    /**
     * Warm cache with data
     */
    async warm(entries) {
        const promises = entries.map(async ({ key, fetchFn, options = {} }) => {
            try {
                const value = await fetchFn();
                this.set(key, value, options);
                return { key, success: true };
            }
            catch (error) {
                console.warn(`🗄️ Cache warming failed for key "${key}":`, error);
                return { key, success: false, error };
            }
        });
        const results = await Promise.allSettled(promises);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        console.log(`🗄️ Cache warmed: ${successful}/${entries.length} entries loaded`);
        this.emit('warmed', { total: entries.length, successful });
    }
    /**
     * Cleanup expired entries
     */
    cleanup() {
        const now = Date.now();
        let expired = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt <= now) {
                this.cache.delete(key);
                expired++;
            }
        }
        if (expired > 0) {
            console.log(`🗄️ Cache cleanup: ${expired} expired entries removed`);
            this.emit('cleanup', { expired });
        }
    }
    /**
     * Evict least recently used entry
     */
    evictLRU() {
        let oldestKey = null;
        let oldestTime = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (entry.accessedAt < oldestTime) {
                oldestTime = entry.accessedAt;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.emit('evict', { key: oldestKey, reason: 'lru' });
        }
    }
    /**
     * Calculate approximate size of value
     */
    calculateSize(value) {
        const json = JSON.stringify(value);
        return new Blob([json]).size;
    }
    /**
     * Destroy cache service
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
        this.removeAllListeners();
        console.log('🗄️ Cache Service destroyed');
    }
}
exports.CacheService = CacheService;
// Global cache instances for different data types
exports.cacheInstances = {
    vehicles: new CacheService({
        ttl: 10 * 60 * 1000, // 10 minutes - vehicles don't change often
        tags: ['vehicles'],
        maxSize: 500
    }),
    customers: new CacheService({
        ttl: 5 * 60 * 1000, // 5 minutes - customers change more frequently
        tags: ['customers'],
        maxSize: 1000
    }),
    companies: new CacheService({
        ttl: 30 * 60 * 1000, // 30 minutes - companies rarely change
        tags: ['companies'],
        maxSize: 100
    }),
    rentals: new CacheService({
        ttl: 2 * 60 * 1000, // 2 minutes - rentals change frequently
        tags: ['rentals'],
        maxSize: 2000
    }),
    expenses: new CacheService({
        ttl: 5 * 60 * 1000, // 5 minutes
        tags: ['expenses'],
        maxSize: 1000
    }),
    statistics: new CacheService({
        ttl: 1 * 60 * 1000, // 1 minute - stats need to be fresh
        tags: ['statistics'],
        maxSize: 50
    })
};
// Smart invalidation helper
const invalidateRelatedCache = (entity, action) => {
    console.log(`🗄️ Invalidating cache for ${entity}:${action}`);
    switch (entity) {
        case 'rental':
            exports.cacheInstances.rentals.clear();
            exports.cacheInstances.statistics.clear();
            // Don't clear vehicles/customers as rental changes don't affect them
            break;
        case 'vehicle':
            exports.cacheInstances.vehicles.clear();
            exports.cacheInstances.statistics.clear();
            // Clear rentals as vehicle changes affect availability
            if (action === 'update') {
                exports.cacheInstances.rentals.clear();
            }
            break;
        case 'customer':
            exports.cacheInstances.customers.clear();
            exports.cacheInstances.statistics.clear();
            break;
        case 'expense':
            exports.cacheInstances.expenses.clear();
            exports.cacheInstances.statistics.clear();
            break;
        case 'company':
            // Company changes affect everything
            Object.values(exports.cacheInstances).forEach(cache => cache.clear());
            break;
    }
};
exports.invalidateRelatedCache = invalidateRelatedCache;
exports.default = CacheService;
//# sourceMappingURL=cache-service%202.js.map