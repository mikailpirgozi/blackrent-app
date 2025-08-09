/**
 * 🖼️ OPTIMIZED IMAGE COMPONENT
 * 
 * Booking.com štýl image loading:
 * - Lazy loading s Intersection Observer
 * - Thumbnail system pre zoznamy
 * - Progressive blur-to-sharp loading
 * - WebP format support
 * - Memory efficient
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Skeleton } from '@mui/material';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  thumbnail?: boolean; // Pre zoznamy - malé obrázky
  quality?: number; // 1-100
  priority?: boolean; // Pre critical images
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
  style?: React.CSSProperties;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = '100%',
  height = 'auto',
  thumbnail = false,
  quality = 75,
  priority = false,
  onLoad,
  onError,
  className,
  style,
  objectFit = 'cover'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Priority images load immediately
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 🎯 Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before visible
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  // 🖼️ Generate optimized image URL
  const getOptimizedUrl = useCallback((originalSrc: string) => {
    // Ak je to už Cloudflare R2 URL, pridáme optimalizácie
    if (originalSrc.includes('r2.dev') || originalSrc.includes('cloudflare.com')) {
      const url = new URL(originalSrc);
      
      // Thumbnail rozmer
      if (thumbnail) {
        url.searchParams.set('w', '150');
        url.searchParams.set('h', '150');
      } else if (typeof width === 'number') {
        url.searchParams.set('w', width.toString());
      }
      
      if (typeof height === 'number') {
        url.searchParams.set('h', height.toString());
      }
      
      url.searchParams.set('q', quality.toString());
      url.searchParams.set('format', 'webp');
      url.searchParams.set('fit', objectFit);
      
      return url.toString();
    }
    
    // Pre lokálne obrázky alebo iné URL
    return originalSrc;
  }, [thumbnail, width, height, quality, objectFit]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const optimizedSrc = getOptimizedUrl(src);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        ...style
      }}
      className={className}
    >
      {/* 🔄 Loading skeleton */}
      {!isLoaded && !hasError && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1
          }}
        />
      )}

      {/* 🖼️ Actual image */}
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            transition: 'opacity 0.3s ease, filter 0.3s ease',
            opacity: isLoaded ? 1 : 0,
            filter: isLoaded ? 'none' : 'blur(5px)', // Progressive blur effect
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 2
          }}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}

      {/* ❌ Error fallback */}
      {hasError && (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            color: '#999',
            fontSize: '0.875rem',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 3
          }}
        >
          📷 Obrázok sa nepodarilo načítať
        </Box>
      )}
    </Box>
  );
};

// 🎯 Specialized components for different use cases
export const ThumbnailImage: React.FC<Omit<OptimizedImageProps, 'thumbnail'>> = (props) => (
  <OptimizedImage {...props} thumbnail={true} quality={60} />
);

export const HeroImage: React.FC<Omit<OptimizedImageProps, 'priority'>> = (props) => (
  <OptimizedImage {...props} priority={true} quality={85} />
);

export default OptimizedImage;