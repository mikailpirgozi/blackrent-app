/**
 * Upload Manager - HTTP/2 Parallel Upload s Retry Mechanikou
 *
 * Features:
 * - Paralelné uploady (6× súčasne pre HTTP/2 multiplex)
 * - Automatic retry s exponential backoff
 * - Progress tracking
 * - Error handling
 */

import { getApiBaseUrl } from '../utils/apiUrl';
import { logger } from '../utils/logger';

export interface UploadTask {
  id: string;
  blob: Blob;
  path: string;
  type?: string; // Backend requirement: 'protocol', 'vehicle', etc.
  entityId?: string; // Backend requirement: protocol ID
  protocolType?: string; // 'handover' | 'return'
  category?: string; // 'vehicle_photos' | 'documents' | 'damages'
  mediaType?: string; // 'vehicle' | 'document' | 'damage'
  metadata?: Record<string, unknown>;
}

export interface UploadResult {
  id: string;
  url: string;
  size: number;
  uploadTime: number;
}

export class UploadManager {
  private MAX_PARALLEL = this.detectOptimalParallelism(); // ✅ iOS ANTI-CRASH: Auto-detect
  private readonly MAX_RETRIES = 5; // ✅ INCREASED: 3 → 5 retries for weak internet
  private readonly RETRY_DELAY = 3000; // ✅ INCREASED: 2s → 3s base delay
  private readonly UPLOAD_TIMEOUT = 120000; // ✅ NEW: 120s timeout per upload (was infinite!)
  private readonly HEALTH_CHECK_TIMEOUT = 5000; // ✅ NEW: 5s timeout for health check

  /**
   * ✅ ANTI-CRASH: Detect optimal parallelism based on device
   *
   * After testing:
   * - iOS: 2 concurrent (memory limited)
   * - Safari Desktop: 3 concurrent (crashes at 6 with 19+ photos)
   * - Chrome Desktop: 4 concurrent (crashes at 6 with 38+ photos)
   */
  private detectOptimalParallelism(): number {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isLowMemory =
      (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;

    if (isIOS || isLowMemory) {
      logger.info('📱 iOS/Low Memory detected - using concurrency 2');
      return 2;
    }

    if (isSafari) {
      logger.info('🦁 Safari detected - using concurrency 3');
      return 3;
    }

    logger.info('💻 Chrome/Desktop detected - using concurrency 4');
    return 4; // Was 6, but crashes with 30+ photos
  }

  /**
   * Set adaptive parallel upload count based on device capabilities
   */
  setAdaptiveParallelism(batchSize: number): void {
    this.MAX_PARALLEL = Math.max(1, Math.min(6, batchSize));
    logger.info('Adaptive parallelism set', { maxParallel: this.MAX_PARALLEL });
  }

  /**
   * ✅ NEW: Health check - verify server is reachable before uploading
   */
  private async healthCheck(): Promise<boolean> {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.HEALTH_CHECK_TIMEOUT
      );

      const response = await fetch(`${apiBaseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        logger.info('✅ Server health check passed');
        return true;
      }

      logger.warn('⚠️ Server health check failed', { status: response.status });
      return false;
    } catch (error) {
      logger.error('❌ Server health check error', {
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * ✅ NEW: Fetch with timeout wrapper
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      logger.warn('⏱️ Upload timeout reached', { url, timeout: timeoutMs });
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if ((error as Error).name === 'AbortError') {
        throw new Error(`Upload timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  }

  /**
   * Upload batch of files in parallel with adaptive sizing
   */
  async uploadBatch(
    tasks: UploadTask[],
    onProgress?: (
      completed: number,
      total: number,
      currentTask?: string
    ) => void,
    adaptiveBatchSize?: number
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    const failedUploads: Array<{ task: UploadTask; error: string }> = [];
    let completed = 0;

    // ✅ NEW: Health check before starting uploads
    logger.info('🏥 Performing server health check before upload...');
    const isHealthy = await this.healthCheck();
    if (!isHealthy) {
      logger.error('❌ Server health check failed - aborting upload');
      throw new Error(
        'Server is not reachable. Please check your internet connection and try again.'
      );
    }

    // Use adaptive batch size if provided
    const parallelCount = adaptiveBatchSize || this.MAX_PARALLEL;

    logger.info('Starting adaptive batch upload', {
      totalTasks: tasks.length,
      parallelCount,
      adaptive: !!adaptiveBatchSize,
    });

    // Upload v adaptívnych dávkach
    for (let i = 0; i < tasks.length; i += parallelCount) {
      const batch = tasks.slice(i, i + parallelCount);

      logger.debug('Uploading adaptive batch', {
        batchIndex: Math.floor(i / parallelCount) + 1,
        batchSize: batch.length,
        parallelCount,
      });

      // ✅ FIX: Use Promise.allSettled to handle failures gracefully
      const batchResults = await Promise.allSettled(
        batch.map(task => this.uploadWithRetry(task, onProgress))
      );

      // ✅ CRITICAL FIX: Preserve array indices for failed uploads
      // Frontend expects uploadResults[i] to match uploadTasks[i]
      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          const task = batch[idx];
          if (task) {
            failedUploads.push({
              task,
              error: result.reason?.message || 'Unknown error',
            });
            logger.error('❌ Upload failed after all retries', {
              path: task.path,
              id: task.id,
              error: result.reason?.message,
            });

            // ✅ CRITICAL: Push null placeholder to maintain array indices
            // This ensures uploadResults[i] matches uploadTasks[i]
            results.push(null as any);
          }
        }
      });

      completed += batch.length;
      onProgress?.(completed, tasks.length);

      logger.debug('Batch upload completed', {
        completed,
        total: tasks.length,
        successful: results.length,
        failed: failedUploads.length,
      });
    }

    logger.info('Adaptive batch upload complete', {
      totalUploaded: results.length,
      totalFailed: failedUploads.length,
      successRate: `${((results.length / tasks.length) * 100).toFixed(1)}%`,
      totalSize: results.reduce((sum, r) => sum + r.size, 0),
      totalTime: results.reduce((sum, r) => sum + r.uploadTime, 0),
      avgTimePerFile:
        results.length > 0
          ? (
              results.reduce((sum, r) => sum + r.uploadTime, 0) / results.length
            ).toFixed(0) + 'ms'
          : '0ms',
    });

    // ✅ Log failed uploads for debugging
    if (failedUploads.length > 0) {
      logger.warn('Some uploads failed after all retries', {
        failedCount: failedUploads.length,
        failedUploads: failedUploads.map(f => ({
          id: f.task.id,
          path: f.task.path,
          size: f.task.blob.size,
          error: f.error,
        })),
      });
    }

    return results;
  }

  /**
   * Upload single file with retry logic
   */
  private async uploadWithRetry(
    task: UploadTask,
    onProgress?: (
      completed: number,
      total: number,
      currentTask?: string
    ) => void
  ): Promise<UploadResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const startTime = Date.now();
        onProgress?.(
          0,
          0,
          `Uploading ${task.path} (attempt ${attempt}/${this.MAX_RETRIES})`
        );

        const url = await this.uploadToR2(task);
        const uploadTime = Date.now() - startTime;

        logger.info('Upload successful', {
          id: task.id,
          path: task.path,
          size: task.blob.size,
          uploadTime,
          attempt,
        });

        return {
          id: task.id,
          url,
          size: task.blob.size,
          uploadTime,
        };
      } catch (error) {
        lastError = error as Error;
        const errorMessage = lastError.message || 'Unknown error';

        // ✅ NEW: Classify error type for better handling
        const isNetworkError =
          errorMessage.includes('fetch') ||
          errorMessage.includes('network') ||
          errorMessage.includes('timeout') ||
          lastError.name === 'AbortError' ||
          lastError.name === 'TypeError';

        const isServerError =
          errorMessage.includes('500') ||
          errorMessage.includes('502') ||
          errorMessage.includes('503') ||
          errorMessage.includes('504');

        logger.warn('Upload failed, analyzing error...', {
          id: task.id,
          path: task.path,
          attempt,
          error: errorMessage,
          errorType: isNetworkError
            ? 'network'
            : isServerError
              ? 'server'
              : 'unknown',
          retryable: attempt < this.MAX_RETRIES,
        });

        if (attempt < this.MAX_RETRIES) {
          // ✅ NEW: Adaptive retry delay based on error type
          let baseDelay = this.RETRY_DELAY * Math.pow(2, attempt - 1);

          // Network errors: longer delay (might be internet issue)
          if (isNetworkError) {
            baseDelay *= 1.5;
            logger.info('🌐 Network error detected - using longer retry delay');
          }

          // Server errors: shorter delay (server might recover quickly)
          if (isServerError) {
            baseDelay *= 0.75;
            logger.info('🖥️ Server error detected - using shorter retry delay');
          }

          const jitter = Math.random() * 1000; // Add 0-1s random jitter to prevent thundering herd
          const delay = baseDelay + jitter;

          logger.info('⏳ Retrying upload after delay', {
            attempt,
            nextAttempt: attempt + 1,
            maxRetries: this.MAX_RETRIES,
            delay: Math.round(delay),
            id: task.id,
            errorType: isNetworkError
              ? 'network'
              : isServerError
                ? 'server'
                : 'unknown',
          });

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    const errorMessage = `Upload failed after ${this.MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`;
    logger.error(errorMessage, { id: task.id, path: task.path });
    throw new Error(errorMessage);
  }

  /**
   * Upload to R2 via backend API
   */
  private async uploadToR2(task: UploadTask): Promise<string> {
    const formData = new FormData();

    // Create File from Blob with proper filename
    const file = new File(
      [task.blob],
      task.path.split('/').pop() || 'upload.webp',
      {
        type: task.blob.type || 'image/webp',
      }
    );

    formData.append('file', file);

    // Backend required fields
    formData.append('type', task.type || 'protocol');
    formData.append('entityId', task.entityId || 'unknown');

    // Optional fields
    if (task.protocolType) {
      formData.append('protocolType', task.protocolType);
    }
    if (task.category) {
      formData.append('category', task.category);
    }
    if (task.mediaType) {
      formData.append('mediaType', task.mediaType);
    }
    if (task.metadata) {
      formData.append('metadata', JSON.stringify(task.metadata));
    }

    const token =
      localStorage.getItem('blackrent_token') ||
      sessionStorage.getItem('blackrent_token');

    if (!token) {
      throw new Error('No authentication token found');
    }

    const apiBaseUrl = getApiBaseUrl();

    // ✅ NEW: Use fetchWithTimeout instead of plain fetch
    const response = await this.fetchWithTimeout(
      `${apiBaseUrl}/files/upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
      this.UPLOAD_TIMEOUT
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const result = await response.json();

    if (!result.url && !result.publicUrl) {
      throw new Error('Upload response missing URL');
    }

    return result.url || result.publicUrl;
  }
}
