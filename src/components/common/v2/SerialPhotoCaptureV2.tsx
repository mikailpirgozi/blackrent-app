/**
 * SerialPhotoCaptureV2 - Vylepšená verzia photo capture s queue systémom
 * Podporuje background upload, retry logiku a real-time progress
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  PROTOCOL_V2_FLAGS,
  featureManager,
} from '../../../config/featureFlags';

export interface QueueItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  retries: number;
  photoId?: string;
  urls?: {
    original?: string;
    thumb?: string;
    gallery?: string;
    pdf?: string;
  };
  error?: string;
  uploadedAt?: Date;
  processedAt?: Date;
}

export interface Preview {
  id: string;
  url: string;
  file: File;
  timestamp: Date;
}

interface Props {
  protocolId: string;
  onPhotosChange?: (photos: QueueItem[]) => void;
  onUploadComplete?: (photoId: string, urls: QueueItem['urls']) => void;
  maxPhotos?: number;
  userId?: string;
  disabled?: boolean;
}

export const SerialPhotoCaptureV2: React.FC<Props> = ({
  protocolId,
  onPhotosChange,
  onUploadComplete,
  maxPhotos = 20,
  userId,
  disabled = false,
}) => {
  const [uploadQueue, setUploadQueue] = useState<QueueItem[]>([]);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [isV2Enabled, setIsV2Enabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check feature flag
  useEffect(() => {
    const checkFeatureFlag = async () => {
      try {
        const enabled = await featureManager.isEnabled(
          PROTOCOL_V2_FLAGS.PHOTO_UPLOAD,
          userId
        );
        setIsV2Enabled(enabled);
      } catch (error) {
        console.error('Failed to check V2 feature flag:', error);
        setIsV2Enabled(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFeatureFlag();
  }, [userId]);

  // Polling pre status updates
  useEffect(() => {
    if (uploadQueue.length === 0) return;

    const processingPhotos = uploadQueue.filter(
      item => item.status === 'uploading' || item.status === 'processing'
    );

    if (processingPhotos.length === 0) return;

    processingIntervalRef.current = setInterval(async () => {
      for (const item of processingPhotos) {
        if (item.photoId) {
          await checkPhotoStatus(item.photoId);
        }
      }
    }, 2000); // Check každé 2 sekundy

    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, [uploadQueue]);

  /**
   * Handling file capture/selection
   */
  const handleCapture = useCallback(
    async (files: FileList | File[]) => {
      if (disabled || !isV2Enabled) return;

      const fileArray = Array.from(files);

      // Check limits
      if (uploadQueue.length + fileArray.length > maxPhotos) {
        alert(`Maximálny počet fotografií je ${maxPhotos}`);
        return;
      }

      // Generovanie previews a queue items
      const newItems: QueueItem[] = [];
      const newPreviews: Preview[] = [];

      for (const file of fileArray) {
        // Validácia súboru
        if (!file.type.startsWith('image/')) {
          console.warn(`Skipped non-image file: ${file.name}`);
          continue;
        }

        if (file.size > 50 * 1024 * 1024) {
          // 50MB limit
          alert(`Súbor ${file.name} je príliš veľký (max 50MB)`);
          continue;
        }

        // Generovanie preview
        const preview: Preview = {
          id: uuidv4(),
          url: URL.createObjectURL(file),
          file,
          timestamp: new Date(),
        };

        // Queue item
        const queueItem: QueueItem = {
          id: preview.id,
          file,
          status: 'pending',
          progress: 0,
          retries: 0,
        };

        newItems.push(queueItem);
        newPreviews.push(preview);
      }

      // Update state
      setUploadQueue(prev => [...prev, ...newItems]);
      setPreviews(prev => [...prev, ...newPreviews]);

      // Trigger uploads
      for (const item of newItems) {
        processQueueItem(item);
      }
    },
    [disabled, isV2Enabled, uploadQueue.length, maxPhotos, protocolId, userId]
  );

  /**
   * Spracovanie jednotlivého queue item
   */
  const processQueueItem = async (item: QueueItem) => {
    try {
      // Update status
      updateQueueItemStatus(item.id, 'uploading', 10);

      // Príprava form data
      const formData = new FormData();
      formData.append('photos', item.file);
      formData.append('protocolId', protocolId);
      if (userId) {
        formData.append('userId', userId);
      }

      // Upload request
      const response = await fetch('/api/v2/protocols/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Extract photo info
      const photoInfo = result.results.photos[0];
      if (!photoInfo || !photoInfo.success) {
        throw new Error(photoInfo?.error || 'Photo upload failed');
      }

      // Update s photo ID a URLs
      updateQueueItem(item.id, {
        status: 'processing',
        progress: 50,
        photoId: photoInfo.photoId,
        urls: {
          original: photoInfo.originalUrl,
        },
      });

      // Start monitoring processing
      if (photoInfo.photoId) {
        monitorPhotoProcessing(item.id, photoInfo.photoId);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Upload failed';
      console.error(`Upload failed for ${item.file.name}:`, error);

      // Retry logic
      if (item.retries < 3) {
        setTimeout(
          () => {
            updateQueueItem(item.id, {
              retries: item.retries + 1,
              status: 'pending',
              progress: 0,
            });
            processQueueItem({ ...item, retries: item.retries + 1 });
          },
          Math.pow(2, item.retries) * 1000
        ); // Exponential backoff
      } else {
        updateQueueItemStatus(item.id, 'failed', 0, errorMessage);
      }
    }
  };

  /**
   * Monitoring photo processing status
   */
  const monitorPhotoProcessing = async (itemId: string, photoId: string) => {
    try {
      const response = await fetch(
        `/api/v2/protocols/photos/${photoId}/status`
      );

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Status check failed');
      }

      const photo = result.photo;

      // Update queue item
      updateQueueItem(itemId, {
        status: photo.status === 'completed' ? 'completed' : 'processing',
        progress: photo.progress || 0,
        urls: photo.urls,
        error: photo.error,
        processedAt: photo.processedAt
          ? new Date(photo.processedAt)
          : undefined,
      });

      // Notify completion
      if (photo.status === 'completed' && onUploadComplete) {
        onUploadComplete(photoId, photo.urls);
      }

      // Continue monitoring ak ešte nie je hotové
      if (photo.status !== 'completed' && photo.status !== 'failed') {
        setTimeout(() => monitorPhotoProcessing(itemId, photoId), 2000);
      }
    } catch (error) {
      console.error(`Failed to check photo status ${photoId}:`, error);
      updateQueueItemStatus(
        itemId,
        'failed',
        0,
        error instanceof Error ? error.message : 'Status check failed'
      );
    }
  };

  /**
   * Check photo status directly
   */
  const checkPhotoStatus = async (photoId: string) => {
    try {
      const response = await fetch(
        `/api/v2/protocols/photos/${photoId}/status`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const item = uploadQueue.find(q => q.photoId === photoId);
          if (item) {
            updateQueueItem(item.id, {
              status:
                result.photo.status === 'completed'
                  ? 'completed'
                  : 'processing',
              progress: result.photo.progress || 0,
              urls: result.photo.urls,
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to check status for photo ${photoId}:`, error);
    }
  };

  /**
   * Helper funkcie pre state updates
   */
  const updateQueueItemStatus = (
    id: string,
    status: QueueItem['status'],
    progress: number,
    error?: string
  ) => {
    setUploadQueue(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status, progress, error } : item
      )
    );
  };

  const updateQueueItem = (id: string, updates: Partial<QueueItem>) => {
    setUploadQueue(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  /**
   * File input handling
   */
  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files) {
      handleCapture(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Remove photo from queue
   */
  const removePhoto = useCallback((id: string) => {
    // Remove from queue
    setUploadQueue(prev => prev.filter(item => item.id !== id));

    // Remove preview a cleanup URL
    setPreviews(prev => {
      const preview = prev.find(p => p.id === id);
      if (preview) {
        URL.revokeObjectURL(preview.url);
      }
      return prev.filter(p => p.id !== id);
    });
  }, []);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach(preview => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, []);

  // Notify parent o changes
  useEffect(() => {
    if (onPhotosChange) {
      onPhotosChange(uploadQueue);
    }
  }, [uploadQueue, onPhotosChange]);

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Načítavam...</p>
      </div>
    );
  }

  if (!isV2Enabled) {
    // Fallback na V1 komponent
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          Protocol V2 nie je povolený. Používa sa štandardný systém.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploadQueue.length >= maxPhotos}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {uploadQueue.length >= maxPhotos
            ? `Maximum ${maxPhotos} fotografií`
            : 'Pridať fotografie'}
        </button>

        <p className="mt-2 text-sm text-gray-600">
          Alebo presuňte súbory sem. Max {maxPhotos} fotografií, 50MB na súbor.
        </p>

        <div className="mt-2 text-xs text-gray-500">
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
            V2 System
          </span>{' '}
          Background processing • Automatic retry • Real-time progress
        </div>
      </div>

      {/* Upload progress summary */}
      {uploadQueue.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Upload Progress</h3>
            <span className="text-sm text-gray-600">
              {uploadQueue.filter(i => i.status === 'completed').length}/
              {uploadQueue.length} dokončené
            </span>
          </div>

          {/* Overall progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(uploadQueue.filter(i => i.status === 'completed').length / uploadQueue.length) * 100}%`,
              }}
            />
          </div>

          {/* Queue stats */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium text-gray-500">Čaká</div>
              <div>
                {uploadQueue.filter(i => i.status === 'pending').length}
              </div>
            </div>
            <div className="text-center">
              <div className="font-medium text-blue-500">Spracováva</div>
              <div>
                {
                  uploadQueue.filter(i =>
                    ['uploading', 'processing'].includes(i.status)
                  ).length
                }
              </div>
            </div>
            <div className="text-center">
              <div className="font-medium text-green-500">Hotové</div>
              <div>
                {uploadQueue.filter(i => i.status === 'completed').length}
              </div>
            </div>
            <div className="text-center">
              <div className="font-medium text-red-500">Chyby</div>
              <div>{uploadQueue.filter(i => i.status === 'failed').length}</div>
            </div>
          </div>
        </div>
      )}

      {/* Photo previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previews.map(preview => {
            const queueItem = uploadQueue.find(q => q.id === preview.id);

            return (
              <div key={preview.id} className="relative group">
                {/* Preview image */}
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={preview.url}
                    alt={`Preview ${preview.id}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Status overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-white text-center">
                      <div className="text-sm font-medium capitalize">
                        {queueItem?.status || 'unknown'}
                      </div>
                      {queueItem?.progress !== undefined && (
                        <div className="text-xs mt-1">
                          {queueItem.progress}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                {queueItem &&
                  queueItem.status !== 'completed' &&
                  queueItem.status !== 'failed' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gray-200 h-1">
                      <div
                        className="bg-blue-500 h-1 transition-all duration-300"
                        style={{ width: `${queueItem.progress}%` }}
                      />
                    </div>
                  )}

                {/* Status indicator */}
                <div className="absolute top-2 left-2">
                  {queueItem?.status === 'completed' && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}

                  {queueItem?.status === 'failed' && (
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  )}

                  {queueItem?.status === 'processing' && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removePhoto(preview.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                {/* Error message */}
                {queueItem?.error && (
                  <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-1 rounded-b-lg">
                    {queueItem.error}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {previews.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p>Žiadne fotografie neboli pridané</p>
          <p className="text-sm">
            Kliknite na tlačidlo vyššie pre pridanie fotografií
          </p>
        </div>
      )}
    </div>
  );
};
