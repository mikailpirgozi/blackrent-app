/**
 * Feature Detector & Browser Compatibility
 * 
 * Detects browser capabilities and provides fallbacks
 * - IndexedDB support
 * - Service Worker support
 * - Background Sync API
 * - Web Worker support
 * - OffscreenCanvas support
 */

import { logger } from '../logger';

export interface BrowserCapabilities {
  indexedDB: boolean;
  serviceWorker: boolean;
  backgroundSync: boolean;
  webWorker: boolean;
  offscreenCanvas: boolean;
  webp: boolean;
  modernBrowser: boolean;
  warnings: string[];
}

export class FeatureDetector {
  private capabilities: BrowserCapabilities | null = null;

  /**
   * Detect all browser capabilities
   */
  async detect(): Promise<BrowserCapabilities> {
    if (this.capabilities) {
      return this.capabilities;
    }

    const warnings: string[] = [];

    // IndexedDB
    const indexedDB = 'indexedDB' in window;
    if (!indexedDB) {
      warnings.push('IndexedDB not supported - using memory storage (limited)');
    }

    // Service Worker
    const serviceWorker = 'serviceWorker' in navigator;
    if (!serviceWorker) {
      warnings.push('Service Worker not supported - offline features disabled');
    }

    // Background Sync
    const backgroundSync = await this.checkBackgroundSync();
    if (!backgroundSync) {
      warnings.push('Background Sync not supported - using manual retry');
    }

    // Web Worker
    const webWorker = typeof Worker !== 'undefined';
    if (!webWorker) {
      warnings.push('Web Worker not supported - processing may be slower');
    }

    // OffscreenCanvas
    const offscreenCanvas = typeof OffscreenCanvas !== 'undefined';
    if (!offscreenCanvas) {
      warnings.push('OffscreenCanvas not supported - using regular canvas');
    }

    // WebP support
    const webp = await this.checkWebPSupport();
    if (!webp) {
      warnings.push('WebP not supported - using JPEG (larger files)');
    }

    // Modern browser check
    const modernBrowser = indexedDB && serviceWorker && webWorker;

    this.capabilities = {
      indexedDB,
      serviceWorker,
      backgroundSync,
      webWorker,
      offscreenCanvas,
      webp,
      modernBrowser,
      warnings,
    };

    logger.info('Browser capabilities detected', this.capabilities);

    return this.capabilities;
  }

  /**
   * Check Background Sync API support
   */
  private async checkBackgroundSync(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      return 'sync' in registration;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check WebP support
   */
  private async checkWebPSupport(): Promise<boolean> {
    return new Promise((resolve) => {
      const webpData =
        'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
      const img = new Image();

      img.onload = () => {
        resolve(img.width === 1 && img.height === 1);
      };

      img.onerror = () => {
        resolve(false);
      };

      img.src = webpData;
    });
  }

  /**
   * Get fallback strategy for missing feature
   */
  getFallback(feature: keyof BrowserCapabilities): string {
    const fallbacks: Record<string, string> = {
      indexedDB: 'Using memory storage (limited capacity)',
      serviceWorker: 'Offline features disabled',
      backgroundSync: 'Manual retry required for failed uploads',
      webWorker: 'Processing on main thread (may be slower)',
      offscreenCanvas: 'Using regular canvas (slower)',
      webp: 'Using JPEG format (larger files)',
    };

    return fallbacks[feature] || 'Feature not available';
  }

  /**
   * Check if device can handle photo processing
   */
  canProcessPhotos(): boolean {
    // Minimum requirements: basic canvas support
    return typeof document.createElement('canvas').getContext === 'function';
  }

  /**
   * Check if PWA mode is available
   */
  canInstallPWA(): boolean {
    return this.capabilities?.serviceWorker || false;
  }

  /**
   * Get recommended mode based on capabilities
   */
  getRecommendedMode(): 'pwa' | 'web' | 'legacy' {
    if (!this.capabilities) {
      return 'legacy';
    }

    if (this.capabilities.modernBrowser && this.capabilities.backgroundSync) {
      return 'pwa';
    }

    if (this.capabilities.indexedDB && this.capabilities.webWorker) {
      return 'web';
    }

    return 'legacy';
  }

  /**
   * Show capability warnings to user
   */
  getWarnings(): string[] {
    return this.capabilities?.warnings || [];
  }
}

// Singleton instance
export const featureDetector = new FeatureDetector();

