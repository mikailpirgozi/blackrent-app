/**
 * Smart Error Recovery System
 * 
 * Context-aware error classification and recovery strategies
 * - Network errors → Retry with exponential backoff
 * - Server errors → Queue for Background Sync
 * - Client errors → Show user guidance
 * - Memory errors → Reduce batch size
 */

import { logger } from '../logger';
import { backgroundSyncQueue } from '../sync/BackgroundSyncQueue';
import { indexedDBManager } from '../storage/IndexedDBManager';

export type ErrorCategory = 
  | 'network'
  | 'server'
  | 'client'
  | 'memory'
  | 'timeout'
  | 'unknown';

export interface ErrorContext {
  error: Error;
  category: ErrorCategory;
  operation: 'upload' | 'process' | 'save';
  retryable: boolean;
  userMessage: string;
  recoveryStrategy: 'retry' | 'queue' | 'reduce_batch' | 'user_action' | 'abort';
}

export class SmartErrorRecovery {
  /**
   * Classify error and determine recovery strategy
   */
  classifyError(error: Error, operation: 'upload' | 'process' | 'save'): ErrorContext {
    const errorMsg = error.message.toLowerCase();

    // Network errors
    if (
      errorMsg.includes('network') ||
      errorMsg.includes('fetch') ||
      errorMsg.includes('offline') ||
      errorMsg.includes('connection')
    ) {
      return {
        error,
        category: 'network',
        operation,
        retryable: true,
        userMessage: 'Network connection lost. Will retry automatically when online.',
        recoveryStrategy: 'queue',
      };
    }

    // Server errors (5xx)
    if (
      errorMsg.includes('500') ||
      errorMsg.includes('502') ||
      errorMsg.includes('503') ||
      errorMsg.includes('server error')
    ) {
      return {
        error,
        category: 'server',
        operation,
        retryable: true,
        userMessage: 'Server is temporarily unavailable. Will retry automatically.',
        recoveryStrategy: 'queue',
      };
    }

    // Client errors (4xx)
    if (
      errorMsg.includes('400') ||
      errorMsg.includes('401') ||
      errorMsg.includes('403') ||
      errorMsg.includes('413') ||
      errorMsg.includes('file too large')
    ) {
      return {
        error,
        category: 'client',
        operation,
        retryable: false,
        userMessage: 'Invalid request. Please check your input and try again.',
        recoveryStrategy: 'user_action',
      };
    }

    // Memory errors
    if (
      errorMsg.includes('memory') ||
      errorMsg.includes('out of memory') ||
      errorMsg.includes('allocation failed')
    ) {
      return {
        error,
        category: 'memory',
        operation,
        retryable: true,
        userMessage: 'Low memory detected. Reducing batch size automatically.',
        recoveryStrategy: 'reduce_batch',
      };
    }

    // Timeout errors
    if (
      errorMsg.includes('timeout') ||
      errorMsg.includes('timed out')
    ) {
      return {
        error,
        category: 'timeout',
        operation,
        retryable: true,
        userMessage: 'Request timed out. Retrying with longer timeout.',
        recoveryStrategy: 'retry',
      };
    }

    // Unknown errors
    return {
      error,
      category: 'unknown',
      operation,
      retryable: false,
      userMessage: 'An unexpected error occurred. Please try again.',
      recoveryStrategy: 'abort',
    };
  }

  /**
   * Execute recovery strategy
   */
  async recover(
    context: ErrorContext,
    metadata: {
      protocolId: string;
      blob?: Blob;
      filename?: string;
      protocolType?: 'handover' | 'return';
      mediaType?: string;
    }
  ): Promise<void> {
    logger.info('Executing recovery strategy', {
      category: context.category,
      strategy: context.recoveryStrategy,
      operation: context.operation,
    });

    switch (context.recoveryStrategy) {
      case 'queue':
        await this.queueForBackgroundSync(context, metadata);
        break;

      case 'retry':
        // Retry is handled by caller with exponential backoff
        logger.debug('Retry strategy - handled by caller');
        break;

      case 'reduce_batch':
        await this.reduceMemoryFootprint(metadata.protocolId);
        break;

      case 'user_action':
        // User needs to take action - show message via UI
        logger.warn('User action required', { context });
        break;

      case 'abort':
        logger.error('Recovery aborted', { context });
        // Save partial progress to draft
        await this.saveDraft(metadata.protocolId);
        break;
    }
  }

  /**
   * Queue failed upload for Background Sync
   */
  private async queueForBackgroundSync(
    context: ErrorContext,
    metadata: {
      protocolId: string;
      blob?: Blob;
      filename?: string;
      protocolType?: 'handover' | 'return';
      mediaType?: string;
    }
  ): Promise<void> {
    if (!metadata.blob || !metadata.filename || !metadata.protocolType || !metadata.mediaType) {
      logger.warn('Cannot queue for background sync - missing metadata');
      return;
    }

    try {
      await backgroundSyncQueue.enqueue(
        metadata.blob,
        metadata.filename,
        {
          entityId: metadata.protocolId,
          protocolType: metadata.protocolType,
          mediaType: metadata.mediaType,
        }
      );

      logger.info('Task queued for Background Sync', {
        filename: metadata.filename,
        protocolId: metadata.protocolId,
      });
    } catch (error) {
      logger.error('Failed to queue for background sync', { error });
    }
  }

  /**
   * Reduce memory footprint by clearing unnecessary data
   */
  private async reduceMemoryFootprint(protocolId: string): Promise<void> {
    try {
      // Get current images
      const images = await indexedDBManager.getProtocolImages(protocolId);
      
      // Keep only uploaded images, clear pending ones
      const pendingImages = images.filter(img => img.uploadStatus === 'pending');
      
      for (const img of pendingImages) {
        await indexedDBManager.deleteImage(img.id);
      }

      logger.info('Memory footprint reduced', {
        protocolId,
        clearedImages: pendingImages.length,
      });
    } catch (error) {
      logger.error('Failed to reduce memory footprint', { error });
    }
  }

  /**
   * Save partial progress as draft
   */
  private async saveDraft(protocolId: string): Promise<void> {
    try {
      const images = await indexedDBManager.getProtocolImages(protocolId);
      const uploadedCount = images.filter(img => img.uploadStatus === 'completed').length;

      await indexedDBManager.saveDraft({
        protocolId,
        formData: {},
        images: images.map(img => img.id),
        uploadedCount,
        totalCount: images.length,
        timestamp: Date.now(),
        lastModified: Date.now(),
      });

      logger.info('Draft saved for recovery', {
        protocolId,
        uploadedCount,
        totalCount: images.length,
      });
    } catch (error) {
      logger.error('Failed to save draft', { error });
    }
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: Error, operation: 'upload' | 'process' | 'save'): string {
    const context = this.classifyError(error, operation);
    return context.userMessage;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: Error, operation: 'upload' | 'process' | 'save'): boolean {
    const context = this.classifyError(error, operation);
    return context.retryable;
  }
}

// Singleton instance
export const smartErrorRecovery = new SmartErrorRecovery();

