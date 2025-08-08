// 📱 Mobile Performance Optimizer
// Lightweight performance optimizations specifically for mobile devices

interface MobilePerformanceConfig {
  enableVirtualization: boolean;
  enableImageOptimization: boolean;
  enableRenderOptimization: boolean;
  debugMode: boolean;
}

class MobilePerformanceOptimizer {
  private config: MobilePerformanceConfig;
  private isMobile: boolean = false;
  private renderQueue: Array<() => void> = [];
  private isProcessingQueue: boolean = false;

  constructor(config: Partial<MobilePerformanceConfig> = {}) {
    this.config = {
      enableVirtualization: true,
      enableImageOptimization: true,
      enableRenderOptimization: true,
      debugMode: false,
      ...config
    };

    this.isMobile = this.detectMobileDevice();
    this.initialize();
  }

  private detectMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isMobileViewport = window.matchMedia && window.matchMedia('(max-width: 900px)').matches;
    
    return isMobileUserAgent || isMobileViewport;
  }

  private log(message: string, data?: any) {
    if (this.config.debugMode) {
      console.log(`📱 MobilePerf: ${message}`, data || '');
    }
  }

  private initialize() {
    if (!this.isMobile) return;

    this.log('Initializing mobile performance optimizations');

    if (this.config.enableRenderOptimization) {
      this.setupRenderOptimization();
    }

    if (this.config.enableImageOptimization) {
      this.setupImageOptimization();
    }
  }

  private setupRenderOptimization() {
    // Batch DOM updates for better performance
    this.log('Setting up render optimization');
    
    // Use requestIdleCallback if available, otherwise fallback to requestAnimationFrame
    const scheduleWork = (callback: () => void) => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(callback, { timeout: 100 });
      } else {
        requestAnimationFrame(callback);
      }
    };

    // Override console.log to batch logs on mobile
    if (this.config.debugMode) {
      const originalLog = console.log;
      let logBuffer: any[] = [];
      
      console.log = (...args: any[]) => {
        logBuffer.push(args);
        
        scheduleWork(() => {
          if (logBuffer.length > 0) {
            logBuffer.forEach(logArgs => originalLog.apply(console, logArgs));
            logBuffer = [];
          }
        });
      };
    }
  }

  private setupImageOptimization() {
    this.log('Setting up image optimization');

    // Lazy load images that are not in viewport
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px'
    });

    // Observe all images with data-src attribute
    document.querySelectorAll('img[data-src]').forEach(img => {
      observer.observe(img);
    });
  }

  public optimizeComponent(componentName: string, renderFunction: () => void) {
    if (!this.isMobile) {
      renderFunction();
      return;
    }

    this.log(`Optimizing component: ${componentName}`);
    
    // Add to render queue for batching
    this.renderQueue.push(renderFunction);
    
    if (!this.isProcessingQueue) {
      this.processRenderQueue();
    }
  }

  private processRenderQueue() {
    if (this.renderQueue.length === 0) return;

    this.isProcessingQueue = true;
    
    const processChunk = () => {
      const startTime = performance.now();
      
      // Process renders for up to 5ms to avoid blocking
      while (this.renderQueue.length > 0 && (performance.now() - startTime) < 5) {
        const renderFunction = this.renderQueue.shift();
        if (renderFunction) {
          renderFunction();
        }
      }
      
      if (this.renderQueue.length > 0) {
        // Schedule next chunk
        requestAnimationFrame(processChunk);
      } else {
        this.isProcessingQueue = false;
      }
    };

    requestAnimationFrame(processChunk);
  }

  public measurePerformance<T>(name: string, fn: () => T): T {
    if (!this.isMobile || !this.config.debugMode) {
      return fn();
    }

    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    
    this.log(`Performance: ${name}`, {
      duration: `${(endTime - startTime).toFixed(2)}ms`,
      timestamp: new Date().toISOString()
    });

    return result;
  }

  public throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastExecTime = 0;

    return (...args: Parameters<T>) => {
      const currentTime = Date.now();

      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  public debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  public getMemoryInfo() {
    if (!('memory' in performance)) {
      return null;
    }

    const memInfo = (performance as any).memory;
    return {
      used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024),
      usagePercent: Math.round((memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100)
    };
  }

  public isHighMemoryUsage(): boolean {
    const memInfo = this.getMemoryInfo();
    return memInfo ? memInfo.usagePercent > 70 : false;
  }

  public cleanup() {
    this.renderQueue = [];
    this.isProcessingQueue = false;
    this.log('Mobile performance optimizer cleaned up');
  }
}

// Singleton instance
let mobilePerformanceOptimizer: MobilePerformanceOptimizer | null = null;

export const initializeMobilePerformance = (config?: Partial<MobilePerformanceConfig>): MobilePerformanceOptimizer => {
  if (!mobilePerformanceOptimizer) {
    mobilePerformanceOptimizer = new MobilePerformanceOptimizer(config);
  }
  return mobilePerformanceOptimizer;
};

export const getMobilePerformanceOptimizer = (): MobilePerformanceOptimizer | null => {
  return mobilePerformanceOptimizer;
};

export const destroyMobilePerformance = (): void => {
  if (mobilePerformanceOptimizer) {
    mobilePerformanceOptimizer.cleanup();
    mobilePerformanceOptimizer = null;
  }
};

export type { MobilePerformanceConfig };
