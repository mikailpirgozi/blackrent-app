/**
 * 🗄️ CACHE SERVICE
 *
 * Intelligent in-memory caching system pre BlackRent API:
 * - TTL-based expiration
 * - Smart invalidation strategies
 * - Performance monitoring
 * - Memory management
 */
import { EventEmitter } from 'events';
export interface CacheOptions {
    ttl?: number;
    maxSize?: number;
    tags?: string[];
    refreshOnAccess?: boolean;
    serialize?: boolean;
    onExpire?: (key: string, value: any) => void;
}
export interface CacheEntry<T> {
    key: string;
    value: T;
    createdAt: number;
    expiresAt: number;
    accessedAt: number;
    accessCount: number;
    tags: string[];
    size: number;
}
export interface CacheStats {
    totalEntries: number;
    hitRate: number;
    totalHits: number;
    totalMisses: number;
    totalSets: number;
    totalDeletes: number;
    memoryUsage: number;
    uptime: number;
    topKeys: Array<{
        key: string;
        hits: number;
        size: number;
    }>;
}
export declare class CacheService extends EventEmitter {
    private cache;
    private stats;
    private defaultOptions;
    private cleanupInterval;
    constructor(options?: Partial<CacheOptions>);
    /**
     * Set cache entry
     */
    set<T>(key: string, value: T, options?: CacheOptions): void;
    /**
     * Get cache entry
     */
    get<T>(key: string): T | undefined;
    /**
     * Check if key exists and is not expired
     */
    has(key: string): boolean;
    /**
     * Delete cache entry
     */
    delete(key: string): boolean;
    /**
     * Clear all cache entries
     */
    clear(): void;
    /**
     * Clear entries by tags
     */
    clearByTags(tags: string[]): number;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Get or set with callback
     */
    getOrSet<T>(key: string, fetchFn: () => Promise<T> | T, options?: CacheOptions): Promise<T>;
    /**
     * Warm cache with data
     */
    warm(entries: Array<{
        key: string;
        fetchFn: () => Promise<any>;
        options?: CacheOptions;
    }>): Promise<void>;
    /**
     * Cleanup expired entries
     */
    private cleanup;
    /**
     * Evict least recently used entry
     */
    private evictLRU;
    /**
     * Calculate approximate size of value
     */
    private calculateSize;
    /**
     * Destroy cache service
     */
    destroy(): void;
}
export declare const cacheInstances: {
    vehicles: CacheService;
    customers: CacheService;
    companies: CacheService;
    rentals: CacheService;
    expenses: CacheService;
    statistics: CacheService;
};
export declare const invalidateRelatedCache: (entity: string, action: "create" | "update" | "delete") => void;
export default CacheService;
//# sourceMappingURL=cache-service%202.d.ts.map