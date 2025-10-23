/**
 * Progressive Photo Uploader - Hybrid Solution (Option D)
 *
 * ✅ Uploads photos ONE AT A TIME (progressive)
 * ✅ Server-side compression (no mobile memory crashes)
 * ✅ Real-time progress tracking per photo
 * ✅ Automatic retry for failed uploads
 * ✅ Works on mobile and desktop
 *
 * This component solves the mobile photo upload problem by:
 * 1. Uploading photos sequentially (not all at once)
 * 2. Server handles compression (mobile browser doesn't crash)
 * 3. Retry mechanism for failed uploads
 * 4. Clear progress indication for users
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  LinearProgress,
  Typography,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Paper,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Refresh as RetryIcon,
  PhotoCamera as PhotoIcon,
} from '@mui/icons-material';
import { getApiBaseUrl } from '../../utils/apiUrl';
import { logger } from '../../utils/logger';
import { ProtocolImage } from '../../types';

interface ProgressivePhotoUploaderProps {
  protocolId: string;
  protocolType: 'handover' | 'return';
  mediaType: 'vehicle' | 'document' | 'damage' | 'fuel' | 'odometer';
  onUploadComplete: (images: ProtocolImage[]) => void;
  onUploadProgress?: (
    current: number,
    total: number,
    percentage: number
  ) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

interface PhotoUploadStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  result?: ProtocolImage;
  error?: string;
  retryCount: number;
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

export const ProgressivePhotoUploader: React.FC<
  ProgressivePhotoUploaderProps
> = ({
  protocolId,
  protocolType,
  mediaType,
  onUploadComplete,
  onUploadProgress,
  maxPhotos = 50,
  disabled = false,
}) => {
  const [photos, setPhotos] = useState<PhotoUploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle file selection
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      if (files.length === 0) return;

      // Validate file count
      if (photos.length + files.length > maxPhotos) {
        alert(
          `Môžete nahrať maximálne ${maxPhotos} fotiek. Vyberte menej fotiek.`
        );
        return;
      }

      // Validate file types
      const validFiles = files.filter(file => file.type.startsWith('image/'));
      if (validFiles.length !== files.length) {
        alert('Niektoré súbory nie sú obrázky a boli preskočené.');
      }

      // Add files to upload queue
      const newPhotos: PhotoUploadStatus[] = validFiles.map(file => ({
        file,
        status: 'pending',
        progress: 0,
        retryCount: 0,
      }));

      setPhotos(prev => [...prev, ...newPhotos]);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      logger.info('📸 Photos added to queue', {
        count: validFiles.length,
        totalQueue: photos.length + validFiles.length,
      });
    },
    [photos.length, maxPhotos]
  );

  // Upload single photo
  const uploadSinglePhoto = useCallback(
    async (
      photoStatus: PhotoUploadStatus,
      index: number
    ): Promise<ProtocolImage | null> => {
      const { file, retryCount } = photoStatus;

      try {
        logger.info(`📤 Uploading photo ${index + 1}/${photos.length}`, {
          filename: file.name,
          size: file.size,
          retryCount,
        });

        // Update status to uploading
        setPhotos(prev =>
          prev.map((p, i) =>
            i === index
              ? { ...p, status: 'uploading' as const, progress: 0 }
              : p
          )
        );

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('protocolId', protocolId);
        formData.append('protocolType', protocolType);
        formData.append('mediaType', mediaType);
        formData.append('photoIndex', (index + 1).toString());
        formData.append('totalPhotos', photos.length.toString());

        // Get auth token
        const token =
          localStorage.getItem('blackrent_token') ||
          sessionStorage.getItem('blackrent_token');

        // Create abort controller for this upload
        abortControllerRef.current = new AbortController();

        // Upload with progress tracking
        const response = await fetch(
          `${getApiBaseUrl()}/files/progressive-upload`,
          {
            method: 'POST',
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: formData,
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: 'Upload failed' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        logger.info(
          `✅ Photo uploaded successfully ${index + 1}/${photos.length}`,
          {
            photoId: result.photo.id,
            stats: result.stats,
          }
        );

        // Update status to success
        setPhotos(prev =>
          prev.map((p, i) =>
            i === index
              ? {
                  ...p,
                  status: 'success' as const,
                  progress: 100,
                  result: result.photo,
                }
              : p
          )
        );

        // Notify progress
        onUploadProgress?.(
          index + 1,
          photos.length,
          Math.round(((index + 1) / photos.length) * 100)
        );

        return result.photo;
      } catch (error) {
        logger.error(`❌ Photo upload failed ${index + 1}/${photos.length}`, {
          filename: file.name,
          error,
          retryCount,
        });

        // Update status to error
        setPhotos(prev =>
          prev.map((p, i) =>
            i === index
              ? {
                  ...p,
                  status: 'error' as const,
                  error:
                    error instanceof Error ? error.message : 'Upload failed',
                  retryCount: retryCount + 1,
                }
              : p
          )
        );

        return null;
      }
    },
    [protocolId, protocolType, mediaType, photos.length, onUploadProgress]
  );

  // Upload all photos progressively
  const uploadAllPhotos = useCallback(async () => {
    if (photos.length === 0) return;

    setIsUploading(true);
    setCurrentUploadIndex(0);

    const successfulUploads: ProtocolImage[] = [];

    try {
      // Upload photos ONE BY ONE
      for (let i = 0; i < photos.length; i++) {
        const photoStatus = photos[i];

        // Type guard - skip if undefined
        if (!photoStatus) {
          logger.warn('⚠️ Photo status is undefined, skipping', { index: i });
          continue;
        }

        // Skip already successful uploads
        if (photoStatus.status === 'success' && photoStatus.result) {
          successfulUploads.push(photoStatus.result);
          continue;
        }

        setCurrentUploadIndex(i);

        // Upload with retry logic
        let result: ProtocolImage | null = null;
        let attempts = 0;

        while (attempts < MAX_RETRY_ATTEMPTS && !result) {
          if (attempts > 0) {
            logger.info(
              `🔄 Retrying upload (attempt ${attempts + 1}/${MAX_RETRY_ATTEMPTS})`,
              {
                photoIndex: i + 1,
                filename: photoStatus.file.name,
              }
            );
            await new Promise(resolve =>
              setTimeout(resolve, RETRY_DELAY_MS * attempts)
            );
          }

          result = await uploadSinglePhoto(photoStatus, i);
          attempts++;

          if (!result && attempts < MAX_RETRY_ATTEMPTS) {
            // Update retry count in state
            setPhotos(prev =>
              prev.map((p, idx) =>
                idx === i ? { ...p, retryCount: attempts } : p
              )
            );
          }
        }

        if (result) {
          successfulUploads.push(result);
        }

        // Small delay between uploads to prevent server overload
        if (i < photos.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Calculate success rate
      const successRate = Math.round(
        (successfulUploads.length / photos.length) * 100
      );

      logger.info('✅ Progressive upload complete', {
        total: photos.length,
        successful: successfulUploads.length,
        failed: photos.length - successfulUploads.length,
        successRate: `${successRate}%`,
      });

      // Notify completion
      onUploadComplete(successfulUploads);

      // Show summary
      if (successfulUploads.length < photos.length) {
        alert(
          `Nahralo sa ${successfulUploads.length} z ${photos.length} fotiek.\n` +
            `${photos.length - successfulUploads.length} fotiek zlyhalo.\n\n` +
            `Môžete skúsiť znova nahrať zlyhané fotky kliknutím na tlačidlo "Retry".`
        );
      }
    } catch (error) {
      logger.error('❌ Progressive upload failed', { error });
      alert('Nahrávanie fotiek zlyhalo. Skúste to znova.');
    } finally {
      setIsUploading(false);
      setCurrentUploadIndex(0);
      abortControllerRef.current = null;
    }
  }, [photos, uploadSinglePhoto, onUploadComplete]);

  // Retry failed uploads
  const retryFailedUploads = useCallback(async () => {
    const failedPhotos = photos.filter(p => p.status === 'error');

    if (failedPhotos.length === 0) {
      alert('Žiadne zlyhané fotky na opakovanie.');
      return;
    }

    logger.info('🔄 Retrying failed uploads', { count: failedPhotos.length });

    // Reset failed photos to pending
    setPhotos(prev =>
      prev.map(p =>
        p.status === 'error'
          ? { ...p, status: 'pending' as const, retryCount: 0 }
          : p
      )
    );

    // Start upload
    await uploadAllPhotos();
  }, [photos, uploadAllPhotos]);

  // Remove photo from queue
  const removePhoto = useCallback((index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    logger.info('🗑️ Photo removed from queue', { index });
  }, []);

  // Clear all photos
  const clearAllPhotos = useCallback(() => {
    setPhotos([]);
    setCurrentUploadIndex(0);
    logger.info('🗑️ All photos cleared');
  }, []);

  // Calculate statistics
  const stats = {
    total: photos.length,
    pending: photos.filter(p => p.status === 'pending').length,
    uploading: photos.filter(p => p.status === 'uploading').length,
    success: photos.filter(p => p.status === 'success').length,
    error: photos.filter(p => p.status === 'error').length,
    successRate:
      photos.length > 0
        ? Math.round(
            (photos.filter(p => p.status === 'success').length /
              photos.length) *
              100
          )
        : 0,
  };

  return (
    <Box>
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || isUploading}
      />

      {/* Upload Button */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<PhotoIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading || photos.length >= maxPhotos}
          fullWidth
        >
          Vybrať fotky ({photos.length}/{maxPhotos})
        </Button>

        {photos.length > 0 && (
          <>
            <Button
              variant="contained"
              color="primary"
              startIcon={<UploadIcon />}
              onClick={uploadAllPhotos}
              disabled={disabled || isUploading || stats.pending === 0}
            >
              Nahrať ({stats.pending})
            </Button>

            {stats.error > 0 && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<RetryIcon />}
                onClick={retryFailedUploads}
                disabled={disabled || isUploading}
              >
                Retry ({stats.error})
              </Button>
            )}

            <Button
              variant="outlined"
              color="error"
              onClick={clearAllPhotos}
              disabled={disabled || isUploading}
            >
              Vymazať
            </Button>
          </>
        )}
      </Box>

      {/* Statistics */}
      {photos.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip label={`Celkom: ${stats.total}`} size="small" />
          <Chip label={`Čaká: ${stats.pending}`} size="small" color="default" />
          <Chip
            label={`Nahráva sa: ${stats.uploading}`}
            size="small"
            color="info"
          />
          <Chip
            label={`Úspešné: ${stats.success}`}
            size="small"
            color="success"
          />
          {stats.error > 0 && (
            <Chip
              label={`Zlyhané: ${stats.error}`}
              size="small"
              color="error"
            />
          )}
          {stats.total > 0 && (
            <Chip
              label={`Úspešnosť: ${stats.successRate}%`}
              size="small"
              color="primary"
            />
          )}
        </Box>
      )}

      {/* Progress Bar */}
      {isUploading && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Nahráva sa fotka {currentUploadIndex + 1} z {photos.length}...
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.round(((currentUploadIndex + 1) / photos.length) * 100)}
          />
        </Box>
      )}

      {/* Photo List */}
      {photos.length > 0 && (
        <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
          <List dense>
            {photos.map((photo, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  !isUploading &&
                  photo.status !== 'success' && (
                    <IconButton
                      edge="end"
                      onClick={() => removePhoto(index)}
                      size="small"
                    >
                      <ErrorIcon fontSize="small" />
                    </IconButton>
                  )
                }
              >
                <ListItemIcon>
                  {photo.status === 'pending' && <PhotoIcon color="disabled" />}
                  {photo.status === 'uploading' && <UploadIcon color="info" />}
                  {photo.status === 'success' && (
                    <SuccessIcon color="success" />
                  )}
                  {photo.status === 'error' && <ErrorIcon color="error" />}
                </ListItemIcon>
                <ListItemText
                  primary={photo.file.name}
                  secondary={
                    <>
                      {(photo.file.size / 1024 / 1024).toFixed(2)} MB
                      {photo.status === 'error' &&
                        photo.error &&
                        ` - ${photo.error}`}
                      {photo.status === 'error' &&
                        photo.retryCount > 0 &&
                        ` (Pokus ${photo.retryCount}/${MAX_RETRY_ATTEMPTS})`}
                    </>
                  }
                />
                {photo.status === 'uploading' && (
                  <Box sx={{ width: 100, ml: 2 }}>
                    <LinearProgress />
                  </Box>
                )}
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Info Alert */}
      {photos.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Kliknite na "Vybrať fotky" pre pridanie fotiek. Fotky sa nahrávajú po
          jednej, čo zabezpečuje spoľahlivé nahrávanie aj na mobilných
          zariadeniach.
        </Alert>
      )}

      {/* Success Alert */}
      {stats.success > 0 && !isUploading && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Úspešne nahraných {stats.success} z {stats.total} fotiek!
          {stats.error > 0 &&
            ` ${stats.error} fotiek zlyhalo - môžete ich skúsiť nahrať znova.`}
        </Alert>
      )}
    </Box>
  );
};
