import { useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  threshold?: number; // Distance from bottom to trigger load (px)
  rootMargin?: string; // Intersection observer root margin
  preloadThreshold?: number; // Percentage of scroll to trigger preload (0-1)
}

// Simple version for direct usage with preloading
export function useInfiniteScroll(
  scrollRef: React.RefObject<HTMLDivElement>,
  onLoadMore: () => void,
  shouldLoad: boolean,
  preloadThreshold: number = 0.7 // Default: 70% scroll position
) {
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      if (!shouldLoad) return;

      const { scrollTop, scrollHeight, clientHeight } = element;
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
      
      // 🚀 PRELOADING: Trigger when user reaches 70% of scroll
      if (scrollPercentage >= preloadThreshold) {
        onLoadMore();
      }
    };

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [scrollRef, onLoadMore, shouldLoad, preloadThreshold]);
}

// Advanced version with options and enhanced preloading
export function useInfiniteScrollAdvanced({
  hasMore,
  loading,
  onLoadMore,
  threshold = 300,
  rootMargin = '0px',
  preloadThreshold = 0.7 // 🚀 NEW: Preload at 70% scroll
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef(onLoadMore);
  const preloadTriggeredRef = useRef(false); // 🚀 NEW: Track if preload was triggered
  
  // Keep loadMore function reference current
  loadMoreRef.current = onLoadMore;

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    
    if (entry.isIntersecting && hasMore && !loading) {
      loadMoreRef.current();
    }
  }, [hasMore, loading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold: 0.1
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [handleIntersection, rootMargin]);

  // 🚀 ENHANCED: Scroll-based detection with preloading
  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollPercentage = scrollTop / (documentHeight - windowHeight);

      // 🚀 PRELOADING: Trigger at 70% scroll for seamless experience
      if (scrollPercentage >= preloadThreshold && !preloadTriggeredRef.current) {
        preloadTriggeredRef.current = true;
        loadMoreRef.current();
      }

      // Reset preload trigger when user scrolls back up
      if (scrollPercentage < preloadThreshold) {
        preloadTriggeredRef.current = false;
      }

      // Fallback: Trigger when user is within threshold pixels of bottom
      if (scrollTop + windowHeight >= documentHeight - threshold) {
        loadMoreRef.current();
      }
    };

    // Throttle scroll events for performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [loading, hasMore, threshold, preloadThreshold]);

  return sentinelRef;
}

// 🚀 NEW: Specialized hook for container-based infinite scroll with preloading
export function useContainerInfiniteScroll(
  containerRef: React.RefObject<HTMLDivElement>,
  onLoadMore: () => void,
  shouldLoad: boolean,
  preloadThreshold: number = 0.7
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleContainerScroll = () => {
      if (!shouldLoad) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
      
      // 🚀 PRELOADING: Trigger at 70% scroll for seamless experience
      if (scrollPercentage >= preloadThreshold) {
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleContainerScroll);
    return () => container.removeEventListener('scroll', handleContainerScroll);
  }, [containerRef, onLoadMore, shouldLoad, preloadThreshold]);
}