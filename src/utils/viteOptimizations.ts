// 🚀 Vite Performance Optimizations
// Advanced preloading, code splitting, and performance utilities

// import { ComponentType } from 'react';

// Vite-specific module preloading
interface ViteModulePreloader {
  preloadModule: (id: string) => Promise<void>;
  preloadComponent: (
    importFunc: () => Promise<Record<string, unknown>>
  ) => Promise<Record<string, unknown>>;
}

class ViteOptimizer implements ViteModulePreloader {
  private preloadCache = new Map<string, Promise<Record<string, unknown>>>();
  private preloadQueue: Array<() => Promise<Record<string, unknown>>> = [];
  private isProcessingQueue = false;

  // Preload Vite module by ID
  async preloadModule(id: string): Promise<void> {
    if (this.preloadCache.has(id)) {
      return;
    }

    const preloadPromise = import(/* @vite-ignore */ id);
    this.preloadCache.set(id, preloadPromise);
    await preloadPromise;
  }

  // Preload component with intelligent batching
  async preloadComponent(
    importFunc: () => Promise<Record<string, unknown>>
  ): Promise<Record<string, unknown>> {
    const funcString = importFunc.toString();

    if (this.preloadCache.has(funcString)) {
      const cached = this.preloadCache.get(funcString);
      if (cached) {
        return cached;
      }
    }

    const preloadPromise = importFunc();
    this.preloadCache.set(funcString, preloadPromise);
    return preloadPromise;
  }

  // Batch preload multiple components during idle time
  queuePreload(importFunc: () => Promise<Record<string, unknown>>): void {
    this.preloadQueue.push(importFunc);
    this.processQueueWhenIdle();
  }

  private processQueueWhenIdle(): void {
    if (this.isProcessingQueue || this.preloadQueue.length === 0) return;

    this.isProcessingQueue = true;

    // Use requestIdleCallback for non-blocking preloading
    const processNext = (deadline?: IdleDeadline) => {
      while (
        this.preloadQueue.length > 0 &&
        (!deadline || deadline.timeRemaining() > 0)
      ) {
        const importFunc = this.preloadQueue.shift();
        if (importFunc) {
          this.preloadComponent(importFunc).catch(console.warn);
        }
      }

      if (this.preloadQueue.length > 0) {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(processNext);
        } else {
          setTimeout(() => processNext(), 16); // Fallback for Safari
        }
      } else {
        this.isProcessingQueue = false;
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(processNext);
    } else {
      setTimeout(() => processNext(), 16);
    }
  }
}

// Global Vite optimizer instance
export const viteOptimizer = new ViteOptimizer();

// Critical component preloading for BlackRent
export const preloadCriticalComponents = () => {
  // Preload most used components immediately
  viteOptimizer.queuePreload(
    () => import('../components/vehicles/VehicleListNew')
  );
  viteOptimizer.queuePreload(() => import('../components/rentals/RentalList'));
  viteOptimizer.queuePreload(
    () => import('../components/customers/CustomerListNew')
  );
};

// Route-based preloading
export const preloadRouteComponents = (currentRoute: string) => {
  const routePreloadMap: Record<
    string,
    Array<() => Promise<Record<string, unknown>>>
  > = {
    '/vehicles': [
      () => import('../components/vehicles/VehicleListNew'),
      () => import('../components/common/LazyDetailView'),
    ],
    '/rentals': [
      () => import('../components/rentals/RentalList'),
      () => import('../components/protocols/HandoverProtocolForm'),
    ],
    '/customers': [() => import('../components/customers/CustomerListNew')],
    '/statistics': [() => import('../components/Statistics')],
    '/email-monitoring': [
      () => import('../components/email-management/EmailManagementLayout'),
    ],
  };

  const preloads = routePreloadMap[currentRoute];
  if (preloads) {
    preloads.forEach(importFunc => viteOptimizer.queuePreload(importFunc));
  }
};

// Intersection Observer for predictive preloading
export const setupPredictivePreloading = () => {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const preloadRoute = element.dataset.preloadRoute;

          if (preloadRoute) {
            preloadRouteComponents(preloadRoute);
            observer.unobserve(element);
          }
        }
      });
    },
    { rootMargin: '50px' }
  );

  // Observe navigation elements
  document.querySelectorAll('[data-preload-route]').forEach(el => {
    observer.observe(el);
  });

  return observer;
};

// Vite environment-specific optimizations
export const initializeViteOptimizations = () => {
  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('🚀 Vite optimizations initialized (development mode)');

    // In development, preload less aggressively
    setTimeout(preloadCriticalComponents, 2000);
  } else {
    console.log('🚀 Vite optimizations initialized (production mode)');

    // In production, preload more aggressively
    setTimeout(preloadCriticalComponents, 500);
    setTimeout(setupPredictivePreloading, 1000);
  }
};

// Performance monitoring for Vite chunks
export const monitorVitePerformance = () => {
  if ('performance' in window && 'getEntriesByType' in performance) {
    const observer = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        if (entry.name.includes('chunk-') || entry.name.includes('assets/')) {
          console.log(
            `📊 Vite chunk loaded: ${entry.name} (${entry.duration}ms)`
          );
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }
};
