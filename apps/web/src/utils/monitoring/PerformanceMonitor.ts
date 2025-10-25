/**
 * Performance Monitor
 *
 * Tracks memory usage, processing time, bottlenecks
 * Detects performance issues and triggers warnings
 */

import { logger } from '../logger';

export interface PerformanceMetrics {
  memoryUsage: {
    current: number; // MB
    peak: number; // MB
    limit: number; // MB
    percentage: number; // 0-100
  };
  processingTime: {
    avgPerImage: number; // ms
    totalTime: number; // ms
    slowestImage: number; // ms
  };
  uploadTime: {
    avgPerImage: number; // ms
    totalTime: number; // ms
    slowestUpload: number; // ms
  };
  bottleneck: 'processing' | 'upload' | 'memory' | 'none';
}

export class PerformanceMonitor {
  private metrics: {
    memoryReadings: number[];
    processingTimes: number[];
    uploadTimes: number[];
    startTime: number;
  } = {
    memoryReadings: [],
    processingTimes: [],
    uploadTimes: [],
    startTime: 0,
  };

  private criticalMemoryThreshold = 0.85; // 85% of limit
  private warningCallbacks: Array<(message: string) => void> = [];
  private _pollInterval?: ReturnType<typeof setInterval>;

  /**
   * Start monitoring session
   */
  start(): void {
    this.metrics = {
      memoryReadings: [],
      processingTimes: [],
      uploadTimes: [],
      startTime: Date.now(),
    };

    // Start memory polling
    this.startMemoryPolling();

    logger.info('Performance monitoring started');
  }

  /**
   * Stop monitoring and get final metrics
   */
  stop(): PerformanceMetrics {
    const metrics = this.getMetrics();
    logger.info('Performance monitoring stopped', metrics);
    return metrics;
  }

  /**
   * Record processing time for single image
   */
  recordProcessingTime(durationMs: number): void {
    this.metrics.processingTimes.push(durationMs);
  }

  /**
   * Record upload time for single image
   */
  recordUploadTime(durationMs: number): void {
    this.metrics.uploadTimes.push(durationMs);
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    const memoryUsage = this.getMemoryMetrics();
    const processingTime = this.getProcessingMetrics();
    const uploadTime = this.getUploadMetrics();
    const bottleneck = this.identifyBottleneck(
      processingTime,
      uploadTime,
      memoryUsage
    );

    return {
      memoryUsage,
      processingTime,
      uploadTime,
      bottleneck,
    };
  }

  /**
   * Register callback for performance warnings
   */
  onWarning(callback: (message: string) => void): void {
    this.warningCallbacks.push(callback);
  }

  /**
   * Start polling memory usage
   */
  private startMemoryPolling(): void {
    const poll = () => {
      const memory = this.getCurrentMemory();
      if (memory > 0) {
        this.metrics.memoryReadings.push(memory);

        // Check for critical memory usage
        const memoryMetrics = this.getMemoryMetrics();
        if (memoryMetrics.percentage > this.criticalMemoryThreshold * 100) {
          this.triggerWarning(
            `Critical memory usage: ${memoryMetrics.current}MB (${memoryMetrics.percentage.toFixed(0)}%)`
          );
        }
      }
    };

    // Poll every 500ms during active monitoring
    const intervalId = setInterval(poll, 500);

    // Store interval ID for cleanup
    this._pollInterval = intervalId;
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemory(): number {
    const perf = performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };
    if (perf.memory) {
      const mem = perf.memory;
      return mem.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
    return 0;
  }

  /**
   * Get memory metrics
   */
  private getMemoryMetrics() {
    const readings = this.metrics.memoryReadings;

    if (readings.length === 0) {
      return {
        current: 0,
        peak: 0,
        limit: 0,
        percentage: 0,
      };
    }

    const current = readings[readings.length - 1];
    const peak = Math.max(...readings);

    // Get memory limit
    let limit = 0;
    const perf = performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };
    if (perf.memory) {
      const mem = perf.memory;
      limit = mem.jsHeapSizeLimit / 1024 / 1024; // MB
    }

    const percentage = limit > 0 ? (peak / limit) * 100 : 0;

    return {
      current: Math.round(current || 0),
      peak: Math.round(peak),
      limit: Math.round(limit),
      percentage: Math.round(percentage),
    };
  }

  /**
   * Get processing metrics
   */
  private getProcessingMetrics() {
    const times = this.metrics.processingTimes;

    if (times.length === 0) {
      return {
        avgPerImage: 0,
        totalTime: 0,
        slowestImage: 0,
      };
    }

    const totalTime = times.reduce((sum, t) => sum + t, 0);
    const avgPerImage = totalTime / times.length;
    const slowestImage = Math.max(...times);

    return {
      avgPerImage: Math.round(avgPerImage),
      totalTime: Math.round(totalTime),
      slowestImage: Math.round(slowestImage),
    };
  }

  /**
   * Get upload metrics
   */
  private getUploadMetrics() {
    const times = this.metrics.uploadTimes;

    if (times.length === 0) {
      return {
        avgPerImage: 0,
        totalTime: 0,
        slowestUpload: 0,
      };
    }

    const totalTime = times.reduce((sum, t) => sum + t, 0);
    const avgPerImage = totalTime / times.length;
    const slowestUpload = Math.max(...times);

    return {
      avgPerImage: Math.round(avgPerImage),
      totalTime: Math.round(totalTime),
      slowestUpload: Math.round(slowestUpload),
    };
  }

  /**
   * Identify performance bottleneck
   */
  private identifyBottleneck(
    processing: ReturnType<typeof this.getProcessingMetrics>,
    upload: ReturnType<typeof this.getUploadMetrics>,
    memory: ReturnType<typeof this.getMemoryMetrics>
  ): 'processing' | 'upload' | 'memory' | 'none' {
    // Memory critical
    if (memory.percentage > 80) {
      return 'memory';
    }

    // Processing slow
    if (
      processing.avgPerImage > 2000 &&
      processing.avgPerImage > upload.avgPerImage * 2
    ) {
      return 'processing';
    }

    // Upload slow
    if (
      upload.avgPerImage > 3000 &&
      upload.avgPerImage > processing.avgPerImage * 2
    ) {
      return 'upload';
    }

    return 'none';
  }

  /**
   * Trigger warning to all registered callbacks
   */
  private triggerWarning(message: string): void {
    logger.warn('Performance warning', { message });

    for (const callback of this.warningCallbacks) {
      try {
        callback(message);
      } catch (error) {
        logger.error('Warning callback failed', { error });
      }
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this._pollInterval) {
      clearInterval(this._pollInterval);
    }
    this.warningCallbacks = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();
