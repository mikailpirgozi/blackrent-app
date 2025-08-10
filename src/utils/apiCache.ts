/**
 * 🗄️ FRONTEND API CACHE
 * 
 * Intelligent frontend caching pre API responses:
 * - In-memory cache s TTL
 * - Smart invalidation 
 * - Request deduplication
 * - Offline support
 */

import { RequestDeduplicator } from './debounce';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  tags: string[];
}

export interface CacheOptions {
  ttl?: number; // milliseconds
  tags?: string[];
  forceRefresh?: boolean;
  background?: boolean; // Update cache in background
}

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  memoryUsage: string;
  oldestEntry: string;
  newestEntry: string;
  topHits: Array<{ key: string; hits: number }>;
}

class FrontendApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private deduplicator = new RequestDeduplicator();
  private stats = { hits: 0, misses: 0 };
  private maxSize = 500; // Max cache entries
  private defaultTTL = 10 * 60 * 1000; // 10 minutes - optimized for performance

  /**
   * Get cached data or fetch new
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = this.defaultTTL, tags = [], forceRefresh = false, background = false } = options;

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = this.get<T>(key);
      if (cached !== null) {
        // If background refresh enabled, update cache async
        if (background && this.shouldRefresh(key)) {
          this.backgroundRefresh(key, fetchFn, { ttl, tags });
        }
        return cached;
      }
    }

    // Deduplicate concurrent requests
    return this.deduplicator.deduplicate(key, async () => {
      try {
        const data = await fetchFn();
        this.set(key, data, { ttl, tags });
        return data;
      } catch (error) {
        console.warn(`🗄️ Cache fetch failed for "${key}":`, error);
        throw error;
      }
    });
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

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update stats
    entry.hits++;
    this.stats.hits++;
    
    return entry.data;
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const { ttl = this.defaultTTL, tags = [] } = options;

    // Check cache size limit
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      tags: [...tags]
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if entry should be refreshed (before expiration)
   */
  private shouldRefresh(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;

    const age = Date.now() - entry.timestamp;
    const refreshThreshold = entry.ttl * 0.75; // Refresh at 75% of TTL
    
    return age > refreshThreshold;
  }

  /**
   * Background cache refresh
   */
  private async backgroundRefresh<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions
  ): Promise<void> {
    try {
      const data = await fetchFn();
      this.set(key, data, options);
      console.log(`🗄️ Background refresh completed for "${key}"`);
    } catch (error) {
      console.warn(`🗄️ Background refresh failed for "${key}":`, error);
    }
  }

  /**
   * Invalidate by key
   */
  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate by tags
   */
  invalidateByTags(tags: string[]): number {
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      console.log(`🗄️ Invalidated ${count} entries by tags:`, tags);
    }

    return count;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗄️ Cache cleared: ${size} entries removed`);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    
    // Calculate memory usage estimate
    const entriesArray = Array.from(this.cache.entries());
    const avgEntrySize = 1000; // Approximate bytes per entry
    const memoryUsage = (entriesArray.length * avgEntrySize / 1024).toFixed(1) + ' KB';
    
    // Find oldest/newest entries
    const timestamps = entriesArray.map(([_, entry]) => entry.timestamp);
    const oldestTimestamp = Math.min(...timestamps);
    const newestTimestamp = Math.max(...timestamps);
    
    // Top hits
    const topHits = entriesArray
      .map(([key, entry]) => ({ key, hits: entry.hits }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 5);

    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      totalRequests,
      memoryUsage,
      oldestEntry: new Date(oldestTimestamp).toLocaleString(),
      newestEntry: new Date(newestTimestamp).toLocaleString(),
      topHits
    };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Preload cache with data
   */
  async preload(entries: Array<{
    key: string;
    fetchFn: () => Promise<any>;
    options?: CacheOptions;
  }>): Promise<void> {
    const promises = entries.map(async ({ key, fetchFn, options }) => {
      try {
        const data = await fetchFn();
        this.set(key, data, options);
        return { key, success: true };
      } catch (error) {
        console.warn(`🗄️ Preload failed for "${key}":`, error);
        return { key, success: false, error };
      }
    });

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    
    console.log(`🗄️ Cache preloaded: ${successful}/${entries.length} entries`);
  }
}

// Global cache instance
export const apiCache = new FrontendApiCache();

// Cache key generators
export const cacheKeys = {
  vehicles: (userId?: string) => `vehicles:${userId || 'all'}`,
  customers: (userId?: string) => `customers:${userId || 'all'}`,
  companies: () => 'companies:all',
  rentals: (userId?: string) => `rentals:${userId || 'all'}`,
  expenses: (userId?: string) => `expenses:${userId || 'all'}`,
  statistics: (timeRange?: string, userId?: string) => 
    `statistics:${timeRange || 'month'}:${userId || 'all'}`,
  user: (userId: string) => `user:${userId}`,
  permissions: (userId: string) => `permissions:${userId}`,
  // 🆕 NEW CACHE KEYS for optimizations
  bulkData: () => 'bulk:data:all',
  vehicleOwnership: () => 'vehicles:ownership:history'
};

// Entity-specific cache helpers
export const cacheHelpers = {
  /**
   * Invalidate all related caches when entity changes
   */
  invalidateEntity: (entity: 'vehicle' | 'customer' | 'rental' | 'expense' | 'company') => {
    console.log(`🗄️ Invalidating frontend cache for entity: ${entity}`);
    
    switch (entity) {
      case 'vehicle':
        apiCache.invalidateByTags(['vehicles']);
        apiCache.invalidateByTags(['statistics']); 
        break;
      case 'customer':
        apiCache.invalidateByTags(['customers']);
        apiCache.invalidateByTags(['statistics']);
        break;
      case 'rental':
        apiCache.invalidateByTags(['rentals']);
        apiCache.invalidateByTags(['statistics']);
        break;
      case 'expense':
        apiCache.invalidateByTags(['expenses']);
        apiCache.invalidateByTags(['statistics']);
        break;
      case 'company':
        apiCache.clear(); // Company changes affect everything
        break;
    }
  },

  /**
   * Warm cache on app startup
   */
  warmCache: async () => {
    const userId = localStorage.getItem('blackrent_user_id');
    
    await apiCache.preload([
      {
        key: cacheKeys.companies(),
        fetchFn: () => fetch('/api/companies').then(r => r.json()),
        options: { ttl: 30 * 60 * 1000, tags: ['companies'] }
      },
      {
        key: cacheKeys.vehicles(userId || undefined),
        fetchFn: () => fetch('/api/vehicles').then(r => r.json()),
        options: { ttl: 10 * 60 * 1000, tags: ['vehicles'] }
      }
    ]);
  }
};

// Cache debugging helpers
export const cacheDebug = {
  getStats: () => apiCache.getStats(),
  clear: () => apiCache.clear(),
  invalidate: (key: string) => apiCache.invalidate(key),
  inspect: () => {
    console.table(apiCache.getStats());
  }
};

// Make cache accessible globally for debugging
if (typeof window !== 'undefined') {
  (window as any).apiCache = { apiCache, cacheHelpers, cacheDebug };
}

export default apiCache;