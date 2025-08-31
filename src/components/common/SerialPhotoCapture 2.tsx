import {
  PhotoCamera,
  Delete,
  Save,
  Close,
  Preview,
  VideoCall,
  Compress,
} from '@mui/icons-material';
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
  Grid,
} from '@mui/material';
import React, { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

import type { ProtocolImage, ProtocolVideo } from '../../types';
import {
  compressImage,
  compressMultipleImages,
  CompressionResult,
} from '../../utils/imageCompression';
import {
  compressVideo,
  generateVideoThumbnail,
  VideoCompressionResult,
} from '../../utils/videoCompression';

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
  entityId?: string; // ID pre R2 upload
  autoUploadToR2?: boolean; // Automatický upload na R2
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
  maxVideos = 5,
  compressImages = true,
  compressVideos = true,
  entityId,
  autoUploadToR2 = true,
}: SerialPhotoCaptureProps) {
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewMedia, setPreviewMedia] = useState<CapturedMedia | null>(null);
  const [uploadingToR2, setUploadingToR2] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Funkcia pre upload na R2
  const uploadToR2 = async (
    file: File,
    type: 'image' | 'video'
  ): Promise<string> => {
    if (!entityId || !autoUploadToR2) {
      // Fallback na base64 ak nie je R2 upload
      return new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'protocol');
    formData.append('entityId', entityId);

    const apiBaseUrl =
      import.meta.env.VITE_API_URL ||
      'https://blackrent-app-production-4d6f.up.railway.app/api';

    const response = await fetch(`${apiBaseUrl}/files/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`R2 upload failed: ${response.status}`);
    }

    const result = await response.json();
    return result.url;
  };

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      // Kontrola limitov
      const currentImages = capturedMedia.filter(
        m => m.type === 'image'
      ).length;
      const currentVideos = capturedMedia.filter(
        m => m.type === 'video'
      ).length;

      const newImages = files.filter(f => !f.type.startsWith('video/')).length;
      const newVideos = files.filter(f => f.type.startsWith('video/')).length;

      if (currentImages + newImages > maxImages) {
        alert(
          `Môžete nahrať maximálne ${maxImages} obrázkov. Aktuálne máte ${currentImages} a pokúšate sa pridať ${newImages}.`
        );
        return;
      }

      if (currentVideos + newVideos > maxVideos) {
        alert(
          `Môžete nahrať maximálne ${maxVideos} videí. Aktuálne máte ${currentVideos} a pokúšate sa pridať ${newVideos}.`
        );
        return;
      }

      setProcessing(true);
      setProgress(0);

      try {
        const newMedia: CapturedMedia[] = [];
        let processedCount = 0;

        for (const file of files) {
          const isVideo = file.type.startsWith('video/');
          const mediaType = allowedTypes[0]; // Default type

          // Automatická kompresia ak je povolená
          let processedFile = file;
          let compressed = false;
          const originalSize = file.size;
          let compressedSize = file.size;

          if (isVideo && compressVideos) {
            setProgress((processedCount / files.length) * 50);
            const compressionResult = await compressVideo(file);
            processedFile = compressionResult.compressedFile;
            compressed = true;
            compressedSize = compressionResult.compressedFile.size;
          } else if (!isVideo && compressImages) {
            setProgress((processedCount / files.length) * 50);
            const compressionResult = await compressImage(file);
            processedFile = new File(
              [compressionResult.compressedBlob],
              file.name,
              {
                type: file.type,
                lastModified: Date.now(),
              }
            );
            compressed = true;
            compressedSize = compressionResult.compressedBlob.size;
          }

          // Okamžitý upload na R2 ak je povolený
          let url: string;
          if (autoUploadToR2 && entityId) {
            setUploadingToR2(true);
            setUploadProgress((processedCount / files.length) * 100);
            url = await uploadToR2(processedFile, isVideo ? 'video' : 'image');
            setUploadingToR2(false);
          } else {
            // Fallback na base64
            url = await new Promise<string>(resolve => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(processedFile);
            });
          }

          const media: CapturedMedia = {
            id: uuidv4(),
            file: processedFile,
            type: isVideo ? 'video' : 'image',
            mediaType,
            description: '',
            preview: url,
            timestamp: new Date(),
            compressed,
            originalSize,
            compressedSize,
            compressionRatio:
              originalSize > 0
                ? ((originalSize - compressedSize) / originalSize) * 100
                : 0,
          };

          newMedia.push(media);
          processedCount++;
          setProgress((processedCount / files.length) * 100);
        }

        setCapturedMedia(prev => [...prev, ...newMedia]);
        console.log(
          `✅ Pridané ${newMedia.length} médií s ${autoUploadToR2 ? 'R2 upload' : 'base64'}`
        );
      } catch (error) {
        console.error('❌ Chyba pri spracovaní súborov:', error);
        alert(
          'Chyba pri spracovaní súborov: ' +
            (error instanceof Error ? error.message : 'Neznáma chyba')
        );
      } finally {
        setProcessing(false);
        setProgress(0);
        setUploadingToR2(false);
        setUploadProgress(0);
        // Reset file input
        if (event.target) {
          event.target.value = '';
        }
      }
    },
    [
      capturedMedia,
      maxImages,
      maxVideos,
      allowedTypes,
      compressImages,
      compressVideos,
      autoUploadToR2,
      entityId,
    ]
  );

  const handleMediaTypeChange = (
    id: string,
    type: 'vehicle' | 'damage' | 'document' | 'fuel' | 'odometer'
  ) => {
    setCapturedMedia(prev =>
      prev.map(media =>
        media.id === id ? { ...media, mediaType: type } : media
      )
    );
  };

  const handleDescriptionChange = (id: string, description: string) => {
    setCapturedMedia(prev =>
      prev.map(media => (media.id === id ? { ...media, description } : media))
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

          const compressedFile = new File(
            [result.compressedBlob],
            media.file.name,
            {
              type: result.compressedBlob.type,
            }
          );

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
            maxSizeInMB: 10,
          });

          const compressedFile = result.compressedFile;

          updatedMedia[i] = {
            ...media,
            file: compressedFile,
            compressed: true,
            compressedSize: result.compressedSizeInMB,
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
      // Ak je preview už R2 URL, použij ho priamo
      let url = media.preview;

      // Ak nie je R2 URL, konvertuj na base64
      if (
        !url.startsWith('https://') ||
        (!url.includes('r2.dev') && !url.includes('cloudflare.com'))
      ) {
        url = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(media.file);
        });
      }

      if (media.type === 'image') {
        images.push({
          id: media.id,
          url: url,
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
          url: url,
          type: media.mediaType,
          description: media.description,
          timestamp: media.timestamp,
          compressed: media.compressed,
          originalSize: media.originalSize,
          compressedSize: media.compressedSize,
        });
      }
    }

    console.log(
      `✅ Ukladám ${images.length} obrázkov a ${videos.length} videí`
    );
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

  const totalSize = capturedMedia.reduce(
    (sum, media) => sum + media.file.size,
    0
  );
  const compressedSize = capturedMedia.reduce(
    (sum, media) => sum + (media.compressedSize || media.file.size),
    0
  );
  const compressionRatio =
    totalSize > 0 ? ((totalSize - compressedSize) / totalSize) * 100 : 0;

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" color="text.primary">
            {title}
          </Typography>
          <IconButton onClick={handleClose} color="inherit">
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

          {/* Progress indicators */}
          {(processing || uploadingToR2) && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {uploadingToR2
                  ? 'Uploadujem na R2...'
                  : 'Spracovávam súbory...'}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={uploadingToR2 ? uploadProgress : progress}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block' }}
              >
                {uploadingToR2
                  ? uploadProgress.toFixed(0)
                  : progress.toFixed(0)}
                %
              </Typography>
            </Box>
          )}

          {/* Stats */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              mb: 2,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Limity: {maxImages} fotiek, {maxVideos} videí
            </Typography>
            {capturedMedia.length > 0 && (
              <>
                <Chip
                  label={`${capturedMedia.filter(m => m.type === 'image').length}/${maxImages} fotiek`}
                  size="small"
                  color={
                    capturedMedia.filter(m => m.type === 'image').length >=
                    maxImages
                      ? 'error'
                      : 'default'
                  }
                />
                <Chip
                  label={`${capturedMedia.filter(m => m.type === 'video').length}/${maxVideos} videí`}
                  size="small"
                  color={
                    capturedMedia.filter(m => m.type === 'video').length >=
                    maxVideos
                      ? 'error'
                      : 'default'
                  }
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
              </>
            )}
          </Box>

          {/* Media grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 2,
            }}
          >
            {capturedMedia.map(media => (
              <Card key={media.id}>
                <CardContent>
                  <Box sx={{ position: 'relative', mb: 2 }}>
                    {media.type === 'image' ? (
                      <img
                        src={media.preview}
                        alt={media.description}
                        style={{
                          width: '100%',
                          height: 150,
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: 150,
                          backgroundImage: `url(${media.preview})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <VideoCall
                          sx={{ fontSize: 40, color: 'text.primary' }}
                        />
                      </Box>
                    )}

                    <Box
                      sx={{
                        position: 'absolute',
                        top: 5,
                        right: 5,
                        display: 'flex',
                        gap: 1,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => setPreviewMedia(media)}
                        sx={{
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          color: 'text.primary',
                        }}
                      >
                        <Preview />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteMedia(media.id)}
                        sx={{
                          backgroundColor: 'rgba(255,0,0,0.5)',
                          color: 'text.primary',
                        }}
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
                      onChange={e =>
                        handleMediaTypeChange(media.id, e.target.value as any)
                      }
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
                    onChange={e =>
                      handleDescriptionChange(media.id, e.target.value)
                    }
                    multiline
                    rows={2}
                  />

                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', mt: 1, display: 'block' }}
                  >
                    {media.compressed ? (
                      <>
                        {(media.compressedSize! / 1024 / 1024).toFixed(2)} MB
                        <span style={{ color: 'success.main' }}>
                          ({media.compressionRatio!.toFixed(1)}% komprimované)
                        </span>
                      </>
                    ) : (
                      `${(media.file.size / 1024 / 1024).toFixed(2)} MB`
                    )}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="inherit">
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
      <Dialog
        open={!!previewMedia}
        onClose={() => setPreviewMedia(null)}
        maxWidth="md"
        fullWidth
      >
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

              <Typography variant="body2" color="text.primary" sx={{ mt: 2 }}>
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
