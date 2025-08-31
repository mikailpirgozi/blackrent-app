import {
  Close,
  Delete,
  PhotoCamera,
  Preview,
  Save,
  VideoCall,
} from '@mui/icons-material';
import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import Alert from '@mui/material/Alert';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import type { ProtocolImage, ProtocolVideo } from '../../types';
import { getApiBaseUrl } from '../../utils/apiUrl';
import { isWebPSupported } from '../../utils/imageCompression';
import { lintImage } from '../../utils/imageLint';

// import { Grid } from '@mui/material';

import { logger } from '../../utils/logger';
import { compressVideo } from '../../utils/videoCompression';
import { DefaultCard, PrimaryButton, SecondaryButton } from '../ui';

import NativeCamera from './NativeCamera';

interface SerialPhotoCaptureProps {
  open: boolean;
  onClose: () => void;
  onSave: (images: ProtocolImage[], videos: ProtocolVideo[]) => void;
  title: string;
  allowedTypes: ('vehicle' | 'damage' | 'document' | 'fuel' | 'odometer')[];
  maxImages?: number;
  maxVideos?: number;

  compressVideos?: boolean;
  entityId?: string;
  autoUploadToR2?: boolean;
  // ✅ NOVÉ PROPS pre nový systém
  protocolType?: 'handover' | 'return';
  mediaType?: 'vehicle' | 'document' | 'damage' | 'fuel' | 'odometer';
  category?:
    | 'vehicle_photos'
    | 'documents'
    | 'damages'
    | 'signatures'
    | 'pdf'
    | 'videos'
    | 'other';
  // 🎯 NOVÉ: Možnosť výberu kvality
  qualityPreset?: 'mobile' | 'protocol' | 'highQuality' | 'archive';
  // 🌟 NOVÉ: WebP podpora
  preferWebP?: boolean;
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

  compressVideos = true,
  entityId,
  autoUploadToR2 = true,
  protocolType = 'handover',
  mediaType = 'vehicle',
  category: _category,
  qualityPreset = 'protocol',
  preferWebP = true,
}: SerialPhotoCaptureProps) {
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewMedia, setPreviewMedia] = useState<CapturedMedia | null>(null);
  const [uploadingToR2, setUploadingToR2] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [nativeCameraOpen, setNativeCameraOpen] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<
    'mobile' | 'protocol' | 'highQuality' | 'archive'
  >(qualityPreset);
  const [webPEnabled, setWebPEnabled] = useState(preferWebP);
  const [webPSupported, setWebPSupported] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // 🔍 Detekcia WebP podpory pri načítaní
  useEffect(() => {
    isWebPSupported().then(setWebPSupported);
  }, []);

  // ⚡ NOVÉ: Keyboard shortcuts pre rýchle fotenie
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!open) return;

      // Cmd/Ctrl + K = Kvalitné fotky (natívna galéria)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        fileInputRef.current?.click();
      }

      // Cmd/Ctrl + R = Rýchle fotky (prehliadač)
      if ((event.metaKey || event.ctrlKey) && event.key === 'r') {
        event.preventDefault();
        setNativeCameraOpen(true);
      }

      // Space = Rýchle fotky (najčastejšie)
      if (event.code === 'Space' && !nativeCameraOpen) {
        event.preventDefault();
        setNativeCameraOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [open, nativeCameraOpen]);

  // Funkcia pre upload na R2
  // ✅ NOVÁ FUNKCIA: Direct upload (fallback)
  const directUpload = useCallback(
    async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('protocolId', entityId!);
      formData.append('protocolType', protocolType);
      formData.append('mediaType', mediaType);
      formData.append('label', file.name);

      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/files/protocol-photo`, {
        method: 'POST',
        headers: {
          ...(localStorage.getItem('blackrent_token') && {
            Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
          }),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result.url;
    },
    [entityId, protocolType, mediaType]
  );

  const uploadToR2 = useCallback(
    async (file: File): Promise<string> => {
      // Fallback na base64 ak R2 nie je povolené
      if (!autoUploadToR2) {
        return new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      // Kontrola entityId
      if (!entityId) {
        throw new Error('EntityId is required for R2 upload');
      }

      // ✅ NOVÝ SYSTÉM: Signed URL upload
      try {
        const apiBaseUrl = getApiBaseUrl();

        // 🚀 NOVÝ SYSTÉM: Signed URL upload
        logger.debug('🔄 Getting presigned URL for:', {
          protocolId: entityId,
          filename: file.name,
          size: file.size,
          contentType: file.type,
        });

        // 1. Získanie presigned URL (použiť starší endpoint bez autentifikácie)
        const presignedResponse = await fetch(
          `${apiBaseUrl}/files/presigned-url`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'protocol',
              entityId: entityId,
              filename: file.name,
              contentType: file.type,
            }),
          }
        );

        if (!presignedResponse.ok) {
          throw new Error(
            `Failed to get presigned URL: ${presignedResponse.status}`
          );
        }

        const presignedData = await presignedResponse.json();
        logger.debug('✅ Presigned URL received:', presignedData);

        // 2. Upload priamo do R2 cez presigned URL
        const uploadResponse = await fetch(presignedData.presignedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload to R2: ${uploadResponse.status}`);
        }

        logger.debug('✅ File uploaded directly to R2');

        // 3. Uloženie metadát do databázy (voliteľné - pre V1 nie je potrebné)
        // V1 protokoly ukladajú fotky priamo v JSON, takže metadata endpoint nie je potrebný
        logger.debug(
          '✅ Photo uploaded to R2, metadata will be saved with protocol'
        );

        return presignedData.publicUrl;
      } catch (error) {
        console.error('❌ Signed URL upload failed:', error);

        // Fallback na direct upload ak signed URL zlyhá
        logger.debug('🔄 Falling back to direct upload...');
        return await directUpload(file);
      }
    },
    [autoUploadToR2, directUpload, entityId]
  );

  // Cloudflare Worker upload (nepoužíva sa)
  // const workerUpload = async (file: File): Promise<string> => { /* intentionally disabled */ throw new Error('unused'); };

  // directUpload definované vyššie

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

          // Spracovanie súborov s validáciou a optimalizáciou
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
          } else if (!isVideo) {
            setProgress((processedCount / files.length) * 50);

            try {
              // 🚀 NOVÉ: Použitie imageLint pre validáciu a optimalizáciu
              processedFile = await lintImage(file);
              compressed = true;
              compressedSize = processedFile.size;

              logger.debug('✅ Image linted successfully:', {
                originalName: file.name,
                originalSize: originalSize,
                originalType: file.type,
                processedName: processedFile.name,
                processedSize: compressedSize,
                processedType: processedFile.type,
                compressionRatio:
                  (
                    ((originalSize - compressedSize) / originalSize) *
                    100
                  ).toFixed(1) + '%',
              });
            } catch (error) {
              // Ak imageLint zlyhá, ukáž chybu používateľovi
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : 'Neznáma chyba pri spracovaní obrázka';
              alert(errorMessage);
              continue; // Preskočiť tento súbor a pokračovať s ďalšími
            }
          }

          // Okamžitý upload na R2 ak je povolený
          logger.debug('🔍 R2 UPLOAD CHECK:', {
            autoUploadToR2,
            entityId,
            hasEntityId: !!entityId,
            willUseR2: autoUploadToR2 && entityId,
            filename: processedFile.name,
          });

          let url: string;
          if (autoUploadToR2 && entityId) {
            logger.debug('✅ STARTING R2 UPLOAD:', processedFile.name);
            setUploadingToR2(true);
            setUploadProgress((processedCount / files.length) * 100);
            try {
              url = await uploadToR2(processedFile);
              logger.debug('✅ R2 UPLOAD SUCCESS:', url);
            } catch (error) {
              console.error(
                '❌ R2 UPLOAD FAILED, falling back to base64:',
                error
              );
              url = await new Promise<string>(resolve => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(processedFile);
              });
            }
            setUploadingToR2(false);
          } else {
            logger.debug('⚠️ USING BASE64 FALLBACK - R2 conditions not met');
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
        logger.debug(
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
      compressVideos,
      autoUploadToR2,
      entityId,
      uploadToR2,
    ]
  );

  // Handler pre natívnu kameru
  const handleNativeCapture = useCallback(
    async (imageBlob: Blob) => {
      // Konvertuj Blob na File
      const file = new File([imageBlob], `photo_${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });

      // Vytvor dočasný preview URL
      let preview = URL.createObjectURL(imageBlob);

      logger.debug('📸 Native camera capture - R2 upload check:', {
        autoUploadToR2,
        entityId,
        hasEntityId: !!entityId,
        willUploadToR2: autoUploadToR2 && entityId,
        filename: file.name,
        size: file.size,
      });

      // Okamžitý upload na R2 ak je povolený
      if (autoUploadToR2 && entityId) {
        logger.debug('🚀 NATIVE CAMERA: Starting R2 upload for:', file.name);
        setUploadingToR2(true);

        try {
          const r2Url = await uploadToR2(file);
          logger.debug('✅ NATIVE CAMERA: R2 upload success:', r2Url);

          // Zruš dočasný blob URL a použij R2 URL
          URL.revokeObjectURL(preview);
          preview = r2Url;
        } catch (error) {
          console.error(
            '❌ NATIVE CAMERA: R2 upload failed, using blob URL:',
            error
          );
          // Ponechaj blob URL ako fallback
        }

        setUploadingToR2(false);
      } else {
        logger.debug(
          '⚠️ NATIVE CAMERA: Using blob URL (R2 conditions not met)'
        );
      }

      // Vytvor media objekt
      const media: CapturedMedia = {
        id: uuidv4(),
        file: file,
        type: 'image',
        mediaType: allowedTypes[0], // Default type
        description: '',
        preview: preview, // Buď R2 URL alebo blob URL
        timestamp: new Date(),
        compressed: false,
        originalSize: imageBlob.size,
        compressedSize: imageBlob.size,
        compressionRatio: 0,
      };

      // Pridaj do capturedMedia
      setCapturedMedia(prev => [...prev, media]);
      logger.debug('✅ Fotka z natívnej kamery pridaná', media);
    },
    [allowedTypes, autoUploadToR2, entityId, uploadToR2]
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

  const handleSave = async () => {
    const images: ProtocolImage[] = [];
    const videos: ProtocolVideo[] = [];

    for (const media of capturedMedia) {
      // ✅ PRIAMO R2 URL - žiadne base64 konverzie
      let url = media.preview;

      // Ak je to už R2 URL, použij ho priamo
      if (
        url.startsWith('https://') &&
        (url.includes('r2.dev') || url.includes('cloudflare.com'))
      ) {
        logger.debug('✅ Using existing R2 URL:', url);
      } else {
        // 🎯 KOMPRESOVAŤ obrázky pre PDF (max 800x600, qualita 0.7)
        logger.debug(
          '⚠️ Converting to base64 for PDF - compressing:',
          media.file.name
        );

        let processedFile = media.file;

        // Ak je obrázok veľký, kompresuj ho
        if (media.type === 'image' && media.file.size > 100000) {
          // > 100KB
          logger.debug(
            `🗜️ Komprimujem veľký obrázok: ${(media.file.size / 1024).toFixed(1)}KB`
          );

          try {
            // Vytvoriť canvas pre resize
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            processedFile = await new Promise<File>((resolve, reject) => {
              img.onload = () => {
                // Resize na max 800x600 pre PDF
                const maxWidth = 800;
                const maxHeight = 600;

                let { width, height } = img;

                if (width > maxWidth || height > maxHeight) {
                  const ratio = Math.min(maxWidth / width, maxHeight / height);
                  width *= ratio;
                  height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw resized image
                ctx?.drawImage(img, 0, 0, width, height);

                // Convert to blob with compression
                canvas.toBlob(
                  blob => {
                    if (blob) {
                      const compressedFile = new File([blob], media.file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                      });
                      logger.debug(
                        `✅ Komprimované: ${(blob.size / 1024).toFixed(1)}KB`
                      );
                      resolve(compressedFile);
                    } else {
                      reject(new Error('Canvas toBlob failed'));
                    }
                  },
                  'image/jpeg',
                  0.7
                ); // 70% kvalita
              };
              img.onerror = reject;
              img.src = URL.createObjectURL(media.file);
            });
          } catch (compressionError) {
            console.error(
              '⚠️ Compression failed, using original:',
              compressionError
            );
          }
        }

        // Convert to base64
        url = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(processedFile);
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

    logger.debug(
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
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              mb: 3,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <PrimaryButton
              startIcon={<PhotoCamera />}
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
              sx={{
                fontSize: '1.1rem',
                py: 1.5,
                px: 3,
                '&:hover': {
                  transform: 'scale(1.02)',
                  transition: 'transform 0.1s',
                },
              }}
            >
              📸 Kvalitné fotky
            </PrimaryButton>

            <PrimaryButton
              startIcon={<VideoCall />}
              onClick={() => videoInputRef.current?.click()}
              disabled={processing}
            >
              Pridať video
            </PrimaryButton>

            <SecondaryButton
              startIcon={<PhotoCamera />}
              onClick={() => setNativeCameraOpen(true)}
              disabled={processing}
              sx={{
                borderColor: 'orange.main',
                color: 'orange.main',
                '&:hover': {
                  borderColor: 'orange.dark',
                  backgroundColor: 'orange.50',
                },
              }}
            >
              ⚡ Rýchle fotky
            </SecondaryButton>

            {/* 🎯 NOVÉ: Výber kvality */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Kvalita</InputLabel>
              <Select
                value={selectedQuality}
                onChange={e =>
                  setSelectedQuality(e.target.value as typeof selectedQuality)
                }
                label="Kvalita"
              >
                <MenuItem value="mobile">
                  📱 Mobilná ({webPEnabled ? '500KB' : '800KB'})
                </MenuItem>
                <MenuItem value="protocol">
                  🏢 Protokol ({webPEnabled ? '1MB' : '1.5MB'})
                </MenuItem>
                <MenuItem value="highQuality">
                  🔍 Vysoká ({webPEnabled ? '2MB' : '3MB'})
                </MenuItem>
                <MenuItem value="archive">
                  💾 Archív ({webPEnabled ? '3.5MB' : '5MB'})
                </MenuItem>
              </Select>
            </FormControl>

            {/* 🌟 NOVÉ: WebP toggle */}
            {webPSupported !== null && (
              <FormControlLabel
                control={
                  <Switch
                    checked={webPEnabled && webPSupported}
                    onChange={e => setWebPEnabled(e.target.checked)}
                    disabled={!webPSupported}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      WebP {webPSupported ? '✅' : '❌'}
                    </Typography>
                    {webPEnabled && webPSupported && (
                      <Chip
                        label="30% MENŠIE"
                        size="small"
                        color="success"
                        variant="filled"
                      />
                    )}
                  </Box>
                }
                sx={{ ml: 1 }}
              />
            )}
          </Box>

          {/* 💡 NOVÉ: Smart Tips pre rýchle fotenie */}
          <Alert severity="info" sx={{ mb: 2, bgcolor: 'blue.50' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>⚡ Rýchle fotenie:</strong>
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              <li>
                <kbd>Space</kbd> alebo <kbd>⌘R</kbd> = Rýchle fotky cez
                prehliadač
              </li>
              <li>
                <kbd>⌘K</kbd> = Kvalitné fotky z galérie/fotoaparátu
              </li>
              <li>
                <strong>Tip:</strong> Pre škody použiť kvalitné, pre celkové
                zábery rýchle
              </li>
            </Box>
          </Alert>

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
              <DefaultCard key={media.id}>
                <Box sx={{ position: 'relative', mb: 2 }}>
                  {media.type === 'image' ? (
                    <img
                      src={media.preview}
                      alt={media.description}
                      style={{ width: '100%', height: 150, objectFit: 'cover' }}
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
                      <VideoCall sx={{ fontSize: 40, color: 'text.primary' }} />
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
                      handleMediaTypeChange(media.id, e.target.value as string)
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
              </DefaultCard>
            ))}
          </Box>
        </DialogContent>

        <DialogActions>
          <SecondaryButton onClick={handleClose}>Zrušiť</SecondaryButton>
          <PrimaryButton
            onClick={handleSave}
            startIcon={<Save />}
            disabled={capturedMedia.length === 0 || processing}
            loading={processing}
            loadingText="Ukladám..."
          >
            Uložiť ({capturedMedia.length})
          </PrimaryButton>
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
          <SecondaryButton onClick={() => setPreviewMedia(null)}>
            Zatvoriť
          </SecondaryButton>
        </DialogActions>
      </Dialog>

      {/* Native Camera Component */}
      <NativeCamera
        open={nativeCameraOpen}
        onClose={() => setNativeCameraOpen(false)}
        onCapture={handleNativeCapture}
        title="📸 Rapid fotografovanie"
        maxPhotos={maxImages}
        currentPhotoCount={capturedMedia.filter(m => m.type === 'image').length}
      />
    </>
  );
}
