import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Grid,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  Download as DownloadIcon,
  Link as LinkIcon
} from '@mui/icons-material';

interface ImageData {
  id: string;
  url: string;
  type: string;
  description?: string;
  timestamp?: string;
}

interface VideoData {
  id: string;
  url: string;
  type: string;
  description?: string;
  timestamp?: string;
}

interface SimpleImageGalleryProps {
  open: boolean;
  onClose: () => void;
  images: ImageData[];
  videos: VideoData[];
  title?: string;
}

const SimpleImageGallery: React.FC<SimpleImageGalleryProps> = ({
  open,
  onClose,
  images,
  videos,
  title = 'Galéria médií'
}) => {
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const allMedia = [...images, ...videos];
  const totalCount = allMedia.length;

  const handleImageClick = useCallback((image: ImageData) => {
    setSelectedImage(image);
    setSelectedVideo(null);
    setIsFullscreen(true);
  }, []);

  const handleVideoClick = useCallback((video: VideoData) => {
    setSelectedVideo(video);
    setSelectedImage(null);
    setIsFullscreen(true);
  }, []);

  const handleCloseFullscreen = useCallback(() => {
    setIsFullscreen(false);
    setSelectedImage(null);
    setSelectedVideo(null);
  }, []);

  const handleDownload = useCallback(async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Chyba pri sťahovaní:', error);
    }
  }, []);

  const handleOpenLink = useCallback((url: string) => {
    window.open(url, '_blank');
  }, []);

  if (!open) return null;

  return (
    <>
      {/* Hlavná galéria */}
      <Dialog
        open={open && !isFullscreen}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            minHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <Typography variant="h6">
            {title} ({totalCount} položiek)
          </Typography>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2 }}>
          {totalCount === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '200px' 
            }}>
              <Typography variant="h6" color="rgba(255, 255, 255, 0.7)">
                Žiadne médiá na zobrazenie
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {/* Obrázky */}
              {images.map((image, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={image.id || index}>
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        transition: 'transform 0.2s'
                      }
                    }}
                    onClick={() => handleImageClick(image)}
                  >
                    <img
                      src={image.url}
                      alt={image.description || `Obrázok ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                      onError={(e) => {
                        console.error('Chyba načítania obrázka:', image.url);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    
                    {/* Overlay s informáciami */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                        p: 1
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
                          color: 'white'
                        }} 
                      />
                    </Box>

                    {/* Akčné tlačidlá */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        display: 'flex',
                        gap: 0.5
                      }}
                    >
                      <Tooltip title="Stiahnuť">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(image.url, `image-${index + 1}.jpg`);
                          }}
                          sx={{ 
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.9)' }
                          }}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Otvoriť link">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenLink(image.url);
                          }}
                          sx={{ 
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.9)' }
                          }}
                        >
                          <LinkIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Grid>
              ))}

              {/* Videá */}
              {videos.map((video, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={video.id || index}>
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        transition: 'transform 0.2s'
                      }
                    }}
                    onClick={() => handleVideoClick(video)}
                  >
                    <video
                      src={video.url}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                      onError={(e) => {
                        console.error('Chyba načítania videa:', video.url);
                        (e.target as HTMLVideoElement).style.display = 'none';
                      }}
                    />
                    
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
                        justifyContent: 'center'
                      }}
                    >
                      <Typography variant="h6" color="white">▶</Typography>
                    </Box>

                    {/* Overlay s informáciami */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                        p: 1
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
                          color: 'white'
                        }} 
                      />
                    </Box>

                    {/* Akčné tlačidlá */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        display: 'flex',
                        gap: 0.5
                      }}
                    >
                      <Tooltip title="Stiahnuť">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(video.url, `video-${index + 1}.mp4`);
                          }}
                          sx={{ 
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.9)' }
                          }}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Otvoriť link">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenLink(video.url);
                          }}
                          sx={{ 
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.9)' }
                          }}
                        >
                          <LinkIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Fullscreen zobrazenie */}
      <Dialog
        open={isFullscreen}
        onClose={handleCloseFullscreen}
        maxWidth={false}
        fullScreen
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            color: 'white'
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <Typography variant="h6">
            {selectedImage?.description || selectedVideo?.description || 'Médium'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Stiahnuť">
              <IconButton
                onClick={() => {
                  if (selectedImage) {
                    handleDownload(selectedImage.url, `image.jpg`);
                  } else if (selectedVideo) {
                    handleDownload(selectedVideo.url, `video.mp4`);
                  }
                }}
                sx={{ color: 'white' }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Otvoriť link">
              <IconButton
                onClick={() => {
                  if (selectedImage) {
                    handleOpenLink(selectedImage.url);
                  } else if (selectedVideo) {
                    handleOpenLink(selectedVideo.url);
                  }
                }}
                sx={{ color: 'white' }}
              >
                <LinkIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={handleCloseFullscreen} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 'calc(100vh - 80px)',
          p: 2
        }}>
          {selectedImage && (
            <img
              src={selectedImage.url}
              alt={selectedImage.description || 'Obrázok'}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              onError={(e) => {
                console.error('Chyba načítania obrázka:', selectedImage.url);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          {selectedVideo && (
            <video
              src={selectedVideo.url}
              controls
              style={{
                maxWidth: '100%',
                maxHeight: '100%'
              }}
              onError={(e) => {
                console.error('Chyba načítania videa:', selectedVideo.url);
                (e.target as HTMLVideoElement).style.display = 'none';
              }}
            />
          )}
        </Box>
      </Dialog>
    </>
  );
};

export default SimpleImageGallery; 