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
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2s base delay

  /**
   * ✅ iOS ANTI-CRASH: Detect optimal parallelism based on device
   */
  private detectOptimalParallelism(): number {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isLowMemory =
      (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;

    if (isIOS || isLowMemory) {
      logger.info('📱 iOS/Low Memory detected - using concurrency 2');
      return 2; // iOS: max 2 concurrent uploads
    }

    logger.info('💻 Desktop detected - using concurrency 6');
    return 6; // Desktop: 6 concurrent uploads
  }

  /**
   * Set adaptive parallel upload count based on device capabilities
   */
  setAdaptiveParallelism(batchSize: number): void {
    this.MAX_PARALLEL = Math.max(1, Math.min(6, batchSize));
    logger.info('Adaptive parallelism set', { maxParallel: this.MAX_PARALLEL });
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
    let completed = 0;

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

      const batchResults = await Promise.all(
        batch.map(task => this.uploadWithRetry(task, onProgress))
      );

      results.push(...batchResults);
      completed += batch.length;
      onProgress?.(completed, tasks.length);

      logger.debug('Batch upload completed', {
        completed,
        total: tasks.length,
      });
    }

    logger.info('Adaptive batch upload complete', {
      totalUploaded: results.length,
      totalSize: results.reduce((sum, r) => sum + r.size, 0),
      totalTime: results.reduce((sum, r) => sum + r.uploadTime, 0),
      avgTimePerFile:
        results.length > 0
          ? (
              results.reduce((sum, r) => sum + r.uploadTime, 0) / results.length
            ).toFixed(0) + 'ms'
          : '0ms',
    });

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
        logger.warn('Upload failed, retrying...', {
          id: task.id,
          path: task.path,
          attempt,
          error: lastError.message,
        });

        if (attempt < this.MAX_RETRIES) {
          // Exponential backoff: 2s, 4s, 8s
          const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
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
    const response = await fetch(`${apiBaseUrl}/files/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

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
