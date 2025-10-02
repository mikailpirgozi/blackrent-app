/**
 * 🚀 Performance Tests
 * Tests for performance optimization and memory management
 */

import { MemoryManager } from '../memory-manager';
import { logger } from '../logger';

// Mock logger to avoid console output in tests
jest.mock('../logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Performance Tests', () => {
  let memoryManager: MemoryManager;

  beforeEach(() => {
    memoryManager = MemoryManager.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    memoryManager.cleanup();
  });

  describe('Memory Management', () => {
    it('should track image cache efficiently', () => {
      const testImages = [
        'image1.jpg',
        'image2.jpg',
        'image3.jpg',
      ];

      testImages.forEach(uri => {
        memoryManager.trackImageCache(uri, 1024);
      });

      const stats = memoryManager.getMemoryStats();
      expect(stats.imageCache).toBe(3);
    });

    it('should clean old cache entries when limit exceeded', () => {
      // Add more images than the cache limit
      for (let i = 0; i < 60; i++) {
        memoryManager.trackImageCache(`image${i}.jpg`, 1024);
      }

      const stats = memoryManager.getMemoryStats();
      expect(stats.imageCache).toBeLessThanOrEqual(50); // Max cache size
    });

    it('should handle timer registration and cleanup', () => {
      const timer = setTimeout(() => {}, 1000);
      memoryManager.registerTimer(timer);

      let stats = memoryManager.getMemoryStats();
      expect(stats.activeTimers).toBe(1);

      memoryManager.unregisterTimer(timer);
      stats = memoryManager.getMemoryStats();
      expect(stats.activeTimers).toBe(0);
    });

    it('should handle listener registration and cleanup', () => {
      const cleanup = jest.fn();
      memoryManager.registerListener(cleanup);

      let stats = memoryManager.getMemoryStats();
      expect(stats.activeListeners).toBe(1);

      memoryManager.unregisterListener(cleanup);
      stats = memoryManager.getMemoryStats();
      expect(stats.activeListeners).toBe(0);
    });

    it('should optimize list rendering configuration', () => {
      const _config = memoryManager.optimizeListRendering();

      expect(config).toMatchObject({
        removeClippedSubviews: true,
        maxToRenderPerBatch: 10,
        updateCellsBatchingPeriod: 50,
        initialNumToRender: 10,
        windowSize: 10,
      });

      expect(config.getItemLayout).toBeInstanceOf(Function);
    });

    it('should perform cleanup without errors', () => {
      // Add some data to clean
      memoryManager.trackImageCache('test.jpg', 1024);
      const timer = setTimeout(() => {}, 1000);
      memoryManager.registerTimer(timer);

      expect(() => {
        memoryManager.performCleanup();
      }).not.toThrow();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should handle large image cache efficiently', () => {
      const startTime = performance.now();
      
      // Add 1000 images to cache
      for (let i = 0; i < 1000; i++) {
        memoryManager.trackImageCache(`image${i}.jpg`, 1024);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should handle rapid cache access efficiently', () => {
      // Pre-populate cache
      for (let i = 0; i < 50; i++) {
        memoryManager.trackImageCache(`image${i}.jpg`, 1024);
      }

      const startTime = performance.now();
      
      // Rapid access to cached images
      for (let i = 0; i < 1000; i++) {
        const imageIndex = i % 50;
        memoryManager.trackImageCache(`image${imageIndex}.jpg`, 1024);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle rapid access efficiently
      expect(duration).toBeLessThan(50);
    });

    it('should handle memory cleanup efficiently', () => {
      // Add data to clean
      for (let i = 0; i < 100; i++) {
        memoryManager.trackImageCache(`image${i}.jpg`, 1024);
        const timer = setTimeout(() => {}, 1000);
        memoryManager.registerTimer(timer);
      }

      const startTime = performance.now();
      memoryManager.performCleanup();
      const endTime = performance.now();
      
      const duration = endTime - startTime;

      // Cleanup should be fast
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should not leak timers', () => {
      const initialStats = memoryManager.getMemoryStats();
      
      // Create and register timers
      const timers = [];
      for (let i = 0; i < 10; i++) {
        const timer = setTimeout(() => {}, 1000);
        timers.push(timer);
        memoryManager.registerTimer(timer);
      }

      // Unregister all timers
      timers.forEach(timer => {
        memoryManager.unregisterTimer(timer);
      });

      const finalStats = memoryManager.getMemoryStats();
      expect(finalStats.activeTimers).toBe(initialStats.activeTimers);
    });

    it('should not leak listeners', () => {
      const initialStats = memoryManager.getMemoryStats();
      
      // Create and register listeners
      const listeners = [];
      for (let i = 0; i < 10; i++) {
        const listener = jest.fn();
        listeners.push(listener);
        memoryManager.registerListener(listener);
      }

      // Unregister all listeners
      listeners.forEach(listener => {
        memoryManager.unregisterListener(listener);
      });

      const finalStats = memoryManager.getMemoryStats();
      expect(finalStats.activeListeners).toBe(initialStats.activeListeners);
    });

    it('should handle cleanup on destruction', () => {
      // Add various resources
      memoryManager.trackImageCache('test.jpg', 1024);
      const timer = setTimeout(() => {}, 1000);
      memoryManager.registerTimer(timer);
      const listener = jest.fn();
      memoryManager.registerListener(listener);

      // Cleanup should not throw
      expect(() => {
        memoryManager.cleanup();
      }).not.toThrow();

      // All resources should be cleaned
      const stats = memoryManager.getMemoryStats();
      expect(stats.imageCache).toBe(0);
      expect(stats.activeTimers).toBe(0);
      expect(stats.activeListeners).toBe(0);
    });
  });

  describe('Logger Performance', () => {
    it('should handle high-frequency logging efficiently', () => {
      const startTime = performance.now();
      
      // Log 1000 messages
      for (let i = 0; i < 1000; i++) {
        logger.debug(`Test message ${i}`, { data: i });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle logging efficiently
      expect(duration).toBeLessThan(100);
    });

    it('should not impact performance in production mode', () => {
      // Mock production environment
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = false;

      const startTime = performance.now();
      
      // Log messages in production
      for (let i = 0; i < 1000; i++) {
        logger.debug(`Test message ${i}`, { data: i });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should be very fast in production
      expect(duration).toBeLessThan(10);

      // Restore original environment
      (global as any).__DEV__ = originalDev;
    });
  });

  describe('Bundle Size Optimization', () => {
    it('should lazy load components efficiently', async () => {
      const { createLazyComponent } = await import('../lazy-loader');
      
      const startTime = performance.now();
      
      // Create lazy component
      const LazyComponent = createLazyComponent(
        () => Promise.resolve({ default: () => null })
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Component creation should be fast
      expect(duration).toBeLessThan(10);
      expect(LazyComponent).toBeDefined();
    });

    it('should handle multiple lazy components efficiently', async () => {
      const { createLazyComponent } = await import('../lazy-loader');
      
      const startTime = performance.now();
      
      // Create multiple lazy components
      const components = [];
      for (let i = 0; i < 100; i++) {
        const LazyComponent = createLazyComponent(
          () => Promise.resolve({ default: () => null })
        );
        components.push(LazyComponent);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle multiple components efficiently
      expect(duration).toBeLessThan(100);
      expect(components).toHaveLength(100);
    });
  });
});
