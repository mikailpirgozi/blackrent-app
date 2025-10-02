/**
 * 🖼️ Image Optimizer
 * Advanced image optimization and caching system
 */

import React from 'react';
import { logger } from './logger';
import { performanceMonitor } from './performance-monitor';

interface ImageOptimizationOptions {
  quality?: number; // 0-100
  format?: 'webp' | 'jpeg' | 'png';
  width?: number;
  height?: number;
  lazy?: boolean;
  cache?: boolean;
  fallback?: string;
}

interface OptimizedImage {
  uri: string;
  width: number;
  height: number;
  format: string;
  size: number; // bytes
  cached: boolean;
}

class ImageOptimizer {
  private cache = new Map<string, OptimizedImage>();
  private loadingPromises = new Map<string, Promise<OptimizedImage>>();

  /**
   * Optimize image with given options
   */
  async optimizeImage(
    sourceUri: string, 
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage> {
    const cacheKey = this.getCacheKey(sourceUri, options);
    
    // Return cached version if available
    if (options.cache !== false && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      logger.debug(`Image cache hit: ${sourceUri}`);
      return cached;
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }

    // Start optimization
    const optimizationPromise = this.performOptimization(sourceUri, options);
    this.loadingPromises.set(cacheKey, optimizationPromise);

    try {
      const result = await optimizationPromise;
      
      // Cache result
      if (options.cache !== false) {
        this.cache.set(cacheKey, result);
      }
      
      return result;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Perform actual image optimization
   */
  private async performOptimization(
    sourceUri: string,
    options: ImageOptimizationOptions
  ): Promise<OptimizedImage> {
    const startTime = Date.now();
    
    try {
      // For React Native, we'll use the source URI directly
      // In a real implementation, you might use react-native-image-resizer
      // or similar library for actual optimization
      
      const optimizedUri = this.buildOptimizedUri(sourceUri, options);
      
      // Measure image dimensions (mock implementation)
      const dimensions = await this.getImageDimensions(optimizedUri);
      
      const result: OptimizedImage = {
        uri: optimizedUri,
        width: options.width || dimensions.width,
        height: options.height || dimensions.height,
        format: options.format || 'webp',
        size: 0, // Would be calculated in real implementation
        cached: false,
      };

      const duration = Date.now() - startTime;
      logger.debug(`Image optimization completed in ${duration}ms: ${sourceUri}`);
      
      return result;
    } catch (error) {
      logger.error(`Image optimization failed: ${sourceUri}`, error);
      
      // Return fallback
      return {
        uri: options.fallback || sourceUri,
        width: options.width || 300,
        height: options.height || 200,
        format: 'jpeg',
        size: 0,
        cached: false,
      };
    }
  }

  /**
   * Build optimized URI with parameters
   */
  private buildOptimizedUri(sourceUri: string, options: ImageOptimizationOptions): string {
    // For local assets, return as-is
    if (sourceUri.startsWith('file://') || !sourceUri.includes('http')) {
      return sourceUri;
    }

    // For remote images, add optimization parameters
    const url = new URL(sourceUri);
    
    if (options.width) url.searchParams.set('w', options.width.toString());
    if (options.height) url.searchParams.set('h', options.height.toString());
    if (options.quality) url.searchParams.set('q', options.quality.toString());
    if (options.format) url.searchParams.set('f', options.format);
    
    return url.toString();
  }

  /**
   * Get image dimensions
   */
  private async getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      // Mock implementation - in real app, use Image.getSize() from React Native
      setTimeout(() => {
        resolve({ width: 300, height: 200 });
      }, 10);
    });
  }

  /**
   * Generate cache key
   */
  private getCacheKey(uri: string, options: ImageOptimizationOptions): string {
    const optionsStr = JSON.stringify(options);
    return `${uri}_${btoa(optionsStr)}`;
  }

  /**
   * Preload images for better performance
   */
  async preloadImages(uris: string[], options: ImageOptimizationOptions = {}): Promise<void> {
    const promises = uris.map(uri => this.optimizeImage(uri, options));
    
    try {
      await Promise.all(promises);
      logger.debug(`Preloaded ${uris.length} images`);
    } catch (error) {
      logger.warn('Some images failed to preload', error);
    }
  }

  /**
   * Clear image cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug('Image cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    totalSize: number;
  } {
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, img) => sum + img.size, 0);
    
    return {
      size: this.cache.size,
      hitRate: 0, // Would be calculated based on hits/misses
      totalSize,
    };
  }

  /**
   * Lazy load image with intersection observer
   */
  createLazyLoader(threshold = 0.1) {
    const loadedImages = new Set<string>();
    
    return {
      shouldLoad: (uri: string, isVisible: boolean): boolean => {
        if (loadedImages.has(uri)) return true;
        
        if (isVisible) {
          loadedImages.add(uri);
          return true;
        }
        
        return false;
      },
      markAsLoaded: (uri: string) => {
        loadedImages.add(uri);
      },
    };
  }
}

export const imageOptimizer = new ImageOptimizer();

/**
 * Hook for optimized image loading
 */
export function useOptimizedImage(
  uri: string, 
  options: ImageOptimizationOptions = {}
) {
  const [optimizedImage, setOptimizedImage] = React.useState<OptimizedImage | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let mounted = true;
    
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await performanceMonitor.measureApiCall(
          `image_${uri}`,
          () => imageOptimizer.optimizeImage(uri, options)
        );
        
        if (mounted) {
          setOptimizedImage(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Image optimization failed'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadImage();
    
    return () => {
      mounted = false;
    };
  }, [uri, JSON.stringify(options)]);

  return { optimizedImage, loading, error };
}

/**
 * Responsive image sizes for different screen densities
 */
export const responsiveImageSizes = {
  thumbnail: { width: 100, height: 100 },
  small: { width: 200, height: 150 },
  medium: { width: 400, height: 300 },
  large: { width: 800, height: 600 },
  hero: { width: 1200, height: 800 },
} as const;

/**
 * Get optimal image size based on screen dimensions
 */
export function getOptimalImageSize(
  containerWidth: number,
  containerHeight: number,
  pixelRatio: number = 1
): { width: number; height: number } {
  const scaledWidth = containerWidth * pixelRatio;
  const scaledHeight = containerHeight * pixelRatio;
  
  // Find the closest predefined size that's larger than needed
  const sizes = Object.values(responsiveImageSizes);
  const optimalSize = sizes.find(size => 
    size.width >= scaledWidth && size.height >= scaledHeight
  ) || sizes[sizes.length - 1]; // fallback to largest
  
  return optimalSize;
}
