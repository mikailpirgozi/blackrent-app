/**
 * Image Processor - wrapper pre Web Worker
 *
 * Paralelne spracováva fotky pomocou Web Workera s GPU acceleration
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

export interface ProcessImageResult {
  id: string;
  gallery: {
    blob: Blob;
    size: number;
    width: number;
    height: number;
  };
  pdf: {
    blob: Blob; // For R2 upload + IndexedDB (only 1 version now!)
    size: number;
  };
  metadata: {
    originalSize: number;
    timestamp: number;
    gps?: { lat: number; lng: number };
  };
}

interface ProcessImageTask {
  id: string;
  file: File;
  options: {
    gallery: { format: 'webp'; quality: number; maxWidth: number };
    pdf: {
      format: 'jpeg';
      quality: number;
      maxWidth: number;
      maxHeight: number;
    };
  };
}

export class ImageProcessor {
  private worker: Worker | null = null;
  private taskQueue: Map<
    string,
    {
      resolve: (result: ProcessImageResult) => void;
      reject: (error: Error) => void;
    }
  > = new Map();
  private isReady = false;
  private readyPromise: Promise<void>;

  constructor() {
    // Initialize worker
    this.readyPromise = this.initWorker();
  }

  private async initWorker(): Promise<void> {
    try {
      // Vite handles worker imports with ?worker suffix
      this.worker = new Worker(
        new URL('../workers/imageProcessor.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = e => {
        const data = e.data;

        // Handle ready signal
        if (data.type === 'ready') {
          this.isReady = true;
          logger.debug('ImageProcessor worker ready');
          return;
        }

        // Handle task result
        const { id, error } = data;

        if (error) {
          logger.error('Worker processing error', { id, error });
          // ✅ FIX: Properly reject promise instead of just deleting it
          const task = this.taskQueue.get(id);
          if (task) {
            task.reject(new Error(`Image processing failed: ${error}`));
            this.taskQueue.delete(id);
          }
          return;
        }

        // 🎯 FIX: Pass complete data object INCLUDING id!
        const task = this.taskQueue.get(id);
        if (task) {
          task.resolve(data as ProcessImageResult);
          this.taskQueue.delete(id);
        }
      };

      this.worker.onerror = error => {
        logger.error('ImageProcessor worker error', { error });
      };

      // Wait for ready signal
      await new Promise<void>(resolve => {
        const checkReady = setInterval(() => {
          if (this.isReady) {
            clearInterval(checkReady);
            resolve();
          }
        }, 100);

        // Timeout after 5s
        setTimeout(() => {
          clearInterval(checkReady);
          if (!this.isReady) {
            logger.warn('Worker did not signal ready, continuing anyway');
            this.isReady = true;
            resolve();
          }
        }, 5000);
      });
    } catch (error) {
      logger.error('Failed to initialize ImageProcessor worker', { error });
      throw error;
    }
  }

  /**
   * Process single image
   */
  async processImage(file: File): Promise<ProcessImageResult> {
    await this.readyPromise;

    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    return new Promise((resolve, reject) => {
      const id = uuidv4();
      this.taskQueue.set(id, { resolve, reject }); // ✅ FIX: Store both resolve and reject

      const task: ProcessImageTask = {
        id,
        file,
        options: {
          gallery: { format: 'webp', quality: 0.95, maxWidth: 1920 },
          pdf: { format: 'jpeg', quality: 0.9, maxWidth: 800, maxHeight: 600 },
        },
      };

      this.worker!.postMessage(task);

      // Timeout after 30s
      setTimeout(() => {
        if (this.taskQueue.has(id)) {
          this.taskQueue.delete(id);
          reject(new Error(`Image processing timeout for ${file.name}`));
        }
      }, 30000);
    });
  }

  /**
   * Process batch of images in parallel batches
   */
  async processBatch(
    files: File[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<ProcessImageResult[]> {
    const results: ProcessImageResult[] = [];
    const failedFiles: Array<{ file: File; error: string }> = [];
    let completed = 0;

    // ✅ ANTI-CRASH: Universal safe batch size for all devices
    // iOS/Low Memory: 2 concurrent
    // Safari: 3 concurrent (better than Chrome but still limited)
    // Chrome/Desktop: 4 concurrent (was 6, but crashes with 30+ photos)
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory;
    const isLowMemory = deviceMemory !== undefined && deviceMemory < 4;

    const BATCH_SIZE = isIOS || isLowMemory ? 2 : isSafari ? 3 : 4;

    logger.info('Starting batch image processing', {
      totalFiles: files.length,
      batchSize: BATCH_SIZE,
    });

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);

      logger.debug('Processing batch', {
        batchIndex: Math.floor(i / BATCH_SIZE) + 1,
        batchSize: batch.length,
      });

      // ✅ FIX: Use Promise.allSettled to handle failures gracefully
      const batchResults = await Promise.allSettled(
        batch.map(file => this.processImage(file))
      );

      // Separate successful and failed results
      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          const file = batch[idx];
          if (file) {
            failedFiles.push({
              file,
              error: result.reason?.message || 'Unknown error',
            });
            logger.error('Image processing failed', {
              filename: file.name,
              error: result.reason?.message,
            });
          }
        }
      });

      completed += batch.length;
      onProgress?.(completed, files.length);

      logger.debug('Batch completed', {
        completed,
        total: files.length,
        successful: results.length,
        failed: failedFiles.length,
      });
    }

    logger.info('Batch processing complete', {
      totalProcessed: results.length,
      totalFailed: failedFiles.length,
      successRate: `${((results.length / files.length) * 100).toFixed(1)}%`,
      totalSize: results.reduce((sum, r) => sum + r.gallery.size, 0),
    });

    // ✅ Log failed files for debugging
    if (failedFiles.length > 0) {
      logger.warn('Some images failed to process', {
        failedCount: failedFiles.length,
        failedFiles: failedFiles.map(f => ({
          name: f.file.name,
          size: f.file.size,
          error: f.error,
        })),
      });
    }

    return results;
  }

  /**
   * Destroy worker and cleanup
   */
  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.taskQueue.clear();
      this.isReady = false;
      logger.debug('ImageProcessor worker terminated');
    }
  }
}
