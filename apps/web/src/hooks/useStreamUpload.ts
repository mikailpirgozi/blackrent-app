/**
 * Stream Upload Hook - Anti-crash iOS Safari
 *
 * ✅ NO base64/dataURL (33% less RAM)
 * ✅ Concurrency 2 (prevents memory spikes)
 * ✅ Multipart upload for large files (>5MB)
 * ✅ objectURL for previews (revoke immediately)
 * ✅ No localStorage/IndexedDB for raw data
 * ✅ Wake lock (optional, prevents screen sleep)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '../utils/logger';
import { getApiBaseUrl } from '../utils/apiUrl';

// Constants
const CONCURRENCY = 2; // Max parallel uploads (iOS safe)
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks for multipart
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Types
export interface UploadTask {
  id: string;
  file: File;
  objectURL: string; // For preview (revoke after use!)
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  url?: string;
  error?: string;
  retries: number;
}

export interface UseStreamUploadOptions {
  protocolId: string;
  mediaType: 'vehicle' | 'document' | 'damage' | 'odometer' | 'fuel';
  protocolType?: 'handover' | 'return';
  onProgress?: (completed: number, total: number) => void;
  onComplete?: (urls: string[]) => void;
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

  // Cleanup objectURLs on unmount
  useEffect(() => {
    return () => {
      tasks.forEach(task => {
        if (task.objectURL) {
          URL.revokeObjectURL(task.objectURL);
        }
      });
    };
  }, [tasks]);

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
    async (task: UploadTask, signal: AbortSignal): Promise<string> => {
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
        // Create tasks with objectURL previews
        const newTasks: UploadTask[] = files.map(file => ({
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file,
          objectURL: URL.createObjectURL(file), // ✅ For preview only!
          status: 'pending',
          progress: 0,
          retries: 0,
        }));

        setTasks(newTasks);

        // Upload queue with concurrency 2
        const queue = [...newTasks];
        const active = new Set<Promise<void>>();
        const results: string[] = [];
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

                // Upload
                const url = await uploadFile(
                  task,
                  abortControllerRef.current!.signal
                );

                // Success
                setTasks(prev =>
                  prev.map(t =>
                    t.id === task.id
                      ? { ...t, status: 'completed', url, progress: 100 }
                      : t
                  )
                );

                results.push(url);
                completed++;
                options.onProgress?.(completed, files.length);

                // ✅ Revoke objectURL immediately after upload
                URL.revokeObjectURL(task.objectURL);
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
                  URL.revokeObjectURL(task.objectURL);
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

    // Revoke all objectURLs
    tasks.forEach(task => {
      if (task.objectURL) {
        URL.revokeObjectURL(task.objectURL);
      }
    });

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
 * Upload single file (< 5MB)
 */
async function uploadSingle(
  task: UploadTask,
  signal: AbortSignal,
  options: UseStreamUploadOptions
): Promise<string> {
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
  return result.url || result.publicUrl;
}

/**
 * Upload large file with multipart (> 5MB)
 * Uploads in 5MB chunks to prevent memory spikes
 */
async function uploadMultipart(
  task: UploadTask,
  signal: AbortSignal,
  options: UseStreamUploadOptions
): Promise<string> {
  const { file } = task;
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  logger.info('Starting multipart upload', {
    filename: file.name,
    size: file.size,
    chunks: totalChunks,
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
  return url;
}
