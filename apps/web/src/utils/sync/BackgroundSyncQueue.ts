/**
 * Background Sync Queue Manager
 *
 * Manages offline upload queue with PWA Background Sync API
 * - Automatically retries failed uploads when device comes online
 * - Persists queue in IndexedDB
 * - Integrates with Service Worker Background Sync
 */

import { indexedDBManager, type QueueTask } from '../storage/IndexedDBManager';
import { logger } from '../logger';
import { getApiBaseUrl } from '../apiUrl';

export class BackgroundSyncQueue {
  /**
   * Add upload task to queue
   * Will be automatically processed by Service Worker when online
   */
  async enqueue(
    blob: Blob,
    filename: string,
    metadata: {
      entityId: string; // Protocol ID
      protocolType: 'handover' | 'return';
      mediaType: string; // 'vehicle' | 'document' | 'damage'
      type?: string;
      category?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    // Get auth token
    const token =
      localStorage.getItem('blackrent_token') ||
      sessionStorage.getItem('blackrent_token');

    if (!token) {
      throw new Error('No authentication token found');
    }

    // ✅ ANTI-CRASH: Create objectURL instead of storing blob
    const objectURL = URL.createObjectURL(blob);

    // Create queue task (with objectURL, not blob)
    const task: Omit<QueueTask, 'timestamp' | 'retries'> = {
      id: globalThis.crypto.randomUUID(),
      url: objectURL, // ✅ Store objectURL, not blob
      filename,
      type: metadata.type || 'protocol',
      entityId: metadata.entityId,
      protocolType: metadata.protocolType,
      mediaType: metadata.mediaType,
      category: metadata.category,
      metadata: metadata.metadata,
      apiBaseUrl: getApiBaseUrl(),
      token,
    };

    // Save to IndexedDB
    await indexedDBManager.addToQueue(task);

    logger.info('📤 Task added to upload queue', {
      filename,
      entityId: metadata.entityId,
    });

    // Register Background Sync if available (PWA)
    await this.registerSync();
  }

  /**
   * Register Background Sync event
   * Service Worker will process queue when online
   */
  private async registerSync(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
      logger.debug(
        'Background Sync not available, queue will be processed manually'
      );
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      if ('sync' in registration) {
        // @ts-expect-error - sync API not in TypeScript types yet
        await registration.sync.register('upload-protocol-images');
        logger.info(
          '✅ Background Sync registered - uploads will retry automatically'
        );
      }
    } catch (error) {
      logger.error('Failed to register background sync', { error });
      // Don't throw - queue is still saved, can be processed manually
    }
  }

  /**
   * Get all queued tasks
   */
  async getQueuedTasks(): Promise<QueueTask[]> {
    return await indexedDBManager.getQueuedTasks();
  }

  /**
   * Get queued tasks for specific protocol
   */
  async getProtocolQueuedTasks(protocolId: string): Promise<QueueTask[]> {
    return await indexedDBManager.getProtocolQueuedTasks(protocolId);
  }

  /**
   * Manually process queue (fallback if Background Sync not available)
   * Use this when user manually clicks "Retry" button
   */
  async processQueue(): Promise<{
    success: number;
    failed: number;
    errors: Array<{ filename: string; error: string }>;
  }> {
    const tasks = await this.getQueuedTasks();

    if (tasks.length === 0) {
      logger.debug('Queue empty, nothing to process');
      return { success: 0, failed: 0, errors: [] };
    }

    logger.info(`Processing ${tasks.length} queued uploads manually`);

    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ filename: string; error: string }> = [];

    for (const task of tasks) {
      try {
        await this.uploadTask(task);
        await indexedDBManager.removeFromQueue(task.id);
        successCount++;
        logger.info(`✅ Uploaded: ${task.filename}`);
      } catch (error) {
        failedCount++;
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push({ filename: task.filename, error: errorMsg });

        // Update task with error
        await indexedDBManager.updateQueueTaskError(task.id, errorMsg);

        logger.error(`❌ Failed to upload: ${task.filename}`, { error });
      }
    }

    logger.info(
      `Queue processing complete: ${successCount} success, ${failedCount} failed`
    );

    return { success: successCount, failed: failedCount, errors };
  }

  /**
   * Upload single task
   */
  private async uploadTask(task: QueueTask): Promise<unknown> {
    // ✅ ANTI-CRASH: Fetch blob from objectURL
    const response = await fetch(task.url);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append('file', blob, task.filename);
    formData.append('type', task.type);
    formData.append('entityId', task.entityId);
    formData.append('protocolType', task.protocolType);
    formData.append('mediaType', task.mediaType);

    if (task.category) {
      formData.append('category', task.category);
    }

    if (task.metadata) {
      formData.append('metadata', JSON.stringify(task.metadata));
    }

    const uploadResponse = await fetch(`${task.apiBaseUrl}/files/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${task.token}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse
        .text()
        .catch(() => 'Unknown error');
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    // ✅ Revoke objectURL after successful upload
    URL.revokeObjectURL(task.url);

    return await uploadResponse.json();
  }

  /**
   * Clear queue for specific protocol
   */
  async clearProtocolQueue(protocolId: string): Promise<void> {
    const tasks = await this.getProtocolQueuedTasks(protocolId);

    await Promise.all(
      tasks.map(task => indexedDBManager.removeFromQueue(task.id))
    );

    logger.info(
      `Cleared ${tasks.length} queued tasks for protocol ${protocolId}`
    );
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    totalTasks: number;
    byProtocol: Record<string, number>;
    totalSize: number;
    oldestTask: Date | null;
  }> {
    const tasks = await this.getQueuedTasks();

    const byProtocol: Record<string, number> = {};
    const totalSize = 0;
    let oldestTimestamp = Date.now();

    for (const task of tasks) {
      // Count by protocol
      byProtocol[task.entityId] = (byProtocol[task.entityId] || 0) + 1;

      // ✅ ANTI-CRASH: No blob.size (we use objectURL now)
      // totalSize += task.blob.size;

      // Find oldest
      if (task.timestamp < oldestTimestamp) {
        oldestTimestamp = task.timestamp;
      }
    }

    return {
      totalTasks: tasks.length,
      byProtocol,
      totalSize,
      oldestTask: tasks.length > 0 ? new Date(oldestTimestamp) : null,
    };
  }
}

// Singleton instance
export const backgroundSyncQueue = new BackgroundSyncQueue();
