/**
 * 🖼️ LAZY IMAGE LOADING HOOK
 *
 * Hook pre progressive image loading s Intersection Observer API
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseLazyImageOptions {
  threshold?: number;
  rootMargin?: string;
  fallbackDelay?: number;
  retryAttempts?: number;
  onLoad?: () => void;
  onError?: (error: React.SyntheticEvent<HTMLImageElement>) => void;
}

interface UseLazyImageReturn {
  src: string | null;
  isLoading: boolean;
  hasError: boolean;
  isInView: boolean;
  retry: () => void;
  imageRef: React.RefObject<HTMLImageElement | null>;
}

export const useLazyImage = (
  imageSrc: string,
  options: UseLazyImageOptions = {}
): UseLazyImageReturn => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    fallbackDelay = 3000,
    retryAttempts = 3,
    onLoad,
    onError,
  } = options;

  const [src, setSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const imageRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preload image
  const loadImage = useCallback(async () => {
    if (!imageSrc || hasError || src) return;

    setIsLoading(true);
    setHasError(false);

    try {
      // Create new image element for preloading
      const img = new Image();

      // Promise-based image loading
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          console.log(`🖼️ Image loaded: ${imageSrc}`);
          resolve();
        };

        img.onerror = error => {
          console.error(`❌ Image failed to load: ${imageSrc}`, error);
          reject(error);
        };

        // Set timeout as fallback
        loadTimeoutRef.current = setTimeout(() => {
          reject(new Error('Image load timeout'));
        }, fallbackDelay);

        img.src = imageSrc;
      });

      // Clear timeout if image loaded successfully
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }

      setSrc(imageSrc);
      setIsLoading(false);
      onLoad?.();
    } catch (error) {
      console.error('Image loading failed:', error);

      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }

      setIsLoading(false);

      if (retryCount < retryAttempts) {
        // Exponential backoff for retry
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadImage();
        }, delay);
      } else {
        setHasError(true);
        // Create synthetic event for consistency
        const syntheticError = {
          nativeEvent: error as Event,
          currentTarget: null as unknown as HTMLImageElement,
          target: null as unknown as HTMLImageElement,
          bubbles: false,
          cancelable: false,
          defaultPrevented: false,
          eventPhase: 0,
          isTrusted: false,
          preventDefault: () => {},
          isDefaultPrevented: () => false,
          stopPropagation: () => {},
          isPropagationStopped: () => false,
          persist: () => {},
          timeStamp: Date.now(),
          type: 'error',
        } as React.SyntheticEvent<HTMLImageElement>;
        onError?.(syntheticError);
      }
    }
  }, [
    imageSrc,
    hasError,
    src,
    retryCount,
    retryAttempts,
    fallbackDelay,
    onLoad,
    onError,
  ]);

  // Manual retry function
  const retry = useCallback(() => {
    setHasError(false);
    setSrc(null);
    setRetryCount(0);
    loadImage();
  }, [loadImage]);

  // Setup Intersection Observer
  useEffect(() => {
    const imageElement = imageRef.current;
    if (!imageElement) return;

    // Create observer
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          console.log('🎯 Image in view, starting lazy load:', imageSrc);
          setIsInView(true);

          // Start loading image
          loadImage();

          // Stop observing after first intersection
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    // Start observing
    observerRef.current.observe(imageElement);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [imageSrc, threshold, rootMargin, loadImage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  return {
    src,
    isLoading,
    hasError,
    isInView,
    retry,
    imageRef,
  };
};

/**
 * 🎭 Preload images utility
 */
export const preloadImages = (imageUrls: string[]): Promise<string[]> => {
  return Promise.allSettled(
    imageUrls.map(url => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error(`Failed to preload: ${url}`));
        img.src = url;
      });
    })
  ).then(results => {
    const successful = results
      .filter(
        (result): result is PromiseFulfilledResult<string> =>
          result.status === 'fulfilled'
      )
      .map(result => result.value);

    console.log(`🎭 Preloaded ${successful.length}/${imageUrls.length} images`);
    return successful;
  });
};

/**
 * 📱 Progressive image quality hook
 */
export const useProgressiveImage = (
  lowQualitySrc: string,
  highQualitySrc: string,
  options: UseLazyImageOptions = {}
) => {
  const [currentSrc, setCurrentSrc] = useState<string>(lowQualitySrc);
  const [isHighQuality, setIsHighQuality] = useState(false);

  const {
    src: highQualityLoaded,
    isLoading: isLoadingHQ,
    hasError: hasHQError,
    isInView,
    retry,
    imageRef,
  } = useLazyImage(highQualitySrc, options);

  useEffect(() => {
    if (highQualityLoaded && !hasHQError) {
      setCurrentSrc(highQualityLoaded);
      setIsHighQuality(true);
    }
  }, [highQualityLoaded, hasHQError]);

  return {
    src: currentSrc,
    isLoading: isLoadingHQ,
    hasError: hasHQError,
    isHighQuality,
    isInView,
    retry,
    imageRef,
  };
};
