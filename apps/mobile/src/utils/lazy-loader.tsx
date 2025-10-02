/**
 * 📦 Lazy Loading System
 * Bundle size optimization and component lazy loading
 */

import React, { Suspense, lazy, ComponentType } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { logger } from './logger';
import { memoryManager } from './memory-manager';

interface LazyComponentProps {
  fallback?: React.ComponentType;
  errorBoundary?: React.ComponentType<{ error: Error; retry: () => void }>;
  preload?: boolean;
}

/**
 * Default loading fallback
 */
const DefaultLoadingFallback: React.FC = () => (
  <View style={{ 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  }}>
    <ActivityIndicator size="large" color="#007AFF" />
  </View>
);

/**
 * Default error fallback
 */
const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ 
  error, 
  retry 
}) => (
  <View style={{ 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  }}>
    <Text style={{ marginBottom: 16, textAlign: 'center' }}>
      Failed to load component: {error.message}
    </Text>
    <TouchableOpacity 
      onPress={retry}
      style={{
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: 'white' }}>Retry</Text>
    </TouchableOpacity>
  </View>
);

/**
 * Create lazy component with optimizations
 */
export const createLazyComponent = <P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyComponentProps = {}
) => {
  const {
    fallback: Fallback = DefaultLoadingFallback,
    errorBoundary: ErrorBoundary = DefaultErrorFallback,
    preload = false,
  } = options;

  // Create lazy component
  const LazyComponent = lazy(() => {
    logger.debug('LazyLoader: Loading component');
    
    return importFn().catch((error) => {
      logger.error('LazyLoader: Failed to load component', error);
      throw error;
    });
  });

  // Preload if requested
  if (preload) {
    importFn().catch((error) => {
      logger.warn('LazyLoader: Preload failed', error);
    });
  }

  // Wrapper component with error boundary
  const LazyWrapper: React.FC<P> = (props) => {
    const [error, setError] = React.useState<Error | null>(null);
    const [retryCount, setRetryCount] = React.useState(0);

    const retry = React.useCallback(() => {
      setError(null);
      setRetryCount(prev => prev + 1);
    }, []);

    if (error) {
      return <ErrorBoundary error={error} retry={retry} />;
    }

    return (
      <Suspense fallback={<Fallback />}>
        <LazyComponent key={retryCount} {...props} />
      </Suspense>
    );
  };

  return LazyWrapper;
};

/**
 * Lazy load hook with preloading
 */
export const useLazyLoad = <T extends unknown>(
  importFn: () => Promise<T>,
  deps: React.DependencyList = []
) => {
  const [component, setComponent] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const load = React.useCallback(async () => {
    if (component) return component;

    setLoading(true);
    setError(null);

    try {
      const loadedComponent = await importFn();
      setComponent(loadedComponent);
      return loadedComponent;
    } catch (err) {
      const _error = err as Error;
      setError(error);
      logger.error('useLazyLoad: Failed to load', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, deps);

  const preload = React.useCallback(() => {
    if (!component && !loading) {
      load().catch(() => {
        // Preload failures are silent
      });
    }
  }, [component, loading, load]);

  return {
    component,
    loading,
    error,
    load,
    preload,
  };
};

/**
 * Bundle analyzer utilities
 */
export const BundleAnalyzer = {
  /**
   * Track component load times
   */
  trackLoadTime: (componentName: string, startTime: number) => {
    const loadTime = Date.now() - startTime;
    logger.debug(`BundleAnalyzer: ${componentName} loaded in ${loadTime}ms`);
    
    // Track in memory manager
    memoryManager.registerTimer(
      setTimeout(() => {
        // Cleanup tracking after 5 minutes
      }, 5 * 60 * 1000) as any
    );
  },

  /**
   * Get bundle size estimate
   */
  estimateBundleSize: (componentName: string) => {
    // This would integrate with bundle analyzer in development
    if (__DEV__) {
      logger.debug(`BundleAnalyzer: Estimating size for ${componentName}`);
    }
  },
};

/**
 * Lazy loading presets for common patterns
 */
export const LazyPresets = {
  /**
   * Screen component lazy loading
   */
  screen: <P extends object = {}>(
    importFn: () => Promise<{ default: ComponentType<P> }>
  ) => createLazyComponent(importFn, {
    preload: false, // Screens are loaded on demand
  }),

  /**
   * Modal component lazy loading
   */
  modal: <P extends object = {}>(
    importFn: () => Promise<{ default: ComponentType<P> }>
  ) => createLazyComponent(importFn, {
    preload: true, // Modals are preloaded for better UX
  }),

  /**
   * Heavy component lazy loading
   */
  heavy: <P extends object = {}>(
    importFn: () => Promise<{ default: ComponentType<P> }>
  ) => createLazyComponent(importFn, {
    preload: false,
    fallback: () => (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: 200,
      }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, color: '#666' }}>
          Loading component...
        </Text>
      </View>
    ),
  }),
};

/**
 * Route-based code splitting
 */
export const createLazyRoute = (
  routeName: string,
  importFn: () => Promise<{ default: ComponentType<any> }>
) => {
  const startTime = Date.now();
  
  return createLazyComponent(
    () => {
      return importFn().then((module: any) => {
        BundleAnalyzer.trackLoadTime(routeName, startTime);
        return module;
      });
    },
    {
      preload: false,
      fallback: () => (
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: '#f8f9fa',
        }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ 
            marginTop: 16, 
            color: '#666',
            fontSize: 16,
          }}>
            Loading {routeName}...
          </Text>
        </View>
      ),
    }
  );
};

/**
 * Asset lazy loading
 */
export const LazyAsset = {
  /**
   * Lazy load images
   */
  image: (uri: string) => {
    return new Promise<string>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        memoryManager.trackImageCache(uri);
        resolve(uri);
      };
      image.onerror = reject;
      image.src = uri;
    });
  },

  /**
   * Lazy load JSON data
   */
  json: async <T extends unknown>(path: string): Promise<T> => {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load JSON: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      logger.error('LazyAsset: Failed to load JSON', error as Error);
      throw error;
    }
  },
};

/**
 * Performance monitoring for lazy loading
 */
export const LazyPerformance = {
  /**
   * Monitor lazy loading performance
   */
  monitor: () => {
    if (__DEV__) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name.includes('lazy')) {
            logger.debug('LazyPerformance:', {
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        });
      });

      observer.observe({ entryTypes: ['measure', 'navigation'] });
    }
  },

  /**
   * Mark lazy loading events
   */
  mark: (name: string) => {
    if (__DEV__ && performance.mark) {
      performance.mark(`lazy-${name}`);
    }
  },

  /**
   * Measure lazy loading duration
   */
  measure: (name: string, startMark: string) => {
    if (__DEV__ && performance.measure) {
      performance.measure(`lazy-${name}`, `lazy-${startMark}`);
    }
  },
};

export default {
  createLazyComponent,
  useLazyLoad,
  LazyPresets,
  createLazyRoute,
  LazyAsset,
  LazyPerformance,
  BundleAnalyzer,
};
