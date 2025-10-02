/**
 * 🚀 App Performance Manager
 * Central performance optimization and monitoring system
 */

import React from 'react';

import { performanceMonitor } from './performance-monitor';
import { imageOptimizer } from './image-optimizer';
import { bundleOptimizer, preloadCriticalResources } from './bundle-optimizer';
import { startCacheCleanup, memoryCache, persistentCache, apiCache } from './cache-manager';
import { logger } from './logger';

interface PerformanceConfig {
  enableImageOptimization: boolean;
  enableBundleOptimization: boolean;
  enableCacheOptimization: boolean;
  enablePerformanceMonitoring: boolean;
  cacheCleanupInterval: number;
  imagePreloadCount: number;
  bundlePreloadPriority: 'high' | 'medium' | 'low';
}

interface PerformanceReport {
  timestamp: number;
  memoryUsage: number;
  cacheStats: {
    memory: any;
    persistent: any;
    api: any;
  };
  bundleStats: any;
  imageStats: any;
  recommendations: string[];
}

class AppPerformanceManager {
  private config: PerformanceConfig;
  private isInitialized = false;
  private cleanupInterval: (() => void) | null = null;
  private performanceReports: PerformanceReport[] = [];

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableImageOptimization: true,
      enableBundleOptimization: true,
      enableCacheOptimization: true,
      enablePerformanceMonitoring: true,
      cacheCleanupInterval: 5 * 60 * 1000, // 5 minutes
      imagePreloadCount: 10,
      bundlePreloadPriority: 'high',
      ...config,
    };
  }

  /**
   * Initialize performance optimizations
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Performance manager already initialized');
      return;
    }

    const startTime = Date.now();
    logger.info('🚀 Initializing App Performance Manager...');

    try {
      // Initialize cache cleanup
      if (this.config.enableCacheOptimization) {
        this.cleanupInterval = startCacheCleanup(this.config.cacheCleanupInterval);
        logger.debug('✅ Cache optimization enabled');
      }

      // Preload critical resources
      if (this.config.enableBundleOptimization) {
        await preloadCriticalResources();
        logger.debug('✅ Bundle optimization enabled');
      }

      // Initialize image optimization
      if (this.config.enableImageOptimization) {
        // Preload common images
        await this.preloadCommonImages();
        logger.debug('✅ Image optimization enabled');
      }

      // Start performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        this.startPerformanceMonitoring();
        logger.debug('✅ Performance monitoring enabled');
      }

      this.isInitialized = true;
      const initTime = Date.now() - startTime;
      logger.info(`🎉 Performance Manager initialized in ${initTime}ms`);
    } catch (error) {
      logger.error('❌ Failed to initialize Performance Manager', error);
      throw error;
    }
  }

  /**
   * Preload common images for better performance
   */
  private async preloadCommonImages(): Promise<void> {
    const commonImages = [
      'assets/images/vehicles/hero-image-1.webp',
      'assets/images/vehicles/hero-image-2.webp',
      'assets/images/vehicles/vehicle-1.webp',
      'assets/images/vehicles/vehicle-card.webp',
    ];

    try {
      await imageOptimizer.preloadImages(commonImages, {
        quality: 85,
        format: 'webp',
        cache: true,
      });
      logger.debug(`Preloaded ${commonImages.length} common images`);
    } catch (error) {
      logger.warn('Some common images failed to preload', error);
    }
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Generate performance report every 30 seconds
    setInterval(() => {
      this.generatePerformanceReport();
    }, 30 * 1000);

    // Initial report
    setTimeout(() => {
      this.generatePerformanceReport();
    }, 5000);
  }

  /**
   * Generate comprehensive performance report
   */
  private generatePerformanceReport(): void {
    try {
      const report: PerformanceReport = {
        timestamp: Date.now(),
        memoryUsage: performanceMonitor.getMemoryUsage(),
        cacheStats: {
          memory: memoryCache.getStats(),
          persistent: persistentCache.getStats(),
          api: apiCache.getStats(),
        },
        bundleStats: bundleOptimizer.getBundleStats(),
        imageStats: imageOptimizer.getCacheStats(),
        recommendations: this.generateRecommendations(),
      };

      this.performanceReports.push(report);

      // Keep only last 20 reports
      if (this.performanceReports.length > 20) {
        this.performanceReports = this.performanceReports.slice(-20);
      }

      // Log warnings if performance is degraded
      this.checkPerformanceThresholds(report);
    } catch (error) {
      logger.error('Failed to generate performance report', error);
    }
  }

  /**
   * Check performance thresholds and log warnings
   */
  private checkPerformanceThresholds(report: PerformanceReport): void {
    // Memory usage warning
    if (report.memoryUsage > 150) { // 150MB
      logger.warn(`High memory usage: ${report.memoryUsage.toFixed(1)}MB`);
    }

    // Cache hit rate warning
    const apiHitRate = report.cacheStats.api.hitRate;
    if (apiHitRate < 0.7) { // Less than 70%
      logger.warn(`Low API cache hit rate: ${(apiHitRate * 100).toFixed(1)}%`);
    }

    // Bundle loading issues
    const failedChunks = report.bundleStats.failedChunks;
    if (failedChunks.length > 0) {
      logger.warn(`Failed to load ${failedChunks.length} bundle chunks`);
    }
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const latestReport = this.performanceReports[this.performanceReports.length - 1];

    if (!latestReport) return recommendations;

    // Memory recommendations
    if (latestReport.memoryUsage > 100) {
      recommendations.push('Consider clearing unused caches to reduce memory usage');
    }

    // Cache recommendations
    if (latestReport.cacheStats.memory.size > 50) {
      recommendations.push('Memory cache is large, consider reducing TTL');
    }

    // Image recommendations
    if (latestReport.imageStats.size > 30) {
      recommendations.push('Image cache is large, consider clearing old images');
    }

    return recommendations;
  }

  /**
   * Optimize app performance on demand
   */
  async optimizeNow(): Promise<void> {
    logger.info('🔧 Running on-demand performance optimization...');

    const tasks = [];

    // Clear expired caches
    if (this.config.enableCacheOptimization) {
      tasks.push(
        memoryCache.cleanup(),
        persistentCache.cleanup(),
        apiCache.cleanup()
      );
    }

    // Clear image cache if too large
    if (this.config.enableImageOptimization) {
      const imageStats = imageOptimizer.getCacheStats();
      if (imageStats.size > 50) {
        imageOptimizer.clearCache();
        logger.debug('Cleared image cache');
      }
    }

    // Clear bundle preload cache
    if (this.config.enableBundleOptimization) {
      bundleOptimizer.clearPreloadCache();
      logger.debug('Cleared bundle preload cache');
    }

    await Promise.all(tasks);
    logger.info('✅ Performance optimization completed');
  }

  /**
   * Get current performance status
   */
  getPerformanceStatus(): {
    isHealthy: boolean;
    memoryUsage: number;
    cacheEfficiency: number;
    recommendations: string[];
    lastReport?: PerformanceReport;
  } {
    const lastReport = this.performanceReports[this.performanceReports.length - 1];
    
    if (!lastReport) {
      return {
        isHealthy: true,
        memoryUsage: 0,
        cacheEfficiency: 0,
        recommendations: [],
      };
    }

    const isHealthy = 
      lastReport.memoryUsage < 150 &&
      lastReport.cacheStats.api.hitRate > 0.7 &&
      lastReport.bundleStats.failedChunks.length === 0;

    const avgCacheHitRate = (
      lastReport.cacheStats.memory.hitRate +
      lastReport.cacheStats.persistent.hitRate +
      lastReport.cacheStats.api.hitRate
    ) / 3;

    return {
      isHealthy,
      memoryUsage: lastReport.memoryUsage,
      cacheEfficiency: avgCacheHitRate,
      recommendations: lastReport.recommendations,
      lastReport,
    };
  }

  /**
   * Update performance configuration
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.debug('Performance configuration updated', newConfig);
  }

  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      this.cleanupInterval();
      this.cleanupInterval = null;
    }

    this.isInitialized = false;
    logger.info('🛑 Performance Manager shutdown');
  }

  /**
   * Get performance reports for debugging
   */
  getPerformanceReports(): PerformanceReport[] {
    return [...this.performanceReports];
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(): string {
    const data = {
      config: this.config,
      reports: this.performanceReports,
      timestamp: Date.now(),
    };

    return JSON.stringify(data, null, 2);
  }
}

// Global instance
export const _appPerformanceManager = new AppPerformanceManager();

/**
 * Hook for performance monitoring in React components
 */
export function usePerformanceStatus() {
  const [status, setStatus] = React.useState(appPerformanceManager.getPerformanceStatus());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStatus(appPerformanceManager.getPerformanceStatus());
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const optimizeNow = React.useCallback(() => {
    return appPerformanceManager.optimizeNow();
  }, []);

  return {
    ...status,
    optimizeNow,
  };
}

/**
 * Initialize performance optimizations on app start
 */
export async function initializeAppPerformance(config?: Partial<PerformanceConfig>): Promise<void> {
  if (config) {
    appPerformanceManager.updateConfig(config);
  }
  
  await appPerformanceManager.initialize();
}
