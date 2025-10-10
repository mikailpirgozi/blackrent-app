/**
 * Performance Monitor
 * 
 * Tracks performance metrics pre optimalizáciu workflow
 */

import { logger } from './logger';

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  /**
   * Start timer and return function to stop it
   */
  startTimer(label: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;

      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      this.metrics.get(label)!.push(duration);

      logger.debug('Performance metric', { label, duration: `${duration.toFixed(2)}ms` });
    };
  }

  /**
   * Get average time for label
   */
  getAverageTime(label: string): number {
    const times = this.metrics.get(label) || [];
    if (times.length === 0) return 0;

    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  /**
   * Get all metrics with stats
   */
  getMetrics(): Record<
    string,
    { avg: number; min: number; max: number; count: number }
  > {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    this.metrics.forEach((times, label) => {
      result[label] = {
        avg: this.getAverageTime(label),
        min: Math.min(...times),
        max: Math.max(...times),
        count: times.length,
      };
    });

    return result;
  }

  /**
   * Get metrics as formatted string
   */
  getMetricsFormatted(): string {
    const metrics = this.getMetrics();
    let output = 'Performance Metrics:\n';

    Object.entries(metrics).forEach(([label, stats]) => {
      output += `\n${label}:\n`;
      output += `  Avg: ${stats.avg.toFixed(2)}ms\n`;
      output += `  Min: ${stats.min.toFixed(2)}ms\n`;
      output += `  Max: ${stats.max.toFixed(2)}ms\n`;
      output += `  Count: ${stats.count}\n`;
    });

    return output;
  }

  /**
   * Log all metrics
   */
  logMetrics(): void {
    const metrics = this.getMetrics();
    logger.info('Performance Summary', metrics);
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    logger.debug('Performance metrics reset');
  }

  /**
   * Reset specific metric
   */
  resetMetric(label: string): void {
    this.metrics.delete(label);
    logger.debug('Performance metric reset', { label });
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

