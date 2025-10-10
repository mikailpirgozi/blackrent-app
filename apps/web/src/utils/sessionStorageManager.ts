/**
 * SessionStorage Manager pre dočasné PDF data
 * 
 * Ukladá komprimované JPEG base64 stringy do SessionStorage
 * pre okamžité PDF generovanie bez nutnosti sťahovania z R2
 */

import { logger } from './logger';

const PDF_IMAGES_PREFIX = 'pdf_img_';
const MAX_SESSION_SIZE = 50 * 1024 * 1024; // 50MB limit

export class SessionStorageManager {
  /**
   * Save PDF image base64 to SessionStorage
   */
  static savePDFImage(imageId: string, base64: string): void {
    try {
      const key = `${PDF_IMAGES_PREFIX}${imageId}`;
      sessionStorage.setItem(key, base64);

      // Check size
      const size = this.getStorageSize();
      if (size > MAX_SESSION_SIZE) {
        logger.warn('SessionStorage approaching limit', {
          size,
          maxSize: MAX_SESSION_SIZE,
          percentage: ((size / MAX_SESSION_SIZE) * 100).toFixed(1) + '%',
        });
      }

      logger.debug('PDF image saved to SessionStorage', {
        imageId,
        size: base64.length,
      });
    } catch (error) {
      logger.error('Failed to save PDF image to SessionStorage', {
        error,
        imageId,
      });

      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error(
          'SessionStorage full - cannot save PDF images. Try closing other tabs or clearing browser data.'
        );
      }

      throw error;
    }
  }

  /**
   * Get PDF image base64 from SessionStorage
   */
  static getPDFImage(imageId: string): string | null {
    const key = `${PDF_IMAGES_PREFIX}${imageId}`;
    return sessionStorage.getItem(key);
  }

  /**
   * Get all PDF images as Map
   */
  static getAllPDFImages(): Map<string, string> {
    const images = new Map<string, string>();

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(PDF_IMAGES_PREFIX)) {
        const imageId = key.substring(PDF_IMAGES_PREFIX.length);
        const base64 = sessionStorage.getItem(key);
        if (base64) {
          images.set(imageId, base64);
        }
      }
    }

    logger.debug('Retrieved all PDF images from SessionStorage', {
      count: images.size,
    });

    return images;
  }

  /**
   * Clear all PDF images from SessionStorage
   */
  static clearPDFImages(): void {
    const keysToRemove: string[] = [];

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(PDF_IMAGES_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => sessionStorage.removeItem(key));

    logger.info('SessionStorage PDF images cleared', {
      count: keysToRemove.length,
    });
  }

  /**
   * Get current SessionStorage size in bytes
   */
  private static getStorageSize(): number {
    let size = 0;

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        const item = sessionStorage.getItem(key);
        if (item) {
          // Each char is 2 bytes in JS string
          size += (item.length + key.length) * 2;
        }
      }
    }

    return size;
  }

  /**
   * Get formatted storage size
   */
  static getStorageSizeFormatted(): string {
    const size = this.getStorageSize();
    const mb = size / (1024 * 1024);

    if (mb < 1) {
      return `${(size / 1024).toFixed(2)} KB`;
    }

    return `${mb.toFixed(2)} MB`;
  }

  /**
   * Check if SessionStorage has enough space for new data
   */
  static hasSpace(estimatedSize: number): boolean {
    const currentSize = this.getStorageSize();
    return currentSize + estimatedSize < MAX_SESSION_SIZE;
  }

  /**
   * Get storage stats
   */
  static getStats(): {
    used: number;
    usedFormatted: string;
    max: number;
    maxFormatted: string;
    available: number;
    availableFormatted: string;
    percentUsed: number;
    imageCount: number;
  } {
    const used = this.getStorageSize();
    const available = MAX_SESSION_SIZE - used;
    const imageCount = this.getAllPDFImages().size;

    return {
      used,
      usedFormatted: this.formatBytes(used),
      max: MAX_SESSION_SIZE,
      maxFormatted: this.formatBytes(MAX_SESSION_SIZE),
      available,
      availableFormatted: this.formatBytes(available),
      percentUsed: (used / MAX_SESSION_SIZE) * 100,
      imageCount,
    };
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }
}

