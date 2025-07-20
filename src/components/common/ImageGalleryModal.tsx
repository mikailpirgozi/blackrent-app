import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Grid,
  Chip,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Download as DownloadIcon,
  PhotoLibrary as GalleryIcon,
} from '@mui/icons-material';

interface ProtocolImage {
  id: string;
  url: string;
  filename: string;
  size?: number;
  uploadedAt?: Date;
  type?: 'vehicle' | 'document' | 'damage' | 'odometer' | 'fuel';
}

interface ImageGalleryModalProps {
  open: boolean;
  onClose: () => void;
  images: ProtocolImage[];
  title?: string;
}

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({
  open,
  onClose,
  images,
  title = 'Galerie obrázkov'
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrev();
    }
  };

  const handlePrev = useCallback(() => {
    setSelectedImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  }, [images.length]);

  const handleNext = useCallback(() => {
    setSelectedImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  }, [images.length]);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsFullscreen(true);
  };

  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
  };

  const handleDownload = async (image: ProtocolImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Chyba pri sťahovaní obrázka:', error);
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        handlePrev();
        break;
      case 'ArrowRight':
        handleNext();
        break;
      case 'Escape':
        if (isFullscreen) {
          handleCloseFullscreen();
        } else {
          onClose();
        }
        break;
    }
  }, [open, isFullscreen, handlePrev, handleNext, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!open) {
      setSelectedImageIndex(0);
      setIsFullscreen(false);
    }
  }, [open]);

  if (!open || images.length === 0) return null;

  const selectedImage = images[selectedImageIndex];

  // Fullscreen view
  if (isFullscreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <Typography variant="h6">
            {selectedImage.filename}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={() => handleDownload(selectedImage)}
              sx={{ color: 'white' }}
            >
              <DownloadIcon />
            </IconButton>
            <IconButton
              onClick={handleCloseFullscreen}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Image */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
          }}
        >
          <img
            src={selectedImage.url}
            alt={selectedImage.filename}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              userSelect: 'none',
            }}
          />
        </Box>

        {/* Navigation */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <IconButton
            onClick={handlePrev}
            sx={{ color: 'white' }}
            size="large"
          >
            <PrevIcon />
          </IconButton>
          
          <Typography variant="body2" sx={{ color: 'white' }}>
            {selectedImageIndex + 1} / {images.length}
          </Typography>
          
          <IconButton
            onClick={handleNext}
            sx={{ color: 'white' }}
            size="large"
          >
            <NextIcon />
          </IconButton>
        </Box>
      </Box>
    );
  }

  // Gallery view
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          height: isMobile ? '100%' : '80vh',
          maxHeight: isMobile ? '100%' : '80vh',
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GalleryIcon />
          {title} ({images.length})
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
          <Grid container spacing={2}>
            {images.map((image, index) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={image.id}>
                <Box
                  sx={{
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: 2,
                    borderColor: selectedImageIndex === index ? 'primary.main' : 'transparent',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  }}
                  onClick={() => handleImageClick(index)}
                >
                  <img
                    src={image.url}
                    alt={image.filename}
                    style={{
                      width: '100%',
                      height: '150px',
                      objectFit: 'cover',
                    }}
                  />
                  
                  {/* Image info overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                      p: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'white',
                        fontSize: '0.7rem',
                        display: 'block',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {image.filename}
                    </Typography>
                    
                    {image.type && (
                      <Chip
                        label={image.type}
                        size="small"
                        sx={{
                          height: '16px',
                          fontSize: '0.6rem',
                          mt: 0.5,
                        }}
                      />
                    )}
                  </Box>

                  {/* Download button */}
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(image);
                    }}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.7)',
                      },
                    }}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ImageGalleryModal; 