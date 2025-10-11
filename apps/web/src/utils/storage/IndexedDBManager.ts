/**
 * Enterprise IndexedDB Manager for PWA - ANTI-CRASH iOS
 *
 * ✅ NO raw data storage (only metadata)
 * ✅ NO base64 storage (causes crashes on iOS)
 * ✅ Stores protocol drafts for crash recovery
 * ✅ Stores offline upload queue for Background Sync
 * ✅ Minimal memory footprint
 * ✅ Survives page reloads and app restarts
 */

import { logger } from '../logger';

// Types
export interface ImageMetadata {
  id: string;
  protocolId: string;
  filename: string;
  type: string; // 'vehicle' | 'document' | 'damage' | 'fuel' | 'odometer'
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
  url?: string; // R2 URL after upload
  timestamp: number;
  size: number;
  // ❌ REMOVED: blob (never store raw data in IndexedDB for iOS)
}

export interface ProtocolDraft {
  protocolId: string;
  formData: Record<string, unknown>;
  images: string[]; // Image IDs
  uploadedCount: number;
  totalCount: number;
  timestamp: number;
  lastModified: number;
}

export interface QueueTask {
  id: string;
  // ❌ REMOVED: blob (never queue raw data for iOS)
  url: string; // R2 URL to upload
  filename: string;
  type: string; // 'protocol', 'vehicle', etc.
  entityId: string; // Protocol ID
  protocolType: 'handover' | 'return';
  mediaType: string; // 'vehicle' | 'document' | 'damage'
  category?: string;
  metadata?: Record<string, unknown>;
  apiBaseUrl: string;
  token: string;
  timestamp: number;
  retries: number;
  lastError?: string;
  lastAttempt?: number;
}

export class IndexedDBManager {
  private dbName = 'blackrent-protocols';
  private version = 1;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize IndexedDB connection
   */
  async init(): Promise<IDBDatabase> {
    // Return existing promise if initialization is in progress
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return existing db if already initialized
    if (this.db) {
      return Promise.resolve(this.db);
    }

    // Check if indexedDB is available
    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('IndexedDB is not available in this environment');
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        logger.error('IndexedDB initialization failed', {
          error: request.error,
        });
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.info('✅ IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        logger.info('🔧 IndexedDB upgrade needed, creating object stores');

        // Object store: images
        if (!db.objectStoreNames.contains('images')) {
          const imageStore = db.createObjectStore('images', { keyPath: 'id' });
          imageStore.createIndex('protocolId', 'protocolId', { unique: false });
          imageStore.createIndex('uploadStatus', 'uploadStatus', {
            unique: false,
          });
          imageStore.createIndex('timestamp', 'timestamp', { unique: false });
          logger.debug('Created object store: images');
        }

        // Object store: drafts
        if (!db.objectStoreNames.contains('drafts')) {
          const draftStore = db.createObjectStore('drafts', {
            keyPath: 'protocolId',
          });
          draftStore.createIndex('timestamp', 'timestamp', { unique: false });
          logger.debug('Created object store: drafts');
        }

        // Object store: queue (for Background Sync)
        if (!db.objectStoreNames.contains('queue')) {
          const queueStore = db.createObjectStore('queue', { keyPath: 'id' });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          queueStore.createIndex('retries', 'retries', { unique: false });
          queueStore.createIndex('entityId', 'entityId', { unique: false });
          logger.debug('Created object store: queue');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Ensure DB is initialized before operations
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // ==================== IMAGES ====================

  /**
   * Save image metadata (NO raw data!)
   */
  async saveImageMetadata(metadata: ImageMetadata): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('images', 'readwrite');
      const store = tx.objectStore('images');
      const request = store.put(metadata);

      request.onsuccess = () => {
        logger.debug('Image metadata saved', { imageId: metadata.id });
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get image metadata by ID
   */
  async getImageMetadata(imageId: string): Promise<ImageMetadata | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('images', 'readonly');
      const store = tx.objectStore('images');
      const request = store.get(imageId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all image metadata for a protocol
   */
  async getProtocolImageMetadata(protocolId: string): Promise<ImageMetadata[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('images', 'readonly');
      const store = tx.objectStore('images');
      const index = store.index('protocolId');
      const request = index.getAll(IDBKeyRange.only(protocolId));

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete image
   */
  async deleteImage(imageId: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('images', 'readwrite');
      const store = tx.objectStore('images');
      const request = store.delete(imageId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== DRAFTS ====================

  /**
   * Save protocol draft
   */
  async saveDraft(draft: ProtocolDraft): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite');
      const store = tx.objectStore('drafts');
      const request = store.put({
        ...draft,
        lastModified: Date.now(),
      });

      request.onsuccess = () => {
        logger.debug('Draft saved to IndexedDB', {
          protocolId: draft.protocolId,
        });
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get protocol draft
   */
  async getDraft(protocolId: string): Promise<ProtocolDraft | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readonly');
      const store = tx.objectStore('drafts');
      const request = store.get(protocolId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all drafts
   */
  async getAllDrafts(): Promise<ProtocolDraft[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readonly');
      const store = tx.objectStore('drafts');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete protocol draft
   */
  async deleteDraft(protocolId: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite');
      const store = tx.objectStore('drafts');
      const request = store.delete(protocolId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== QUEUE ====================

  /**
   * Add task to upload queue
   */
  async addToQueue(
    task: Omit<QueueTask, 'timestamp' | 'retries'>
  ): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('queue', 'readwrite');
      const store = tx.objectStore('queue');
      const request = store.put({
        ...task,
        timestamp: Date.now(),
        retries: 0,
      });

      request.onsuccess = () => {
        logger.info('Task added to upload queue', {
          taskId: task.id,
          filename: task.filename,
        });
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all queued tasks
   */
  async getQueuedTasks(): Promise<QueueTask[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('queue', 'readonly');
      const store = tx.objectStore('queue');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get queued tasks for specific protocol
   */
  async getProtocolQueuedTasks(protocolId: string): Promise<QueueTask[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('queue', 'readonly');
      const store = tx.objectStore('queue');
      const index = store.index('entityId');
      const request = index.getAll(IDBKeyRange.only(protocolId));

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update queue task with error
   */
  async updateQueueTaskError(
    taskId: string,
    errorMessage: string
  ): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('queue', 'readwrite');
      const store = tx.objectStore('queue');
      const getRequest = store.get(taskId);

      getRequest.onsuccess = () => {
        const task = getRequest.result;
        if (!task) {
          reject(new Error(`Task ${taskId} not found`));
          return;
        }

        task.retries = (task.retries || 0) + 1;
        task.lastError = errorMessage;
        task.lastAttempt = Date.now();

        const putRequest = store.put(task);
        putRequest.onsuccess = () => {
          logger.warn('Queue task updated with error', {
            taskId,
            retries: task.retries,
            error: errorMessage,
          });
          resolve();
        };
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Remove task from queue
   */
  async removeFromQueue(taskId: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('queue', 'readwrite');
      const store = tx.objectStore('queue');
      const request = store.delete(taskId);

      request.onsuccess = () => {
        logger.info('Task removed from queue', { taskId });
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== CLEANUP ====================

  /**
   * Clear all data for a protocol
   */
  async clearProtocolData(protocolId: string): Promise<void> {
    const db = await this.ensureDB();

    await Promise.all([
      // Clear images
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction('images', 'readwrite');
        const store = tx.objectStore('images');
        const index = store.index('protocolId');
        const request = index.openCursor(IDBKeyRange.only(protocolId));

        request.onsuccess = event => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => reject(request.error);
      }),

      // Clear draft
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction('drafts', 'readwrite');
        const store = tx.objectStore('drafts');
        const request = store.delete(protocolId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),

      // Clear queue tasks
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction('queue', 'readwrite');
        const store = tx.objectStore('queue');
        const index = store.index('entityId');
        const request = index.openCursor(IDBKeyRange.only(protocolId));

        request.onsuccess = event => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => reject(request.error);
      }),
    ]);

    logger.info('✅ Protocol data cleared from IndexedDB', { protocolId });
  }

  /**
   * Clear all data (use with caution!)
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureDB();

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction('images', 'readwrite');
        const request = tx.objectStore('images').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction('drafts', 'readwrite');
        const request = tx.objectStore('drafts').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction('queue', 'readwrite');
        const request = tx.objectStore('queue').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
    ]);

    logger.warn('⚠️ All IndexedDB data cleared');
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    imageCount: number;
    draftCount: number;
    queueCount: number;
    estimatedSize: number;
  }> {
    const db = await this.ensureDB();

    const [images, drafts, queueTasks] = await Promise.all([
      new Promise<number>((resolve, reject) => {
        const tx = db.transaction('images', 'readonly');
        const request = tx.objectStore('images').count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
      new Promise<number>((resolve, reject) => {
        const tx = db.transaction('drafts', 'readonly');
        const request = tx.objectStore('drafts').count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
      new Promise<number>((resolve, reject) => {
        const tx = db.transaction('queue', 'readonly');
        const request = tx.objectStore('queue').count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
    ]);

    // Estimate size (rough approximation)
    const estimatedSize =
      images * 500000 + drafts * 50000 + queueTasks * 500000; // ~500KB per image, ~50KB per draft

    return {
      imageCount: images,
      draftCount: drafts,
      queueCount: queueTasks,
      estimatedSize,
    };
  }

  // ==================== PDF METADATA ====================
  // ❌ REMOVED: PDF blob storage (causes iOS crashes)
  // ✅ NEW: PDFs generated directly from R2 URLs
  // No temporary storage needed - just use pdfUrl from protocol images
}

// Singleton instance
export const indexedDBManager = new IndexedDBManager();
