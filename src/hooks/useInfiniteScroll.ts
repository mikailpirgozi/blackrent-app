import { useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  threshold?: number; // Distance from bottom to trigger load (px)
  rootMargin?: string; // Intersection observer root margin
}

// Simple version for direct usage
export function useInfiniteScroll(
  scrollRef: React.RefObject<HTMLDivElement>,
  onLoadMore: () => void,
  shouldLoad: boolean
) {
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      if (!shouldLoad) return;

      const { scrollTop, scrollHeight, clientHeight } = element;
      
      // Trigger when user is 200px from bottom
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        onLoadMore();
      }
    };

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [scrollRef, onLoadMore, shouldLoad]);
}

// Advanced version with options
export function useInfiniteScrollAdvanced({
  hasMore,
  loading,
  onLoadMore,
  threshold = 300,
  rootMargin = '0px'
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef(onLoadMore);
  
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

  // Alternative scroll-based detection for better UX
  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Trigger when user is within threshold pixels of bottom
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
  }, [loading, hasMore, threshold]);

  return sentinelRef;
}