/**
 * Image Service
 * Handles vehicle images with backend API, local assets, and Unsplash fallback
 */

import { EXTERNAL_SERVICES, IMAGES } from '../config/constants';
import * as FileSystem from 'expo-file-system';
import { Image as ExpoImage } from 'expo-image';

export interface ImageSource {
  uri: string;
  type: 'backend' | 'local' | 'unsplash' | 'placeholder';
}

/**
 * Category to Unsplash keyword mapping
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'nizka-trieda': ['compact car', 'economy car', 'small car', 'hatchback'],
  'stredna-trieda': ['sedan', 'family car', 'mid-size car'],
  'vyssia-stredna': ['executive car', 'luxury sedan', 'premium car'],
  'luxusne': ['luxury car', 'premium vehicle', 'high-end car'],
  'sportove': ['sports car', 'supercar', 'performance car'],
  'suv': ['suv', 'crossover', 'off-road vehicle'],
  'viacmiestne': ['minivan', 'people carrier', '7-seater'],
  'dodavky': ['cargo van', 'delivery van', 'commercial vehicle'],
};

/**
 * Fallback placeholder images (Picsum Photos - Free, No API Key)
 * Using specific photo IDs that look like cars/vehicles
 */
const PLACEHOLDER_IMAGES: Record<string, string[]> = {
  'nizka-trieda': [
    'https://picsum.photos/seed/car-compact-1/800/600',
    'https://picsum.photos/seed/car-compact-2/800/600',
    'https://picsum.photos/seed/car-compact-3/800/600',
  ],
  'stredna-trieda': [
    'https://picsum.photos/seed/car-sedan-1/800/600',
    'https://picsum.photos/seed/car-sedan-2/800/600',
    'https://picsum.photos/seed/car-sedan-3/800/600',
  ],
  'vyssia-stredna': [
    'https://picsum.photos/seed/car-executive-1/800/600',
    'https://picsum.photos/seed/car-executive-2/800/600',
    'https://picsum.photos/seed/car-executive-3/800/600',
  ],
  'luxusne': [
    'https://picsum.photos/seed/car-luxury-1/800/600',
    'https://picsum.photos/seed/car-luxury-2/800/600',
    'https://picsum.photos/seed/car-luxury-3/800/600',
  ],
  'sportove': [
    'https://picsum.photos/seed/car-sport-1/800/600',
    'https://picsum.photos/seed/car-sport-2/800/600',
    'https://picsum.photos/seed/car-sport-3/800/600',
  ],
  'suv': [
    'https://picsum.photos/seed/car-suv-1/800/600',
    'https://picsum.photos/seed/car-suv-2/800/600',
    'https://picsum.photos/seed/car-suv-3/800/600',
  ],
  'viacmiestne': [
    'https://picsum.photos/seed/car-van-1/800/600',
    'https://picsum.photos/seed/car-van-2/800/600',
    'https://picsum.photos/seed/car-van-3/800/600',
  ],
  'dodavky': [
    'https://picsum.photos/seed/car-cargo-1/800/600',
    'https://picsum.photos/seed/car-cargo-2/800/600',
    'https://picsum.photos/seed/car-cargo-3/800/600',
  ],
};

/**
 * Default fallback image (Picsum Photos)
 */
const DEFAULT_PLACEHOLDER = 'https://picsum.photos/seed/car-default/800/600';

/**
 * Get vehicle images with fallback strategy:
 * 1. Try backend API images
 * 2. Fall back to category-specific placeholders
 * 3. Fall back to default placeholder
 */
export function getVehicleImages(
  vehicleImages: string[] | undefined,
  category?: string,
  count: number = 3
): ImageSource[] {
  // Strategy 1: Backend images exist
  if (vehicleImages && vehicleImages.length > 0) {
    return vehicleImages.slice(0, count).map((uri) => ({
      uri: normalizeImageUrl(uri),
      type: 'backend',
    }));
  }

  // Strategy 2: Category-specific placeholders
  if (category && PLACEHOLDER_IMAGES[category]) {
    const placeholders = PLACEHOLDER_IMAGES[category];
    return Array.from({ length: count }, (_, i) => ({
      uri: placeholders[i % placeholders.length],
      type: 'placeholder',
    }));
  }

  // Strategy 3: Default placeholders
  const defaultPlaceholders = PLACEHOLDER_IMAGES['stredna-trieda'];
  return Array.from({ length: count }, (_, i) => ({
    uri: defaultPlaceholders[i % defaultPlaceholders.length],
    type: 'placeholder',
  }));
}

/**
 * Get single vehicle image (first from array or placeholder)
 */
export function getVehicleImage(
  vehicleImages: string[] | undefined,
  category?: string
): ImageSource {
  const images = getVehicleImages(vehicleImages, category, 1);
  return images[0];
}

/**
 * Normalize image URL (handle relative/absolute paths)
 */
function normalizeImageUrl(url: string): string {
  // If it's already a full URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If it's a relative URL from backend
  if (url.startsWith('/')) {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace('/api', '');
    return `${baseUrl}${url}`;
  }

  // Otherwise assume it's a file path
  return url;
}

/**
 * Search Unsplash for vehicle images (optional, requires API key)
 */
export async function searchUnsplashVehicleImages(
  query: string,
  category?: string,
  count: number = 3
): Promise<ImageSource[]> {
  const accessKey = EXTERNAL_SERVICES.UNSPLASH_ACCESS_KEY;

  // If no API key, return placeholders
  if (!accessKey) {
    return getVehicleImages(undefined, category, count);
  }

  try {
    // Build search query with category keywords
    const keywords = category ? CATEGORY_KEYWORDS[category] : [];
    const searchQuery = keywords.length > 0 
      ? `${query} ${keywords[0]}` 
      : query;

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=${count}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Unsplash API error');
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results.map((photo: Record<string, unknown>) => ({
        uri: (photo.urls as Record<string, string>).regular || DEFAULT_PLACEHOLDER,
        type: 'unsplash' as const,
      }));
    }

    // No results, return placeholders
    return getVehicleImages(undefined, category, count);
  } catch (error) {
    console.error('Failed to fetch Unsplash images:', error);
    return getVehicleImages(undefined, category, count);
  }
}

/**
 * Preload images for better performance
 */
export async function preloadImages(uris: string[]): Promise<void> {
  try {
    await Promise.all(
      uris.map((uri) =>
        ExpoImage.prefetch(uri, {
          cachePolicy: 'memory-disk',
        })
      )
    );
  } catch (error) {
    console.error('Failed to preload images:', error);
  }
}

/**
 * Clear image cache
 */
export async function clearImageCache(): Promise<void> {
  try {
    await ExpoImage.clearMemoryCache();
    await ExpoImage.clearDiskCache();
  } catch (error) {
    console.error('Failed to clear image cache:', error);
  }
}

/**
 * Get cached image size
 */
export async function getCachedImageSize(): Promise<number> {
  try {
    const cacheDir = `${FileSystem.cacheDirectory}ExpoImageCache/`;
    const cacheInfo = await FileSystem.getInfoAsync(cacheDir);
    
    if (cacheInfo.exists && !cacheInfo.isDirectory) {
      return cacheInfo.size || 0;
    }
    
    return 0;
  } catch (error) {
    console.error('Failed to get cache size:', error);
    return 0;
  }
}

/**
 * Compress image for upload (protocols, etc.)
 */
export async function compressImage(
  uri: string,
  quality: number = IMAGES.COMPRESSION_QUALITY
): Promise<string> {
  try {
    // This is a placeholder - actual compression would need expo-image-manipulator
    // For now, return original URI
    return uri;
  } catch (error) {
    console.error('Failed to compress image:', error);
    throw error;
  }
}

/**
 * Get optimized image URL with size parameters (Picsum or other services)
 */
export function getOptimizedImageUrl(
  url: string,
  width: number = 800,
  height: number = 600,
  quality: number = 80
): string {
  // For Picsum images - already optimized with /width/height in URL
  if (url.includes('picsum.photos')) {
    // Picsum format: https://picsum.photos/seed/xxx/800/600
    // Already has size in URL, return as is
    return url;
  }

  // For Unsplash images (if fallback)
  if (url.includes('unsplash.com')) {
    // Check if already has parameters
    if (url.includes('?')) {
      return `${url}&w=${width}&h=${height}&q=${quality}&fit=crop`;
    }
    return `${url}?w=${width}&h=${height}&q=${quality}&fit=crop`;
  }

  // For other images, return as is
  return url;
}

/**
 * Get vehicle thumbnail URL
 */
export function getVehicleThumbnail(
  imageUrl: string | undefined,
  category?: string
): string {
  if (!imageUrl) {
    const placeholders = category 
      ? PLACEHOLDER_IMAGES[category] 
      : PLACEHOLDER_IMAGES['stredna-trieda'];
    return getOptimizedImageUrl(
      placeholders[0],
      IMAGES.THUMBNAIL_SIZE.width,
      IMAGES.THUMBNAIL_SIZE.height
    );
  }

  return getOptimizedImageUrl(
    normalizeImageUrl(imageUrl),
    IMAGES.THUMBNAIL_SIZE.width,
    IMAGES.THUMBNAIL_SIZE.height
  );
}

/**
 * Get vehicle full-size image URL
 */
export function getVehicleFullSizeImage(
  imageUrl: string | undefined,
  category?: string
): string {
  if (!imageUrl) {
    const placeholders = category 
      ? PLACEHOLDER_IMAGES[category] 
      : PLACEHOLDER_IMAGES['stredna-trieda'];
    return getOptimizedImageUrl(
      placeholders[0],
      IMAGES.FULL_SIZE.width,
      IMAGES.FULL_SIZE.height
    );
  }

  return getOptimizedImageUrl(
    normalizeImageUrl(imageUrl),
    IMAGES.FULL_SIZE.width,
    IMAGES.FULL_SIZE.height
  );
}

/**
 * Validate image URL
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch (error) {
    return false;
  }
}



