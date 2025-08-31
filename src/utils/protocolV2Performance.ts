/**
 * Protocol V2 Performance Monitoring & Optimizations
 * Memory usage tracking, performance metrics a optimalizácie
 */

import { getV2CacheStats, optimizeV2Cache } from './protocolV2Cache';

interface PerformanceMetrics {
  memoryUsage: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    percentage: number;
  };
  cacheStats: {
    hasGlobalCache: boolean;
    companyCacheCount: number;
    emailStatusCount: number;
    cacheSize: number;
  };
  componentMetrics: {
    renderCount: number;
    lastRenderTime: number;
    averageRenderTime: number;
  };
  uploadMetrics: {
    activeUploads: number;
    queueSize: number;
    failedUploads: number;
    totalUploaded: number;
  };
}

interface PerformanceAlert {
  type: 'memory' | 'cache' | 'upload' | 'render';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  metrics?: any;
}

// Performance monitoring state
let performanceMetrics: PerformanceMetrics = {
  memoryUsage: {
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
    percentage: 0,
  },
  cacheStats: {
    hasGlobalCache: false,
    companyCacheCount: 0,
    emailStatusCount: 0,
    cacheSize: 0,
  },
  componentMetrics: {
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
  },
  uploadMetrics: {
    activeUploads: 0,
    queueSize: 0,
    failedUploads: 0,
    totalUploaded: 0,
  },
};

let performanceAlerts: PerformanceAlert[] = [];
let renderTimes: number[] = [];
let monitoringInterval: NodeJS.Timeout | null = null;

// Performance thresholds
const MEMORY_WARNING_THRESHOLD = 70; // 70% memory usage
const MEMORY_CRITICAL_THRESHOLD = 85; // 85% memory usage
const CACHE_SIZE_WARNING = 1024 * 1024; // 1MB cache size
const RENDER_TIME_WARNING = 100; // 100ms render time
const MAX_ALERTS = 50; // Maximum stored alerts

/**
 * 📊 Získanie aktuálnych performance metrics
 */
export const getPerformanceMetrics = (): PerformanceMetrics => {
  updateMemoryMetrics();
  updateCacheMetrics();
  return { ...performanceMetrics };
};

/**
 * 🔍 Memory usage monitoring
 */
const updateMemoryMetrics = (): void => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    const usedMB = memory.usedJSHeapSize / 1024 / 1024;
    const totalMB = memory.totalJSHeapSize / 1024 / 1024;
    const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
    const percentage = (usedMB / limitMB) * 100;

    performanceMetrics.memoryUsage = {
      usedJSHeapSize: usedMB,
      totalJSHeapSize: totalMB,
      jsHeapSizeLimit: limitMB,
      percentage,
    };

    // Memory alerts
    if (percentage > MEMORY_CRITICAL_THRESHOLD) {
      addPerformanceAlert({
        type: 'memory',
        severity: 'critical',
        message: `Kritické využitie pamäte: ${percentage.toFixed(1)}%`,
        timestamp: Date.now(),
        metrics: performanceMetrics.memoryUsage,
      });
    } else if (percentage > MEMORY_WARNING_THRESHOLD) {
      addPerformanceAlert({
        type: 'memory',
        severity: 'medium',
        message: `Vysoké využitie pamäte: ${percentage.toFixed(1)}%`,
        timestamp: Date.now(),
        metrics: performanceMetrics.memoryUsage,
      });
    }
  }
};

/**
 * 🔍 Cache metrics monitoring
 */
const updateCacheMetrics = (): void => {
  const cacheStats = getV2CacheStats();
  performanceMetrics.cacheStats = cacheStats;

  // Cache size alerts
  if (cacheStats.cacheSize > CACHE_SIZE_WARNING) {
    addPerformanceAlert({
      type: 'cache',
      severity: 'medium',
      message: `Veľká cache: ${(cacheStats.cacheSize / 1024).toFixed(1)}KB`,
      timestamp: Date.now(),
      metrics: cacheStats,
    });
  }
};

/**
 * 📊 Component render tracking
 */
export const trackComponentRender = (
  componentName: string,
  renderTime: number
): void => {
  performanceMetrics.componentMetrics.renderCount++;
  performanceMetrics.componentMetrics.lastRenderTime = renderTime;

  // Track render times for average calculation
  renderTimes.push(renderTime);
  if (renderTimes.length > 100) {
    renderTimes = renderTimes.slice(-50); // Keep last 50 renders
  }

  const averageRenderTime =
    renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
  performanceMetrics.componentMetrics.averageRenderTime = averageRenderTime;

  // Render time alerts
  if (renderTime > RENDER_TIME_WARNING) {
    addPerformanceAlert({
      type: 'render',
      severity: renderTime > 200 ? 'high' : 'medium',
      message: `Pomalý render ${componentName}: ${renderTime}ms`,
      timestamp: Date.now(),
      metrics: { componentName, renderTime, averageRenderTime },
    });
  }

  console.log(
    `🎯 V2 Performance: ${componentName} render: ${renderTime}ms (avg: ${averageRenderTime.toFixed(1)}ms)`
  );
};

/**
 * 📊 Upload metrics tracking
 */
export const trackUploadMetrics = (metrics: {
  activeUploads?: number;
  queueSize?: number;
  failedUploads?: number;
  totalUploaded?: number;
}): void => {
  performanceMetrics.uploadMetrics = {
    ...performanceMetrics.uploadMetrics,
    ...metrics,
  };

  // Upload performance alerts
  if (metrics.failedUploads && metrics.failedUploads > 5) {
    addPerformanceAlert({
      type: 'upload',
      severity: 'high',
      message: `Vysoký počet neúspešných uploadov: ${metrics.failedUploads}`,
      timestamp: Date.now(),
      metrics: performanceMetrics.uploadMetrics,
    });
  }

  if (metrics.queueSize && metrics.queueSize > 20) {
    addPerformanceAlert({
      type: 'upload',
      severity: 'medium',
      message: `Veľká upload queue: ${metrics.queueSize} súborov`,
      timestamp: Date.now(),
      metrics: performanceMetrics.uploadMetrics,
    });
  }
};

/**
 * ⚠️ Performance alert system
 */
const addPerformanceAlert = (alert: PerformanceAlert): void => {
  performanceAlerts.unshift(alert);

  // Keep only recent alerts
  if (performanceAlerts.length > MAX_ALERTS) {
    performanceAlerts = performanceAlerts.slice(0, MAX_ALERTS);
  }

  // Log critical alerts
  if (alert.severity === 'critical' || alert.severity === 'high') {
    console.warn(
      `🚨 V2 Performance Alert [${alert.severity.toUpperCase()}]: ${alert.message}`,
      alert.metrics
    );
  }
};

/**
 * 📋 Získanie performance alerts
 */
export const getPerformanceAlerts = (
  severity?: PerformanceAlert['severity']
): PerformanceAlert[] => {
  if (severity) {
    return performanceAlerts.filter(alert => alert.severity === severity);
  }
  return [...performanceAlerts];
};

/**
 * 🧹 Vymazanie starých alerts
 */
export const clearPerformanceAlerts = (olderThan?: number): void => {
  if (olderThan) {
    const cutoff = Date.now() - olderThan;
    performanceAlerts = performanceAlerts.filter(
      alert => alert.timestamp > cutoff
    );
  } else {
    performanceAlerts = [];
  }
};

/**
 * 🚀 Automatické performance optimizations
 */
export const runPerformanceOptimizations = (): void => {
  console.log('🚀 V2: Running performance optimizations...');

  const metrics = getPerformanceMetrics();

  // Memory optimization
  if (metrics.memoryUsage.percentage > MEMORY_WARNING_THRESHOLD) {
    console.log('🧹 V2: High memory usage detected, running cleanup...');

    // Optimize cache
    optimizeV2Cache();

    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }

    // Clear old render times
    if (renderTimes.length > 20) {
      renderTimes = renderTimes.slice(-10);
    }

    // Clear old alerts
    clearPerformanceAlerts(5 * 60 * 1000); // 5 minutes
  }

  // Cache optimization
  if (metrics.cacheStats.cacheSize > CACHE_SIZE_WARNING) {
    console.log('🧹 V2: Large cache detected, optimizing...');
    optimizeV2Cache();
  }

  console.log('✅ V2: Performance optimizations completed');
};

/**
 * 📊 Start continuous performance monitoring
 */
export const startPerformanceMonitoring = (
  intervalMs: number = 30000
): void => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
  }

  monitoringInterval = setInterval(() => {
    updateMemoryMetrics();
    updateCacheMetrics();

    // Auto-optimize if needed
    const metrics = getPerformanceMetrics();
    if (
      metrics.memoryUsage.percentage > MEMORY_WARNING_THRESHOLD ||
      metrics.cacheStats.cacheSize > CACHE_SIZE_WARNING
    ) {
      runPerformanceOptimizations();
    }
  }, intervalMs);

  console.log(
    `📊 V2: Performance monitoring started (interval: ${intervalMs}ms)`
  );
};

/**
 * 🛑 Stop performance monitoring
 */
export const stopPerformanceMonitoring = (): void => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    console.log('🛑 V2: Performance monitoring stopped');
  }
};

/**
 * 📊 Performance report generation
 */
export const generatePerformanceReport = (): string => {
  const metrics = getPerformanceMetrics();
  const alerts = getPerformanceAlerts();
  const criticalAlerts = alerts.filter(
    a => a.severity === 'critical' || a.severity === 'high'
  );

  return `
🎯 BLACKRENT V2 PERFORMANCE REPORT
Generated: ${new Date().toLocaleString()}

📊 MEMORY USAGE:
- Used: ${metrics.memoryUsage.usedJSHeapSize.toFixed(1)}MB
- Total: ${metrics.memoryUsage.totalJSHeapSize.toFixed(1)}MB
- Limit: ${metrics.memoryUsage.jsHeapSizeLimit.toFixed(1)}MB
- Usage: ${metrics.memoryUsage.percentage.toFixed(1)}%

🔄 CACHE STATS:
- Global Cache: ${metrics.cacheStats.hasGlobalCache ? 'Yes' : 'No'}
- Company Caches: ${metrics.cacheStats.companyCacheCount}
- Email Status: ${metrics.cacheStats.emailStatusCount}
- Total Size: ${(metrics.cacheStats.cacheSize / 1024).toFixed(1)}KB

🎨 RENDER PERFORMANCE:
- Total Renders: ${metrics.componentMetrics.renderCount}
- Last Render: ${metrics.componentMetrics.lastRenderTime}ms
- Average: ${metrics.componentMetrics.averageRenderTime.toFixed(1)}ms

📤 UPLOAD METRICS:
- Active: ${metrics.uploadMetrics.activeUploads}
- Queue: ${metrics.uploadMetrics.queueSize}
- Failed: ${metrics.uploadMetrics.failedUploads}
- Total: ${metrics.uploadMetrics.totalUploaded}

⚠️ ALERTS:
- Total: ${alerts.length}
- Critical/High: ${criticalAlerts.length}

${
  criticalAlerts.length > 0
    ? `
🚨 CRITICAL ISSUES:
${criticalAlerts.map(alert => `- [${alert.severity.toUpperCase()}] ${alert.message}`).join('\n')}
`
    : '✅ No critical issues detected'
}
`;
};

/**
 * 🎯 React Hook pre performance tracking
 */
export const useV2Performance = (componentName: string) => {
  const startTime = performance.now();

  return {
    trackRender: () => {
      const renderTime = performance.now() - startTime;
      trackComponentRender(componentName, renderTime);
    },
    getMetrics: getPerformanceMetrics,
    getAlerts: () =>
      getPerformanceAlerts('high').concat(getPerformanceAlerts('critical')),
  };
};
