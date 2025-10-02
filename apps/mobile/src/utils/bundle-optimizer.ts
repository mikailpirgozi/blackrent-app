/**
 * 📦 Bundle Optimizer
 * Code splitting and lazy loading utilities
 */

import React from 'react';
import { logger } from './logger';
import { performanceMonitor } from './performance-monitor';

interface LazyComponentOptions {
  fallback?: React.ComponentType;
  errorBoundary?: React.ComponentType<{ error: Error; retry: () => void }>;
  preload?: boolean;
  timeout?: number;
}

interface BundleStats {
  totalSize: number;
  loadedChunks: string[];
  pendingChunks: string[];
  failedChunks: string[];
}

class BundleOptimizer {
  private loadedChunks = new Set<string>();
  private pendingChunks = new Set<string>();
  private failedChunks = new Set<string>();
  private preloadPromises = new Map<string, Promise<any>>();

  /**
   * Create lazy-loaded component with error handling
   */
  createLazyComponent<T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    options: LazyComponentOptions = {}
  ): React.ComponentType<React.ComponentProps<T>> {
    const LazyComponent = React.lazy(importFn);
    
    return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => {
      const [error, setError] = React.useState<Error | null>(null);
      const [retryCount, setRetryCount] = React.useState(0);

      const retry = React.useCallback(() => {
        setError(null);
        setRetryCount(prev => prev + 1);
      }, []);

      if (error && options.errorBoundary) {
        const ErrorBoundary = options.errorBoundary;
        return React.createElement(ErrorBoundary, { error, retry });
      }

      return React.createElement(
        React.Suspense,
        { 
          fallback: options.fallback 
            ? React.createElement(options.fallback) 
            : React.createElement(DefaultFallback)
        },
        React.createElement(
          ErrorBoundaryWrapper,
          { onError: setError },
          React.createElement(LazyComponent as any, { ...props, ref, key: retryCount })
        )
      );
    });
  }

  /**
   * Preload component for better performance
   */
  async preloadComponent(
    chunkName: string,
    importFn: () => Promise<any>
  ): Promise<void> {
    if (this.loadedChunks.has(chunkName) || this.preloadPromises.has(chunkName)) {
      return;
    }

    const preloadPromise = performanceMonitor.measureApiCall(
      `chunk_${chunkName}`,
      async () => {
        try {
          this.pendingChunks.add(chunkName);
          const module = await importFn();
          this.loadedChunks.add(chunkName);
          this.pendingChunks.delete(chunkName);
          logger.debug(`Preloaded chunk: ${chunkName}`);
          return module;
        } catch (error) {
          this.failedChunks.add(chunkName);
          this.pendingChunks.delete(chunkName);
          logger.error(`Failed to preload chunk: ${chunkName}`, error);
          throw error;
        }
      }
    );

    this.preloadPromises.set(chunkName, preloadPromise);
    return preloadPromise;
  }

  /**
   * Preload multiple components based on route
   */
  async preloadRoute(routeName: string, imports: Record<string, () => Promise<any>>): Promise<void> {
    const preloadPromises = Object.entries(imports).map(([chunkName, importFn]) =>
      this.preloadComponent(`${routeName}_${chunkName}`, importFn)
    );

    try {
      await Promise.all(preloadPromises);
      logger.debug(`Preloaded route: ${routeName}`);
    } catch (error) {
      logger.warn(`Some chunks failed to preload for route: ${routeName}`, error);
    }
  }

  /**
   * Get bundle statistics
   */
  getBundleStats(): BundleStats {
    return {
      totalSize: 0, // Would be calculated from actual bundle sizes
      loadedChunks: Array.from(this.loadedChunks),
      pendingChunks: Array.from(this.pendingChunks),
      failedChunks: Array.from(this.failedChunks),
    };
  }

  /**
   * Clear preload cache
   */
  clearPreloadCache(): void {
    this.preloadPromises.clear();
    logger.debug('Preload cache cleared');
  }

  /**
   * Priority-based preloading
   */
  async preloadByPriority(
    chunks: Array<{
      name: string;
      importFn: () => Promise<any>;
      priority: 'high' | 'medium' | 'low';
    }>
  ): Promise<void> {
    // Sort by priority
    const sortedChunks = chunks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Preload high priority chunks first
    const highPriority = sortedChunks.filter(c => c.priority === 'high');
    await Promise.all(
      highPriority.map(chunk => this.preloadComponent(chunk.name, chunk.importFn))
    );

    // Then medium priority
    const mediumPriority = sortedChunks.filter(c => c.priority === 'medium');
    await Promise.all(
      mediumPriority.map(chunk => this.preloadComponent(chunk.name, chunk.importFn))
    );

    // Finally low priority (fire and forget)
    const lowPriority = sortedChunks.filter(c => c.priority === 'low');
    lowPriority.forEach(chunk => 
      this.preloadComponent(chunk.name, chunk.importFn).catch(() => {})
    );
  }
}

/**
 * Default fallback component
 */
const DefaultFallback: React.FC = () => 
  React.createElement(
    'div',
    { className: 'flex items-center justify-center p-8' },
    React.createElement('div', { 
      className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' 
    })
  );

/**
 * Error boundary wrapper
 */
class ErrorBoundaryWrapper extends React.Component<
  { children: React.ReactNode; onError: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null; // Error will be handled by parent
    }

    return this.props.children;
  }
}

export const bundleOptimizer = new BundleOptimizer();

/**
 * Hook for component preloading
 */
export function usePreloadComponent() {
  const preload = React.useCallback(
    (chunkName: string, importFn: () => Promise<any>) => {
      return bundleOptimizer.preloadComponent(chunkName, importFn);
    },
    []
  );

  const preloadRoute = React.useCallback(
    (routeName: string, imports: Record<string, () => Promise<any>>) => {
      return bundleOptimizer.preloadRoute(routeName, imports);
    },
    []
  );

  return { preload, preloadRoute };
}

/**
 * Lazy component factory with optimizations
 */
export function createOptimizedLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions & { chunkName?: string } = {}
) {
  const LazyComponent = bundleOptimizer.createLazyComponent(importFn, options);

  // Preload if requested
  if (options.preload && options.chunkName) {
    bundleOptimizer.preloadComponent(options.chunkName, importFn);
  }

  return LazyComponent;
}

/**
 * Route-based code splitting helper
 */
export const createRouteComponent = (
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
  routeName: string
) => {
  return createOptimizedLazyComponent(importFn, {
    chunkName: `route_${routeName}`,
    fallback: DefaultFallback,
    errorBoundary: ({ retry }) => 
      React.createElement(
        'div',
        { className: 'flex flex-col items-center justify-center p-8 text-center' },
        React.createElement(
          'p',
          { className: 'text-red-600 mb-4' },
          `Failed to load ${routeName}`
        ),
        React.createElement(
          'button',
          { 
            onClick: retry,
            className: 'px-4 py-2 bg-blue-600 text-white rounded-lg'
          },
          'Retry'
        )
      ),
  });
};

/**
 * Critical resource preloader
 */
export const preloadCriticalResources = async () => {
  const criticalChunks = [
    {
      name: 'home_screen',
      importFn: () => import('../app/(tabs)/home'),
      priority: 'high' as const,
    },
    {
      name: 'catalog_screen', 
      importFn: () => import('../app/(tabs)/catalog'),
      priority: 'high' as const,
    },
    {
      name: 'booking_flow',
      importFn: () => import('../app/booking'),
      priority: 'medium' as const,
    },
  ];

  await bundleOptimizer.preloadByPriority(criticalChunks);
};
