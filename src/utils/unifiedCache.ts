/**
 * 🗄️ UNIFIED CACHE SYSTEM
 * 
 * Replaces 5 different cache systems with one intelligent cache:
 * 1. Backend CacheService (6 instances)
 * 2. PostgresDatabase cache (4 cache types)  
 * 3. Frontend ApiCache
 * 4. AppContext cache
 * 5. AvailabilityCalendar cache
 * 
 * Features:
 * - Smart invalidation strategies
 * - Memory-efficient LRU eviction
 * - TTL-based expiration
 * - Request deduplication
 * - Background refresh
 * - Performance monitoring
 */

import { logger } from './smartLogger';

export interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: number;
  lastAccessed: number;
  ttl: number;
  tags: string[];
  size: number;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  priority?: 'low' | 'normal' | 'high';
  backgroundRefresh?: boolean;
  serialize?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: string;
  entryCount: number;
  oldestEntry: number;
  newestEntry: number;
  topKeys: Array<{ key: string; hits: number; size: number }>;
}

class UnifiedCacheSystem {
  private cache = new Map<string, CacheEntry<any>>();
  private hitCounts = new Map<string, number>();
  private pendingRequests = new Map<string, Promise<any>>();
  private stats = { hits: 0, misses: 0, startTime: Date.now() };
  
  // Configuration
  private maxSize = 1000; // Max entries
  private maxMemory = 50 * 1024 * 1024; // 50MB max memory
  private defaultTTL = 10 * 60 * 1000; // 10 minutes
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Start automatic cleanup every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 2 * 60 * 1000);
    
    logger.cache('Unified cache system initialized');
  }

  /**
   * Get or fetch data with intelligent caching
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = this.defaultTTL, tags = [], backgroundRefresh = false } = options;

    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      // Background refresh if enabled and data is getting stale
      if (backgroundRefresh && this.shouldRefresh(key)) {
        this.backgroundRefresh(key, fetchFn, options);
      }
      return cached;
    }

    // Deduplicate concurrent requests
    if (this.pendingRequests.has(key)) {
      logger.cache(`Deduplicating request for key: ${key}`);
      return this.pendingRequests.get(key)!;
    }

    // Fetch new data
    const promise = this.fetchAndCache(key, fetchFn, { ttl, tags });
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Get from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL
    if (Date.now() - entry.createdAt > entry.ttl) {
      this.cache.delete(key);
      this.hitCounts.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access time and hit count
    entry.lastAccessed = Date.now();
    this.hitCounts.set(key, (this.hitCounts.get(key) || 0) + 1);
    this.stats.hits++;
    
    logger.cache(`Cache HIT for key: ${key}`);
    return entry.value;
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const { ttl = this.defaultTTL, tags = [], priority = 'normal' } = options;
    
    const size = this.calculateSize(value);
    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      ttl,
      tags,
      size
    };

    // Check memory limits before adding
    if (this.shouldEvict(size)) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    logger.cache(`Cache SET for key: ${key} (size: ${size} bytes)`);
  }

  /**
   * Invalidate by key or tags
   */
  invalidate(keyOrTags: string | string[]): number {
    let invalidated = 0;

    if (typeof keyOrTags === 'string') {
      // Single key invalidation
      if (this.cache.has(keyOrTags)) {
        this.cache.delete(keyOrTags);
        this.hitCounts.delete(keyOrTags);
        invalidated = 1;
      }
    } else {
      // Tag-based invalidation
      const tags = keyOrTags;
      for (const [key, entry] of this.cache.entries()) {
        if (entry.tags.some(tag => tags.includes(tag))) {
          this.cache.delete(key);
          this.hitCounts.delete(key);
          invalidated++;
        }
      }
    }

    logger.cache(`Cache invalidated: ${invalidated} entries`);
    return invalidated;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const count = this.cache.size;
    this.cache.clear();
    this.hitCounts.clear();
    this.pendingRequests.clear();
    logger.cache(`Cache cleared: ${count} entries removed`);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    
    let totalMemory = 0;
    let oldestEntry = Date.now();
    let newestEntry = 0;
    
    for (const entry of this.cache.values()) {
      totalMemory += entry.size;
      if (entry.createdAt < oldestEntry) oldestEntry = entry.createdAt;
      if (entry.createdAt > newestEntry) newestEntry = entry.createdAt;
    }

    // Top keys by hit count
    const topKeys = Array.from(this.hitCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([key, hits]) => ({
        key,
        hits,
        size: this.cache.get(key)?.size || 0
      }));

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage: this.formatBytes(totalMemory),
      entryCount: this.cache.size,
      oldestEntry,
      newestEntry,
      topKeys
    };
  }

  /**
   * Private methods
   */
  private async fetchAndCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions
  ): Promise<T> {
    try {
      const data = await fetchFn();
      this.set(key, data, options);
      return data;
    } catch (error) {
      logger.error('Cache fetch failed', { key, error });
      throw error;
    }
  }

  private shouldRefresh(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Refresh if data is more than 50% of TTL old
    const age = Date.now() - entry.createdAt;
    return age > entry.ttl * 0.5;
  }

  private async backgroundRefresh<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions
  ): Promise<void> {
    try {
      const data = await fetchFn();
      this.set(key, data, options);
      logger.cache(`Background refresh completed for key: ${key}`);
    } catch (error) {
      logger.warn('Background refresh failed', { key, error });
    }
  }

  private shouldEvict(newEntrySize: number): boolean {
    if (this.cache.size >= this.maxSize) return true;
    
    const currentMemory = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
    
    return currentMemory + newEntrySize > this.maxMemory;
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.hitCounts.delete(oldestKey);
      logger.cache(`LRU evicted key: ${oldestKey}`);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let expired = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.createdAt > entry.ttl) {
        this.cache.delete(key);
        this.hitCounts.delete(key);
        expired++;
      }
    }
    
    if (expired > 0) {
      logger.cache(`Cleanup completed: ${expired} expired entries removed`);
    }
  }

  private calculateSize(value: any): number {
    // Rough size calculation
    const json = JSON.stringify(value);
    return new Blob([json]).size;
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
    logger.cache('Unified cache system destroyed');
  }
}

// Global unified cache instance
export const unifiedCache = new UnifiedCacheSystem();

// Cache helper functions for different data types
export const cacheHelpers = {
  // Vehicles cache (10 min TTL - rarely change)
  vehicles: {
    get: () => unifiedCache.get<any[]>('vehicles'),
    set: (data: any[]) => unifiedCache.set('vehicles', data, { 
      ttl: 10 * 60 * 1000, 
      tags: ['vehicles'],
      priority: 'high'
    }),
    invalidate: () => unifiedCache.invalidate(['vehicles'])
  },

  // Rentals cache (2 min TTL - change frequently)  
  rentals: {
    get: () => unifiedCache.get<any[]>('rentals'),
    set: (data: any[]) => unifiedCache.set('rentals', data, {
      ttl: 2 * 60 * 1000,
      tags: ['rentals'],
      backgroundRefresh: true
    }),
    invalidate: () => unifiedCache.invalidate(['rentals'])
  },

  // Calendar cache (5 min TTL - moderate changes)
  calendar: {
    get: (key: string) => unifiedCache.get<any>(`calendar:${key}`),
    set: (key: string, data: any) => unifiedCache.set(`calendar:${key}`, data, {
      ttl: 5 * 60 * 1000,
      tags: ['calendar', 'availability'],
      backgroundRefresh: true
    }),
    invalidate: () => unifiedCache.invalidate(['calendar', 'availability'])
  },

  // Companies cache (30 min TTL - rarely change)
  companies: {
    get: () => unifiedCache.get<any[]>('companies'),
    set: (data: any[]) => unifiedCache.set('companies', data, {
      ttl: 30 * 60 * 1000,
      tags: ['companies'],
      priority: 'normal'
    }),
    invalidate: () => unifiedCache.invalidate(['companies'])
  },

  // Customers cache (5 min TTL)
  customers: {
    get: () => unifiedCache.get<any[]>('customers'),
    set: (data: any[]) => unifiedCache.set('customers', data, {
      ttl: 5 * 60 * 1000,
      tags: ['customers']
    }),
    invalidate: () => unifiedCache.invalidate(['customers'])
  }
};

// Smart invalidation helper
export const smartInvalidation = {
  // When rental is created/updated/deleted
  onRentalChange: () => {
    unifiedCache.invalidate(['rentals', 'calendar', 'availability']);
    logger.cache('Smart invalidation: rental change');
  },

  // When vehicle is updated
  onVehicleChange: () => {
    unifiedCache.invalidate(['vehicles', 'calendar', 'availability']);
    logger.cache('Smart invalidation: vehicle change');
  },

  // When unavailability is changed
  onUnavailabilityChange: () => {
    unifiedCache.invalidate(['calendar', 'availability']);
    logger.cache('Smart invalidation: unavailability change');
  },

  // When customer is updated
  onCustomerChange: () => {
    unifiedCache.invalidate(['customers']);
    logger.cache('Smart invalidation: customer change');
  }
};

export default unifiedCache;
