/**
 * 🖼️ LAZY IMAGE COMPONENT
 *
 * Optimalizovaný image komponent s lazy loading a placeholder support
 */

import React, { forwardRef, memo } from 'react';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import {
  AlertCircle,
  Image as ImageIcon,
  RefreshCw,
  Loader2,
} from 'lucide-react';

import { useLazyImage, useProgressiveImage } from '../../hooks/useLazyImage';

interface LazyImageProps {
  src: string;
  alt: string;
  lowQualitySrc?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  borderRadius?: number | string;
  showRetry?: boolean;
  placeholder?: 'skeleton' | 'icon' | 'blur' | React.ReactNode;
  placeholderColor?: string;
  fadeInDuration?: number;
  onLoad?: () => void;
  onError?: (error: React.SyntheticEvent<HTMLImageElement>) => void;
  onClick?: () => void;
  // Lazy loading options
  threshold?: number;
  rootMargin?: string;
  retryAttempts?: number;
}

const LazyImage = forwardRef<HTMLImageElement, LazyImageProps>(
  (
    {
      src,
      alt,
      lowQualitySrc,
      width = '100%',
      height = 200,
      className,
      style,
      objectFit = 'cover',
      borderRadius = 2,
      showRetry = true,
      placeholder = 'skeleton',
      placeholderColor,
      fadeInDuration = 300,
      onLoad,
      onError,
      onClick,
      threshold = 0.1,
      rootMargin = '50px',
      retryAttempts = 3,
    },
    ref
  ) => {
    // Always call both hooks to avoid conditional hook calls
    const progressiveImageHook = useProgressiveImage(
      lowQualitySrc || src,
      src,
      {
        threshold,
        rootMargin,
        retryAttempts,
        ...(onLoad && { onLoad }),
        ...(onError && { onError }),
      }
    );

    const lazyImageHook = useLazyImage(src, {
      threshold,
      rootMargin,
      retryAttempts,
      ...(onLoad && { onLoad }),
      ...(onError && { onError }),
    });

    // Use progressive loading if low quality src is provided
    const imageHook = lowQualitySrc ? progressiveImageHook : lazyImageHook;

    const {
      src: loadedSrc,
      isLoading,
      hasError,
      isInView,
      retry,
      imageRef,
    } = imageHook;

    const isProgressive = 'isHighQuality' in imageHook;
    const isHighQuality = isProgressive ? imageHook.isHighQuality : true;

    // Container styles
    const containerStyles = {
      width,
      height,
      borderRadius,
      overflow: 'hidden',
      position: 'relative' as const,
      backgroundColor: placeholderColor || '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    };

    // Render placeholder
    const renderPlaceholder = () => {
      if (typeof placeholder === 'object' && placeholder !== null) {
        return placeholder;
      }

      switch (placeholder) {
        case 'skeleton':
          return (
            <Skeleton
              className="w-full h-full"
              style={{ borderRadius }}
            />
          );

        case 'icon':
          return (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="h-12 w-12 opacity-50" />
              <p className="text-xs opacity-70">
                {isLoading ? 'Načítava...' : 'Obrázok'}
              </p>
            </div>
          );

        case 'blur':
          return (
            <div
              className="absolute inset-0 opacity-30 blur-sm"
              style={{
                background: `linear-gradient(45deg, 
                #e5e5e5 25%, 
                transparent 25%, 
                transparent 75%, 
                #e5e5e5 75%, 
                #e5e5e5
              )`,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px',
              }}
            />
          );

        default:
          return null;
      }
    };

    // Render error state
    const renderError = () => (
      <div className="flex flex-col items-center gap-2 text-red-500 p-4">
        <AlertCircle className="h-8 w-8" />
        <p className="text-xs text-center opacity-80">
          Obrázok sa nepodarilo načítať
        </p>
        {showRetry && (
          <Button
            size="sm"
            onClick={retry}
            className="mt-1 bg-red-500 text-white hover:bg-red-600 h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
    );

    // Combine refs
    const combinedRef = (element: HTMLImageElement | null) => {
      if (imageRef) {
        (imageRef as React.MutableRefObject<HTMLImageElement | null>).current =
          element;
      }
      if (ref) {
        if (typeof ref === 'function') {
          ref(element);
        } else {
          ref.current = element;
        }
      }
    };

    return (
      <div className={className} style={containerStyles} onClick={onClick}>
        {/* Placeholder/Loading state */}
        {!loadedSrc && !hasError && renderPlaceholder()}

        {/* Error state */}
        {hasError && renderError()}

        {/* Loaded image */}
        {loadedSrc && !hasError && (
          <div
            className="w-full h-full absolute top-0 left-0 transition-opacity duration-300"
            style={{ animation: `fadeIn ${fadeInDuration}ms ease-out` }}
          >
            <img
              ref={combinedRef}
              src={loadedSrc}
              alt={alt}
              className="w-full h-full transition-all duration-300"
              style={{
                objectFit,
                filter: isHighQuality ? 'none' : 'blur(2px)',
              }}
              loading="lazy" // Native lazy loading as fallback
              onLoad={onLoad}
              onError={onError}
            />
          </div>
        )}

        {/* Loading indicator overlay */}
        {isLoading && isInView && (
          <div className="absolute top-2 right-2 bg-black/60 rounded p-1 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin text-white" />
            <p className="text-white text-[10px]">
              {isProgressive && !isHighQuality ? 'HD' : 'Načítava'}
            </p>
          </div>
        )}

        {/* Progressive quality indicator */}
        {isProgressive && loadedSrc && !isHighQuality && (
          <div className="absolute bottom-2 left-2 bg-orange-500/80 text-white px-2 py-1 rounded text-[10px] font-semibold">
            Optimalizuje sa...
          </div>
        )}
      </div>
    );
  }
);

LazyImage.displayName = 'LazyImage';

export default memo(LazyImage);
