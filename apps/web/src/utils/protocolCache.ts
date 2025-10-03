/**
 * 💾 PROTOCOL STATUS CACHE
 *
 * Smart caching pre protocol status:
 * - Ukladá do localStorage s TTL
 * - Instant loading + background refresh
 * - Cache invalidácia pri zmene protokolov
 */

import { logger } from './smartLogger';

export interface CachedProtocolStatus {
  rentalId: string;
  hasHandoverProtocol: boolean;
  hasReturnProtocol: boolean;
  handoverProtocolId?: string;
  returnProtocolId?: string;
  handoverCreatedAt: Date | undefined;
  returnCreatedAt: Date | undefined;
}

interface ProtocolCacheData {
  data: CachedProtocolStatus[];
  timestamp: number;
  version: string;
}

const CACHE_KEY = 'blackrent_protocol_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minút
const CACHE_VERSION = '1.0';

/**
 * 💾 Uloží protocol status do cache
 */
export const setProtocolCache = (protocols: CachedProtocolStatus[]): void => {
  try {
    const cacheData: ProtocolCacheData = {
      data: protocols,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    // Optimalized: Only log in development or when cache is large
    if (process.env.NODE_ENV === 'development' || protocols.length > 500) {
      logger.debug(`✅ Protocol cache saved: ${protocols.length} records`);
    }
  } catch (error) {
    console.warn('⚠️ Failed to save protocol cache:', error);
  }
};

/**
 * 📦 Načíta protocol status z cache (ak je fresh)
 */
export const getProtocolCache = (): CachedProtocolStatus[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const cacheData: ProtocolCacheData = JSON.parse(cached);

    // Skontroluj verziu
    if (cacheData.version !== CACHE_VERSION) {
      logger.debug('🔄 Cache version mismatch, clearing...');
      clearProtocolCache();
      return null;
    }

    // Skontroluj TTL
    const age = Date.now() - cacheData.timestamp;
    if (age > CACHE_TTL) {
      logger.debug('⏰ Protocol cache expired, clearing...');
      clearProtocolCache();
      return null;
    }

    // Konvertuj Date stringy nazad na Date objekty
    const protocols = cacheData.data.map(item => ({
      ...item,
      handoverCreatedAt: item.handoverCreatedAt
        ? new Date(item.handoverCreatedAt)
        : undefined,
      returnCreatedAt: item.returnCreatedAt
        ? new Date(item.returnCreatedAt)
        : undefined,
    }));

    // Optimalized: Consolidated cache hit log
    logger.debug(
      `📦 Protocol status: ${protocols.length} records loaded (age: ${Math.round(age / 1000)}s, cached)`
    );
    return protocols;
  } catch (error) {
    console.warn('⚠️ Failed to read protocol cache:', error);
    clearProtocolCache(); // Vyčisti corrupted cache
    return null;
  }
};

/**
 * 🗑️ Vymaže protocol cache
 */
export const clearProtocolCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
    logger.debug('🗑️ Protocol cache cleared');
  } catch (error) {
    console.warn('⚠️ Failed to clear protocol cache:', error);
  }
};

/**
 * ❓ Skontroluje či je cache fresh
 */
export const isCacheFresh = (): boolean => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return false;

    const cacheData: ProtocolCacheData = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;

    return age <= CACHE_TTL && cacheData.version === CACHE_VERSION;
  } catch (error) {
    return false;
  }
};

/**
 * 📊 Vráti cache info pre debugging
 */
export const getCacheInfo = (): {
  exists: boolean;
  age?: number;
  records?: number;
  fresh?: boolean;
} => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return { exists: false };

    const cacheData: ProtocolCacheData = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;
    const fresh = age <= CACHE_TTL && cacheData.version === CACHE_VERSION;

    return {
      exists: true,
      age: Math.round(age / 1000),
      records: cacheData.data.length,
      fresh,
    };
  } catch (error) {
    return { exists: false };
  }
};
