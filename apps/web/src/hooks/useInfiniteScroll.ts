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
  const loadingRef = useRef(false);
  const lastScrollTop = useRef(0);
  const lastTriggerTime = useRef(0);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    let debounceTimer: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      if (!shouldLoad || loadingRef.current) return;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = element;

        // Only trigger if scrolling down
        if (scrollTop <= lastScrollTop.current) {
          lastScrollTop.current = scrollTop;
          return;
        }
        lastScrollTop.current = scrollTop;

        const scrollPercentage = scrollTop / (scrollHeight - clientHeight);

        // 🚀 PRELOADING: Trigger when user reaches threshold
        // But add a minimum scroll height check to avoid triggering too early
        const minScrollHeight = 500; // Minimum scroll height in pixels
        const hasEnoughContent = scrollHeight - clientHeight > minScrollHeight;

        // Add time-based throttling - don't trigger more than once per 2 seconds
        const now = Date.now();
        const timeSinceLastTrigger = now - lastTriggerTime.current;
        const minTimeBetweenTriggers = 2000; // 2 seconds

        if (
          scrollPercentage >= preloadThreshold &&
          hasEnoughContent &&
          !loadingRef.current &&
          timeSinceLastTrigger > minTimeBetweenTriggers
        ) {
          console.log(
            `📜 Infinite scroll triggered at ${Math.round(scrollPercentage * 100)}%`
          );
          loadingRef.current = true;
          lastTriggerTime.current = now;
          onLoadMore();

          // Reset loading flag after a longer delay
          setTimeout(() => {
            loadingRef.current = false;
          }, 3000); // 3 seconds delay
        }
      }, 150); // Debounce for 150ms
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(debounceTimer);
      element.removeEventListener('scroll', handleScroll);
    };
  }, [scrollRef, onLoadMore, shouldLoad, preloadThreshold]);

  // Reset loading flag when shouldLoad changes to false (loading completed)
  useEffect(() => {
    if (!shouldLoad) {
      loadingRef.current = false;
    }
  }, [shouldLoad]);
}

// Advanced version with options and enhanced preloading
export function useInfiniteScrollAdvanced({
  hasMore,
  loading,
  onLoadMore,
  threshold = 300,
  rootMargin = '0px',
  preloadThreshold = 0.7, // 🚀 NEW: Preload at 70% scroll
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef(onLoadMore);
  const preloadTriggeredRef = useRef(false); // 🚀 NEW: Track if preload was triggered

  // Keep loadMore function reference current
  loadMoreRef.current = onLoadMore;

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;

      if (entry?.isIntersecting && hasMore && !loading) {
        loadMoreRef.current();
      }
    },
    [hasMore, loading]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold: 0.1,
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

      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollPercentage = scrollTop / (documentHeight - windowHeight);

      // 🚀 PRELOADING: Trigger at 70% scroll for seamless experience
      if (
        scrollPercentage >= preloadThreshold &&
        !preloadTriggeredRef.current
      ) {
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

// 🎯 NEW: Item-based infinite scroll - triggers based on visible item index
export function useItemBasedInfiniteScroll(
  containerRef: React.RefObject<HTMLDivElement>,
  onLoadMore: () => void,
  shouldLoad: boolean,
  totalItems: number,
  itemSelector: string = '[data-rental-item]',
  triggerAtItem: number | 'auto' = 'auto' // 'auto' = 85% of items
) {
  const loadingRef = useRef(false);
  const lastTriggerTime = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let debounceTimer: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      if (!shouldLoad || loadingRef.current || totalItems === 0) return;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        // Get all rental items
        const items = container.querySelectorAll(itemSelector);
        if (items.length === 0) return;

        // Find the last visible item
        const containerRect = container.getBoundingClientRect();
        let lastVisibleIndex = -1;

        items.forEach((item, index) => {
          const itemRect = item.getBoundingClientRect();
          // Check if item is at least partially visible
          if (
            itemRect.top < containerRect.bottom &&
            itemRect.bottom > containerRect.top
          ) {
            lastVisibleIndex = Math.max(lastVisibleIndex, index);
          }
        });

        // Calculate trigger point
        const triggerIndex =
          triggerAtItem === 'auto'
            ? Math.floor(totalItems * 0.85) - 1 // 85% of items
            : triggerAtItem - 1;

        // Time-based throttling
        const now = Date.now();
        const timeSinceLastTrigger = now - lastTriggerTime.current;
        const minTimeBetweenTriggers = 2000; // 2 seconds

        // Trigger if we've scrolled past the trigger item
        if (
          lastVisibleIndex >= triggerIndex &&
          !loadingRef.current &&
          timeSinceLastTrigger > minTimeBetweenTriggers
        ) {
          console.log(
            `📜 Item-based scroll triggered: Item ${lastVisibleIndex + 1}/${totalItems} visible (trigger at ${triggerIndex + 1})`
          );
          loadingRef.current = true;
          lastTriggerTime.current = now;
          onLoadMore();

          // Reset loading flag after delay
          setTimeout(() => {
            loadingRef.current = false;
          }, 3000);
        }
      }, 150); // Debounce
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    // Also check on initial render and when items change
    setTimeout(handleScroll, 100);

    return () => {
      clearTimeout(debounceTimer);
      container.removeEventListener('scroll', handleScroll);
    };
  }, [
    containerRef,
    onLoadMore,
    shouldLoad,
    totalItems,
    itemSelector,
    triggerAtItem,
  ]);

  // Reset loading flag when shouldLoad changes
  useEffect(() => {
    if (!shouldLoad) {
      loadingRef.current = false;
    }
  }, [shouldLoad]);
}
