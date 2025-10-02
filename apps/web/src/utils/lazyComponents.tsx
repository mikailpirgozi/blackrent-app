// 🔄 Enhanced Lazy Loading Utilities
// Advanced code splitting with error boundaries, preloading, and retry logic

import type {
  ComponentProps,
  ComponentType,
  LazyExoticComponent,
  ReactNode,
} from 'react';
import React, { Suspense } from 'react';

import ErrorBoundary from '../components/common/ErrorBoundary';
import {
  ComponentLoader,
  PageLoader,
} from '../components/common/LoadingStates';

// Preload cache to avoid duplicate dynamic imports
// const preloadCache = new Map<
//   string,
//   Promise<{ default: ComponentType<unknown> }>
// >();

interface LazyComponentOptions {
  loading?: ReactNode;
  error?: ReactNode;
  delay?: number;
  timeout?: number;
  retry?: boolean;
  retryCount?: number;
  preload?: boolean;
}

interface RetryableLazyComponent<T = Record<string, unknown>>
  extends LazyExoticComponent<ComponentType<T>> {
  preload: () => Promise<{ default: ComponentType<T> }>;
  retry: () => void;
}

// Enhanced lazy loading with retry and preload capabilities
export function createLazyComponent<T = Record<string, unknown>>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  options: LazyComponentOptions = {}
): RetryableLazyComponent<T> {
  const {
    delay = 0,
    timeout = 30000,
    retry = true,
    retryCount = 3,
    preload = false,
  } = options;

  let importPromise: Promise<{ default: ComponentType<T> }> | null = null;
  let retryCounter = 0;

  const loadComponent = (): Promise<{ default: ComponentType<T> }> => {
    if (importPromise) {
      return importPromise;
    }

    // Create timeout promise
    const timeoutPromise =
      timeout > 0
        ? new Promise<never>((_, reject) => {
            setTimeout(
              () => reject(new Error(`Component load timeout (${timeout}ms)`)),
              timeout
            );
          })
        : null;

    // Create delay promise
    const delayPromise =
      delay > 0
        ? new Promise(resolve => setTimeout(resolve, delay))
        : Promise.resolve();

    // Load component with timeout and delay
    importPromise = Promise.race([
      delayPromise.then(() => importFunc()),
      ...(timeoutPromise ? [timeoutPromise] : []),
    ]).catch(error => {
      importPromise = null; // Reset for retry

      if (retry && retryCounter < retryCount) {
        retryCounter++;
        console.warn(
          `Component load failed, retrying (${retryCounter}/${retryCount}):`,
          error
        );

        // Exponential backoff
        const backoffDelay = Math.pow(2, retryCounter) * 1000;
        return new Promise(resolve => setTimeout(resolve, backoffDelay)).then(
          () => loadComponent()
        );
      }

      throw error;
    });

    return importPromise;
  };

  // Create the lazy component
  const LazyComponent = React.lazy(loadComponent) as RetryableLazyComponent<T>;

  // Add preload method
  LazyComponent.preload = () => {
    return loadComponent();
  };

  // Add retry method
  LazyComponent.retry = () => {
    importPromise = null;
    retryCounter = 0;
  };

  // Preload if requested
  if (preload && typeof window !== 'undefined') {
    // Preload on idle or after a short delay
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => LazyComponent.preload());
    } else {
      setTimeout(() => LazyComponent.preload(), 100);
    }
  }

  return LazyComponent;
}

// Higher-order component for lazy loading with enhanced error handling
interface LazyWrapperProps {
  loading?: ReactNode;
  error?: ReactNode;
  level?: 'page' | 'component';
  children: ReactNode;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  loading = <ComponentLoader />,
  error,
  level = 'component',
  children,
}) => (
  <ErrorBoundary level={level} fallback={error}>
    <Suspense fallback={loading}>{children}</Suspense>
  </ErrorBoundary>
);

// Route-level lazy component with page loader
export function createLazyRoute<T = Record<string, unknown>>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  options: Omit<LazyComponentOptions, 'loading'> = {}
): RetryableLazyComponent<T> {
  return createLazyComponent(importFunc, {
    ...options,
    loading: <PageLoader message="Načítavam stránku..." />,
  });
}

// Component-level lazy loading
export function createLazyComponentWithLoader<T = Record<string, unknown>>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  loadingComponent?: ReactNode,
  options: LazyComponentOptions = {}
): React.FC<T> {
  const LazyComponent = createLazyComponent(importFunc, options);

  const WrappedComponent: React.FC<T> = (props: T) => (
    <LazyWrapper loading={loadingComponent}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <LazyComponent {...(props as any)} />
    </LazyWrapper>
  );

  WrappedComponent.displayName = `LazyComponentWithLoader`;

  return WrappedComponent;
}

// Preload utilities
export const preloadComponent = <T extends ComponentType<unknown>>(
  LazyComponent: RetryableLazyComponent<T>
): void => {
  if ('preload' in LazyComponent) {
    LazyComponent.preload();
  }
};

export const preloadComponents = (
  components: Array<RetryableLazyComponent<ComponentType<unknown>>>
): Promise<void> => {
  const preloadPromises = components
    .filter(component => 'preload' in component)
    .map(component =>
      component.preload().catch(error => {
        console.warn('Component preload failed:', error);
      })
    );

  return Promise.all(preloadPromises).then(() => {});
};

// Route-based preloading
export const preloadRouteOnHover = (
  _routePath: string,
  LazyComponent: RetryableLazyComponent<ComponentType<unknown>>
) => {
  return () => {
    // Only preload if not on mobile (to avoid unnecessary data usage)
    if (!window.matchMedia('(max-width: 768px)').matches) {
      preloadComponent(LazyComponent);
    }
  };
};

// Advanced lazy loading with intersection observer
export const createIntersectionLazyComponent = <
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  options: LazyComponentOptions & {
    rootMargin?: string;
    threshold?: number;
  } = {}
): React.FC<T> => {
  const { rootMargin = '50px', threshold = 0.1, ...lazyOptions } = options;

  const LazyIntersectionComponent: React.FC<T> = (props: T) => {
    const [shouldLoad, setShouldLoad] = React.useState(false);
    const elementRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const observer = new IntersectionObserver(
        entries => {
          const [entry] = entries;
          if (entry?.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        },
        { rootMargin, threshold }
      );

      if (elementRef.current) {
        observer.observe(elementRef.current);
      }

      return () => observer.disconnect();
    }, []);

    if (!shouldLoad) {
      return (
        <div ref={elementRef} style={{ minHeight: '200px' }}>
          {lazyOptions.loading || <ComponentLoader />}
        </div>
      );
    }

    const LazyComponent = createLazyComponent(importFunc, lazyOptions);

    return (
      <LazyWrapper>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <LazyComponent {...(props as any)} />
      </LazyWrapper>
    );
  };

  LazyIntersectionComponent.displayName = 'LazyIntersectionComponent';

  return LazyIntersectionComponent;
};

// Performance monitoring for lazy components
export const withPerformanceTracking = <T extends ComponentType<unknown>>(
  LazyComponent: T,
  componentName: string
): T => {
  const WrappedComponent: React.FC<ComponentProps<T>> = props => {
    React.useEffect(() => {
      const startTime = performance.now();

      return () => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;

        if (process.env.NODE_ENV === 'development') {
          console.debug(
            `📊 Component ${componentName} load time: ${loadTime.toFixed(2)}ms`
          );

          if (loadTime > 100) {
            console.warn(`⚠️ Slow component load: ${componentName}`);
          }
        }
      };
    }, []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <LazyComponent {...(props as any)} />;
  };

  WrappedComponent.displayName = `withPerformanceTracking(${componentName})`;
  return WrappedComponent as T;
};

// Bundle splitting utilities
export const createChunkedImport = () => {
  return <T = Record<string, unknown>,>(
    importFunc: () => Promise<{ default: ComponentType<T> }>
  ): (() => Promise<{ default: ComponentType<T> }>) => {
    // Add webpack magic comment for chunk naming
    return () => importFunc();
  };
};

// Export commonly used lazy components factory
export const createLazyPageComponent = (
  importFunc: () => Promise<{ default: ComponentType<unknown> }>
) => {
  return createLazyRoute(importFunc, {
    timeout: 10000,
    retry: true,
    retryCount: 2,
    preload: false,
  });
};

export default {
  createLazyComponent,
  createLazyRoute,
  createLazyComponentWithLoader,
  createIntersectionLazyComponent,
  preloadComponent,
  preloadComponents,
  withPerformanceTracking,
};
