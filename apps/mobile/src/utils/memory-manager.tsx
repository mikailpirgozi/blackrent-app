/**
 * 🧠 Memory Management System
 * Optimizes memory usage and prevents memory leaks
 */

import React from 'react';
import { logger } from './logger';

interface MemoryStats {
  imageCache: number;
  activeListeners: number;
  activeTimers: number;
  lastCleanup: Date;
}

interface CacheItem {
  uri: string;
  timestamp: number;
  size?: number;
  accessCount: number;
}

export class MemoryManager {
  private static instance: MemoryManager;
  private imageCache = new Map<string, CacheItem>();
  private activeTimers = new Set<NodeJS.Timeout>();
  private activeListeners = new Set<() => void>();
  private maxCacheSize = 50; // Maximum cached images
  private maxCacheAge = 30 * 60 * 1000; // 30 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startPeriodicCleanup();
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Start periodic memory cleanup
   */
  private startPeriodicCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 5 * 60 * 1000) as any; // Every 5 minutes

    this.activeTimers.add(this.cleanupInterval as any);
  }

  /**
   * Clear image cache
   */
  clearImageCache(): void {
    logger.debug('MemoryManager: Clearing image cache', {
      cacheSize: this.imageCache.size,
    });

    this.imageCache.clear();
    
    // Clear React Native Image cache
    if ((Image as any).clearMemoryCache) {
      (Image as any).clearMemoryCache();
    }

    if ((Image as any).clearDiskCache) {
      (Image as any).clearDiskCache();
    }
  }

  /**
   * Add image to cache tracking
   */
  trackImageCache(uri: string, size?: number): void {
    const existing = this.imageCache.get(uri);
    
    if (existing) {
      existing.accessCount++;
      existing.timestamp = Date.now();
    } else {
      this.imageCache.set(uri, {
        uri,
        timestamp: Date.now(),
        size,
        accessCount: 1,
      });
    }

    // Clean old entries if cache is too large
    if (this.imageCache.size > this.maxCacheSize) {
      this.cleanOldCacheEntries();
    }
  }

  /**
   * Clean old cache entries
   */
  private cleanOldCacheEntries(): void {
    const now = Date.now();
    const entries = Array.from(this.imageCache.entries());
    
    // Sort by access count and age (least used and oldest first)
    entries.sort(([, a], [, b]) => {
      const scoreA = a.accessCount * (now - a.timestamp);
      const scoreB = b.accessCount * (now - b.timestamp);
      return scoreA - scoreB;
    });

    // Remove oldest entries
    const toRemove = entries.slice(0, entries.length - this.maxCacheSize);
    toRemove.forEach(([uri]) => {
      this.imageCache.delete(uri);
    });

    logger.debug('MemoryManager: Cleaned cache entries', {
      removed: toRemove.length,
      remaining: this.imageCache.size,
    });
  }

  /**
   * Register timer for cleanup tracking
   */
  registerTimer(timer: NodeJS.Timeout): void {
    this.activeTimers.add(timer);
  }

  /**
   * Unregister timer
   */
  unregisterTimer(timer: NodeJS.Timeout): void {
    this.activeTimers.delete(timer);
    clearTimeout(timer);
  }

  /**
   * Register listener for cleanup tracking
   */
  registerListener(cleanup: () => void): void {
    this.activeListeners.add(cleanup);
  }

  /**
   * Unregister listener
   */
  unregisterListener(cleanup: () => void): void {
    this.activeListeners.delete(cleanup);
  }

  /**
   * Optimize FlatList rendering
   */
  optimizeListRendering() {
    return {
      // Optimize rendering performance
      removeClippedSubviews: true,
      maxToRenderPerBatch: 10,
      updateCellsBatchingPeriod: 50,
      initialNumToRender: 10,
      windowSize: 10,
      
      // Memory optimization
      getItemLayout: (data: any[], index: number) => ({
        length: 100, // Estimated item height
        offset: 100 * index,
        index,
      }),
    };
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): MemoryStats {
    return {
      imageCache: this.imageCache.size,
      activeListeners: this.activeListeners.size,
      activeTimers: this.activeTimers.size,
      lastCleanup: new Date(),
    };
  }

  /**
   * Perform comprehensive cleanup
   */
  performCleanup(): void {
    logger.debug('MemoryManager: Performing cleanup');

    // Clean expired cache entries
    const now = Date.now();
    const expiredEntries: string[] = [];

    this.imageCache.forEach((item, uri) => {
      if (now - item.timestamp > this.maxCacheAge) {
        expiredEntries.push(uri);
      }
    });

    expiredEntries.forEach(uri => {
      this.imageCache.delete(uri);
    });

    // Clear React Native caches periodically
    if (expiredEntries.length > 0) {
      if ((Image as any).clearMemoryCache) {
        (Image as any).clearMemoryCache();
      }
    }

    logger.debug('MemoryManager: Cleanup completed', {
      expiredEntries: expiredEntries.length,
      remainingCache: this.imageCache.size,
    });
  }

  /**
   * Force garbage collection (if available)
   */
  forceGarbageCollection(): void {
    // @ts-ignore - global.gc might be available in development
    if (global.gc && __DEV__) {
      global.gc();
      logger.debug('MemoryManager: Forced garbage collection');
    }
  }

  /**
   * Clean up all resources
   */
  cleanup(): void {
    logger.debug('MemoryManager: Final cleanup');

    // Clear all timers
    this.activeTimers.forEach(timer => {
      clearTimeout(timer);
    });
    this.activeTimers.clear();

    // Call all cleanup listeners
    this.activeListeners.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        logger.error('MemoryManager: Error in cleanup listener', error as Error);
      }
    });
    this.activeListeners.clear();

    // Clear image cache
    this.clearImageCache();

    // Stop periodic cleanup
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Monitor memory usage
   */
  startMemoryMonitoring(): void {
    const monitorInterval = setInterval(() => {
      const stats = this.getMemoryStats();
      
      logger.debug('MemoryManager: Memory stats', stats);

      // Auto-cleanup if cache is too large
      if (stats.imageCache > this.maxCacheSize * 1.5) {
        this.performCleanup();
      }
    }, 60 * 1000); // Every minute

    this.registerTimer(monitorInterval as any);
  }
}

/**
 * Memory optimization hook
 */
export const useMemoryOptimization = () => {
  const memoryManager = MemoryManager.getInstance();

  const trackImage = (uri: string, size?: number) => {
    memoryManager.trackImageCache(uri, size);
  };

  const getListOptimization = () => {
    return memoryManager.optimizeListRendering();
  };

  const getMemoryStats = () => {
    return memoryManager.getMemoryStats();
  };

  const performCleanup = () => {
    memoryManager.performCleanup();
  };

  return {
    trackImage,
    getListOptimization,
    getMemoryStats,
    performCleanup,
  };
};

/**
 * Memory-optimized component wrapper
 */
export const withMemoryOptimization = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  return React.memo((props: P) => {
    const memoryManager = MemoryManager.getInstance();

    React.useEffect(() => {
      const cleanup = () => {
        // Component-specific cleanup
      };

      memoryManager.registerListener(cleanup);

      return () => {
        memoryManager.unregisterListener(cleanup);
      };
    }, [memoryManager]);

    return <Component {...props} />;
  });
};

// Export singleton instance
export const memoryManager = MemoryManager.getInstance();

export default MemoryManager;
