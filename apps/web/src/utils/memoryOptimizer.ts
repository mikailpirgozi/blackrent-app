// 🧠 Memory Optimization & Leak Prevention
// Advanced memory management and performance monitoring tools

interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
  timestamp: number;
}

interface PerformanceMetrics {
  memoryStats: MemoryStats | null;
  renderTime: number;
  interactionLatency: number;
  resourceCount: number;
  activeListeners: number;
}

class MemoryOptimizer {
  private memoryCheckInterval: ReturnType<typeof setInterval> | null = null;
  private memoryHistory: MemoryStats[] = [];
  private activeListeners = new Map<string, Set<EventListener>>();
  private weakRefs = new Set<WeakRef<Record<string, unknown>>>();
  private cleanupCallbacks = new Set<() => void>();

  // Memory monitoring
  startMemoryMonitoring(intervalMs: number = 5000): void {
    if (!('memory' in performance)) {
      console.warn('Memory API not available');
      return;
    }

    this.memoryCheckInterval = setInterval(() => {
      const memoryStats = this.getMemoryStats();
      if (memoryStats) {
        this.memoryHistory.push(memoryStats);

        // Keep only last 20 measurements
        if (this.memoryHistory.length > 20) {
          this.memoryHistory.shift();
        }

        // Check for memory leaks
        this.detectMemoryLeaks(memoryStats);

        if (process.env.NODE_ENV === 'development') {
          this.logMemoryStats(memoryStats);
        }
      }
    }, intervalMs);
  }

  stopMemoryMonitoring(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
  }

  // Get current memory statistics
  getMemoryStats(): MemoryStats | null {
    if (!('memory' in performance)) return null;

    interface PerformanceMemory {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    }

    const memory = (performance as unknown as { memory: PerformanceMemory })
      .memory;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      timestamp: Date.now(),
    };
  }

  // Detect potential memory leaks
  private detectMemoryLeaks(currentStats: MemoryStats): void {
    if (this.memoryHistory.length < 5) return;

    const recentStats = this.memoryHistory.slice(-5);
    const growthTrend = recentStats.every((stats, index) => {
      if (index === 0) return true;
      return stats.usedJSHeapSize > recentStats[index - 1].usedJSHeapSize;
    });

    const averageGrowth =
      recentStats.reduce((acc, stats, index) => {
        if (index === 0) return 0;
        return (
          acc + (stats.usedJSHeapSize - recentStats[index - 1].usedJSHeapSize)
        );
      }, 0) /
      (recentStats.length - 1);

    // Alert if memory is consistently growing
    if (growthTrend && averageGrowth > 1024 * 1024) {
      // 1MB average growth
      console.warn('🚨 Potential memory leak detected!', {
        averageGrowth: `${(averageGrowth / 1024 / 1024).toFixed(2)}MB`,
        currentUsage: `${(currentStats.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        usagePercentage: `${currentStats.usagePercentage.toFixed(1)}%`,
      });

      // Suggest garbage collection if available
      if (
        'gc' in window &&
        typeof (window as unknown as Record<string, unknown>).gc === 'function'
      ) {
        console.log('🗑️ Running garbage collection...');
        ((window as unknown as Record<string, unknown>).gc as () => void)();
      }
    }

    // Alert if memory usage is very high
    if (currentStats.usagePercentage > 80) {
      console.error('🚨 High memory usage detected!', {
        usage: `${currentStats.usagePercentage.toFixed(1)}%`,
        used: `${(currentStats.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(currentStats.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
      });

      // Trigger cleanup
      this.performEmergencyCleanup();
    }
  }

  // Emergency cleanup when memory is high
  private performEmergencyCleanup(): void {
    console.log('🧹 Performing emergency memory cleanup...');

    // Run all registered cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Cleanup callback failed:', error);
      }
    });

    // Clear weak references
    this.weakRefs.clear();

    // Remove unused event listeners
    this.cleanupUnusedListeners();

    // Clear caches if available
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('temp') || name.includes('cache')) {
            caches.delete(name);
          }
        });
      });
    }

    // Force garbage collection if available
    if (
      'gc' in window &&
      typeof (window as unknown as Record<string, unknown>).gc === 'function'
    ) {
      ((window as unknown as Record<string, unknown>).gc as () => void)();
    }
  }

  // Log memory statistics
  private logMemoryStats(stats: MemoryStats): void {
    const used = (stats.usedJSHeapSize / 1024 / 1024).toFixed(2);
    const total = (stats.totalJSHeapSize / 1024 / 1024).toFixed(2);
    const limit = (stats.jsHeapSizeLimit / 1024 / 1024).toFixed(2);

    console.group('🧠 Memory Stats');
    console.log(`Used: ${used}MB / Total: ${total}MB / Limit: ${limit}MB`);
    console.log(`Usage: ${stats.usagePercentage.toFixed(1)}%`);
    console.log(`Active Listeners: ${this.getTotalListenerCount()}`);
    console.log(`WeakRefs: ${this.weakRefs.size}`);
    console.groupEnd();
  }

  // Register event listener for tracking
  addTrackedListener(
    element: EventTarget,
    event: string,
    listener: EventListener,
    options?: AddEventListenerOptions
  ): void {
    const key = `${element.constructor.name}_${event}`;

    if (!this.activeListeners.has(key)) {
      this.activeListeners.set(key, new Set());
    }

    this.activeListeners.get(key)!.add(listener);
    element.addEventListener(event, listener, options);
  }

  // Remove tracked listener
  removeTrackedListener(
    element: EventTarget,
    event: string,
    listener: EventListener
  ): void {
    const key = `${element.constructor.name}_${event}`;
    const listeners = this.activeListeners.get(key);

    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.activeListeners.delete(key);
      }
    }

    element.removeEventListener(event, listener);
  }

  // Clean up unused listeners
  private cleanupUnusedListeners(): void {
    let removedCount = 0;

    this.activeListeners.forEach((listeners, key) => {
      // Check if listeners are still needed (this is a simplified check)
      listeners.forEach(listener => {
        if (
          typeof listener === 'function' &&
          listener.name.includes('anonymous')
        ) {
          listeners.delete(listener);
          removedCount++;
        }
      });

      if (listeners.size === 0) {
        this.activeListeners.delete(key);
      }
    });

    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} unused event listeners`);
    }
  }

  // Get total listener count
  private getTotalListenerCount(): number {
    let total = 0;
    this.activeListeners.forEach(listeners => {
      total += listeners.size;
    });
    return total;
  }

  // Register cleanup callback
  registerCleanup(callback: () => void): void {
    this.cleanupCallbacks.add(callback);
  }

  // Unregister cleanup callback
  unregisterCleanup(callback: () => void): void {
    this.cleanupCallbacks.delete(callback);
  }

  // Create weak reference for automatic cleanup
  createWeakRef<T extends object>(obj: T): WeakRef<T> {
    const weakRef = new WeakRef(obj);
    this.weakRefs.add(weakRef as WeakRef<Record<string, unknown>>);
    return weakRef;
  }

  // Get performance metrics
  getPerformanceMetrics(): PerformanceMetrics {
    return {
      memoryStats: this.getMemoryStats(),
      renderTime: this.measureRenderTime(),
      interactionLatency: this.measureInteractionLatency(),
      resourceCount: document.querySelectorAll('*').length,
      activeListeners: this.getTotalListenerCount(),
    };
  }

  // Measure render time
  private measureRenderTime(): number {
    if ('navigation' in performance) {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as unknown as Record<string, unknown>;
      if (navigation) {
        return (
          (navigation.loadEventEnd as number) -
          (navigation.loadEventStart as number)
        );
      }
    }
    return 0;
  }

  // Measure interaction latency
  private measureInteractionLatency(): number {
    // This would be implemented with performance observer
    // For now, return a placeholder
    return 0;
  }

  // Generate memory report
  generateMemoryReport(): Record<string, unknown> {
    const currentStats = this.getMemoryStats();
    const metrics = this.getPerformanceMetrics();

    return {
      timestamp: new Date().toISOString(),
      currentMemory: currentStats,
      memoryHistory: [...this.memoryHistory],
      performanceMetrics: metrics,
      recommendations: this.generateRecommendations(currentStats, metrics),
    };
  }

  // Generate performance recommendations
  private generateRecommendations(
    memoryStats: MemoryStats | null,
    metrics: PerformanceMetrics
  ): string[] {
    const recommendations: string[] = [];

    if (memoryStats && memoryStats.usagePercentage > 70) {
      recommendations.push('Consider reducing the number of cached objects');
      recommendations.push('Review and remove unused event listeners');
    }

    if (metrics.activeListeners > 100) {
      recommendations.push(
        'High number of event listeners detected - consider event delegation'
      );
    }

    if (metrics.resourceCount > 1000) {
      recommendations.push(
        'High DOM node count - consider virtual scrolling for large lists'
      );
    }

    if (metrics.renderTime > 100) {
      recommendations.push(
        'Slow render time detected - optimize component rendering'
      );
    }

    return recommendations;
  }

  // Cleanup all resources
  cleanup(): void {
    this.stopMemoryMonitoring();
    this.cleanupCallbacks.clear();
    this.activeListeners.clear();
    this.weakRefs.clear();
    this.memoryHistory = [];
  }
}

// React component memory optimizer
export class ReactMemoryOptimizer {
  private componentRefs = new Map<string, WeakRef<Record<string, unknown>>>();

  // Track component mount/unmount
  trackComponent(
    componentName: string,
    component: Record<string, unknown>
  ): void {
    this.componentRefs.set(componentName, new WeakRef(component));
  }

  // Check for components that should have been unmounted
  checkForLeakedComponents(): string[] {
    const leaked: string[] = [];

    this.componentRefs.forEach((weakRef, componentName) => {
      const component = weakRef.deref();
      if (component) {
        // Component still exists - check if it should have been cleaned up
        if (
          (component as Record<string, unknown>)._unmounted ||
          (component as Record<string, unknown>)._reactInternalFiber === null
        ) {
          leaked.push(componentName);
        }
      } else {
        // Component was garbage collected - remove from tracking
        this.componentRefs.delete(componentName);
      }
    });

    return leaked;
  }

  // Get component count
  getComponentCount(): number {
    let count = 0;
    this.componentRefs.forEach(weakRef => {
      if (weakRef.deref()) count++;
    });
    return count;
  }
}

// Export singleton instances
export const memoryOptimizer = new MemoryOptimizer();
export const reactMemoryOptimizer = new ReactMemoryOptimizer();

// Initialize memory optimization
export const initializeMemoryOptimization = () => {
  if (process.env.NODE_ENV === 'development') {
    memoryOptimizer.startMemoryMonitoring(10000); // Check every 10 seconds in dev
  } else {
    memoryOptimizer.startMemoryMonitoring(30000); // Check every 30 seconds in prod
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    memoryOptimizer.cleanup();
  });

  // Register global cleanup for React components
  memoryOptimizer.registerCleanup(() => {
    const leaked = reactMemoryOptimizer.checkForLeakedComponents();
    if (leaked.length > 0) {
      console.warn('🚨 Potentially leaked components:', leaked);
    }
  });

  console.log('🧠 Memory optimization initialized');
};

export default {
  memoryOptimizer,
  reactMemoryOptimizer,
  initializeMemoryOptimization,
};
