/**
 * 🖼️ IMAGE GALLERY LAZY
 * 
 * Optimalizovaná image gallery s lazy loading a virtualizáciou
 */

import React, { memo, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  Fade,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  ZoomIn as ZoomInIcon
} from '@mui/icons-material';
import LazyImage from './LazyImage';
import { VehicleImageUtils } from '../../utils/imageOptimization';

interface GalleryImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  caption?: string;
  vehicleId?: string;
}

interface ImageGalleryLazyProps {
  images: GalleryImage[];
  columns?: number;
  spacing?: number;
  aspectRatio?: number;
  showCaptions?: boolean;
  enableFullscreen?: boolean;
  maxVisibleImages?: number;
  onImageClick?: (image: GalleryImage, index: number) => void;
  className?: string;
}

const ImageGalleryLazy: React.FC<ImageGalleryLazyProps> = ({
  images,
  columns = 3,
  spacing = 2,
  aspectRatio = 4/3,
  showCaptions = false,
  enableFullscreen = true,
  maxVisibleImages = 50, // Virtual scrolling threshold
  onImageClick,
  className
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Responsive columns
  const responsiveColumns = useMemo(() => {
    if (isMobile) return Math.min(2, columns);
    return columns;
  }, [isMobile, columns]);

  // Virtual scrolling - show only subset of images initially
  const [visibleCount, setVisibleCount] = useState(Math.min(maxVisibleImages, images.length));
  const visibleImages = useMemo(() => 
    images.slice(0, visibleCount), 
    [images, visibleCount]
  );

  // Load more images when needed
  const loadMoreImages = useCallback(() => {
    const remaining = images.length - visibleCount;
    const increment = Math.min(20, remaining);
    setVisibleCount(prev => prev + increment);
  }, [images.length, visibleCount]);

  // Handle image click
  const handleImageClick = useCallback((image: GalleryImage, index: number) => {
    if (enableFullscreen) {
      setCurrentImageIndex(index);
      setFullscreenOpen(true);
    }
    onImageClick?.(image, index);
  }, [enableFullscreen, onImageClick]);

  // Fullscreen navigation
  const handlePreviousImage = useCallback(() => {
    setCurrentImageIndex(prev => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  }, [images.length]);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex(prev => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  }, [images.length]);

  const handleCloseFullscreen = useCallback(() => {
    setFullscreenOpen(false);
  }, []);

  // Calculate image dimensions
  const imageHeight = useMemo(() => {
    return `${(1 / aspectRatio) * 100}%`;
  }, [aspectRatio]);

  if (!images || images.length === 0) {
    return (
      <Box 
        sx={{ 
          textAlign: 'center', 
          py: 4,
          color: 'text.secondary'
        }}
      >
        <Typography variant="body1">
          🖼️ Žiadne obrázky na zobrazenie
        </Typography>
      </Box>
    );
  }

  return (
    <Box className={className}>
      {/* Gallery Grid */}
      <Grid container spacing={spacing}>
        {visibleImages.map((image, index) => (
          <Grid 
            item 
            xs={12 / responsiveColumns}
            key={image.id}
          >
            <Paper
              elevation={2}
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                cursor: enableFullscreen ? 'pointer' : 'default',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  elevation: 4,
                  transform: enableFullscreen ? 'scale(1.02)' : 'none'
                }
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  paddingBottom: imageHeight,
                  overflow: 'hidden'
                }}
              >
                <LazyImage
                  src={image.url}
                  lowQualitySrc={image.thumbnailUrl || (
                    image.vehicleId 
                      ? VehicleImageUtils.getVehicleImageUrl(image.vehicleId, 'thumbnail')
                      : undefined
                  )}
                  alt={image.alt || `Obrázok ${index + 1}`}
                  width="100%"
                  height="100%"
                  objectFit="cover"
                  placeholder="skeleton"
                  onClick={() => handleImageClick(image, index)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                />

                {/* Zoom overlay */}
                {enableFullscreen && (
                  <Fade in timeout={200}>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s ease-in-out',
                        '&:hover': {
                          opacity: 1
                        }
                      }}
                    >
                      <ZoomInIcon 
                        sx={{ 
                          color: 'white',
                          fontSize: 32,
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                        }} 
                      />
                    </Box>
                  </Fade>
                )}
              </Box>

              {/* Caption */}
              {showCaptions && image.caption && (
                <Box sx={{ p: 1 }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'text.secondary',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {image.caption}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Load More Button */}
      {visibleCount < images.length && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <button
            onClick={loadMoreImages}
            style={{
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.palette.primary.dark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.palette.primary.main;
            }}
          >
            Načítať ďalšie ({images.length - visibleCount} zostáva)
          </button>
        </Box>
      )}

      {/* Fullscreen Dialog */}
      {enableFullscreen && (
        <Dialog
          open={fullscreenOpen}
          onClose={handleCloseFullscreen}
          maxWidth={false}
          sx={{
            '& .MuiDialog-paper': {
              backgroundColor: 'rgba(0,0,0,0.9)',
              boxShadow: 'none',
              margin: 0,
              maxWidth: '100vw',
              maxHeight: '100vh',
              borderRadius: 0
            }
          }}
        >
          <DialogContent sx={{ p: 0, position: 'relative' }}>
            {/* Close Button */}
            <IconButton
              onClick={handleCloseFullscreen}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 2,
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.7)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <IconButton
                  onClick={handlePreviousImage}
                  sx={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 2,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.7)'
                    }
                  }}
                >
                  <PrevIcon />
                </IconButton>

                <IconButton
                  onClick={handleNextImage}
                  sx={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 2,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.7)'
                    }
                  }}
                >
                  <NextIcon />
                </IconButton>
              </>
            )}

            {/* Fullscreen Image */}
            <Box
              sx={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4
              }}
            >
              {images[currentImageIndex] && (
                <img
                  src={images[currentImageIndex].url}
                  alt={images[currentImageIndex].alt || `Obrázok ${currentImageIndex + 1}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px'
                  }}
                />
              )}
            </Box>

            {/* Image Counter */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                px: 2,
                py: 1,
                borderRadius: 2,
                fontSize: '0.875rem'
              }}
            >
              {currentImageIndex + 1} / {images.length}
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

export default memo(ImageGalleryLazy);