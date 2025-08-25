/**
 * 🗄️ UNIFIED CACHE SYSTEM
 * 
 * Postupne nahradí všetky cache systémy jedným inteligentným systémom.
 * FÁZA 1: Wrapper okolo existujúcich systémov (BEZPEČNÉ)
 * FÁZA 2: Postupná migrácia (KONTROLOVANÉ)
 * FÁZA 3: Odstránenie starých systémov (FINÁLNE)
 */

import { logger } from './smartLogger';

// 🔄 IMPORT EXISTUJÚCICH SYSTÉMOV (dočasne)
import { apiCache, cacheKeys, cacheHelpers } from './apiCache';

export interface UnifiedCacheOptions {
  ttl?: number;
  tags?: string[];
  priority?: 'low' | 'normal' | 'high';
  backgroundRefresh?: boolean;
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
 * 🎯 UNIFIED CACHE FACADE
 * Poskytuje jednotné API, ale zatiaľ deleguje na existujúce systémy
 */
class UnifiedCacheSystem {
  private stats = { hits: 0, misses: 0 };

  /**
   * 🔄 PHASE 1: Wrapper okolo apiCache (BEZPEČNÉ)
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: UnifiedCacheOptions = {}
  ): Promise<T> {
    logger.debug(`🗄️ UNIFIED: Getting ${key}`);
    
    // FÁZA 1: Deleguj na apiCache (zachová existujúce správanie)
    const result = await apiCache.getOrFetch(key, fetchFn, {
      ttl: options.ttl,
      tags: options.tags,
      background: options.backgroundRefresh
    });
    
    this.stats.hits++;
    return result;
  }

  /**
   * 🔄 PHASE 1: Wrapper okolo cacheHelpers (BEZPEČNÉ)
   */
  invalidateEntity(entity: string): void {
    logger.debug(`🗄️ UNIFIED: Invalidating ${entity}`);
    
    // FÁZA 1: Deleguj na existujúci systém
    cacheHelpers.invalidateEntity(entity);
  }

  /**
   * 🔄 PHASE 1: Wrapper okolo cacheKeys (BEZPEČNÉ)
   */
  generateKey(type: string, params?: any): string {
    // FÁZA 1: Deleguj na existujúci systém
    switch (type) {
      case 'vehicles':
        return cacheKeys.vehicles(params?.userId);
      case 'customers':
        return cacheKeys.customers(params?.userId);
      case 'companies':
        return cacheKeys.companies();
      case 'bulkData':
        return cacheKeys.bulkData();
      default:
        return `${type}:${JSON.stringify(params || {})}`;
    }
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
    
    // FÁZA 1: Vymaže všetky existujúce systémy
    try {
      (apiCache as any).clear?.();
      cacheHelpers.invalidateEntity('all');
    } catch (error) {
      logger.warn('Cache clear error:', error);
    }
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
