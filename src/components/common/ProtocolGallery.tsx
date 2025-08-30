import {
  Close,
  NavigateBefore,
  NavigateNext,
  Fullscreen,
  FullscreenExit,
  Download,
  PhotoLibrary,
  PlayArrow,
  ZoomIn,
} from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Grid,
  Chip,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import React, { useState, useEffect } from 'react';

import { ProtocolImage, ProtocolVideo } from '../../types';
import { getApiBaseUrl } from '../../utils/apiUrl';
import logger from '../../utils/logger';

interface ProtocolGalleryProps {
  open: boolean;
  onClose: () => void;
  images: ProtocolImage[];
  videos: ProtocolVideo[];
  title?: string;
}

export default function ProtocolGallery({
  open,
  onClose,
  images,
  videos,
  title = 'Galéria protokolu',
}: ProtocolGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Debugovanie - zobraz čo galéria dostáva
  useEffect(() => {
    // 🐛 Debug len v development mode
    logger.debug('🔍 ProtocolGallery received:', {
      open,
      imagesCount: images?.length || 0,
      videosCount: videos?.length || 0,
      title,
      images: images?.slice(0, 3).map(img => ({
        id: img.id,
        type: img.type,
        url: img.url?.substring(0, 50) + '...',
      })),
      videos: videos?.slice(0, 2).map(vid => ({
        id: vid.id,
        type: vid.type,
        url: vid.url?.substring(0, 50) + '...',
      })),
    });

    logger.debug('🔍 ProtocolGallery state:', {
      open,
      isFullscreen,
      dialogShouldOpen: open && !isFullscreen,
    });
  }, [open, images, videos, title, isFullscreen]);

  const allMedia = [...(images || []), ...(videos || [])];
  const totalCount = allMedia.length;
  const currentMedia = allMedia[selectedIndex];

  // Reset zoom when changing media
  useEffect(() => {
    setZoom(1);
  }, [selectedIndex]);

  const handlePrevious = () => {
    setSelectedIndex(prev => (prev === 0 ? totalCount - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex(prev => (prev === totalCount - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!open) return;

    console.log('🎹 ProtocolGallery keyboard event:', event.key, 'open:', open);

    switch (event.key) {
      case 'ArrowLeft':
        handlePrevious();
        break;
      case 'ArrowRight':
        handleNext();
        break;
      case 'Escape':
        console.log('🚪 Manual Escape pressed - closing gallery');
        onClose(); // Direct call, bypass MUI
        break;
      case '+':
      case '=':
        setZoom(prev => Math.min(prev + 0.25, 3));
        break;
      case '-':
        setZoom(prev => Math.max(prev - 0.25, 0.5));
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, handlePrevious, handleNext, setZoom]);

  // Helper function to convert R2 URL to proxy URL
  const getProxyUrl = (r2Url: string | undefined): string => {
    try {
      // Kontrola či URL existuje
      if (!r2Url) {
        console.warn('⚠️ getProxyUrl: URL is undefined or null');
        return ''; // Vráť prázdny string pre undefined URL
      }

      // Ak je to R2 URL, konvertuj na proxy
      if (r2Url.includes('r2.dev') || r2Url.includes('cloudflare.com')) {
        const urlParts = r2Url.split('/');
        // Zober všetky časti po doméne ako key (preskoč https:// a doménu)
        const key = urlParts.slice(3).join('/');
        const apiBaseUrl = getApiBaseUrl();
        const proxyUrl = `${apiBaseUrl}/files/proxy/${encodeURIComponent(key)}`;
        console.log('🔄 Converting R2 URL to proxy:', r2Url, '→', proxyUrl);
        return proxyUrl;
      }
      return r2Url; // Ak nie je R2 URL, vráť pôvodné
    } catch (error) {
      console.error('❌ Error converting to proxy URL:', error);
      return r2Url || ''; // Vráť pôvodné URL alebo prázdny string
    }
  };

  const handleDownload = async () => {
    if (!currentMedia || !currentMedia.url) {
      console.warn('⚠️ handleDownload: currentMedia or URL is missing');
      alert('Nepodarilo sa stiahnuť súbor - chýba URL');
      return;
    }

    try {
      // Použi proxy URL pre download
      const downloadUrl = getProxyUrl(currentMedia.url);
      if (!downloadUrl) {
        alert('Nepodarilo sa stiahnuť súbor - neplatné URL');
        return;
      }

      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `protocol-media-${selectedIndex + 1}.${currentMedia.url.includes('video') ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Chyba pri sťahovaní:', error);
      alert('Nepodarilo sa stiahnuť súbor');
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedIndex(index);
    setIsFullscreen(true);
  };

  if (!open) return null;

  return (
    <>
      {/* Grid Gallery Modal */}
      <Dialog
        open={open && !isFullscreen}
        onClose={(event, reason) => {
          console.log('🚪 Dialog onClose triggered with reason:', reason);
          console.trace('🔍 Dialog close stack trace:');

          // Only allow manual close (via close button), ignore all automatic closes
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            console.log('🛑 Ignoring automatic close reason:', reason);
            return; // Block automatic close
          }

          // Only allow programmatic close
          onClose();
        }}
        maxWidth="lg"
        fullWidth
        disableEscapeKeyDown={true}
        BackdropProps={{
          onClick: e => {
            console.log('🛑 Backdrop click blocked');
            e.stopPropagation();
          },
        }}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            minHeight: '80vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PhotoLibrary />
            <Typography variant="h6">
              {title} ({totalCount} položiek)
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2 }}>
          {totalCount === 0 ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '200px',
              }}
            >
              <Typography variant="h6" color="rgba(255, 255, 255, 0.7)">
                Žiadne médiá na zobrazenie
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {/* Images */}
              {images.map((image, index) => {
                console.log(`🖼️ Rendering image ${index}:`, {
                  id: image.id,
                  url: image.url,
                  type: image.type,
                  hasUrl: !!image.url,
                  urlType: typeof image.url,
                });

                return (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    lg={3}
                    key={image.id || index}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        borderRadius: 2,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '2px solid transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: 'primary.main',
                          transform: 'scale(1.02)',
                        },
                      }}
                      onClick={() => handleImageClick(index)}
                    >
                      {image.url ? (
                        <img
                          src={getProxyUrl(image.url)}
                          alt={image.description || `Obrázok ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '200px',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                          onError={e => {
                            console.error(
                              '❌ Chyba načítania obrázka:',
                              image.url
                            );
                            (e.target as HTMLImageElement).style.display =
                              'none';
                          }}
                          onLoad={() => {
                            console.log(
                              '✅ Obrázok úspešne načítaný:',
                              image.url
                            );
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '200px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px dashed rgba(255, 255, 255, 0.3)',
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="rgba(255, 255, 255, 0.5)"
                          >
                            Chýba URL
                          </Typography>
                        </Box>
                      )}

                      {/* Overlay s informáciami */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background:
                            'linear-gradient(transparent, rgba(0,0,0,0.8))',
                          p: 1,
                        }}
                      >
                        <Typography variant="caption" color="white">
                          {image.description || `Obrázok ${index + 1}`}
                        </Typography>
                        <Chip
                          label={image.type}
                          size="small"
                          sx={{
                            ml: 1,
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                          }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                );
              })}

              {/* Videos */}
              {videos.map((video, index) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  lg={3}
                  key={video.id || `video-${index}`}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '2px solid transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        transform: 'scale(1.02)',
                      },
                    }}
                    onClick={() => handleImageClick(images.length + index)}
                  >
                    {video.url ? (
                      <video
                        src={getProxyUrl(video.url)}
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                        onError={e => {
                          console.error('Chyba načítania videa:', video.url);
                          (e.target as HTMLVideoElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: '200px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px dashed rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="rgba(255, 255, 255, 0.5)"
                        >
                          Chýba URL
                        </Typography>
                      </Box>
                    )}

                    {/* Play ikona */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        borderRadius: '50%',
                        width: 48,
                        height: 48,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PlayArrow sx={{ color: 'white', fontSize: 24 }} />
                    </Box>

                    {/* Overlay s informáciami */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background:
                          'linear-gradient(transparent, rgba(0,0,0,0.8))',
                        p: 1,
                      }}
                    >
                      <Typography variant="caption" color="white">
                        {video.description || `Video ${index + 1}`}
                      </Typography>
                      <Chip
                        label={video.type}
                        size="small"
                        sx={{
                          ml: 1,
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Fullscreen Lightbox Modal */}
      <Dialog
        open={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        maxWidth={false}
        fullScreen
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
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
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <Typography variant="h6">
            {currentMedia?.description || `Médium ${selectedIndex + 1}`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.5))}
              sx={{ color: 'white' }}
              disabled={zoom <= 0.5}
            >
              <ZoomIn sx={{ transform: 'scaleX(-1)' }} />
            </IconButton>
            <IconButton
              onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
              sx={{ color: 'white' }}
              disabled={zoom >= 3}
            >
              <ZoomIn />
            </IconButton>
            <IconButton onClick={handleDownload} sx={{ color: 'white' }}>
              <Download />
            </IconButton>
            <IconButton
              onClick={() => setIsFullscreen(false)}
              sx={{ color: 'white' }}
            >
              <Close />
            </IconButton>
          </Box>
        </Box>

        {/* Media Display */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 'calc(100vh - 120px)',
            p: 2,
            position: 'relative',
          }}
        >
          {/* Navigation Buttons */}
          {totalCount > 1 && (
            <>
              <IconButton
                onClick={handlePrevious}
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                }}
              >
                <NavigateBefore />
              </IconButton>
              <IconButton
                onClick={handleNext}
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                }}
              >
                <NavigateNext />
              </IconButton>
            </>
          )}

          {/* Media Content */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            {currentMedia && (
              <>
                {selectedIndex < images.length ? (
                  // Image
                  currentMedia.url ? (
                    <img
                      src={getProxyUrl(currentMedia.url)}
                      alt={currentMedia.description || 'Obrázok'}
                      style={{
                        maxWidth: `${100 * zoom}%`,
                        maxHeight: `${100 * zoom}%`,
                        objectFit: 'contain',
                        transition: 'transform 0.2s ease',
                      }}
                      onError={e => {
                        console.error(
                          'Chyba načítania obrázka:',
                          currentMedia.url
                        );
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        textAlign: 'center',
                        color: 'rgba(255, 255, 255, 0.5)',
                      }}
                    >
                      <Typography variant="h6">Chýba URL obrázka</Typography>
                    </Box>
                  )
                ) : // Video
                currentMedia.url ? (
                  <video
                    src={getProxyUrl(currentMedia.url)}
                    controls
                    style={{
                      maxWidth: `${100 * zoom}%`,
                      maxHeight: `${100 * zoom}%`,
                    }}
                    onError={e => {
                      console.error('Chyba načítania videa:', currentMedia.url);
                      (e.target as HTMLVideoElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      textAlign: 'center',
                      color: 'rgba(255, 255, 255, 0.5)',
                    }}
                  >
                    <Typography variant="h6">Chýba URL videa</Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>

        {/* Footer with counter */}
        {totalCount > 1 && (
          <Box
            sx={{
              p: 2,
              textAlign: 'center',
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
              {selectedIndex + 1} z {totalCount}
            </Typography>
          </Box>
        )}
      </Dialog>
    </>
  );
}
