// ⚡ Performance Optimization Hooks
// Comprehensive performance monitoring, memory leak prevention, and optimization utilities

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Memory leak prevention hook
export const useCleanup = () => {
  const cleanupFunctions = useRef<Array<() => void>>([]);

  const addCleanup = useCallback((cleanupFn: () => void) => {
    cleanupFunctions.current.push(cleanupFn);
  }, []);

  useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn('Cleanup function error:', error);
        }
      });
      cleanupFunctions.current = [];
    };
  }, []);

  return addCleanup;
};

// Debounced state hook with cleanup
export const useDebouncedState = <T>(
  initialValue: T,
  delay: number
): [T, T, React.Dispatch<React.SetStateAction<T>>] => {
  const [actualValue, setActualValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const setValue = useCallback(
    (value: React.SetStateAction<T>) => {
      setActualValue(value);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
    },
    [delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [actualValue, debouncedValue, setValue];
};

// Throttled callback hook
export const useThrottledCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(
          () => {
            callback(...args);
            lastRun.current = Date.now();
          },
          delay - (now - lastRun.current)
        );
      }
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef<number>(0);
  const renderTimes = useRef<number[]>([]);
  const startTime = useRef<number>(0);

  // Track renders
  renderCount.current++;

  useEffect(() => {
    startTime.current = performance.now();
  });

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    renderTimes.current.push(renderTime);

    // Keep only last 10 render times
    if (renderTimes.current.length > 10) {
      renderTimes.current.shift();
    }

    // Log slow renders in development
    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      console.warn(
        `🐌 Slow render: ${componentName} (${renderTime.toFixed(2)}ms)`
      );
    }
  });

  const getStats = useCallback(() => {
    const times = renderTimes.current;
    const avgTime =
      times.length > 0 ? times.reduce((a, b) => a + b) / times.length : 0;
    const maxTime = times.length > 0 ? Math.max(...times) : 0;

    return {
      renderCount: renderCount.current,
      averageRenderTime: avgTime,
      maxRenderTime: maxTime,
      recentRenderTimes: [...times],
    };
  }, []);

  return { getStats };
};

// Intersection Observer hook with cleanup
export const useIntersectionObserver = (
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
) => {
  const [element, setElement] = useState<Element | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!element) return;

    observer.current = new IntersectionObserver(
      entries => {
        entries.forEach(callback);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.current.observe(element);

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [element, callback, options]);

  return setElement;
};

// Virtual scrolling hook for large lists
export const useVirtualScrolling = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length - 1
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange,
  };
};

// Image preloading hook
export const useImagePreloader = () => {
  const preloadedImages = useRef<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  const preloadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    if (preloadedImages.current.has(src)) {
      return Promise.resolve(new Image());
    }

    return new Promise((resolve, reject) => {
      setLoadingImages(prev => new Set(prev).add(src));

      const img = new Image();

      img.onload = () => {
        preloadedImages.current.add(src);
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
        resolve(img);
      };

      img.onerror = () => {
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });
  }, []);

  const preloadImages = useCallback(
    (sources: string[]) => {
      return Promise.allSettled(sources.map(preloadImage));
    },
    [preloadImage]
  );

  return {
    preloadImage,
    preloadImages,
    isLoading: loadingImages.size > 0,
    loadingCount: loadingImages.size,
    preloadedCount: preloadedImages.current.size,
  };
};

// Resource preloading hook
export const useResourcePreloader = () => {
  const preload = useCallback((href: string, as: string, type?: string) => {
    // Check if already preloaded
    const existing = document.querySelector(
      `link[rel="preload"][href="${href}"]`
    );
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;

    if (type) {
      link.type = type;
    }

    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }, []);

  const preloadScript = useCallback(
    (src: string) => {
      preload(src, 'script', 'text/javascript');
    },
    [preload]
  );

  const preloadStyle = useCallback(
    (href: string) => {
      preload(href, 'style', 'text/css');
    },
    [preload]
  );

  const preloadFont = useCallback(
    (href: string, format: string = 'woff2') => {
      preload(href, 'font', `font/${format}`);
    },
    [preload]
  );

  return {
    preload,
    preloadScript,
    preloadStyle,
    preloadFont,
  };
};

// Memory usage monitoring hook
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    usagePercentage: number;
  } | null>(null);

  useEffect(() => {
    if (!('memory' in performance)) {
      console.warn('Memory API not supported');
      return;
    }

    const updateMemoryInfo = () => {
      const memory = (
        performance as unknown as {
          memory: {
            usedJSHeapSize: number;
            totalJSHeapSize: number;
            jsHeapSizeLimit: number;
          };
        }
      ).memory;

      setMemoryInfo({
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      });
    };

    updateMemoryInfo();

    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

// Optimized re-render prevention hook
export const useShallowMemo = <T>(
  factory: () => T,
  deps: React.DependencyList
): T => {
  const prevDeps = useRef<React.DependencyList>([]);
  const memoizedValue = useRef<T>();

  const depsChanged =
    deps.length !== prevDeps.current.length ||
    deps.some((dep, index) => !Object.is(dep, prevDeps.current[index]));

  if (memoizedValue.current === undefined || depsChanged) {
    memoizedValue.current = factory();
    prevDeps.current = deps;
  }

  return memoizedValue.current;
};

export default {
  useCleanup,
  useDebouncedState,
  useThrottledCallback,
  usePerformanceMonitor,
  useIntersectionObserver,
  useVirtualScrolling,
  useImagePreloader,
  useResourcePreloader,
  useMemoryMonitor,
  useShallowMemo,
};
