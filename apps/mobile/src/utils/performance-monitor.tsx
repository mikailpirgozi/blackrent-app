/**
 * 🚀 Performance Monitor
 * Real-time performance tracking and optimization
 */

import { logger } from './logger';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
  apiResponseTime: number;
  imageLoadTime: number;
  navigationTime: number;
}

interface PerformanceThresholds {
  renderTime: number; // ms
  memoryUsage: number; // MB
  apiResponseTime: number; // ms
  imageLoadTime: number; // ms
  navigationTime: number; // ms
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds = {
    renderTime: 16, // 60fps = 16ms per frame
    memoryUsage: 100, // 100MB
    apiResponseTime: 1000, // 1s
    imageLoadTime: 2000, // 2s
    navigationTime: 300, // 300ms
  };

  private startTimes = new Map<string, number>();

  /**
   * Start performance measurement
   */
  startMeasurement(key: string): void {
    this.startTimes.set(key, Date.now());
  }

  /**
   * End performance measurement
   */
  endMeasurement(key: string, type: keyof PerformanceMetrics): number {
    const startTime = this.startTimes.get(key);
    if (!startTime) {
      logger.warn(`No start time found for key: ${key}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.startTimes.delete(key);

    // Check against thresholds
    const _threshold = (this.thresholds as any)[type];
    if (duration > threshold) {
      logger.warn(`Performance warning: ${type} took ${duration}ms (threshold: ${threshold}ms)`);
    }

    return duration;
  }

  /**
   * Measure render performance
   */
  measureRender<T>(componentName: string, renderFn: () => T): T {
    const key = `render_${componentName}`;
    this.startMeasurement(key);
    
    const result = renderFn();
    
    const duration = this.endMeasurement(key, 'renderTime');
    logger.debug(`${componentName} render time: ${duration}ms`);
    
    return result;
  }

  /**
   * Measure API call performance
   */
  async measureApiCall<T>(endpoint: string, apiCall: () => Promise<T>): Promise<T> {
    const key = `api_${endpoint}`;
    this.startMeasurement(key);
    
    try {
      const result = await apiCall();
      const duration = this.endMeasurement(key, 'apiResponseTime');
      logger.debug(`API ${endpoint} response time: ${duration}ms`);
      return result;
    } catch (error) {
      this.endMeasurement(key, 'apiResponseTime');
      throw error;
    }
  }

  /**
   * Measure image load performance
   */
  measureImageLoad(imageUri: string): Promise<number> {
    return new Promise((resolve) => {
      const key = `image_${imageUri}`;
      this.startMeasurement(key);
      
      const image = new Image();
      image.onload = () => {
        const duration = this.endMeasurement(key, 'imageLoadTime');
        logger.debug(`Image ${imageUri} load time: ${duration}ms`);
        resolve(duration);
      };
      image.onerror = () => {
        const duration = this.endMeasurement(key, 'imageLoadTime');
        logger.warn(`Image ${imageUri} failed to load after ${duration}ms`);
        resolve(duration);
      };
      image.src = imageUri;
    });
  }

  /**
   * Measure navigation performance
   */
  measureNavigation(screenName: string, navigationFn: () => void): void {
    const key = `navigation_${screenName}`;
    this.startMeasurement(key);
    
    navigationFn();
    
    // Use setTimeout to measure after navigation completes
    setTimeout(() => {
      const duration = this.endMeasurement(key, 'navigationTime');
      logger.debug(`Navigation to ${screenName}: ${duration}ms`);
    }, 0);
  }

  /**
   * Get memory usage (React Native specific)
   */
  getMemoryUsage(): number {
    if (typeof global !== 'undefined' && (global as any).performance?.memory) {
      return (global as any).performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    averages: Partial<PerformanceMetrics>;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage > this.thresholds.memoryUsage) {
      warnings.push(`High memory usage: ${memoryUsage.toFixed(1)}MB`);
      recommendations.push('Consider implementing memory optimization strategies');
    }

    return {
      averages: {
        memoryUsage,
      },
      warnings,
      recommendations,
    };
  }

  /**
   * Clear performance data
   */
  clearMetrics(): void {
    this.metrics = [];
    this.startTimes.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Performance decorator for React components
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return function PerformanceMonitoredComponent(props: P) {
    return performanceMonitor.measureRender(componentName, () => (
      <Component {...props} />
    ));
  };
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceMonitoring(componentName: string) {
  const measureRender = <T,>(renderFn: () => T): T => {
    return performanceMonitor.measureRender(componentName, renderFn);
  };

  const measureApiCall = async <T,>(endpoint: string, apiCall: () => Promise<T>): Promise<T> => {
    return performanceMonitor.measureApiCall(endpoint, apiCall);
  };

  return {
    measureRender,
    measureApiCall,
    measureImageLoad: performanceMonitor.measureImageLoad.bind(performanceMonitor),
    measureNavigation: performanceMonitor.measureNavigation.bind(performanceMonitor),
    getReport: performanceMonitor.getPerformanceReport.bind(performanceMonitor),
  };
}
