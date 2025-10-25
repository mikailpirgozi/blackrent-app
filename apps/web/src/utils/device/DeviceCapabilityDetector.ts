/**
 * Device Capability Detector
 *
 * Detects device capabilities and recommends optimal settings:
 * - RAM capacity (via navigator.deviceMemory)
 * - CPU cores (via navigator.hardwareConcurrency)
 * - Network type and speed
 * - Performance benchmark
 * - PWA installation status
 *
 * Used to adapt batch sizes and quality settings for optimal performance
 */

import { logger } from '../logger';

export interface DeviceCapabilities {
  ram: number; // GB (via navigator.deviceMemory)
  cpuCores: number; // via navigator.hardwareConcurrency
  networkType: '2g' | '3g' | '4g' | '5g' | 'unknown';
  networkSpeed: 'slow' | 'medium' | 'fast';
  performanceScore: number; // 0-100 based on benchmark
  recommendedBatchSize: number; // 1-6
  recommendedQuality: 'mobile' | 'protocol' | 'highQuality';
  isPWA: boolean; // Is app installed as PWA
}

interface NetworkInfo {
  type: '2g' | '3g' | '4g' | '5g' | 'unknown';
  speed: 'slow' | 'medium' | 'fast';
  effectiveType?: string;
  downlink?: number; // Mbps
  rtt?: number; // ms
}

export class DeviceCapabilityDetector {
  private cachedCapabilities: DeviceCapabilities | null = null;
  private benchmarkCache: number | null = null;

  /**
   * Detect all device capabilities
   */
  async detect(force = false): Promise<DeviceCapabilities> {
    // Return cached if available and not forcing refresh
    if (this.cachedCapabilities && !force) {
      logger.debug('Returning cached device capabilities');
      return this.cachedCapabilities;
    }

    logger.info('🔍 Detecting device capabilities...');

    const ram = this.getDeviceMemory();
    const cpuCores = this.getCPUCores();
    const network = this.getNetworkInfo();
    const performanceScore = await this.benchmarkPerformance();
    const isPWA = this.isPWAInstalled();

    const settings = this.calculateRecommendedSettings(
      ram,
      cpuCores,
      network,
      performanceScore
    );

    this.cachedCapabilities = {
      ram,
      cpuCores,
      networkType: network.type,
      networkSpeed: network.speed,
      performanceScore,
      ...settings,
      isPWA,
    };

    logger.info('✅ Device capabilities detected', this.cachedCapabilities);

    return this.cachedCapabilities;
  }

  /**
   * Get device RAM (Chrome/Edge only, defaults to 4GB)
   */
  private getDeviceMemory(): number {
    const memory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory;

    if (memory !== undefined) {
      logger.debug(`Device memory detected: ${memory}GB`);
      return memory;
    }

    // Default to 4GB if not available
    logger.debug('Device memory not available, defaulting to 4GB');
    return 4;
  }

  /**
   * Get CPU core count
   */
  private getCPUCores(): number {
    const cores = navigator.hardwareConcurrency || 4;
    logger.debug(`CPU cores detected: ${cores}`);
    return cores;
  }

  /**
   * Get network information
   */
  private getNetworkInfo(): NetworkInfo {
    const nav = navigator as Navigator & {
      connection?: { effectiveType?: string; downlink?: number; rtt?: number };
      mozConnection?: {
        effectiveType?: string;
        downlink?: number;
        rtt?: number;
      };
      webkitConnection?: {
        effectiveType?: string;
        downlink?: number;
        rtt?: number;
      };
    };
    const connection =
      nav.connection || nav.mozConnection || nav.webkitConnection;

    if (!connection) {
      logger.debug('Network API not available, assuming medium speed');
      return { type: 'unknown', speed: 'medium' };
    }

    const effectiveType = connection.effectiveType || 'unknown';
    const downlink = connection.downlink; // Mbps
    const rtt = connection.rtt; // ms (round-trip time)

    // Determine speed category
    let speed: 'slow' | 'medium' | 'fast';
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      speed = 'slow';
    } else if (effectiveType === '3g') {
      speed = 'medium';
    } else {
      // 4g or unknown -> check actual speed if available
      if (downlink && downlink < 1.5) {
        speed = 'slow'; // < 1.5 Mbps
      } else if (downlink && downlink < 10) {
        speed = 'medium'; // 1.5-10 Mbps
      } else {
        speed = 'fast'; // > 10 Mbps or unknown
      }
    }

    logger.debug('Network detected', {
      effectiveType,
      downlink: downlink ? `${downlink} Mbps` : 'N/A',
      rtt: rtt ? `${rtt} ms` : 'N/A',
      speed,
    });

    // Map effectiveType to NetworkInfo type
    let networkType: '2g' | '3g' | '4g' | '5g' | 'unknown';
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      networkType = '2g';
    } else if (effectiveType === '3g') {
      networkType = '3g';
    } else if (effectiveType === '4g') {
      networkType = '4g';
    } else if (effectiveType === '5g') {
      networkType = '5g';
    } else {
      networkType = 'unknown';
    }

    return {
      type: networkType,
      speed,
      effectiveType,
      downlink,
      rtt,
    };
  }

  /**
   * Benchmark device performance
   * Creates a small canvas and measures rendering time
   */
  private async benchmarkPerformance(): Promise<number> {
    // Return cached benchmark if available
    if (this.benchmarkCache !== null) {
      return this.benchmarkCache;
    }

    try {
      const start = performance.now();

      // Create canvas and do some operations
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        logger.warn('Canvas context not available, defaulting to score 50');
        return 50;
      }

      // Draw 100 rectangles with random positions
      for (let i = 0; i < 100; i++) {
        ctx.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
        ctx.fillRect(Math.random() * 500, Math.random() * 500, 50, 50);
      }

      // Convert to blob (this is what we do with images)
      await new Promise<void>(resolve => {
        canvas.toBlob(() => resolve(), 'image/jpeg', 0.8);
      });

      const duration = performance.now() - start;

      // Score: 0-100 (faster = higher score)
      // < 10ms = 100, 10-50ms = 80-90, 50-100ms = 50-80, > 100ms = 0-50
      let score: number;
      if (duration < 10) {
        score = 100;
      } else if (duration < 50) {
        score = 90 - ((duration - 10) / 40) * 10;
      } else if (duration < 100) {
        score = 50 + ((100 - duration) / 50) * 30;
      } else {
        score = Math.max(0, 50 - ((duration - 100) / 100) * 50);
      }

      this.benchmarkCache = Math.round(score);

      logger.debug('Performance benchmark complete', {
        duration: `${duration.toFixed(2)}ms`,
        score: this.benchmarkCache,
      });

      return this.benchmarkCache;
    } catch (error) {
      logger.error('Benchmark failed', { error });
      return 50; // Default middle score
    }
  }

  /**
   * Check if app is installed as PWA
   */
  private isPWAInstalled(): boolean {
    // Method 1: Display mode (most reliable)
    const isStandalone = window.matchMedia(
      '(display-mode: standalone)'
    ).matches;

    // Method 2: Navigator standalone (iOS Safari)
    const isNavigatorStandalone =
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    // Method 3: Document referrer (Android)
    const isFromHomescreen = document.referrer.includes('android-app://');

    const isPWA = isStandalone || isNavigatorStandalone || isFromHomescreen;

    logger.debug('PWA detection', {
      isStandalone,
      isNavigatorStandalone,
      isFromHomescreen,
      result: isPWA,
    });

    return isPWA;
  }

  /**
   * Calculate recommended settings based on device capabilities
   */
  private calculateRecommendedSettings(
    ram: number,
    cpuCores: number,
    network: NetworkInfo,
    performanceScore: number
  ): {
    recommendedBatchSize: number;
    recommendedQuality: 'mobile' | 'protocol' | 'highQuality';
  } {
    let batchSize = 6; // Start optimistic
    let quality: 'mobile' | 'protocol' | 'highQuality' = 'protocol';

    // Adjust for RAM
    if (ram < 2) {
      batchSize = 1;
      quality = 'mobile';
      logger.debug(
        'Low RAM detected, using minimal batch size and mobile quality'
      );
    } else if (ram < 4) {
      batchSize = 2;
      logger.debug('Medium RAM detected, using conservative batch size');
    } else if (ram < 6) {
      batchSize = 4;
    } else {
      // 6GB+ RAM
      quality = 'highQuality';
      logger.debug('High RAM detected, using maximum batch size and quality');
    }

    // Adjust for CPU cores
    if (cpuCores <= 2) {
      batchSize = Math.min(batchSize, 2);
      logger.debug('Low CPU cores, reducing batch size');
    }

    // Adjust for network
    if (network.speed === 'slow') {
      batchSize = Math.min(batchSize, 2);
      if (quality === 'highQuality') {
        quality = 'protocol';
      } else if (quality === 'protocol') {
        quality = 'mobile';
      }
      logger.debug('Slow network detected, reducing batch size and quality');
    }

    // Adjust for performance score
    if (performanceScore < 30) {
      batchSize = Math.min(batchSize, 2);
      quality = 'mobile';
      logger.debug('Low performance score, using minimal settings');
    } else if (performanceScore < 60) {
      batchSize = Math.min(batchSize, 4);
      if (quality === 'highQuality') {
        quality = 'protocol';
      }
    }

    logger.info('Recommended settings calculated', {
      batchSize,
      quality,
      reasoning: {
        ram: `${ram}GB`,
        cpuCores,
        networkSpeed: network.speed,
        performanceScore,
      },
    });

    return {
      recommendedBatchSize: batchSize,
      recommendedQuality: quality,
    };
  }

  /**
   * Clear cached capabilities (useful for testing or when network changes)
   */
  clearCache(): void {
    this.cachedCapabilities = null;
    this.benchmarkCache = null;
    logger.debug('Device capabilities cache cleared');
  }

  /**
   * Get quality settings for image processing
   */
  getQualitySettings(quality: 'mobile' | 'protocol' | 'highQuality'): {
    gallery: { format: 'webp'; quality: number; maxWidth: number };
    pdf: {
      format: 'jpeg';
      quality: number;
      maxWidth: number;
      maxHeight: number;
    };
  } {
    switch (quality) {
      case 'mobile':
        return {
          gallery: { format: 'webp', quality: 0.85, maxWidth: 1280 },
          pdf: { format: 'jpeg', quality: 0.75, maxWidth: 600, maxHeight: 450 },
        };
      case 'protocol':
        return {
          gallery: { format: 'webp', quality: 0.95, maxWidth: 1920 },
          pdf: { format: 'jpeg', quality: 0.9, maxWidth: 800, maxHeight: 600 },
        };
      case 'highQuality':
        return {
          gallery: { format: 'webp', quality: 0.98, maxWidth: 2560 },
          pdf: {
            format: 'jpeg',
            quality: 0.95,
            maxWidth: 1200,
            maxHeight: 900,
          },
        };
    }
  }
}

// Singleton instance
export const deviceCapabilityDetector = new DeviceCapabilityDetector();
