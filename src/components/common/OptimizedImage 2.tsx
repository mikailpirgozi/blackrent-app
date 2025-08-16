// 🖼️ Optimized Image Component
// Advanced image optimization with lazy loading, WebP support, and progressive enhancement

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  Box,
  Skeleton,
  useTheme,
  styled,
  keyframes,
} from '@mui/material';

// Fade-in animation
const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

// Shimmer animation
const shimmer = keyframes`
  0% { background-position: -468px 0; }
  100% { background-position: 468px 0; }
`;

const ImageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  display: 'inline-block',
  '& img': {
    maxWidth: '100%',
    height: 'auto',
    transition: 'all 0.3s ease',
  },
}));

const PlaceholderBox = styled(Box)(({ theme }) => ({
  background: `linear-gradient(
    90deg,
    ${theme.palette.mode === 'dark' ? 'rgba(45, 55, 72, 0.3)' : 'rgba(241, 245, 249, 0.8)'} 0px,
    ${theme.palette.mode === 'dark' ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.1)'} 40px,
    ${theme.palette.mode === 'dark' ? 'rgba(45, 55, 72, 0.3)' : 'rgba(241, 245, 249, 0.8)'} 80px
  )`,
  backgroundSize: '468px 104px',
  animation: `${shimmer} 1.6s ease-in-out infinite`,
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
  fontSize: '2rem',
}));

const LoadedImage = styled('img')(() => ({
  animation: `${fadeIn} 0.3s ease-out`,
}));

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  aspectRatio?: number; // width / height
  placeholder?: 'skeleton' | 'blur' | 'icon' | React.ReactNode;
  lazy?: boolean;
  webpSupport?: boolean;
  progressive?: boolean;
  quality?: number;
  className?: string;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: () => void;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  borderRadius?: number | string;
  priority?: boolean; // For critical images
}

// Image optimization utility
const generateOptimizedSrc = (
  src: string,
  width?: number | string,
  quality: number = 75
): { webp?: string; fallback: string } => {
  // For external images, return as-is
  if (src.startsWith('http')) {
    return { fallback: src };
  }

  // For local images, generate optimized versions
  const baseUrl = src.replace(/\.[^/.]+$/, ''); // Remove extension
  const extension = src.split('.').pop()?.toLowerCase();

  // Return different formats based on support
  return {
    webp: `${baseUrl}.webp`,
    fallback: src,
  };
};

// Check WebP support
const supportsWebP = (() => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
})();

export const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  src,
  alt,
  width,
  height,
  aspectRatio,
  placeholder = 'skeleton',
  lazy = true,
  webpSupport = true,
  progressive = true,
  quality = 75,
  className,
  onClick,
  onLoad,
  onError,
  objectFit = 'cover',
  borderRadius = 12,
  priority = false,
}) => {
  const theme = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate dimensions
  const containerStyle = {
    width: width || '100%',
    height: height || (aspectRatio && width ? `${(width as number) / aspectRatio}px` : 'auto'),
    borderRadius,
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority, isInView]);

  // Handle image loading
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsError(true);
    onError?.();
  }, [onError]);

  // Generate optimized sources
  const sources = generateOptimizedSrc(src, width as number, quality);
  const shouldUseWebP = webpSupport && supportsWebP && sources.webp;

  // Render placeholder
  const renderPlaceholder = () => {
    if (placeholder === 'skeleton') {
      return (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          sx={{ borderRadius }}
        />
      );
    }

    if (placeholder === 'blur') {
      return (
        <PlaceholderBox
          style={containerStyle}
          sx={{
            filter: 'blur(8px)',
            background: `linear-gradient(45deg, ${theme.palette.primary.light}20, ${theme.palette.secondary.light}20)`,
          }}
        />
      );
    }

    if (placeholder === 'icon') {
      return (
        <PlaceholderBox style={containerStyle}>
          🖼️
        </PlaceholderBox>
      );
    }

    if (React.isValidElement(placeholder)) {
      return placeholder;
    }

    return (
      <PlaceholderBox style={containerStyle}>
        📷
      </PlaceholderBox>
    );
  };

  // Render error state
  const renderError = () => (
    <PlaceholderBox
      style={containerStyle}
      sx={{
        background: theme.palette.error.light + '20',
        color: theme.palette.error.main,
      }}
    >
      ❌
    </PlaceholderBox>
  );

  return (
    <ImageContainer
      ref={containerRef}
      className={className}
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        ...containerStyle,
      }}
    >
      {/* Show placeholder while not in view or loading */}
      {(!isInView || (!isLoaded && !isError)) && renderPlaceholder()}

      {/* Show error state */}
      {isError && renderError()}

      {/* Render image when in view */}
      {isInView && !isError && (
        <>
          {shouldUseWebP ? (
            <picture>
              <source srcSet={sources.webp} type="image/webp" />
              <LoadedImage
                ref={imgRef}
                src={sources.fallback}
                alt={alt}
                onLoad={handleLoad}
                onError={handleError}
                loading={priority ? 'eager' : 'lazy'}
                decoding={progressive ? 'async' : 'sync'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit,
                  opacity: isLoaded ? 1 : 0,
                  borderRadius,
                }}
              />
            </picture>
          ) : (
            <LoadedImage
              ref={imgRef}
              src={sources.fallback}
              alt={alt}
              onLoad={handleLoad}
              onError={handleError}
              loading={priority ? 'eager' : 'lazy'}
              decoding={progressive ? 'async' : 'sync'}
              style={{
                width: '100%',
                height: '100%',
                objectFit,
                opacity: isLoaded ? 1 : 0,
                borderRadius,
              }}
            />
          )}
        </>
      )}

      {/* Progressive loading indicator */}
      {progressive && isInView && !isLoaded && !isError && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            background: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: 1,
            fontSize: '0.7rem',
          }}
        >
          Loading...
        </Box>
      )}
    </ImageContainer>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// Gallery component with optimized images
interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  columns?: number;
  gap?: number;
  onClick?: (index: number) => void;
}

export const OptimizedImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  columns = 3,
  gap = 2,
  onClick,
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
      }}
    >
      {images.map((image, index) => (
        <OptimizedImage
          key={index}
          src={image.src}
          alt={image.alt}
          aspectRatio={1}
          onClick={() => onClick?.(index)}
          placeholder="skeleton"
          lazy={index > 6} // First 6 images load immediately
          priority={index < 3} // First 3 images are high priority
        />
      ))}
    </Box>
  );
};

export default OptimizedImage;