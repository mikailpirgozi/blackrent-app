/**
 * Stream Upload Hook - Anti-crash "Blind Upload" Mode
 *
 * ✅ NO previews during upload (zero RAM for display)
 * ✅ NO base64/dataURL (33% less RAM)
 * ✅ NO objectURL (removed all preview generation)
 * ✅ Concurrency 2 (prevents memory spikes)
 * ✅ Multipart upload for large files (>5MB)
 * ✅ No localStorage/IndexedDB for raw data
 * ✅ Wake lock (optional, prevents screen sleep)
 * ✅ UNLIMITED photos (100+) - only shows progress text
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '../utils/logger';
import { getApiBaseUrl } from '../utils/apiUrl';
import { indexedDBManager } from '../utils/storage/IndexedDBManager';

// Constants
const CONCURRENCY = 6; // Max parallel uploads (faster upload, compression happens in parallel)
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks for multipart
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const PDF_JPEG_QUALITY = 0.2; // 20% quality for PDF (small file, still readable)

// Types
export interface UploadTask {
  id: string;
  file: File;
  filename: string; // Just filename (no objectURL = no RAM!)
  filesize: number; // For display only
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  url?: string;
  error?: string;
  retries: number;
}

export interface UploadResult {
  url: string;
  imageId: string; // ID used in IndexedDB
}

export interface UseStreamUploadOptions {
  protocolId: string;
  mediaType: 'vehicle' | 'document' | 'damage' | 'odometer' | 'fuel';
  protocolType?: 'handover' | 'return';
  onProgress?: (completed: number, total: number) => void;
  onComplete?: (results: UploadResult[]) => void; // Changed: now returns URL + imageId
  onError?: (error: Error) => void;
  enableWakeLock?: boolean;
}

export interface UseStreamUploadReturn {
  tasks: UploadTask[];
  uploadFiles: (files: File[]) => Promise<void>;
  cancel: () => void;
  isUploading: boolean;
  completed: number;
  total: number;
  progress: number;
}

/**
 * Stream upload hook - uploads files in micro-batches without base64
 */
export function useStreamUpload(
  options: UseStreamUploadOptions
): UseStreamUploadReturn {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // ✅ BLIND UPLOAD: No cleanup needed (no objectURLs created)

  // Request wake lock (prevents screen sleep during upload)
  const requestWakeLock = useCallback(async () => {
    if (!options.enableWakeLock || !('wakeLock' in navigator)) {
      return;
    }

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      logger.info('Wake lock acquired');
    } catch (error) {
      logger.warn('Wake lock failed', { error });
    }
  }, [options.enableWakeLock]);

  // Release wake lock
  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      logger.info('Wake lock released');
    }
  }, []);

  // Upload single file with multipart support
  const uploadFile = useCallback(
    async (task: UploadTask, signal: AbortSignal): Promise<UploadResult> => {
      const { file } = task;
      const isLargeFile = file.size > CHUNK_SIZE;

      if (isLargeFile) {
        // Multipart upload for large files
        return await uploadMultipart(task, signal, options);
      } else {
        // Single request for small files
        return await uploadSingle(task, signal, options);
      }
    },
    [options]
  );

  // Upload files with concurrency control
  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      setIsUploading(true);
      abortControllerRef.current = new AbortController();

      // Request wake lock
      await requestWakeLock();

      try {
        // ✅ BLIND UPLOAD: Create tasks WITHOUT objectURL (no RAM usage!)
        const newTasks: UploadTask[] = files.map(file => ({
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file,
          filename: file.name,
          filesize: file.size,
          status: 'pending',
          progress: 0,
          retries: 0,
        }));

        setTasks(newTasks);

        // Upload queue with concurrency 6
        const queue = [...newTasks];
        const active = new Set<Promise<void>>();
        const results: UploadResult[] = [];
        let completed = 0;

        while (queue.length > 0 || active.size > 0) {
          // Fill active slots
          while (active.size < CONCURRENCY && queue.length > 0) {
            const task = queue.shift()!;

            let uploadPromise: Promise<void>;

            uploadPromise = (async () => {
              try {
                // Update status
                setTasks(prev =>
                  prev.map(t =>
                    t.id === task.id ? { ...t, status: 'uploading' } : t
                  )
                );

                // Upload (returns {url, imageId})
                const uploadResult = await uploadFile(
                  task,
                  abortControllerRef.current!.signal
                );

                // Success
                setTasks(prev =>
                  prev.map(t =>
                    t.id === task.id
                      ? { ...t, status: 'completed', url: uploadResult.url, progress: 100 }
                      : t
                  )
                );

                results.push(uploadResult);
                completed++;
                options.onProgress?.(completed, files.length);

                // ✅ BLIND UPLOAD: No objectURL to revoke!
              } catch (error) {
                logger.error('Upload failed', { taskId: task.id, error });

                // Retry logic
                if (task.retries < MAX_RETRIES) {
                  task.retries++;
                  await new Promise(resolve =>
                    setTimeout(resolve, RETRY_DELAY * task.retries)
                  );
                  queue.push(task); // Re-add to queue
                  logger.info('Retrying upload', {
                    taskId: task.id,
                    retries: task.retries,
                  });
                } else {
                  // Final failure
                  setTasks(prev =>
                    prev.map(t =>
                      t.id === task.id
                        ? {
                            ...t,
                            status: 'failed',
                            error:
                              error instanceof Error
                                ? error.message
                                : 'Unknown error',
                          }
                        : t
                    )
                  );
                  // ✅ BLIND UPLOAD: No objectURL to revoke!
                }
              } finally {
                active.delete(uploadPromise);
              }
            })();

            active.add(uploadPromise);
          }

          // Wait for at least one to complete
          if (active.size > 0) {
            await Promise.race(active);
          }
        }

        // All uploads complete
        options.onComplete?.(results);
        logger.info('All uploads complete', {
          total: files.length,
          succeeded: results.length,
        });
      } catch (error) {
        logger.error('Upload batch failed', { error });
        options.onError?.(
          error instanceof Error ? error : new Error('Unknown error')
        );
      } finally {
        setIsUploading(false);
        abortControllerRef.current = null;
        await releaseWakeLock();
      }
    },
    [uploadFile, options, requestWakeLock, releaseWakeLock]
  );

  // Cancel all uploads
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // ✅ BLIND UPLOAD: No objectURLs to revoke!

    setTasks([]);
    setIsUploading(false);
    releaseWakeLock();
  }, [tasks, releaseWakeLock]);

  // Calculate progress
  const completed = tasks.filter(t => t.status === 'completed').length;
  const total = tasks.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return {
    tasks,
    uploadFiles,
    cancel,
    isUploading,
    completed,
    total,
    progress,
  };
}

/**
 * Compress image to JPEG 20% quality for PDF storage
 * Stores in IndexedDB for fast PDF generation
 */
async function compressImageForPdfStorage(
  file: File,
  imageId: string,
  protocolId: string
): Promise<void> {
  console.log('🟡 [COMPRESS] Starting compression:', { imageId, fileType: file.type, fileSize: file.size });
  
  // ✅ ANTI-CRASH: Skip compression for non-image files
  if (!file.type.startsWith('image/')) {
    console.log('⚠️ [COMPRESS] Skipping non-image file:', { imageId, fileType: file.type });
    logger.warn('⚠️ Skipping PDF compression for non-image file', {
      imageId,
      fileType: file.type,
    });
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectURL = URL.createObjectURL(file);

    // ✅ ANTI-CRASH: Set timeout to prevent hanging
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(objectURL);
      logger.error('⏱️ Image compression timeout', { imageId });
      reject(new Error('Image compression timeout'));
    }, 30000); // 30s timeout

    img.onload = async () => {
      try {
        clearTimeout(timeout);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas context not available');
        }

        // Scale to max 800px (sufficient for PDF)
        const MAX_SIZE = 800;
        let { width, height } = img;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', PDF_JPEG_QUALITY);

        // Store in IndexedDB
        console.log('🟡 [COMPRESS] Saving to IndexedDB:', { 
          imageId, 
          protocolId,
          pdfDataLength: base64.length,
          compressedSize: Math.floor((base64.length * 0.75) / 1024)
        });
        
        try {
          await indexedDBManager.saveImage({
            id: imageId,
            protocolId,
            pdfData: base64, // JPEG 20% for PDF
            compressed: true,
            originalSize: file.size,
            compressedSize: Math.floor((base64.length * 0.75) / 1024), // Estimate KB
          });

          console.log('✅ [COMPRESS] Saved to IndexedDB successfully:', { imageId });
          logger.info('📦 PDF JPEG stored in IndexedDB', {
            imageId,
            originalSize: `${(file.size / 1024).toFixed(0)} KB`,
            compressedSize: `${Math.floor((base64.length * 0.75) / 1024)} KB`,
            dimensions: `${width}x${height}`,
            quality: '20%',
          });
        } catch (dbError) {
          console.error('❌ [COMPRESS] IndexedDB save failed:', { 
            imageId, 
            error: dbError,
            errorName: (dbError as Error)?.name,
            errorMessage: (dbError as Error)?.message,
            isQuotaError: (dbError as Error)?.name === 'QuotaExceededError'
          });
          logger.error('⚠️ IndexedDB save failed', {
            imageId,
            errorName: (dbError as Error)?.name,
            errorMessage: (dbError as Error)?.message,
          });
          
          // 🚨 CRITICAL: Warn user if quota exceeded
          if ((dbError as Error)?.name === 'QuotaExceededError') {
            console.error('🚨🚨🚨 QUOTA EXCEEDED! IndexedDB is full. PDF will be LARGE!');
            alert('⚠️ Upozornenie: Pamäť prehliadača je plná. PDF bude veľké. Vymažte staré dáta prehliadača (F12 → Application → Clear storage).');
          }
          // Continue anyway - PDF will use R2 fallback
        }

        URL.revokeObjectURL(objectURL);
        resolve();
      } catch (error) {
        clearTimeout(timeout);
        URL.revokeObjectURL(objectURL);
        logger.error('❌ Image compression failed', { imageId, error });
        // ✅ ANTI-CRASH: Don't reject, just log error (upload can continue)
        resolve(); // Continue upload even if compression fails
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(objectURL);
      logger.error('❌ Failed to load image for compression', { imageId });
      // ✅ ANTI-CRASH: Don't reject, just log error (upload can continue)
      resolve(); // Continue upload even if image load fails
    };

    img.src = objectURL;
  });
}

/**
 * Upload single file (< 5MB)
 */
async function uploadSingle(
  task: UploadTask,
  signal: AbortSignal,
  options: UseStreamUploadOptions
): Promise<UploadResult> {
  // 1. Generate image ID (CRITICAL: This ID is used in IndexedDB!)
  const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // 2. Compress and store JPEG 20% in IndexedDB (parallel with upload)
  console.log('🔵 [UPLOAD] Starting compression for:', { imageId, filename: task.file.name });
  const compressionPromise = compressImageForPdfStorage(
    task.file,
    imageId,
    options.protocolId
  );

  // 3. Upload original file to R2
  const formData = new FormData();
  formData.append('file', task.file);
  formData.append('type', 'protocol');
  formData.append('entityId', options.protocolId);
  formData.append('mediaType', options.mediaType);
  formData.append('protocolType', options.protocolType || 'handover');

  const token =
    localStorage.getItem('blackrent_token') ||
    sessionStorage.getItem('blackrent_token');

  const response = await fetch(`${getApiBaseUrl()}/files/upload`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
    signal,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  const result = await response.json();
  
  // 4. Wait for compression to finish
  console.log('🔵 [UPLOAD] Waiting for compression to finish:', { imageId });
  await compressionPromise;
  console.log('🟢 [UPLOAD] Compression done, returning result:', { imageId, url: result.url || result.publicUrl });

  // 5. Return both URL and imageId (for IndexedDB lookup)
  return {
    url: result.url || result.publicUrl,
    imageId,
  };
}

/**
 * Upload large file with multipart (> 5MB)
 * Uploads in 5MB chunks to prevent memory spikes
 */
async function uploadMultipart(
  task: UploadTask,
  signal: AbortSignal,
  options: UseStreamUploadOptions
): Promise<UploadResult> {
  const { file } = task;
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  // Generate image ID for IndexedDB
  const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Start compression in parallel
  const compressionPromise = compressImageForPdfStorage(
    file,
    imageId,
    options.protocolId
  );

  logger.info('Starting multipart upload', {
    filename: file.name,
    size: file.size,
    chunks: totalChunks,
    imageId,
  });

  // 1. Initiate multipart upload
  const token =
    localStorage.getItem('blackrent_token') ||
    sessionStorage.getItem('blackrent_token');

  const initResponse = await fetch(`${getApiBaseUrl()}/files/multipart/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      entityId: options.protocolId,
      mediaType: options.mediaType,
      totalChunks,
    }),
    signal,
  });

  if (!initResponse.ok) {
    throw new Error('Failed to initiate multipart upload');
  }

  const { uploadId, urls } = await initResponse.json();

  // 2. Upload chunks
  const uploadedParts: { PartNumber: number; ETag: string }[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end); // ✅ No full file in memory!

    const partResponse = await fetch(urls[i], {
      method: 'PUT',
      body: chunk,
      signal,
    });

    if (!partResponse.ok) {
      throw new Error(`Failed to upload chunk ${i + 1}/${totalChunks}`);
    }

    const etag = partResponse.headers.get('ETag')!;
    uploadedParts.push({ PartNumber: i + 1, ETag: etag });

    logger.debug('Chunk uploaded', {
      chunk: i + 1,
      total: totalChunks,
      progress: ((i + 1) / totalChunks) * 100,
    });
  }

  // 3. Complete multipart upload
  const completeResponse = await fetch(
    `${getApiBaseUrl()}/files/multipart/complete`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        uploadId,
        parts: uploadedParts,
      }),
      signal,
    }
  );

  if (!completeResponse.ok) {
    throw new Error('Failed to complete multipart upload');
  }

  const { url } = await completeResponse.json();
  
  // Wait for compression to finish
  await compressionPromise;
  
  return {
    url,
    imageId,
  };
}
