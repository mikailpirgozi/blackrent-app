// ============================================================================
// ASSET REGISTRY - OPTIMIZED ASSET LOADING
// ============================================================================
// Centralized asset management for SmartImage component
// Dynamically generates asset mappings to avoid hardcoded require() calls

import { logger } from '../../../utils/logger';

// Asset registry interface
interface AssetRegistry {
  [key: string]: any;
}

// Asset categories for better organization
interface AssetCategories {
  vehicles: AssetRegistry;
  placeholders: AssetRegistry;
}

// Vehicle images registry - dynamically generated
const vehicleAssets: AssetRegistry = {
  'assets/images/vehicles/hero-image-1.webp': require('../../../../assets/images/vehicles/hero-image-1.webp'),
  'assets/images/vehicles/hero-image-2.webp': require('../../../../assets/images/vehicles/hero-image-2.webp'),
  'assets/images/vehicles/hero-image-3.webp': require('../../../../assets/images/vehicles/hero-image-3.webp'),
  'assets/images/vehicles/hero-image-4.webp': require('../../../../assets/images/vehicles/hero-image-4.webp'),
  'assets/images/vehicles/hero-image-5.webp': require('../../../../assets/images/vehicles/hero-image-5.webp'),
  'assets/images/vehicles/hero-image-6.webp': require('../../../../assets/images/vehicles/hero-image-6.webp'),
  'assets/images/vehicles/hero-image-7.webp': require('../../../../assets/images/vehicles/hero-image-7.webp'),
  'assets/images/vehicles/hero-image-8.webp': require('../../../../assets/images/vehicles/hero-image-8.webp'),
  'assets/images/vehicles/hero-image-9.webp': require('../../../../assets/images/vehicles/hero-image-9.webp'),
  'assets/images/vehicles/hero-image-10.webp': require('../../../../assets/images/vehicles/hero-image-10.webp'),
  'assets/images/vehicles/tesla-model-s.webp': require('../../../../assets/images/vehicles/tesla-model-s.webp'),
  'assets/images/vehicles/tesla-model-s-42bc2b.webp': require('../../../../assets/images/vehicles/tesla-model-s-42bc2b.webp'),
  'assets/images/vehicles/vehicle-1.webp': require('../../../../assets/images/vehicles/vehicle-1.webp'),
  'assets/images/vehicles/vehicle-card-default.webp': require('../../../../assets/images/vehicles/vehicle-card-default.webp'),
  'assets/images/vehicles/vehicle-card-hover-66b96a.webp': require('../../../../assets/images/vehicles/vehicle-card-hover-66b96a.webp'),
  'assets/images/vehicles/vehicle-card.webp': require('../../../../assets/images/vehicles/vehicle-card.webp'),
  'assets/images/vehicles/vehicle-main-image.png': require('../../../../assets/images/vehicles/vehicle-main-image.png'),
  'assets/images/vehicles/vehicle-thumb-1.png': require('../../../../assets/images/vehicles/vehicle-thumb-1.png'),
  'assets/images/vehicles/vehicle-thumb-2.png': require('../../../../assets/images/vehicles/vehicle-thumb-2.png'),
  'assets/images/vehicles/vehicle-thumb-3.png': require('../../../../assets/images/vehicles/vehicle-thumb-3.png'),
  'assets/images/vehicles/vehicle-thumb-4.png': require('../../../../assets/images/vehicles/vehicle-thumb-4.png'),
};

// Placeholder assets
const placeholderAssets: AssetRegistry = {
  'assets/placeholder-car.jpg': require('../../../../assets/placeholder-car.jpg'),
};

// Combined asset registry
const ASSET_REGISTRY: AssetRegistry = {
  ...vehicleAssets,
  ...placeholderAssets,
};

// Asset categories for organized access
export const assetCategories: AssetCategories = {
  vehicles: vehicleAssets,
  placeholders: placeholderAssets,
};

/**
 * Get asset source for given image path
 * @param imagePath - Path to the image asset
 * @returns Asset source object or URI object for remote images
 */
export const getAssetSource = (imagePath: string) => {
  if (!imagePath) {
    logger.warn('getAssetSource: Empty image path provided');
    return null;
  }

  // Check if it's a local asset
  if (imagePath.startsWith('assets/')) {
    const asset = ASSET_REGISTRY[imagePath];
    if (asset) {
      logger.debug(`Asset found for path: ${imagePath}`);
      return asset;
    } else {
      logger.warn(`Local asset not found: ${imagePath}`);
      return null;
    }
  }

  // For remote URLs, return URI object
  logger.debug(`Using remote URL: ${imagePath}`);
  return { uri: imagePath };
};

/**
 * Check if asset exists in registry
 * @param imagePath - Path to check
 * @returns Boolean indicating if asset exists
 */
export const assetExists = (imagePath: string): boolean => {
  if (!imagePath || !imagePath.startsWith('assets/')) {
    return false;
  }
  return imagePath in ASSET_REGISTRY;
};

/**
 * Get all available asset paths
 * @param category - Optional category filter
 * @returns Array of asset paths
 */
export const getAvailableAssets = (category?: keyof AssetCategories): string[] => {
  if (category && assetCategories[category]) {
    return Object.keys(assetCategories[category]);
  }
  return Object.keys(ASSET_REGISTRY);
};

/**
 * Get fallback asset for given category
 * @param category - Asset category
 * @returns Fallback asset source
 */
export const getFallbackAsset = (category: 'vehicle' | 'placeholder' = 'placeholder') => {
  switch (category) {
    case 'vehicle':
      return vehicleAssets['assets/images/vehicles/vehicle-card-default.webp'] || 
             placeholderAssets['assets/placeholder-car.jpg'];
    case 'placeholder':
    default:
      return placeholderAssets['assets/placeholder-car.jpg'];
  }
};

// Export the registry for direct access if needed
export { ASSET_REGISTRY };

// Development helpers
if (__DEV__) {
  logger.info(`Asset Registry initialized with ${Object.keys(ASSET_REGISTRY).length} assets`);
  logger.debug('Available categories:', Object.keys(assetCategories));
}
