/**
 * Image Processor - wrapper pre Web Worker
 *
 * Paralelne spracováva fotky pomocou Web Workera s GPU acceleration
 */

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
    pdf: { format: 'jpeg'; quality: number; maxWidth: number; maxHeight: number };
  };
}

export class ImageProcessor {
  private worker: Worker | null = null;
  private taskQueue: Map<string, (result: ProcessImageResult) => void> =
    new Map();
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
          // Reject promise if we had one waiting
          const resolver = this.taskQueue.get(id);
          if (resolver) {
            this.taskQueue.delete(id);
          }
          return;
        }

        // 🎯 FIX: Pass complete data object INCLUDING id!
        const resolver = this.taskQueue.get(id);
        if (resolver) {
          resolver(data as ProcessImageResult);
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
      const id = crypto.randomUUID();
      this.taskQueue.set(id, resolve);

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
    let completed = 0;

    // Process v dávkach po 6 (optimálne pre väčšinu zariadení)
    const BATCH_SIZE = 6;

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

      const batchResults = await Promise.all(
        batch.map(file => this.processImage(file))
      );

      results.push(...batchResults);
      completed += batch.length;
      onProgress?.(completed, files.length);

      logger.debug('Batch completed', { completed, total: files.length });
    }

    logger.info('Batch processing complete', {
      totalProcessed: results.length,
      totalSize: results.reduce((sum, r) => sum + r.gallery.size, 0),
    });

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
