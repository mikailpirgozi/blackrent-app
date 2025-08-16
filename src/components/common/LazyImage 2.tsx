/**
 * 🖼️ LAZY IMAGE COMPONENT
 * 
 * Optimalizovaný image komponent s lazy loading a placeholder support
 */

import React, { memo, forwardRef } from 'react';
import { Box, Typography, IconButton, Fade, Skeleton, useTheme } from '@mui/material';
import { 
  Refresh as RefreshIcon, 
  Image as ImageIcon,
  Error as ErrorIcon 
} from '@mui/icons-material';
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

const LazyImage = forwardRef<HTMLImageElement, LazyImageProps>(({
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
  retryAttempts = 3
}, ref) => {
  const theme = useTheme();

  // Use progressive loading if low quality src is provided
  const lazyImageHook = lowQualitySrc
    ? useProgressiveImage(lowQualitySrc, src, {
        threshold,
        rootMargin,
        retryAttempts,
        onLoad,
        onError
      })
    : useLazyImage(src, {
        threshold,
        rootMargin,
        retryAttempts,
        onLoad,
        onError
      });

  const { 
    src: loadedSrc, 
    isLoading, 
    hasError, 
    isInView,
    retry,
    imageRef 
  } = lazyImageHook;

  const isProgressive = 'isHighQuality' in lazyImageHook;
  const isHighQuality = isProgressive ? lazyImageHook.isHighQuality : true;

  // Container styles
  const containerStyles = {
    width,
    height,
    borderRadius,
    overflow: 'hidden',
    position: 'relative' as const,
    backgroundColor: placeholderColor || theme.palette.grey[100],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: onClick ? 'pointer' : 'default',
    ...style
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
            variant="rectangular"
            width="100%"
            height="100%"
            animation="wave"
            sx={{ borderRadius }}
          />
        );
      
      case 'icon':
        return (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              color: 'text.disabled'
            }}
          >
            <ImageIcon sx={{ fontSize: 48, opacity: 0.5 }} />
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {isLoading ? 'Načítava...' : 'Obrázok'}
            </Typography>
          </Box>
        );
      
      case 'blur':
        return (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(45deg, 
                ${theme.palette.grey[200]} 25%, 
                transparent 25%, 
                transparent 75%, 
                ${theme.palette.grey[200]} 75%, 
                ${theme.palette.grey[200]}
              )`,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 10px 10px',
              filter: 'blur(1px)',
              opacity: 0.3
            }}
          />
        );
      
      default:
        return null;
    }
  };

  // Render error state
  const renderError = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        color: 'error.main',
        p: 2
      }}
    >
      <ErrorIcon sx={{ fontSize: 32 }} />
      <Typography variant="caption" align="center" sx={{ opacity: 0.8 }}>
        Obrázok sa nepodarilo načítať
      </Typography>
      {showRetry && (
        <IconButton
          size="small"
          onClick={retry}
          sx={{ 
            mt: 0.5,
            backgroundColor: 'error.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'error.dark'
            }
          }}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );

  // Combine refs
  const combinedRef = (element: HTMLImageElement | null) => {
    if (imageRef) {
      (imageRef as React.MutableRefObject<HTMLImageElement | null>).current = element;
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
    <Box
      className={className}
      sx={containerStyles}
      onClick={onClick}
    >
      {/* Placeholder/Loading state */}
      {!loadedSrc && !hasError && renderPlaceholder()}

      {/* Error state */}
      {hasError && renderError()}

      {/* Loaded image */}
      {loadedSrc && !hasError && (
        <Fade 
          in={true} 
          timeout={fadeInDuration}
          style={{ 
            width: '100%', 
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        >
          <img
            ref={combinedRef}
            src={loadedSrc}
            alt={alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit,
              transition: `filter ${fadeInDuration}ms ease-out`,
              filter: isHighQuality ? 'none' : 'blur(2px)',
            }}
            loading="lazy" // Native lazy loading as fallback
            onLoad={onLoad}
            onError={onError}
          />
        </Fade>
      )}

      {/* Loading indicator overlay */}
      {isLoading && isInView && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: 1,
            p: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              border: '2px solid transparent',
              borderTop: '2px solid white',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
          />
          <Typography variant="caption" sx={{ color: 'white', fontSize: 10 }}>
            {isProgressive && !isHighQuality ? 'HD' : 'Načítava'}
          </Typography>
        </Box>
      )}

      {/* Progressive quality indicator */}
      {isProgressive && loadedSrc && !isHighQuality && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            backgroundColor: 'rgba(255,165,0,0.8)',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: 10,
            fontWeight: 600
          }}
        >
          Optimalizuje sa...
        </Box>
      )}
    </Box>
  );
});

LazyImage.displayName = 'LazyImage';

export default memo(LazyImage);