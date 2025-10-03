// 🔄 Smart Form Pre-filling Cache
// Utility pre caching často používaných hodnôt v protokoloch

import { logger } from './smartLogger';

interface FormDefaults {
  location: string;
  fuelLevel: number;
  depositPaymentMethod: 'cash' | 'bank_transfer' | 'card';
  notes: string;
}

interface CachedFormData {
  data: FormDefaults;
  timestamp: number;
  version: number;
}

const CACHE_KEY = 'blackrent_protocol_form_cache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 dní
const CACHE_VERSION = 1;

// 🔄 Uloženie často používaných hodnôt
export const cacheFormDefaults = (formData: Partial<FormDefaults>): void => {
  try {
    const existingCache = getFormDefaults();

    const newCache: CachedFormData = {
      data: {
        ...existingCache,
        ...formData,
      },
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
    logger.debug('🔄 Form defaults cached:', newCache.data);
  } catch (error) {
    console.warn('Failed to cache form defaults:', error);
  }
};

// 🔄 Získanie cached hodnôt
export const getFormDefaults = (): FormDefaults => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      return getDefaultFormDefaults();
    }

    const cachedData: CachedFormData = JSON.parse(cached);

    // Kontrola verzie a TTL
    if (
      cachedData.version !== CACHE_VERSION ||
      Date.now() - cachedData.timestamp > CACHE_TTL
    ) {
      logger.debug('🔄 Form cache expired or outdated, using defaults');
      clearFormCache();
      return getDefaultFormDefaults();
    }

    logger.debug('🔄 Using cached form defaults:', cachedData.data);
    return cachedData.data;
  } catch (error) {
    console.warn('Failed to load cached form defaults:', error);
    return getDefaultFormDefaults();
  }
};

// 🔄 Vymazanie cache
export const clearFormCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
    logger.debug('🔄 Form cache cleared');
  } catch (error) {
    console.warn('Failed to clear form cache:', error);
  }
};

// 🔄 Default hodnoty
const getDefaultFormDefaults = (): FormDefaults => ({
  location: '',
  fuelLevel: 100,
  depositPaymentMethod: 'cash',
  notes: '',
});

// 🔄 Smart pre-filling na základe histórie
export const getSmartDefaults = (companyName?: string): FormDefaults => {
  const cached = getFormDefaults();

  // Ak máme company-specific cache, použijeme ho
  if (companyName) {
    try {
      const companyCache = localStorage.getItem(`${CACHE_KEY}_${companyName}`);
      if (companyCache) {
        const companyData: CachedFormData = JSON.parse(companyCache);
        if (Date.now() - companyData.timestamp < CACHE_TTL) {
          logger.debug(
            `🔄 Using company-specific defaults for ${companyName}:`,
            companyData.data
          );
          return companyData.data;
        }
      }
    } catch (error) {
      console.warn('Failed to load company-specific defaults:', error);
    }
  }

  return cached;
};

// 🔄 Uloženie company-specific defaults
export const cacheCompanyDefaults = (
  companyName: string,
  formData: Partial<FormDefaults>
): void => {
  try {
    const companyKey = `${CACHE_KEY}_${companyName}`;
    const existingCompanyCache = getSmartDefaults(companyName);

    const companyCache: CachedFormData = {
      data: {
        ...existingCompanyCache,
        ...formData,
      },
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };

    localStorage.setItem(companyKey, JSON.stringify(companyCache));
    logger.debug(
      `🔄 Company defaults cached for ${companyName}:`,
      companyCache.data
    );
  } catch (error) {
    console.warn('Failed to cache company defaults:', error);
  }
};

// 🔄 Získanie cache info pre debugging
export const getFormCacheInfo = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const cachedData: CachedFormData = JSON.parse(cached);
    const age = Date.now() - cachedData.timestamp;
    const remainingTTL = CACHE_TTL - age;

    return {
      data: cachedData.data,
      ageMs: age,
      remainingTTLMs: remainingTTL,
      version: cachedData.version,
      isExpired: age > CACHE_TTL,
      isOutdated: cachedData.version !== CACHE_VERSION,
    };
  } catch (error) {
    return null;
  }
};
