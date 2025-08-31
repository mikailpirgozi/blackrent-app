/**
 * Protocol V2 Smart Caching System
 * Rozšírenie existujúceho caching systému o V2 funkcionalitu
 */

import type { HandoverProtocolDataV2 } from '../components/protocols/v2/HandoverProtocolFormV2';
import type { PhotoCategory } from '../types';

// V2 Cache interfaces
interface V2FormDefaults {
  // Rental defaults
  rental: {
    orderNumber?: string;
    totalPrice?: number;
    deposit?: number;
    allowedKilometers?: number;
    extraKilometerRate?: number;
    pickupLocation?: string;
    returnLocation?: string;
  };

  // Protocol defaults
  fuelLevel?: number;
  odometer?: number;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  depositPaymentMethod?: 'cash' | 'bank_transfer' | 'card';

  // Photo category preferences
  photoPreferences: {
    [K in PhotoCategory]: {
      maxPhotos: number;
      autoUpload: boolean;
      compressionLevel: 'low' | 'medium' | 'high';
    };
  };

  // Company-specific settings
  companySettings?: {
    defaultLocation?: string;
    defaultFuelLevel?: number;
    defaultDepositMethod?: 'cash' | 'bank_transfer' | 'card';
    preferredPhotoCategories?: PhotoCategory[];
  };
}

interface V2CachedData {
  data: V2FormDefaults;
  timestamp: number;
  version: number;
  companyName?: string;
}

interface EmailStatusCache {
  protocolId: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message?: string;
  timestamp: number;
  retryCount: number;
}

// Cache constants
const V2_CACHE_KEY = 'blackrent_protocol_v2_cache';
const V2_COMPANY_CACHE_PREFIX = 'blackrent_protocol_v2_company_';
const EMAIL_STATUS_CACHE_KEY = 'blackrent_email_status_cache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 dní
const EMAIL_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hodín
const CACHE_VERSION = 2;

/**
 * 🔄 Získanie default V2 nastavení
 */
const getDefaultV2Settings = (): V2FormDefaults => ({
  rental: {
    extraKilometerRate: 0.5,
    deposit: 0,
    allowedKilometers: 0,
  },
  fuelLevel: 100,
  condition: 'excellent',
  depositPaymentMethod: 'cash',
  photoPreferences: {
    vehicle: {
      maxPhotos: 10,
      autoUpload: true,
      compressionLevel: 'medium',
    },
    document: {
      maxPhotos: 5,
      autoUpload: true,
      compressionLevel: 'high',
    },
    damage: {
      maxPhotos: 15,
      autoUpload: true,
      compressionLevel: 'low',
    },
    odometer: {
      maxPhotos: 2,
      autoUpload: true,
      compressionLevel: 'high',
    },
    fuel: {
      maxPhotos: 2,
      autoUpload: true,
      compressionLevel: 'high',
    },
  },
});

/**
 * 🔄 Smart defaults pre V2 protokoly
 */
export const getV2SmartDefaults = (companyName?: string): V2FormDefaults => {
  try {
    // Najprv skús company-specific cache
    if (companyName) {
      const companyCache = getCompanyV2Cache(companyName);
      if (companyCache) {
        console.log(`🔄 V2: Using company defaults for ${companyName}`);
        return companyCache;
      }
    }

    // Potom globálny V2 cache
    const globalCache = getGlobalV2Cache();
    if (globalCache) {
      console.log('🔄 V2: Using global cached defaults');
      return globalCache;
    }

    // Nakoniec default hodnoty
    console.log('🔄 V2: Using default settings');
    return getDefaultV2Settings();
  } catch (error) {
    console.warn('Failed to load V2 smart defaults:', error);
    return getDefaultV2Settings();
  }
};

/**
 * 🔄 Uloženie V2 form defaults
 */
export const cacheV2FormDefaults = (
  formData: Partial<V2FormDefaults>,
  companyName?: string
): void => {
  try {
    if (companyName) {
      // Company-specific cache
      cacheCompanyV2Defaults(companyName, formData);
    } else {
      // Global cache
      const existing = getGlobalV2Cache() || getDefaultV2Settings();
      const newCache: V2CachedData = {
        data: {
          ...existing,
          ...formData,
        },
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };

      localStorage.setItem(V2_CACHE_KEY, JSON.stringify(newCache));
      console.log('🔄 V2: Global defaults cached');
    }
  } catch (error) {
    console.warn('Failed to cache V2 form defaults:', error);
  }
};

/**
 * 🔄 Company-specific V2 caching
 */
export const cacheCompanyV2Defaults = (
  companyName: string,
  formData: Partial<V2FormDefaults>
): void => {
  try {
    const companyKey = `${V2_COMPANY_CACHE_PREFIX}${companyName}`;
    const existing = getCompanyV2Cache(companyName) || getDefaultV2Settings();

    const companyCache: V2CachedData = {
      data: {
        ...existing,
        ...formData,
        companySettings: {
          ...existing.companySettings,
          ...formData.companySettings,
        },
      },
      timestamp: Date.now(),
      version: CACHE_VERSION,
      companyName,
    };

    localStorage.setItem(companyKey, JSON.stringify(companyCache));
    console.log(`🔄 V2: Company defaults cached for ${companyName}`);
  } catch (error) {
    console.warn(
      `Failed to cache V2 company defaults for ${companyName}:`,
      error
    );
  }
};

/**
 * 🔄 Získanie company-specific cache
 */
const getCompanyV2Cache = (companyName: string): V2FormDefaults | null => {
  try {
    const companyKey = `${V2_COMPANY_CACHE_PREFIX}${companyName}`;
    const cached = localStorage.getItem(companyKey);

    if (!cached) return null;

    const cachedData: V2CachedData = JSON.parse(cached);

    // Kontrola verzie a TTL
    if (
      cachedData.version !== CACHE_VERSION ||
      Date.now() - cachedData.timestamp > CACHE_TTL
    ) {
      localStorage.removeItem(companyKey);
      return null;
    }

    return cachedData.data;
  } catch (error) {
    console.warn(`Failed to load company V2 cache for ${companyName}:`, error);
    return null;
  }
};

/**
 * 🔄 Získanie globálneho V2 cache
 */
const getGlobalV2Cache = (): V2FormDefaults | null => {
  try {
    const cached = localStorage.getItem(V2_CACHE_KEY);
    if (!cached) return null;

    const cachedData: V2CachedData = JSON.parse(cached);

    // Kontrola verzie a TTL
    if (
      cachedData.version !== CACHE_VERSION ||
      Date.now() - cachedData.timestamp > CACHE_TTL
    ) {
      localStorage.removeItem(V2_CACHE_KEY);
      return null;
    }

    return cachedData.data;
  } catch (error) {
    console.warn('Failed to load global V2 cache:', error);
    return null;
  }
};

/**
 * 📧 Email Status Tracking & Caching
 */
export const cacheEmailStatus = (
  protocolId: string,
  status: EmailStatusCache['status'],
  message?: string,
  retryCount: number = 0
): void => {
  try {
    const emailStatus: EmailStatusCache = {
      protocolId,
      status,
      message,
      timestamp: Date.now(),
      retryCount,
    };

    const existingCache = getEmailStatusCache();
    const updatedCache = {
      ...existingCache,
      [protocolId]: emailStatus,
    };

    localStorage.setItem(EMAIL_STATUS_CACHE_KEY, JSON.stringify(updatedCache));
    console.log(
      `📧 V2: Email status cached for protocol ${protocolId}: ${status}`
    );
  } catch (error) {
    console.warn('Failed to cache email status:', error);
  }
};

/**
 * 📧 Získanie email status
 */
export const getEmailStatus = (protocolId: string): EmailStatusCache | null => {
  try {
    const cache = getEmailStatusCache();
    const status = cache[protocolId];

    if (!status) return null;

    // Kontrola TTL
    if (Date.now() - status.timestamp > EMAIL_CACHE_TTL) {
      clearEmailStatus(protocolId);
      return null;
    }

    return status;
  } catch (error) {
    console.warn('Failed to get email status:', error);
    return null;
  }
};

/**
 * 📧 Vymazanie email status
 */
export const clearEmailStatus = (protocolId: string): void => {
  try {
    const cache = getEmailStatusCache();
    delete cache[protocolId];
    localStorage.setItem(EMAIL_STATUS_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to clear email status:', error);
  }
};

/**
 * 📧 Získanie všetkých email statusov
 */
const getEmailStatusCache = (): Record<string, EmailStatusCache> => {
  try {
    const cached = localStorage.getItem(EMAIL_STATUS_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.warn('Failed to load email status cache:', error);
    return {};
  }
};

/**
 * 🔄 Automatické uloženie form data pri zmene
 */
export const autoSaveV2FormData = (
  protocolData: Partial<HandoverProtocolDataV2>,
  companyName?: string
): void => {
  // Debounce pre performance
  const timeoutId = setTimeout(() => {
    const formDefaults: Partial<V2FormDefaults> = {
      rental: {
        extraKilometerRate: protocolData.rental?.extraKilometerRate,
        deposit: protocolData.rental?.deposit,
        allowedKilometers: protocolData.rental?.allowedKilometers,
        pickupLocation: protocolData.rental?.pickupLocation,
        returnLocation: protocolData.rental?.returnLocation,
      },
      fuelLevel: protocolData.fuelLevel,
      condition: protocolData.condition,
      depositPaymentMethod: protocolData.depositPaymentMethod,
    };

    cacheV2FormDefaults(formDefaults, companyName);
  }, 2000); // 2 sekundy debounce

  // Store timeout ID pre cleanup
  (window as any).__v2AutoSaveTimeout = timeoutId;
};

/**
 * 🔄 Vymazanie všetkých V2 cache
 */
export const clearV2Cache = (): void => {
  try {
    // Vymaž globálny cache
    localStorage.removeItem(V2_CACHE_KEY);

    // Vymaž všetky company cache
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(V2_COMPANY_CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });

    // Vymaž email cache
    localStorage.removeItem(EMAIL_STATUS_CACHE_KEY);

    console.log('🔄 V2: All cache cleared');
  } catch (error) {
    console.warn('Failed to clear V2 cache:', error);
  }
};

/**
 * 📊 Cache statistics pre monitoring
 */
export const getV2CacheStats = () => {
  try {
    const globalCache = getGlobalV2Cache();
    const emailCache = getEmailStatusCache();

    // Spočítaj company cache
    const keys = Object.keys(localStorage);
    const companyCacheCount = keys.filter(key =>
      key.startsWith(V2_COMPANY_CACHE_PREFIX)
    ).length;

    return {
      hasGlobalCache: !!globalCache,
      companyCacheCount,
      emailStatusCount: Object.keys(emailCache).length,
      cacheSize: keys
        .filter(
          key =>
            key === V2_CACHE_KEY ||
            key.startsWith(V2_COMPANY_CACHE_PREFIX) ||
            key === EMAIL_STATUS_CACHE_KEY
        )
        .reduce((size, key) => {
          const item = localStorage.getItem(key);
          return size + (item ? item.length : 0);
        }, 0),
    };
  } catch (error) {
    console.warn('Failed to get V2 cache stats:', error);
    return {
      hasGlobalCache: false,
      companyCacheCount: 0,
      emailStatusCount: 0,
      cacheSize: 0,
    };
  }
};

/**
 * 🔄 Performance optimizations
 */
export const optimizeV2Cache = (): void => {
  try {
    // Vymaž expired cache entries
    const now = Date.now();
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      if (key.startsWith(V2_COMPANY_CACHE_PREFIX) || key === V2_CACHE_KEY) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const data: V2CachedData = JSON.parse(cached);
            if (now - data.timestamp > CACHE_TTL) {
              localStorage.removeItem(key);
              console.log(`🔄 V2: Expired cache removed: ${key}`);
            }
          }
        } catch (error) {
          // Corrupted cache entry, remove it
          localStorage.removeItem(key);
        }
      }
    });

    // Vymaž expired email status
    const emailCache = getEmailStatusCache();
    const cleanedEmailCache: Record<string, EmailStatusCache> = {};

    Object.entries(emailCache).forEach(([protocolId, status]) => {
      if (now - status.timestamp <= EMAIL_CACHE_TTL) {
        cleanedEmailCache[protocolId] = status;
      }
    });

    localStorage.setItem(
      EMAIL_STATUS_CACHE_KEY,
      JSON.stringify(cleanedEmailCache)
    );
    console.log('🔄 V2: Cache optimization completed');
  } catch (error) {
    console.warn('Failed to optimize V2 cache:', error);
  }
};
