/**
 * Modern Photo Capture - Ultra-rýchly photo systém
 * 
 * Features:
 * - Web Worker paralelné processing
 * - HTTP/2 parallel uploads
 * - SessionStorage pre PDF data
 * - Progress tracking s ETA
 * - Retry mechanizmus
 */

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, X, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { processAndUploadPhotos } from '@/utils/protocolPhotoWorkflow';
import { SessionStorageManager } from '@/utils/sessionStorageManager';
import type { ProtocolImage, ProtocolVideo } from '@/types';
import { logger } from '@/utils/logger';

interface ModernPhotoCaptureProps {
  open: boolean;
  onClose: () => void;
  onSave: (images: ProtocolImage[], videos: ProtocolVideo[]) => void;
  title: string;
  entityId: string; // Protocol ID
  mediaType: 'vehicle' | 'document' | 'damage' | 'odometer' | 'fuel';
  protocolType?: 'handover' | 'return';
  maxImages?: number;
}

interface CapturedPhoto {
  id: string;
  file: File;
  preview: string;
  processedGallery?: Blob;
  processedPDF?: string; // base64
  uploaded?: boolean;
  uploadUrl?: string;
  error?: string;
}

export const ModernPhotoCapture: React.FC<ModernPhotoCaptureProps> = ({
  open,
  onClose,
  onSave,
  title,
  entityId,
  mediaType,
  protocolType = 'handover',
  maxImages = 50,
}) => {
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    phase: '' as 'processing' | 'uploading' | 'done' | '',
    eta: 0,
  });
  const [previewPhoto, setPreviewPhoto] = useState<CapturedPhoto | null>(null);
  const [uploadedImages, setUploadedImages] = useState<ProtocolImage[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      photos.forEach((photo) => {
        if (photo.preview.startsWith('blob:')) {
          URL.revokeObjectURL(photo.preview);
        }
      });
    };
  }, [photos]);

  /**
   * Handle file selection - Používa nový unified workflow
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check limits
    if (photos.length + files.length > maxImages) {
      alert(`Maximálny počet fotiek je ${maxImages}`);
      return;
    }

    try {
      setWorking(true);

      // Create previews immediately for responsive UI
      const newPhotos: CapturedPhoto[] = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      }));

      setPhotos((prev) => [...prev, ...newPhotos]);

      // Use unified workflow
      const result = await processAndUploadPhotos(files, {
        protocolId: entityId,
        mediaType,
        protocolType,
        onProgress: (completed, total, message) => {
          setProgress({
            current: completed,
            total,
            phase: message.includes('Processing') ? 'processing' : message.includes('Uploading') ? 'uploading' : 'done',
            eta: 0,
          });
        },
      });

      // Store uploaded images
      setUploadedImages((prev) => [...prev, ...result.images]);

      // Mark photos as uploaded
      setPhotos((prev) =>
        prev.map((photo) => {
          const uploaded = result.images.find((img) => img.id === photo.id);
          if (uploaded) {
            return {
              ...photo,
              uploaded: true,
              uploadUrl: uploaded.originalUrl,
            };
          }
          return photo;
        })
      );

      logger.info('Photo workflow complete', {
        count: result.images.length,
        totalTime: result.totalTime,
      });
    } catch (error) {
      logger.error('Photo workflow failed', { error });
      alert(
        `Chyba pri spracovaní fotiek: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setWorking(false);
      setProgress({ current: 0, total: 0, phase: '', eta: 0 });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * Remove photo
   */
  const handleRemove = (id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo && photo.preview.startsWith('blob:')) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  /**
   * Save and close
   */
  const handleSave = () => {
    const videos: ProtocolVideo[] = []; // TODO: Video support

    logger.info('Saving photos', { count: uploadedImages.length });
    onSave(uploadedImages, videos);
    handleClose();
  };

  /**
   * Close and cleanup
   */
  const handleClose = () => {
    photos.forEach((photo) => {
      if (photo.preview.startsWith('blob:')) {
        URL.revokeObjectURL(photo.preview);
      }
    });
    setPhotos([]);
    setProgress({ current: 0, total: 0, phase: '', eta: 0 });
    onClose();
  };

  if (!open) return null;

  const uploadedCount = uploadedImages.length;

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Vyberte fotografie z galérie - automaticky sa spracujú a uploadnú
            </DialogDescription>
          </DialogHeader>

          {/* Progress Bar */}
          {working && progress.total > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {progress.phase === 'processing'
                    ? `Spracovávam ${progress.current}/${progress.total} fotiek...`
                    : progress.phase === 'uploading'
                      ? `Uploadujem ${progress.current}/${progress.total} fotiek...`
                      : `Hotovo ${progress.current}/${progress.total}`}
                </span>
                <span className="text-sm text-muted-foreground">
                  {progress.eta > 0 ? `ETA: ${Math.ceil(progress.eta)}s` : ''}
                </span>
              </div>
              <Progress
                value={(progress.current / progress.total) * 100}
                className="h-2"
              />
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <Badge variant="outline">
              {photos.length}/{maxImages} fotiek
            </Badge>
            <Badge variant={uploadedCount === photos.length ? 'default' : 'secondary'}>
              {uploadedCount} uploadnutých
            </Badge>
            {SessionStorageManager.getStats().imageCount > 0 && (
              <Badge variant="outline">
                SessionStorage: {SessionStorageManager.getStats().usedFormatted}
              </Badge>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex gap-4 mb-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={working || photos.length >= maxImages}
              size="lg"
              className="flex-1"
            >
              {working ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Spracovávam...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-5 w-5" />
                  Vybrať fotografie z galérie
                </>
              )}
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          {/* Photo Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group rounded-lg overflow-hidden border"
                >
                  <img
                    src={photo.preview}
                    alt=""
                    className="w-full h-32 object-cover"
                  />

                  {/* Status overlay */}
                  <div className="absolute top-2 left-2">
                    {photo.uploaded ? (
                      <Badge variant="default" className="bg-green-600">
                        ✓ Uploadnuté
                      </Badge>
                    ) : working ? (
                      <Badge variant="secondary">
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        {progress.phase === 'processing' ? 'Spracovávam...' : 'Uploadujem...'}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Čaká</Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPreviewPhoto(photo)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemove(photo.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Error */}
                  {photo.error && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-1">
                      {photo.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {photos.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Žiadne fotografie neboli pridané
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Kliknite na tlačidlo vyššie pre výber fotiek
              </p>
            </div>
          )}

          {/* Info Alert */}
          {photos.length > 0 && uploadedCount === photos.length && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                ✅ Všetky fotografie úspešne uploadnuté! Môžete uložiť protokol.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-end mt-4">
            <Button variant="outline" onClick={handleClose} disabled={working}>
              Zrušiť
            </Button>
            <Button
              onClick={handleSave}
              disabled={uploadedImages.length === 0 || working}
            >
              Uložiť ({uploadedCount})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      {previewPhoto && (
        <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Náhľad fotografie</DialogTitle>
              <DialogDescription>
                Zobrazenie fotografie v plnej kvalite
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center">
              <img
                src={previewPhoto.preview}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

