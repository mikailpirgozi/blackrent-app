/**
 * 🗄️ UNIFIED CACHE SYSTEM
 * 
 * Postupne nahradí všetky cache systémy jedným inteligentným systémom.
 * FÁZA 1: Wrapper okolo existujúcich systémov (BEZPEČNÉ)
 * FÁZA 2: Postupná migrácia (KONTROLOVANÉ)
 * FÁZA 3: Odstránenie starých systémov (FINÁLNE)
 */

import { logger } from './smartLogger';

// 🔄 PHASE 4: apiCache.ts removed - implementing direct cache logic
// import { apiCache, cacheKeys, cacheHelpers } from './apiCache';

export interface UnifiedCacheOptions {
  ttl?: number;
  tags?: string[];
  priority?: 'low' | 'normal' | 'high';
  backgroundRefresh?: boolean;
  background?: boolean; // Compatibility with old API
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: string;
  entryCount: number;
  systems: {
    apiCache: any;
    middleware: any;
    database: any;
  };
}

/**
 * 🎯 UNIFIED CACHE SYSTEM
 * Kompletný cache systém nahrádzajúci všetky predchádzajúce
 */
class UnifiedCacheSystem {
  private cache = new Map<string, any>();
  private stats = { hits: 0, misses: 0 };
  private defaultTTL = 10 * 60 * 1000; // 10 minutes

  /**
   * 🔄 PHASE 4: Direct cache implementation
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: UnifiedCacheOptions = {}
  ): Promise<T> {
    logger.debug(`🗄️ UNIFIED: Getting ${key}`);
    
    const ttl = options.ttl || this.defaultTTL;
    const cached = this.cache.get(key);
    
    // Check if cached and not expired
    if (cached && (Date.now() - cached.timestamp) < ttl) {
      this.stats.hits++;
      logger.debug(`🗄️ UNIFIED: Cache HIT for ${key}`);
      return cached.data;
    }
    
    // Fetch fresh data
    this.stats.misses++;
    logger.debug(`🗄️ UNIFIED: Cache MISS for ${key}, fetching...`);
    
    const data = await fetchFn();
    
    // Store in cache
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      tags: options.tags || []
    });
    
    return data;
  }

  /**
   * 🔄 PHASE 4: Direct cache invalidation
   */
  invalidateEntity(entity: string): void {
    logger.debug(`🗄️ UNIFIED: Invalidating ${entity}`);
    
    if (entity === 'all') {
      // Clear all caches
      this.cache.clear();
      logger.debug('🗄️ UNIFIED: All cache cleared');
    } else {
      // Clear cache entries with matching tags
      const keysToDelete: string[] = [];
      
      this.cache.forEach((value, key) => {
        if (value.tags && value.tags.includes(entity)) {
          keysToDelete.push(key);
        }
        // Also clear by key pattern
        if (key.includes(entity)) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        this.cache.delete(key);
        logger.debug(`🗄️ UNIFIED: Cleared cache key ${key}`);
      });
    }
  }

  /**
   * 🔄 PHASE 1: Wrapper okolo cacheKeys (BEZPEČNÉ)
   */
  generateKey(type: string, params?: any): string {
    // 🔄 PHASE 4: Direct key generation
    const baseKey = type;
    if (!params) return baseKey;
    
    // Generate consistent key from parameters
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
      
    return `${baseKey}_${paramString}`;
  }

  /**
   * 📊 Unified stats (kombinuje všetky systémy)
   */
  getStats(): CacheStats {
    // FÁZA 1: Zbiera stats zo všetkých systémov
    const apiStats = (apiCache as any).getStats?.() || {};
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) * 100 || 0,
      memoryUsage: '~calculating~',
      entryCount: apiStats.size || 0,
      systems: {
        apiCache: apiStats,
        middleware: { status: 'active' },
        database: { status: 'active' }
      }
    };
  }

  /**
   * 🧹 Clear all caches
   */
  clear(): void {
    logger.debug('🗄️ UNIFIED: Clearing all caches');
    
    // 🔄 PHASE 4: Direct cache clearing
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
    logger.debug('🗄️ UNIFIED: All caches cleared');
  }
}

// 🎯 SINGLETON INSTANCE
export const unifiedCache = new UnifiedCacheSystem();

// 🔄 COMPATIBILITY EXPORTS (pre postupnú migráciu)
export const compatibilityCache = {
  // Zachováva existujúce API
  getOrFetch: unifiedCache.getOrFetch.bind(unifiedCache),
  invalidateEntity: unifiedCache.invalidateEntity.bind(unifiedCache),
  generateKey: unifiedCache.generateKey.bind(unifiedCache),
  clear: unifiedCache.clear.bind(unifiedCache)
};

export default unifiedCache;
