/**
 * Unit testy pre Protocol V2 Cache systém
 * Testuje smart caching, email status tracking a performance optimizations
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cacheCompanyV2Defaults,
  cacheEmailStatus,
  cacheV2FormDefaults,
  clearEmailStatus,
  clearV2Cache,
  getEmailStatus,
  getV2CacheStats,
  getV2SmartDefaults,
  optimizeV2Cache,
} from '../protocolV2Cache';

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {};
  }),
  get length() {
    return Object.keys(this.store).length;
  },
  key: vi.fn(
    (index: number) => Object.keys(mockLocalStorage.store)[index] || null
  ),
};

// Add Object.keys support for localStorage
Object.defineProperty(mockLocalStorage, Symbol.iterator, {
  value: function* () {
    for (const key of Object.keys(this.store)) {
      yield key;
    }
  },
});

// Make Object.keys work with mockLocalStorage
Object.setPrototypeOf(mockLocalStorage, {
  ...Object.prototype,
  [Symbol.iterator]: function* () {
    for (const key of Object.keys(mockLocalStorage.store)) {
      yield key;
    }
  },
});

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Protocol V2 Cache System', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Smart Defaults', () => {
    it('should return default settings when no cache exists', () => {
      const defaults = getV2SmartDefaults();

      expect(defaults).toMatchObject({
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
    });

    it('should cache and retrieve global form defaults', () => {
      const formDefaults = {
        rental: {
          extraKilometerRate: 0.8,
          deposit: 1000,
        },
        fuelLevel: 90,
        depositPaymentMethod: 'card' as const,
      };

      cacheV2FormDefaults(formDefaults);

      const retrieved = getV2SmartDefaults();
      expect(retrieved.rental?.extraKilometerRate).toBe(0.8);
      expect(retrieved.rental?.deposit).toBe(1000);
      expect(retrieved.fuelLevel).toBe(90);
      expect(retrieved.depositPaymentMethod).toBe('card');
    });

    it('should cache and retrieve company-specific defaults', () => {
      const companyName = 'Test Company';
      const companyDefaults = {
        rental: {
          extraKilometerRate: 1.0,
          deposit: 1500,
        },
        fuelLevel: 85,
        companySettings: {
          defaultLocation: 'Bratislava',
          defaultFuelLevel: 85,
          defaultDepositMethod: 'bank_transfer' as const,
        },
      };

      cacheCompanyV2Defaults(companyName, companyDefaults);

      const retrieved = getV2SmartDefaults(companyName);
      expect(retrieved.rental?.extraKilometerRate).toBe(1.0);
      expect(retrieved.rental?.deposit).toBe(1500);
      expect(retrieved.fuelLevel).toBe(85);
      expect(retrieved.companySettings?.defaultLocation).toBe('Bratislava');
      expect(retrieved.companySettings?.defaultDepositMethod).toBe(
        'bank_transfer'
      );
    });

    it('should prioritize company-specific defaults over global defaults', () => {
      const companyName = 'Test Company';

      // Set global defaults
      cacheV2FormDefaults({
        fuelLevel: 100,
        depositPaymentMethod: 'cash',
      });

      // Set company-specific defaults
      cacheCompanyV2Defaults(companyName, {
        fuelLevel: 80,
        depositPaymentMethod: 'card',
      });

      const globalDefaults = getV2SmartDefaults();
      const companyDefaults = getV2SmartDefaults(companyName);

      expect(globalDefaults.fuelLevel).toBe(100);
      expect(globalDefaults.depositPaymentMethod).toBe('cash');

      expect(companyDefaults.fuelLevel).toBe(80);
      expect(companyDefaults.depositPaymentMethod).toBe('card');
    });

    it('should handle expired cache entries', () => {
      const companyName = 'Test Company';

      // Manually create expired cache entry
      const expiredCache = {
        data: {
          fuelLevel: 50,
          depositPaymentMethod: 'cash',
        },
        timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago (expired)
        version: 2,
        companyName,
      };

      mockLocalStorage.setItem(
        `blackrent_protocol_v2_company_${companyName}`,
        JSON.stringify(expiredCache)
      );

      const defaults = getV2SmartDefaults(companyName);

      // Should return default values, not expired cache
      expect(defaults.fuelLevel).toBe(100); // Default value
      expect(defaults.depositPaymentMethod).toBe('cash'); // Default value
    });

    it('should handle corrupted cache entries', () => {
      const companyName = 'Test Company';

      // Set corrupted cache data
      mockLocalStorage.setItem(
        `blackrent_protocol_v2_company_${companyName}`,
        'invalid-json'
      );

      const defaults = getV2SmartDefaults(companyName);

      // Should return default values when cache is corrupted
      expect(defaults.fuelLevel).toBe(100);
      expect(defaults.depositPaymentMethod).toBe('cash');
    });
  });

  describe('Email Status Tracking', () => {
    it('should cache and retrieve email status', () => {
      const protocolId = 'test-protocol-123';
      const status = 'success' as const;
      const message = 'Protocol sent successfully';

      cacheEmailStatus(protocolId, status, message);

      const retrieved = getEmailStatus(protocolId);
      expect(retrieved).toMatchObject({
        protocolId,
        status,
        message,
        retryCount: 0,
      });
      expect(retrieved?.timestamp).toBeGreaterThan(0);
    });

    it('should handle multiple email statuses', () => {
      const protocol1 = 'protocol-1';
      const protocol2 = 'protocol-2';

      cacheEmailStatus(protocol1, 'success', 'Success message');
      cacheEmailStatus(protocol2, 'error', 'Error message', 2);

      const status1 = getEmailStatus(protocol1);
      const status2 = getEmailStatus(protocol2);

      expect(status1?.status).toBe('success');
      expect(status1?.message).toBe('Success message');
      expect(status1?.retryCount).toBe(0);

      expect(status2?.status).toBe('error');
      expect(status2?.message).toBe('Error message');
      expect(status2?.retryCount).toBe(2);
    });

    it('should return null for non-existent email status', () => {
      const status = getEmailStatus('non-existent-protocol');
      expect(status).toBeNull();
    });

    it('should handle expired email status', () => {
      const protocolId = 'test-protocol-123';

      // Manually create expired email status
      const expiredStatus = {
        [protocolId]: {
          protocolId,
          status: 'success',
          message: 'Old message',
          timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago (expired)
          retryCount: 0,
        },
      };

      mockLocalStorage.setItem(
        'blackrent_email_status_cache',
        JSON.stringify(expiredStatus)
      );

      const status = getEmailStatus(protocolId);
      expect(status).toBeNull();
    });

    it('should clear specific email status', () => {
      const protocol1 = 'protocol-1';
      const protocol2 = 'protocol-2';

      cacheEmailStatus(protocol1, 'success', 'Message 1');
      cacheEmailStatus(protocol2, 'pending', 'Message 2');

      clearEmailStatus(protocol1);

      expect(getEmailStatus(protocol1)).toBeNull();
      expect(getEmailStatus(protocol2)).not.toBeNull();
    });
  });

  describe('Cache Management', () => {
    it('should clear all V2 cache', () => {
      // Set up various cache entries
      cacheV2FormDefaults({ fuelLevel: 90 });
      cacheCompanyV2Defaults('Company1', { fuelLevel: 80 });
      cacheCompanyV2Defaults('Company2', { fuelLevel: 70 });
      cacheEmailStatus('protocol-1', 'success', 'Message');

      clearV2Cache();

      // All cache should be cleared
      expect(getV2SmartDefaults().fuelLevel).toBe(100); // Default value
      expect(getV2SmartDefaults('Company1').fuelLevel).toBe(100); // Default value
      expect(getV2SmartDefaults('Company2').fuelLevel).toBe(100); // Default value
      expect(getEmailStatus('protocol-1')).toBeNull();
    });

    it('should generate cache statistics', () => {
      // Set up cache entries
      cacheV2FormDefaults({ fuelLevel: 90 });
      cacheCompanyV2Defaults('Company1', { fuelLevel: 80 });
      cacheCompanyV2Defaults('Company2', { fuelLevel: 70 });
      cacheEmailStatus('protocol-1', 'success', 'Message 1');
      cacheEmailStatus('protocol-2', 'error', 'Message 2');

      // Mock Object.keys to return our store keys
      const originalObjectKeys = Object.keys;
      Object.keys = vi.fn(obj => {
        if (obj === mockLocalStorage) {
          return Object.keys(mockLocalStorage.store);
        }
        return originalObjectKeys(obj);
      });

      const stats = getV2CacheStats();

      // Restore Object.keys
      Object.keys = originalObjectKeys;

      expect(stats.hasGlobalCache).toBe(true);
      expect(stats.companyCacheCount).toBe(2);
      expect(stats.emailStatusCount).toBe(2);
      expect(stats.cacheSize).toBeGreaterThan(0);
    });

    it('should optimize cache by removing expired entries', () => {
      const companyName = 'Test Company';

      // Create expired cache entry
      const expiredCache = {
        data: { fuelLevel: 50 },
        timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
        version: 2,
      };

      mockLocalStorage.setItem(
        'blackrent_protocol_v2_cache',
        JSON.stringify(expiredCache)
      );
      mockLocalStorage.setItem(
        `blackrent_protocol_v2_company_${companyName}`,
        JSON.stringify({ ...expiredCache, companyName })
      );

      // Create expired email status
      const expiredEmailStatus = {
        'protocol-1': {
          protocolId: 'protocol-1',
          status: 'success',
          message: 'Old message',
          timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
          retryCount: 0,
        },
      };

      mockLocalStorage.setItem(
        'blackrent_email_status_cache',
        JSON.stringify(expiredEmailStatus)
      );

      // Mock Object.keys to return our store keys
      const originalObjectKeys = Object.keys;
      Object.keys = vi.fn(obj => {
        if (obj === mockLocalStorage) {
          return Object.keys(mockLocalStorage.store);
        }
        return originalObjectKeys(obj);
      });

      optimizeV2Cache();

      // Restore Object.keys
      Object.keys = originalObjectKeys;

      // Expired entries should be removed
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'blackrent_protocol_v2_cache'
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        `blackrent_protocol_v2_company_${companyName}`
      );

      // Email cache should be cleaned
      const emailCache = JSON.parse(
        mockLocalStorage.getItem('blackrent_email_status_cache') || '{}'
      );
      expect(emailCache['protocol-1']).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      // Mock localStorage to throw error
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw error
      expect(() => {
        cacheV2FormDefaults({ fuelLevel: 90 });
      }).not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('should handle JSON parsing errors gracefully', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      // Set invalid JSON
      mockLocalStorage.store['blackrent_protocol_v2_cache'] = 'invalid-json';

      const defaults = getV2SmartDefaults();

      // Should return default values
      expect(defaults.fuelLevel).toBe(100);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
