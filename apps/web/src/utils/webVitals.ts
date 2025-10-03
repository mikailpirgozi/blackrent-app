// ⚡ Enhanced Web Vitals Monitoring
// Comprehensive performance tracking with real-time metrics

import { logger } from '@/utils/smartLogger';
import {
  getCLS,
  getFCP,
  getFID,
  getLCP,
  getTTFB,
  type Metric,
} from 'web-vitals';

interface VitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType: string;
}

interface PerformanceData {
  metrics: VitalsMetric[];
  timestamp: number;
  url: string;
  userAgent: string;
  connection?: Record<string, unknown>;
}

class WebVitalsMonitor {
  private metrics: VitalsMetric[] = [];
  private onMetricCallback?: (data: PerformanceData) => void;

  constructor(onMetricCallback?: (data: PerformanceData) => void) {
    this.onMetricCallback = onMetricCallback ?? (() => {});
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // Core Web Vitals
    getCLS(this.handleMetric.bind(this));
    getFID(this.handleMetric.bind(this));
    getFCP(this.handleMetric.bind(this));
    getLCP(this.handleMetric.bind(this));
    getTTFB(this.handleMetric.bind(this));

    // Performance Observer for additional metrics
    this.observeResourceTiming();
    this.observeLongTasks();
    this.observeLayoutShifts();
  }

  private handleMetric(metric: Metric) {
    const vitalsMetric: VitalsMetric = {
      name: metric.name,
      value: metric.value,
      rating: this.calculateRating(metric.name, metric.value),
      navigationType: 'navigate',
    };

    this.metrics.push(vitalsMetric);

    // Send metric to callback
    if (this.onMetricCallback) {
      const performanceData: PerformanceData = {
        metrics: [vitalsMetric],
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        connection: (navigator as unknown as Record<string, unknown>)
          .connection as Record<string, unknown>,
      };

      this.onMetricCallback(performanceData);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`📊 Web Vital: ${metric.name}`);
      logger.debug(`Value: ${metric.value.toFixed(2)}ms`);
      logger.debug(`Rating: ${vitalsMetric.rating}`);
      logger.debug(`Navigation: ${vitalsMetric.navigationType}`);
      console.groupEnd();
    }
  }

  private calculateRating(
    name: string,
    value: number
  ): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: { [key: string]: [number, number] } = {
      CLS: [0.1, 0.25],
      FID: [100, 300],
      FCP: [1800, 3000],
      LCP: [2500, 4000],
      TTFB: [800, 1800],
    };

    const threshold = thresholds[name];
    if (!threshold) return 'good';

    if (value <= threshold[0]) return 'good';
    if (value <= threshold[1]) return 'needs-improvement';
    return 'poor';
  }

  private observeResourceTiming() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'resource') {
              this.trackResourceTiming(entry as PerformanceResourceTiming);
            }
          });
        });

        observer.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('Resource timing observation failed:', error);
      }
    }
  }

  private observeLongTasks() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.duration > 50) {
              // Long task threshold
              this.trackLongTask(entry);
            }
          });
        });

        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('Long task observation not supported');
      }
    }
  }

  private observeLayoutShifts() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (
              entry.entryType === 'layout-shift' &&
              !(entry as unknown as Record<string, unknown>).hadRecentInput
            ) {
              this.trackLayoutShift(entry);
            }
          });
        });

        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Layout shift observation failed:', error);
      }
    }
  }

  private trackResourceTiming(entry: PerformanceResourceTiming) {
    const slowResources = entry.duration > 1000; // Slow resource threshold

    if (slowResources && process.env.NODE_ENV === 'development') {
      console.warn(
        `🐌 Slow resource: ${entry.name} (${entry.duration.toFixed(2)}ms)`
      );
    }
  }

  private trackLongTask(entry: PerformanceEntry) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⏰ Long task detected: ${entry.duration.toFixed(2)}ms`);
    }
  }

  private trackLayoutShift(entry: PerformanceEntry) {
    const layoutShiftEntry = entry as unknown as Record<string, unknown>;

    if (
      process.env.NODE_ENV === 'development' &&
      (layoutShiftEntry.value as number) > 0.1
    ) {
      console.warn(
        `📐 Significant layout shift: ${(layoutShiftEntry.value as number).toFixed(4)}`
      );
    }
  }

  // Get current metrics summary
  getMetricsSummary() {
    const summary: { [key: string]: VitalsMetric } = {};

    this.metrics.forEach(metric => {
      if (
        !summary[metric.name] ||
        metric.value < (summary[metric.name]?.value ?? 0)
      ) {
        summary[metric.name] = metric;
      }
    });

    return summary;
  }

  // Get performance score (0-100)
  getPerformanceScore(): number {
    const summary = this.getMetricsSummary();
    const metrics = Object.values(summary);

    if (metrics.length === 0) return 0;

    const scores: number[] = metrics.map(metric => {
      switch (metric.rating) {
        case 'good':
          return 100;
        case 'needs-improvement':
          return 50;
        case 'poor':
          return 0;
        default:
          return 50;
      }
    });

    return Math.round(
      scores.reduce((a: number, b: number) => a + b, 0) / scores.length
    );
  }

  // Send metrics to analytics
  sendToAnalytics(endpoint?: string) {
    const performanceData: PerformanceData = {
      metrics: this.metrics,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: (navigator as unknown as Record<string, unknown>)
        .connection as Record<string, unknown>,
    };

    if (endpoint) {
      // Send to custom endpoint
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(performanceData),
      }).catch(error => {
        console.warn('Failed to send performance data:', error);
      });
    } else if (process.env.NODE_ENV === 'development') {
      // Log summary in development
      console.group('📈 Performance Summary');
      logger.debug('Score:', this.getPerformanceScore() + '/100');
      logger.debug('Metrics:', this.getMetricsSummary());
      logger.debug('Connection:', performanceData.connection);
      console.groupEnd();
    }
  }
}

// Export enhanced reporting function
export const reportWebVitals = (
  onPerfEntry?: (data: PerformanceData) => void
) => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    // Initialize enhanced monitoring
    const monitor = new WebVitalsMonitor(onPerfEntry);

    // Send summary after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        monitor.sendToAnalytics();
      }, 2000);
    });

    return monitor;
  }
  return undefined;
};

// Helper function for performance debugging
export const debugPerformance = () => {
  if (process.env.NODE_ENV !== 'development') return;

  console.group('🔍 Performance Debug Info');

  // Performance timing
  const perfTiming = performance.timing;
  const pageLoad = perfTiming.loadEventEnd - perfTiming.navigationStart;
  const domReady =
    perfTiming.domContentLoadedEventEnd - perfTiming.navigationStart;

  logger.debug(`Page Load Time: ${pageLoad}ms`);
  logger.debug(`DOM Ready Time: ${domReady}ms`);

  // Memory usage (if available)
  if ('memory' in performance) {
    const memory = (performance as unknown as Record<string, unknown>)
      .memory as Record<string, unknown>;
    logger.debug(
      `Memory Used: ${((memory.usedJSHeapSize as number) / 1048576).toFixed(2)} MB`
    );
    logger.debug(
      `Memory Limit: ${((memory.jsHeapSizeLimit as number) / 1048576).toFixed(2)} MB`
    );
  }

  // Network connection info
  if ('connection' in navigator) {
    const connection = (navigator as unknown as Record<string, unknown>)
      .connection as Record<string, unknown>;
    logger.debug(
      `Connection: ${connection.effectiveType} (${connection.downlink} Mbps)`
    );
  }

  console.groupEnd();
};

// Performance monitoring hook for React components
export const usePerformanceMonitoring = () => {
  const measureComponent = (componentName: string) => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (duration > 16 && process.env.NODE_ENV === 'development') {
        console.warn(
          `⚠️ Slow component render: ${componentName} (${duration.toFixed(2)}ms)`
        );
      }
    };
  };

  return { measureComponent };
};

export default WebVitalsMonitor;
