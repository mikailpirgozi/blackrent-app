import {
  Close,
  NavigateBefore,
  NavigateNext,
  Download,
  ZoomIn,
  ZoomOut,
  Fullscreen,
  FullscreenExit,
} from '@mui/icons-material';
import {
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Chip,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import React, { useState, useRef, useEffect } from 'react';

import type { ProtocolImage, ProtocolVideo } from '../../types';

interface ImageGalleryModalProps {
  open: boolean;
  onClose: () => void;
  images: ProtocolImage[];
  videos: ProtocolVideo[];
  title?: string;
}

export default function ImageGalleryModal({
  open,
  onClose,
  images,
  videos,
  title = 'Galéria médií',
}: ImageGalleryModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const allMedia = [...images, ...videos];
  const currentMedia = allMedia[currentIndex];

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Touch gestures pre mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < allMedia.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'ArrowLeft':
          if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
          break;
        case 'ArrowRight':
          if (currentIndex < allMedia.length - 1)
            setCurrentIndex(currentIndex + 1);
          break;
        case 'Escape':
          onClose();
          break;
        case 'f':
          setIsFullscreen(!isFullscreen);
          break;
        case '+':
        case '=':
          setZoom(Math.min(zoom + 0.2, 3));
          break;
        case '-':
          setZoom(Math.max(zoom - 0.2, 0.5));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, allMedia.length, onClose, isFullscreen, zoom]);

  // Reset zoom when changing media
  useEffect(() => {
    setZoom(1);
  }, [currentIndex]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < allMedia.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDownload = async () => {
    if (!currentMedia) return;

    try {
      const response = await fetch(currentMedia.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentMedia.type}_${new Date(currentMedia.timestamp).toISOString().split('T')[0]}.${currentMedia.url.includes('video') ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Chyba pri sťahovaní:', error);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const resetZoom = () => {
    setZoom(1);
  };

  if (!currentMedia) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      fullScreen={isFullscreen}
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          color: 'white',
          minHeight: isFullscreen ? '100vh' : '80vh',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography variant="h6" sx={{ color: 'white' }}>
          {title} ({currentIndex + 1} / {allMedia.length})
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label={currentMedia.type}
            size="small"
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
          />
          <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <DialogContent
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: isFullscreen ? 'calc(100vh - 120px)' : '60vh',
          position: 'relative',
          overflow: 'hidden',
        }}
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation arrows */}
        {!isMobile && (
          <>
            <IconButton
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
                '&.Mui-disabled': { opacity: 0.3 },
              }}
            >
              <NavigateBefore />
            </IconButton>

            <IconButton
              onClick={handleNext}
              disabled={currentIndex === allMedia.length - 1}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
                '&.Mui-disabled': { opacity: 0.3 },
              }}
            >
              <NavigateNext />
            </IconButton>
          </>
        )}

        {/* Media content */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            transform: `scale(${zoom})`,
            transition: 'transform 0.2s ease-in-out',
          }}
        >
          {currentMedia.url.includes('video') ? (
            <video
              ref={videoRef}
              src={currentMedia.url}
              controls
              autoPlay
              loop
              muted
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <img
              ref={imageRef}
              src={currentMedia.url}
              alt={`${currentMedia.type} - ${currentMedia.description}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                userSelect: 'none',
              }}
            />
          )}
        </Box>

        {/* Media info */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: 1,
            p: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
            {currentMedia.description ||
              `${currentMedia.type} - ${new Date(currentMedia.timestamp).toLocaleString('sk-SK')}`}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`${currentMedia.type}`}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
              }}
            />
            {currentMedia.compressed && (
              <Chip
                label="Komprimované"
                size="small"
                sx={{ backgroundColor: 'rgba(0, 255, 0, 0.2)', color: 'white' }}
              />
            )}
            {currentMedia.originalSize && currentMedia.compressedSize && (
              <Chip
                label={`${Math.round(((currentMedia.originalSize - currentMedia.compressedSize) / currentMedia.originalSize) * 100)}% úspora`}
                size="small"
                sx={{ backgroundColor: 'rgba(0, 255, 0, 0.2)', color: 'white' }}
              />
            )}
          </Box>
        </Box>
      </DialogContent>

      {/* Controls */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
          p: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ZoomOut />}
          onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))}
          sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
        >
          Zmenšiť
        </Button>

        <Button
          variant="outlined"
          onClick={resetZoom}
          sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
        >
          {Math.round(zoom * 100)}%
        </Button>

        <Button
          variant="outlined"
          startIcon={<ZoomIn />}
          onClick={() => setZoom(Math.min(zoom + 0.2, 3))}
          sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
        >
          Zväčšiť
        </Button>

        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleDownload}
          sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
        >
          Stiahnuť
        </Button>
      </Box>

      {/* Thumbnail navigation */}
      {allMedia.length > 1 && (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            p: 2,
            overflowX: 'auto',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {allMedia.map((media, index) => (
            <Box
              key={media.id}
              onClick={() => setCurrentIndex(index)}
              sx={{
                width: 60,
                height: 60,
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                border:
                  index === currentIndex
                    ? '2px solid white'
                    : '2px solid transparent',
                opacity: index === currentIndex ? 1 : 0.7,
                '&:hover': { opacity: 1 },
                flexShrink: 0,
              }}
            >
              {media.url.includes('video') ? (
                <video
                  src={media.url}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <img
                  src={media.url}
                  alt={`Thumbnail ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
      )}
    </Dialog>
  );
}
