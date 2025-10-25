/**
 * Offline Queue Manager
 *
 * IndexedDB-based queue pre offline support
 * Automaticky sync-uje keď je zariadenie online
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { logger } from '../utils/logger';
import { apiService } from './api';

interface QueueItem {
  id: string;
  type: 'protocol' | 'upload';
  data: unknown;
  retries: number;
  createdAt: number;
  lastAttempt?: number;
}

interface OfflineDB extends DBSchema {
  queue: {
    key: string;
    value: QueueItem;
    indexes: { 'by-type': string; 'by-created': number };
  };
}

export class OfflineQueueManager {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private readonly DB_NAME = 'blackrent-offline';
  private readonly DB_VERSION = 1;
  private readonly MAX_RETRIES = 5;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    if (this.db) return;

    try {
      this.db = await openDB<OfflineDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          // Create queue store if it doesn't exist
          if (!db.objectStoreNames.contains('queue')) {
            const queueStore = db.createObjectStore('queue', { keyPath: 'id' });
            queueStore.createIndex('by-type', 'type');
            queueStore.createIndex('by-created', 'createdAt');
          }
        },
      });

      logger.info('OfflineQueueManager initialized', {
        dbName: this.DB_NAME,
        version: this.DB_VERSION,
      });
    } catch (error) {
      logger.error('Failed to initialize OfflineQueueManager', { error });
      throw error;
    }
  }

  /**
   * Add item to queue
   */
  async addToQueue(
    type: 'protocol' | 'upload',
    data: unknown
  ): Promise<string> {
    if (!this.db) await this.init();

    const item: QueueItem = {
      id: globalThis.crypto.randomUUID(),
      type,
      data,
      retries: 0,
      createdAt: Date.now(),
    };

    await this.db!.add('queue', item);

    logger.info('Added to offline queue', {
      id: item.id,
      type,
    });

    return item.id;
  }

  /**
   * Process all queued items
   */
  async processQueue(): Promise<void> {
    if (!this.db) await this.init();

    const items = await this.db!.getAll('queue');

    if (items.length === 0) {
      logger.debug('Queue is empty, nothing to process');
      return;
    }

    logger.info('Processing offline queue', { itemCount: items.length });

    for (const item of items) {
      try {
        await this.processQueueItem(item);

        // Success - remove from queue
        await this.db!.delete('queue', item.id);

        logger.info('Queue item processed successfully', {
          id: item.id,
          type: item.type,
        });
      } catch (error) {
        // Failed - increment retries
        item.retries++;
        item.lastAttempt = Date.now();

        logger.warn('Queue item processing failed', {
          id: item.id,
          type: item.type,
          retries: item.retries,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        if (item.retries >= this.MAX_RETRIES) {
          // Max retries reached - remove from queue
          await this.db!.delete('queue', item.id);

          logger.error('Queue item failed after max retries', {
            id: item.id,
            type: item.type,
            maxRetries: this.MAX_RETRIES,
          });
        } else {
          // Update item with new retry count
          await this.db!.put('queue', item);
        }
      }
    }

    logger.info('Queue processing complete');
  }

  /**
   * Process single queue item
   */
  private async processQueueItem(item: QueueItem): Promise<void> {
    switch (item.type) {
      case 'protocol':
        // Process protocol creation
        await apiService.createHandoverProtocol(
          item.data as Parameters<typeof apiService.createHandoverProtocol>[0]
        );
        break;

      case 'upload':
        // Process file upload
        await apiService.uploadFile(
          item.data as Parameters<typeof apiService.uploadFile>[0]
        );
        break;

      default:
        throw new Error(`Unknown queue item type: ${item.type}`);
    }
  }

  /**
   * Get queue size
   */
  async getQueueSize(): Promise<number> {
    if (!this.db) await this.init();
    return this.db!.count('queue');
  }

  /**
   * Get all queue items
   */
  async getQueueItems(): Promise<QueueItem[]> {
    if (!this.db) await this.init();
    return this.db!.getAll('queue');
  }

  /**
   * Clear all queue items
   */
  async clearQueue(): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.clear('queue');
    logger.info('Queue cleared');
  }

  /**
   * Get queue stats
   */
  async getStats(): Promise<{
    total: number;
    protocols: number;
    uploads: number;
    oldestItem?: number;
  }> {
    const items = await this.getQueueItems();

    return {
      total: items.length,
      protocols: items.filter(i => i.type === 'protocol').length,
      uploads: items.filter(i => i.type === 'upload').length,
      oldestItem:
        items.length > 0 ? Math.min(...items.map(i => i.createdAt)) : undefined,
    };
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueueManager();

// Auto-process queue when device goes online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    logger.info('Device is online, processing queue...');
    offlineQueue.processQueue().catch(error => {
      logger.error('Failed to process queue on online event', { error });
    });
  });

  // Process queue on page load if online
  if (navigator.onLine) {
    offlineQueue.processQueue().catch(error => {
      logger.error('Failed to process queue on page load', { error });
    });
  }
}
