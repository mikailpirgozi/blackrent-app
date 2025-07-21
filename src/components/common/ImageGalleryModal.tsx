import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Chip,
  Grid,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close,
  NavigateBefore,
  NavigateNext,
  Fullscreen,
  FullscreenExit,
  ZoomIn,
  ZoomOut,
  RotateLeft,
  RotateRight,
  Download,
  PhotoLibrary,
} from '@mui/icons-material';
import { ProtocolImage, ProtocolVideo } from '../../types';

interface ImageGalleryModalProps {
  open: boolean;
  onClose: () => void;
  protocolId: string;
  protocolType: 'handover' | 'return';
  // ✅ PRIDANÉ: Priame médiá z protokolu
  directMedia?: {
    images: ProtocolImage[];
    videos: ProtocolVideo[];
  };
}

export default function ImageGalleryModal({
  open,
  onClose,
  protocolId,
  protocolType,
  directMedia
}: ImageGalleryModalProps) {
  console.log('🖼️ ImageGalleryModal initialized:', { 
    open, 
    protocolId, 
    protocolType, 
    directMedia: directMedia ? {
      imagesCount: directMedia.images.length,
      videosCount: directMedia.videos.length
    } : null
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // ✅ Pridané stavy pre error handling
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});
  
  // ✅ Pridané stavy pre načítanie z API (fallback)
  const [apiMedia, setApiMedia] = useState<{
    images: ProtocolImage[];
    videos: ProtocolVideo[];
  }>({ images: [], videos: [] });
  const [loadingFromApi, setLoadingFromApi] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ✅ Funkcia na konverziu R2 URL na backend proxy URL
  const convertToProxyUrl = (url: string): string => {
    if (url.includes('r2.dev') || url.includes('cloudflare.com')) {
      // Extrahuj file key z R2 URL
      const r2Url = url.replace('https://', '');
      const parts = r2Url.split('/');
      const domainIndex = parts.findIndex(part => part.includes('r2.dev') || part.includes('cloudflare.com'));
      
      if (domainIndex !== -1 && domainIndex + 1 < parts.length) {
        const fileKey = parts.slice(domainIndex + 1).join('/');
        const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://blackrent-app-production-4d6f.up.railway.app/api';
        return `${apiBaseUrl}/files/proxy/${encodeURIComponent(fileKey)}`;
      }
    }
    return url;
  };

  // ✅ Error handling pre obrázky
  const handleImageError = (url: string) => {
    console.error('Image load error:', url);
    setImageErrors(prev => new Set(prev).add(url));
    
    // Skús opraviť URL
    const fixedUrl = convertToProxyUrl(url);
    if (fixedUrl !== url) {
      const retries = retryCount[url] || 0;
      if (retries < 2) {
        setRetryCount(prev => ({ ...prev, [url]: retries + 1 }));
        // Retry s opraveným URL
        setTimeout(() => {
          setImageErrors(prev => {
            const newSet = new Set(prev);
            newSet.delete(url);
            return newSet;
          });
        }, 1000);
      }
    }
  };

  // ✅ Funkcia na získanie URL pre obrázok
  const getImageUrl = (media: ProtocolImage | ProtocolVideo): string => {
    const url = media.url;
    const proxyUrl = convertToProxyUrl(url);
    console.log('🖼️ Image URL conversion:', { original: url, proxy: proxyUrl });
    if (imageErrors.has(url)) {
      return proxyUrl;
    }
    return proxyUrl;
  };

  // ✅ Načítanie médií z API (fallback)
  const loadMediaFromApi = async () => {
    if (directMedia && (directMedia.images.length > 0 || directMedia.videos.length > 0)) {
      console.log('📸 Using direct media from protocol');
      return;
    }

    console.log('📸 Trying to load media from API...');
    setLoadingFromApi(true);
    setApiError(null);

    try {
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://blackrent-app-production-4d6f.up.railway.app/api';
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');

      const response = await fetch(`${apiBaseUrl}/protocols/media/${protocolId}?type=${protocolType}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('📥 API media loaded:', result);

      if (result.success) {
        setApiMedia({
          images: result.images || [],
          videos: result.videos || []
        });
      } else {
        setApiError(result.error || 'Failed to load media');
      }
    } catch (error) {
      console.error('❌ Error loading media from API:', error);
      setApiError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoadingFromApi(false);
    }
  };

  // ✅ Získanie všetkých médií (priorita: directMedia > apiMedia)
  const getAllMedia = () => {
    if (directMedia && (directMedia.images.length > 0 || directMedia.videos.length > 0)) {
      const result = {
        images: directMedia.images,
        videos: directMedia.videos
      };
      console.log('🖼️ getAllMedia using directMedia:', result);
      return result;
    }
    console.log('🖼️ getAllMedia using apiMedia:', apiMedia);
    return apiMedia;
  };

  const allMedia = getAllMedia();
  const currentMedia = allMedia.images[currentIndex] || allMedia.videos[currentIndex - allMedia.images.length];
  
  console.log('🖼️ Gallery state:', { 
    open,
    currentIndex, 
    totalImages: allMedia.images.length, 
    totalVideos: allMedia.videos.length,
    currentMedia: currentMedia ? {
      id: currentMedia.id,
      url: currentMedia.url,
      type: currentMedia.type
    } : null,
    directMedia: directMedia ? {
      imagesCount: directMedia.images.length,
      videosCount: directMedia.videos.length
    } : null
  });

  useEffect(() => {
    // ✅ Načítaj z API len ak nemáš directMedia
    if (open && (!directMedia || (directMedia.images.length === 0 && directMedia.videos.length === 0))) {
      console.log('🖼️ Loading media from API (no directMedia)');
      loadMediaFromApi();
    } else if (open && directMedia) {
      console.log('📸 Using directMedia, skipping API load');
    }
  }, [open, protocolId, protocolType, directMedia]);

  useEffect(() => {
    // ✅ Načítaj z API len ak nemáš žiadne médiá
    if (open && allMedia.images.length + allMedia.videos.length === 0 && 
        (!directMedia || (directMedia.images.length === 0 && directMedia.videos.length === 0))) {
      console.log('🖼️ Loading media from API (no media available)');
      loadMediaFromApi();
    }
  }, [open, allMedia.images.length, allMedia.videos.length, directMedia]);

  const handlePrevious = () => {
    setCurrentIndex(prev => 
      prev === 0 ? allMedia.images.length + allMedia.videos.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex(prev => 
      prev === allMedia.images.length + allMedia.videos.length - 1 ? 0 : prev + 1
    );
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!open) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        handlePrevious();
        break;
      case 'ArrowRight':
        handleNext();
        break;
      case 'Escape':
        onClose();
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
  }, [open]);

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

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleDownload = () => {
    if (!currentMedia) return;
    
    const link = document.createElement('a');
    link.href = getImageUrl(currentMedia);
         link.download = `protocol-media-${currentIndex + 1}.${'url' in currentMedia && currentMedia.url.includes('video') ? 'mp4' : 'jpg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalMedia = allMedia.images.length + allMedia.videos.length;

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={false}
      fullScreen={isFullscreen}
      PaperProps={{
        sx: {
          width: isFullscreen ? '100vw' : '90vw',
          height: isFullscreen ? '100vh' : '90vh',
          maxWidth: 'none',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PhotoLibrary />
          <Typography variant="h6">
            Galéria protokolu ({totalMedia} médií)
          </Typography>
          {loadingFromApi && (
            <Chip label="Načítavam..." size="small" color="primary" />
          )}
          {apiError && (
            <Chip label="Chyba načítania" size="small" color="error" />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={() => setIsFullscreen(!isFullscreen)} color="inherit">
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
          <IconButton onClick={onClose} color="inherit">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ 
        p: 0, 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white'
      }}>
        {totalMedia === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            gap: 2
          }}>
            <PhotoLibrary sx={{ fontSize: 64, opacity: 0.5 }} />
            <Typography variant="h6" color="text.secondary">
              {loadingFromApi ? 'Načítavam médiá...' : 'Žiadne médiá neboli nájdené'}
            </Typography>
            {apiError && (
              <Typography variant="body2" color="error">
                {apiError}
              </Typography>
            )}
            <Button 
              variant="outlined" 
              onClick={loadMediaFromApi}
              disabled={loadingFromApi}
            >
              Skúsiť znovu
            </Button>
          </Box>
        ) : (
          <>
            {/* Main media display */}
            <Box 
              ref={containerRef}
              sx={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Navigation buttons */}
              <IconButton
                onClick={handlePrevious}
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
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
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
                }}
              >
                <NavigateNext />
              </IconButton>

              {/* Media content */}
              {currentMedia && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                  transform: `scale(${zoom})`,
                  transition: 'transform 0.3s ease'
                }}>
                  {'url' in currentMedia && currentMedia.url.includes('video') ? (
                    <video
                      ref={videoRef}
                      src={getImageUrl(currentMedia)}
                      controls
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  ) : (
                    <img
                      ref={imageRef}
                      src={getImageUrl(currentMedia)}
                      alt={`${currentMedia.type} - ${currentMedia.description}`}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        userSelect: 'none',
                      }}
                      onError={() => {
                        console.log('🖼️ Image load error:', currentMedia.url);
                        handleImageError(currentMedia.url);
                      }}
                      onLoad={() => {
                        console.log('🖼️ Image loaded successfully:', currentMedia.url);
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>

            {/* Controls */}
            <Box sx={{ 
              p: 2, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.5))} color="inherit">
                  <ZoomOut />
                </IconButton>
                <Typography variant="body2">
                  {Math.round(zoom * 100)}%
                </Typography>
                <IconButton onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))} color="inherit">
                  <ZoomIn />
                </IconButton>
                <IconButton onClick={() => setZoom(1)} color="inherit">
                  Reset
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">
                  {currentIndex + 1} z {totalMedia}
                </Typography>
                <IconButton onClick={handleDownload} color="inherit">
                  <Download />
                </IconButton>
              </Box>
            </Box>

            {/* Thumbnails */}
            <Box sx={{ 
              p: 2, 
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              maxHeight: 120,
              overflow: 'auto'
            }}>
              <Grid container spacing={1}>
                {allMedia.images.map((media, index) => (
                  <Grid item key={media.id}>
                    <Box
                      sx={{
                        width: 80,
                        height: 60,
                        border: currentIndex === index ? '2px solid #1976d2' : '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 1,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        '&:hover': { borderColor: '#1976d2' }
                      }}
                      onClick={() => setCurrentIndex(index)}
                    >
                      <img
                        src={getImageUrl(media)}
                        alt={`Thumbnail ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        onError={() => handleImageError(media.url)}
                      />
                    </Box>
                  </Grid>
                ))}
                {allMedia.videos.map((media, index) => (
                  <Grid item key={media.id}>
                    <Box
                      sx={{
                        width: 80,
                        height: 60,
                        border: currentIndex === allMedia.images.length + index ? '2px solid #1976d2' : '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 1,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        '&:hover': { borderColor: '#1976d2' }
                      }}
                      onClick={() => setCurrentIndex(allMedia.images.length + index)}
                    >
                      <Box sx={{ 
                        width: '100%', 
                        height: '100%', 
                        backgroundImage: `url(${getImageUrl(media)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Typography variant="caption" sx={{ color: 'white', textShadow: '1px 1px 2px black' }}>
                          VIDEO
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 