import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  LinearProgress,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  PhotoCamera,
  Delete,
  Save,
  Close,
  Preview,
  VideoCall,
  Compress,
} from '@mui/icons-material';
import { compressImage, compressMultipleImages, CompressionResult } from '../../utils/imageCompression';
import { compressVideo, generateVideoThumbnail, VideoCompressionResult } from '../../utils/videoCompression';
import { ProtocolImage, ProtocolVideo } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface SerialPhotoCaptureProps {
  open: boolean;
  onClose: () => void;
  onSave: (images: ProtocolImage[], videos: ProtocolVideo[]) => void;
  title: string;
  allowedTypes: ('vehicle' | 'damage' | 'document' | 'fuel' | 'odometer')[];
  maxImages?: number;
  maxVideos?: number;
  compressImages?: boolean;
  compressVideos?: boolean;
}

interface CapturedMedia {
  id: string;
  file: File;
  type: 'image' | 'video';
  mediaType: 'vehicle' | 'damage' | 'document' | 'fuel' | 'odometer';
  description: string;
  preview: string;
  timestamp: Date;
  compressed?: boolean;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
}

export default function SerialPhotoCapture({
  open,
  onClose,
  onSave,
  title,
  allowedTypes,
  maxImages = 50,
  maxVideos = 10,
  compressImages = true,
  compressVideos = true,
}: SerialPhotoCaptureProps) {
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewMedia, setPreviewMedia] = useState<CapturedMedia | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setProcessing(true);
    setProgress(0);

    const newMedia: CapturedMedia[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith('video/');
      
      try {
        let preview: string;
        
        if (isVideo) {
          preview = await generateVideoThumbnail(file);
        } else {
          preview = URL.createObjectURL(file);
        }

        const media: CapturedMedia = {
          id: uuidv4(),
          file,
          type: isVideo ? 'video' : 'image',
          mediaType: allowedTypes[0] || 'vehicle',
          description: '',
          preview,
          timestamp: new Date(),
          compressed: false,
          originalSize: file.size,
        };

        newMedia.push(media);
      } catch (error) {
        console.error('Error processing file:', error);
      }
      
      setProgress(((i + 1) / files.length) * 100);
    }

    setCapturedMedia(prev => [...prev, ...newMedia]);
    setProcessing(false);
    setProgress(0);
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  }, [allowedTypes]);

  const handleMediaTypeChange = (id: string, type: 'vehicle' | 'damage' | 'document' | 'fuel' | 'odometer') => {
    setCapturedMedia(prev => 
      prev.map(media => 
        media.id === id ? { ...media, mediaType: type } : media
      )
    );
  };

  const handleDescriptionChange = (id: string, description: string) => {
    setCapturedMedia(prev => 
      prev.map(media => 
        media.id === id ? { ...media, description } : media
      )
    );
  };

  const handleDeleteMedia = (id: string) => {
    setCapturedMedia(prev => {
      const media = prev.find(m => m.id === id);
      if (media) {
        URL.revokeObjectURL(media.preview);
      }
      return prev.filter(m => m.id !== id);
    });
  };

  const handleCompress = async () => {
    if (!compressImages && !compressVideos) return;

    setProcessing(true);
    setProgress(0);

    const updatedMedia = [...capturedMedia];
    let processedCount = 0;

    for (let i = 0; i < updatedMedia.length; i++) {
      const media = updatedMedia[i];
      
      if (media.compressed) {
        processedCount++;
        setProgress((processedCount / updatedMedia.length) * 100);
        continue;
      }

      try {
        if (media.type === 'image' && compressImages) {
          const result = await compressImage(media.file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
            maxSize: 500,
          });
          
          const compressedFile = new File([result.compressedBlob], media.file.name, {
            type: result.compressedBlob.type,
          });
          
          updatedMedia[i] = {
            ...media,
            file: compressedFile,
            compressed: true,
            compressedSize: result.compressedSize,
            compressionRatio: result.compressionRatio,
          };
        } else if (media.type === 'video' && compressVideos) {
          const result = await compressVideo(media.file, {
            maxWidth: 1280,
            maxHeight: 720,
            quality: 0.7,
            maxSize: 10,
            maxDuration: 30,
          });
          
          const compressedFile = new File([result.compressedBlob], media.file.name, {
            type: result.compressedBlob.type,
          });
          
          updatedMedia[i] = {
            ...media,
            file: compressedFile,
            compressed: true,
            compressedSize: result.compressedSize,
            compressionRatio: result.compressionRatio,
          };
        }
      } catch (error) {
        console.error('Error compressing media:', error);
      }
      
      processedCount++;
      setProgress((processedCount / updatedMedia.length) * 100);
    }

    setCapturedMedia(updatedMedia);
    setProcessing(false);
    setProgress(0);
  };

  const handleSave = async () => {
    const images: ProtocolImage[] = [];
    const videos: ProtocolVideo[] = [];

    for (const media of capturedMedia) {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(media.file);
      });

      if (media.type === 'image') {
        images.push({
          id: media.id,
          url: dataUrl,
          type: media.mediaType,
          description: media.description,
          timestamp: media.timestamp,
          compressed: media.compressed,
          originalSize: media.originalSize,
          compressedSize: media.compressedSize,
        });
      } else {
        videos.push({
          id: media.id,
          url: dataUrl,
          type: media.mediaType,
          description: media.description,
          timestamp: media.timestamp,
          compressed: media.compressed,
          originalSize: media.originalSize,
          compressedSize: media.compressedSize,
        });
      }
    }

    onSave(images, videos);
    handleClose();
  };

  const handleClose = () => {
    // Clean up object URLs
    capturedMedia.forEach(media => {
      URL.revokeObjectURL(media.preview);
    });
    setCapturedMedia([]);
    setPreviewMedia(null);
    onClose();
  };

  const totalSize = capturedMedia.reduce((sum, media) => sum + media.file.size, 0);
  const compressedSize = capturedMedia.reduce((sum, media) => sum + (media.compressedSize || media.file.size), 0);
  const compressionRatio = totalSize > 0 ? ((totalSize - compressedSize) / totalSize) * 100 : 0;

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ color: 'white' }}>
            {title}
          </Typography>
          <IconButton onClick={handleClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<PhotoCamera />}
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
            >
              Pridať fotky
            </Button>
            
            <Button
              variant="contained"
              startIcon={<VideoCall />}
              onClick={() => videoInputRef.current?.click()}
              disabled={processing}
            >
              Pridať video
            </Button>
            
            {(compressImages || compressVideos) && (
              <Button
                variant="outlined"
                startIcon={<Compress />}
                onClick={handleCompress}
                disabled={processing || capturedMedia.length === 0}
              >
                Komprimovať
              </Button>
            )}
          </Box>

          {/* File inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          {/* Processing indicator */}
          {processing && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="body2" sx={{ color: 'white', mt: 1 }}>
                Spracovávam: {Math.round(progress)}%
              </Typography>
            </Box>
          )}

          {/* Stats */}
          {capturedMedia.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={`${capturedMedia.filter(m => m.type === 'image').length} fotiek`} 
                size="small" 
              />
              <Chip 
                label={`${capturedMedia.filter(m => m.type === 'video').length} videí`} 
                size="small" 
              />
              <Chip 
                label={`${(totalSize / 1024 / 1024).toFixed(1)} MB`} 
                size="small" 
              />
              {compressionRatio > 0 && (
                <Chip 
                  label={`${compressionRatio.toFixed(1)}% komprimované`} 
                  size="small" 
                  color="success" 
                />
              )}
            </Box>
          )}

          {/* Media grid */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: 2 
          }}>
            {capturedMedia.map((media) => (
              <Card key={media.id}>
                <CardContent>
                  <Box sx={{ position: 'relative', mb: 2 }}>
                    {media.type === 'image' ? (
                      <img 
                        src={media.preview} 
                        alt={media.description} 
                        style={{ width: '100%', height: 150, objectFit: 'cover' }}
                      />
                    ) : (
                      <Box sx={{ 
                        width: '100%', 
                        height: 150, 
                        backgroundImage: `url(${media.preview})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <VideoCall sx={{ fontSize: 40, color: 'white' }} />
                      </Box>
                    )}
                    
                    <Box sx={{ position: 'absolute', top: 5, right: 5, display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => setPreviewMedia(media)}
                        sx={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}
                      >
                        <Preview />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteMedia(media.id)}
                        sx={{ backgroundColor: 'rgba(255,0,0,0.5)', color: 'white' }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                    
                    {media.compressed && (
                      <Chip 
                        label="Komprimované" 
                        size="small" 
                        color="success" 
                        sx={{ position: 'absolute', bottom: 5, left: 5 }}
                      />
                    )}
                  </Box>
                  
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Typ</InputLabel>
                    <Select
                      value={media.mediaType}
                      label="Typ"
                      onChange={(e) => handleMediaTypeChange(media.id, e.target.value as any)}
                    >
                      {allowedTypes.map(type => (
                        <MenuItem key={type} value={type}>
                          {type === 'vehicle' && 'Vozidlo'}
                          {type === 'damage' && 'Poškodenie'}
                          {type === 'document' && 'Doklady'}
                          {type === 'fuel' && 'Palivo'}
                          {type === 'odometer' && 'Tachometer'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    size="small"
                    label="Popis"
                    value={media.description}
                    onChange={(e) => handleDescriptionChange(media.id, e.target.value)}
                    multiline
                    rows={2}
                  />
                  
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                    {(media.file.size / 1024 / 1024).toFixed(2)} MB
                    {media.compressionRatio && ` (${media.compressionRatio.toFixed(1)}% komprimované)`}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} sx={{ color: 'white' }}>
            Zrušiť
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            startIcon={<Save />}
            disabled={capturedMedia.length === 0 || processing}
          >
            Uložiť ({capturedMedia.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewMedia} onClose={() => setPreviewMedia(null)} maxWidth="md" fullWidth>
        <DialogTitle>Náhľad</DialogTitle>
        <DialogContent>
          {previewMedia && (
            <Box sx={{ textAlign: 'center' }}>
              {previewMedia.type === 'image' ? (
                <img 
                  src={previewMedia.preview} 
                  alt={previewMedia.description} 
                  style={{ maxWidth: '100%', maxHeight: '70vh' }}
                />
              ) : (
                <video 
                  src={previewMedia.preview} 
                  controls 
                  style={{ maxWidth: '100%', maxHeight: '70vh' }}
                />
              )}
              
              <Typography variant="body2" sx={{ color: 'white', mt: 2 }}>
                {previewMedia.description || 'Bez popisu'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewMedia(null)}>Zatvoriť</Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 