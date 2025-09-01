/**
 * Unit testy pre Protocol V2 Performance Monitoring
 * Testuje memory tracking, performance metrics a optimizations
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearPerformanceAlerts,
  generatePerformanceReport,
  getPerformanceAlerts,
  getPerformanceMetrics,
  runPerformanceOptimizations,
  startPerformanceMonitoring,
  stopPerformanceMonitoring,
  trackComponentRender,
  trackUploadMetrics,
  useV2Performance,
} from '../protocolV2Performance';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB
  },
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
});

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

Object.defineProperty(global, 'console', {
  value: mockConsole,
});

// Mock setInterval/clearInterval
const mockSetInterval = vi.fn(() => 123); // Return mock interval ID
const mockClearInterval = vi.fn();
vi.stubGlobal('setInterval', mockSetInterval);
vi.stubGlobal('clearInterval', mockClearInterval);

describe('Protocol V2 Performance Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPerformanceAlerts();

    // Reset performance metrics to default state
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const protocolModule = require('../protocolV2Performance');
      const performanceMetrics = protocolModule.performanceMetrics;
      if (performanceMetrics) {
        performanceMetrics.uploadMetrics = {
          activeUploads: 0,
          queueSize: 0,
          failedUploads: 0,
          totalUploaded: 0,
        };
        performanceMetrics.componentMetrics = {
          renderCount: 0,
          lastRenderTime: 0,
          averageRenderTime: 0,
        };
      }
    } catch (error) {
      // Ignore if module not available
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    stopPerformanceMonitoring();
  });

  describe('Performance Metrics', () => {
    it('should get current performance metrics', () => {
      const metrics = getPerformanceMetrics();

      expect(metrics).toMatchObject({
        memoryUsage: {
          usedJSHeapSize: expect.any(Number),
          totalJSHeapSize: expect.any(Number),
          jsHeapSizeLimit: expect.any(Number),
          percentage: expect.any(Number),
        },
        cacheStats: {
          hasGlobalCache: expect.any(Boolean),
          companyCacheCount: expect.any(Number),
          emailStatusCount: expect.any(Number),
          cacheSize: expect.any(Number),
        },
        componentMetrics: {
          renderCount: expect.any(Number),
          lastRenderTime: expect.any(Number),
          averageRenderTime: expect.any(Number),
        },
        uploadMetrics: {
          activeUploads: expect.any(Number),
          queueSize: expect.any(Number),
          failedUploads: expect.any(Number),
          totalUploaded: expect.any(Number),
        },
      });
    });

    it('should calculate memory usage percentage correctly', () => {
      // Mock specific memory values
      mockPerformance.memory = {
        usedJSHeapSize: 100 * 1024 * 1024, // 100MB
        totalJSHeapSize: 120 * 1024 * 1024, // 120MB
        jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB
      };

      const metrics = getPerformanceMetrics();

      expect(metrics.memoryUsage.percentage).toBeCloseTo(50, 1); // 100MB / 200MB = 50%
    });

    it('should handle missing performance.memory API', () => {
      const originalMemory = mockPerformance.memory;
      delete (mockPerformance as typeof mockPerformance & { memory?: unknown })
        .memory;

      const metrics = getPerformanceMetrics();

      // Should not crash and return default values
      expect(metrics.memoryUsage.usedJSHeapSize).toBe(0);
      expect(metrics.memoryUsage.percentage).toBe(0);

      mockPerformance.memory = originalMemory;
    });
  });

  describe('Component Render Tracking', () => {
    it('should track component render times', () => {
      const componentName = 'TestComponent';
      const renderTime = 50;

      trackComponentRender(componentName, renderTime);

      const metrics = getPerformanceMetrics();
      expect(metrics.componentMetrics.renderCount).toBe(1);
      expect(metrics.componentMetrics.lastRenderTime).toBe(renderTime);
      expect(metrics.componentMetrics.averageRenderTime).toBe(renderTime);
    });

    it('should calculate average render time correctly', () => {
      const componentName = 'TestComponent';

      // Reset render count for this test
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const protocolModule = require('../protocolV2Performance');
        protocolModule.performanceMetrics.componentMetrics.renderCount = 0;
      } catch (error) {
        // Ignore if module not available
      }

      trackComponentRender(componentName, 100);
      trackComponentRender(componentName, 200);
      trackComponentRender(componentName, 300);

      const metrics = getPerformanceMetrics();
      expect(metrics.componentMetrics.renderCount).toBe(3);
      expect(metrics.componentMetrics.averageRenderTime).toBe(200); // (100 + 200 + 300) / 3
    });

    it('should generate performance alerts for slow renders', () => {
      const componentName = 'SlowComponent';
      const slowRenderTime = 150; // Above 100ms threshold

      trackComponentRender(componentName, slowRenderTime);

      const alerts = getPerformanceAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        type: 'render',
        severity: 'medium',
        message: expect.stringContaining('Pomalý render SlowComponent: 150ms'),
      });
    });

    it('should generate high severity alerts for very slow renders', () => {
      const componentName = 'VerySlowComponent';
      const verySlowRenderTime = 250; // Above 200ms threshold

      trackComponentRender(componentName, verySlowRenderTime);

      const alerts = getPerformanceAlerts('high');
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe('high');
    });

    it('should limit stored render times to prevent memory leaks', () => {
      const componentName = 'TestComponent';

      // Reset render count for this test
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const protocolModule = require('../protocolV2Performance');
        protocolModule.performanceMetrics.componentMetrics.renderCount = 0;
      } catch (error) {
        // Ignore if module not available
      }

      // Add more than 100 render times
      for (let i = 0; i < 150; i++) {
        trackComponentRender(componentName, 50);
      }

      const metrics = getPerformanceMetrics();
      expect(metrics.componentMetrics.renderCount).toBe(150);
      // Average should still be calculated correctly (internal array should be limited)
      expect(metrics.componentMetrics.averageRenderTime).toBe(50);
    });
  });

  describe('Upload Metrics Tracking', () => {
    it('should track upload metrics', () => {
      const uploadMetrics = {
        activeUploads: 3,
        queueSize: 10,
        failedUploads: 1,
        totalUploaded: 25,
      };

      trackUploadMetrics(uploadMetrics);

      const metrics = getPerformanceMetrics();
      expect(metrics.uploadMetrics).toMatchObject(uploadMetrics);
    });

    it('should generate alerts for high failed upload count', () => {
      trackUploadMetrics({ failedUploads: 8 });

      const alerts = getPerformanceAlerts('high');
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        type: 'upload',
        severity: 'high',
        message: expect.stringContaining(
          'Vysoký počet neúspešných uploadov: 8'
        ),
      });
    });

    it('should generate alerts for large upload queue', () => {
      trackUploadMetrics({ queueSize: 25 });

      const alerts = getPerformanceAlerts('medium');
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        type: 'upload',
        severity: 'medium',
        message: expect.stringContaining('Veľká upload queue: 25 súborov'),
      });
    });

    it('should update metrics incrementally', () => {
      trackUploadMetrics({ activeUploads: 2 });
      trackUploadMetrics({ queueSize: 5 });
      trackUploadMetrics({ failedUploads: 1 });

      const metrics = getPerformanceMetrics();
      expect(metrics.uploadMetrics).toMatchObject({
        activeUploads: 2,
        queueSize: 5,
        failedUploads: 1,
        totalUploaded: 0, // Default value
      });
    });
  });

  describe('Performance Alerts', () => {
    it('should generate memory usage alerts', () => {
      // Mock high memory usage
      mockPerformance.memory = {
        usedJSHeapSize: 180 * 1024 * 1024, // 180MB
        totalJSHeapSize: 190 * 1024 * 1024, // 190MB
        jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB (90% usage)
      };

      getPerformanceMetrics(); // Trigger memory check

      const criticalAlerts = getPerformanceAlerts('critical');
      expect(criticalAlerts).toHaveLength(1);
      expect(criticalAlerts[0]).toMatchObject({
        type: 'memory',
        severity: 'critical',
        message: expect.stringContaining('Kritické využitie pamäte: 90'),
      });
    });

    it('should filter alerts by severity', () => {
      trackComponentRender('SlowComponent', 150); // Medium alert
      trackComponentRender('VerySlowComponent', 250); // High alert
      trackUploadMetrics({ failedUploads: 8 }); // High alert

      const mediumAlerts = getPerformanceAlerts('medium');
      const highAlerts = getPerformanceAlerts('high');
      const allAlerts = getPerformanceAlerts();

      expect(mediumAlerts).toHaveLength(1);
      expect(highAlerts).toHaveLength(2);
      expect(allAlerts).toHaveLength(3);
    });

    it('should clear old alerts', () => {
      trackComponentRender('TestComponent', 150);
      expect(getPerformanceAlerts()).toHaveLength(1);

      clearPerformanceAlerts();
      expect(getPerformanceAlerts()).toHaveLength(0);
    });

    it('should clear alerts older than specified time', () => {
      // Clear existing alerts first
      clearPerformanceAlerts();

      // Mock older timestamp
      const oldTimestamp = Date.now() - 10000; // 10 seconds ago
      vi.spyOn(Date, 'now').mockReturnValue(oldTimestamp);

      trackComponentRender('OldComponent', 150);

      // Restore current timestamp
      vi.spyOn(Date, 'now').mockReturnValue(Date.now());

      trackComponentRender('NewComponent', 150);

      expect(getPerformanceAlerts()).toHaveLength(2);

      clearPerformanceAlerts(5000); // Clear alerts older than 5 seconds

      const remainingAlerts = getPerformanceAlerts();
      expect(remainingAlerts).toHaveLength(1);
      expect(remainingAlerts[0].message).toContain('NewComponent');
    });

    it('should limit maximum stored alerts', () => {
      // Generate more than 50 alerts (MAX_ALERTS)
      for (let i = 0; i < 60; i++) {
        trackComponentRender(`Component${i}`, 150);
      }

      const alerts = getPerformanceAlerts();
      expect(alerts.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Performance Optimizations', () => {
    it('should run optimizations when memory usage is high', () => {
      // Mock high memory usage
      mockPerformance.memory = {
        usedJSHeapSize: 150 * 1024 * 1024, // 150MB
        totalJSHeapSize: 160 * 1024 * 1024, // 160MB
        jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB (75% usage)
      };

      runPerformanceOptimizations();

      expect(mockConsole.log).toHaveBeenCalledWith(
        '🚀 V2: Running performance optimizations...'
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        '🧹 V2: High memory usage detected, running cleanup...'
      );
    });

    it('should force garbage collection if available', () => {
      const mockGC = vi.fn();
      (global as typeof global & { window?: { gc: () => void } }).window = {
        gc: mockGC,
      };

      // Mock high memory usage
      mockPerformance.memory = {
        usedJSHeapSize: 150 * 1024 * 1024,
        totalJSHeapSize: 160 * 1024 * 1024,
        jsHeapSizeLimit: 200 * 1024 * 1024,
      };

      runPerformanceOptimizations();

      expect(mockGC).toHaveBeenCalled();

      delete (global as typeof global & { window?: unknown }).window;
    });
  });

  describe('Performance Monitoring', () => {
    it('should start performance monitoring with interval', () => {
      const intervalMs = 5000;
      startPerformanceMonitoring(intervalMs);

      expect(setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        intervalMs
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        `📊 V2: Performance monitoring started (interval: ${intervalMs}ms)`
      );
    });

    it('should stop performance monitoring', () => {
      startPerformanceMonitoring(5000);
      stopPerformanceMonitoring();

      expect(mockClearInterval).toHaveBeenCalledWith(123);
      expect(mockConsole.log).toHaveBeenCalledWith(
        '🛑 V2: Performance monitoring stopped'
      );
    });

    it('should use default interval when not specified', () => {
      startPerformanceMonitoring();

      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 30000); // Default 30 seconds
    });
  });

  describe('Performance Report', () => {
    it('should generate comprehensive performance report', () => {
      // Set up some metrics
      trackComponentRender('TestComponent', 75);
      trackUploadMetrics({
        activeUploads: 2,
        queueSize: 8,
        failedUploads: 1,
        totalUploaded: 15,
      });

      const report = generatePerformanceReport();

      expect(report).toContain('BLACKRENT V2 PERFORMANCE REPORT');
      expect(report).toContain('MEMORY USAGE:');
      expect(report).toContain('CACHE STATS:');
      expect(report).toContain('RENDER PERFORMANCE:');
      expect(report).toContain('UPLOAD METRICS:');
      expect(report).toContain('ALERTS:');
    });

    it('should include critical issues in report', () => {
      // Generate critical alert
      mockPerformance.memory = {
        usedJSHeapSize: 190 * 1024 * 1024,
        totalJSHeapSize: 195 * 1024 * 1024,
        jsHeapSizeLimit: 200 * 1024 * 1024, // 95% usage
      };

      getPerformanceMetrics(); // Trigger critical alert

      const report = generatePerformanceReport();

      expect(report).toContain('CRITICAL ISSUES:');
      expect(report).toContain('Kritické využitie pamäte');
    });

    it('should show no critical issues when none exist', () => {
      // Clear all alerts first
      clearPerformanceAlerts();

      const report = generatePerformanceReport();

      expect(report).toContain('✅ No critical issues detected');
    });
  });

  describe('useV2Performance Hook', () => {
    it('should return performance tracking functions', () => {
      const componentName = 'TestComponent';
      const hook = useV2Performance(componentName);

      expect(hook).toMatchObject({
        trackRender: expect.any(Function),
        getMetrics: expect.any(Function),
        getAlerts: expect.any(Function),
      });
    });

    it('should track render time when trackRender is called', () => {
      const componentName = 'TestComponent';
      const hook = useV2Performance(componentName);

      // Mock performance.now to simulate render time
      let callCount = 0;
      mockPerformance.now.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 1000 : 1050; // 50ms render time
      });

      hook.trackRender();

      const metrics = getPerformanceMetrics();
      expect(metrics.componentMetrics.lastRenderTime).toBe(50);
    });

    it('should return high and critical alerts only', () => {
      trackComponentRender('SlowComponent', 150); // Medium alert
      trackComponentRender('VerySlowComponent', 250); // High alert
      trackUploadMetrics({ failedUploads: 8 }); // High alert

      const hook = useV2Performance('TestComponent');
      const alerts = hook.getAlerts();

      expect(alerts).toHaveLength(2); // Only high alerts
      expect(
        alerts.every(
          alert => alert.severity === 'high' || alert.severity === 'critical'
        )
      ).toBe(true);
    });
  });
});
