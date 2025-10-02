/**
 * 🗄️ Cache Manager
 * Advanced caching system with TTL, LRU, and persistence
 */

import React from 'react';

// Check if we're in React Native environment
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

let AsyncStorage: any;

if (isReactNative) {
  // Only import AsyncStorage in React Native environment
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} else {
  // In Node.js environment, use a simple in-memory fallback
  AsyncStorage = {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
    getAllKeys: async () => [],
    clear: async () => {},
    multiGet: async () => [],
    multiSet: async () => {},
    multiRemove: async () => {},
  };
}

import { logger } from './logger';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
}

interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum number of entries
  persistent?: boolean; // Store in AsyncStorage
  namespace?: string; // Cache namespace
}

interface CacheStats {
  size: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  oldestEntry: number;
  newestEntry: number;
}

class CacheManager<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private options: Required<CacheOptions>;
  private stats = {
    hits: 0,
    misses: 0,
  };

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
      maxSize: options.maxSize || 100,
      persistent: options.persistent || false,
      namespace: options.namespace || 'default',
    };

    if (this.options.persistent) {
      this.loadFromStorage();
    }
  }

  /**
   * Set cache entry
   */
  async set(key: string, data: T, ttl?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.options.ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry);

    // Enforce max size with LRU eviction
    if (this.cache.size > this.options.maxSize) {
      this.evictLRU();
    }

    // Persist if enabled
    if (this.options.persistent) {
      await this.saveToStorage(key, entry);
    }

    logger.debug(`Cache set: ${key} (TTL: ${entry.ttl}ms)`);
  }

  /**
   * Get cache entry
   */
  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      logger.debug(`Cache miss: ${key}`);
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      if (this.options.persistent) {
        await this.removeFromStorage(key);
      }
      this.stats.misses++;
      logger.debug(`Cache expired: ${key}`);
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    logger.debug(`Cache hit: ${key} (access count: ${entry.accessCount})`);
    return entry.data;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry ? !this.isExpired(entry) : false;
  }

  /**
   * Delete cache entry
   */
  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    
    if (deleted && this.options.persistent) {
      await this.removeFromStorage(key);
    }

    logger.debug(`Cache delete: ${key} (deleted: ${deleted})`);
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;

    if (this.options.persistent) {
      await this.clearStorage();
    }

    logger.debug('Cache cleared');
  }

  /**
   * Get or set with factory function
   */
  async getOrSet(
    key: string, 
    factory: () => Promise<T> | T, 
    ttl?: number
  ): Promise<T> {
    const cached = await this.get(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    await this.set(key, data, ttl);
    return data;
  }

  /**
   * Batch get multiple keys
   */
  async getMany(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    
    for (const key of keys) {
      results.set(key, await this.get(key));
    }
    
    return results;
  }

  /**
   * Batch set multiple entries
   */
  async setMany(entries: Array<{ key: string; data: T; ttl?: number }>): Promise<void> {
    for (const { key, data, ttl } of entries) {
      await this.set(key, data, ttl);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const total = this.stats.hits + this.stats.misses;
    
    return {
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      missRate: total > 0 ? this.stats.misses / total : 0,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      oldestEntry: Math.min(...entries.map(e => e.timestamp)),
      newestEntry: Math.max(...entries.map(e => e.timestamp)),
    };
  }

  /**
   * Clean expired entries
   */
  async cleanup(): Promise<number> {
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await this.delete(key);
    }

    logger.debug(`Cache cleanup: removed ${expiredKeys.length} expired entries`);
    return expiredKeys.length;
  }

  /**
   * Get keys matching pattern
   */
  getKeys(pattern?: RegExp): string[] {
    const keys = Array.from(this.cache.keys());
    return pattern ? keys.filter(key => pattern.test(key)) : keys;
  }

  /**
   * Refresh TTL for existing entry
   */
  async touch(key: string, ttl?: number): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry || this.isExpired(entry)) {
      return false;
    }

    entry.ttl = ttl || this.options.ttl;
    entry.timestamp = Date.now();
    entry.lastAccessed = Date.now();

    if (this.options.persistent) {
      await this.saveToStorage(key, entry);
    }

    return true;
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug(`Cache LRU eviction: ${oldestKey}`);
    }
  }

  /**
   * Load cache from AsyncStorage
   */
  private async loadFromStorage(): Promise<void> {
    // Skip loading in non-React Native environments
    if (!isReactNative) {
      logger.debug('Skipping cache loading - not in React Native environment');
      return;
    }

    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key: string) => key.startsWith(`cache_${this.options.namespace}_`));
      
      for (const storageKey of cacheKeys) {
        const data = await AsyncStorage.getItem(storageKey);
        if (data) {
          const entry: CacheEntry<T> = JSON.parse(data);
          const cacheKey = storageKey.replace(`cache_${this.options.namespace}_`, '');
          
          if (!this.isExpired(entry)) {
            this.cache.set(cacheKey, entry);
          } else {
            await AsyncStorage.removeItem(storageKey);
          }
        }
      }
      
      logger.debug(`Loaded ${this.cache.size} entries from storage`);
    } catch (error) {
      logger.error('Failed to load cache from storage', error);
    }
  }

  /**
   * Save entry to AsyncStorage
   */
  private async saveToStorage(key: string, entry: CacheEntry<T>): Promise<void> {
    // Skip saving in non-React Native environments
    if (!isReactNative) {
      return;
    }

    try {
      const storageKey = `cache_${this.options.namespace}_${key}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      logger.error(`Failed to save cache entry: ${key}`, error);
    }
  }

  /**
   * Remove entry from AsyncStorage
   */
  private async removeFromStorage(key: string): Promise<void> {
    // Skip removing in non-React Native environments
    if (!isReactNative) {
      return;
    }

    try {
      const storageKey = `cache_${this.options.namespace}_${key}`;
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      logger.error(`Failed to remove cache entry: ${key}`, error);
    }
  }

  /**
   * Clear all cache entries from AsyncStorage
   */
  private async clearStorage(): Promise<void> {
    // Skip clearing in non-React Native environments
    if (!isReactNative) {
      return;
    }

    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key: string) => key.startsWith(`cache_${this.options.namespace}_`));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      logger.error('Failed to clear cache storage', error);
    }
  }
}

// Global cache instances
export const memoryCache = new CacheManager({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  persistent: false,
  namespace: 'memory',
});

export const persistentCache = new CacheManager({
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 500,
  persistent: true,
  namespace: 'persistent',
});

export const apiCache = new CacheManager({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 200,
  persistent: true,
  namespace: 'api',
});

export const imageCache = new CacheManager({
  ttl: 60 * 60 * 1000, // 1 hour
  maxSize: 50,
  persistent: true,
  namespace: 'images',
});

/**
 * Hook for cache management
 */
export function useCache<T>(cacheInstance: CacheManager<T> = memoryCache) {
  const get = React.useCallback((key: string) => cacheInstance.get(key), [cacheInstance]);
  const set = React.useCallback((key: string, data: T, ttl?: number) => 
    cacheInstance.set(key, data, ttl), [cacheInstance]);
  const getOrSet = React.useCallback((key: string, factory: () => Promise<T> | T, ttl?: number) =>
    cacheInstance.getOrSet(key, factory, ttl), [cacheInstance]);

  return { get, set, getOrSet, cache: cacheInstance };
}

/**
 * Automatic cache cleanup scheduler
 */
export const startCacheCleanup = (interval = 5 * 60 * 1000) => {
  const cleanup = async () => {
    await Promise.all([
      memoryCache.cleanup(),
      persistentCache.cleanup(),
      apiCache.cleanup(),
      imageCache.cleanup(),
    ]);
  };

  // Initial cleanup
  cleanup();

  // Schedule periodic cleanup
  const intervalId = setInterval(cleanup, interval);
  
  return () => clearInterval(intervalId);
};
