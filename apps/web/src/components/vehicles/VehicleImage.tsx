/**
 * 🚗 VEHICLE IMAGE COMPONENT
 *
 * Optimalizovaný komponent pre zobrazenie vehicle obrázkov s lazy loading
 */

import React, { memo, useCallback, useState } from 'react';

import { cn } from '@/lib/utils';

import {
  ImagePerformanceMonitor,
  VehicleImageUtils,
} from '../../utils/imageOptimization';
import LazyImage from '../common/LazyImage';
import { CompactChip } from '../ui';

interface VehicleImageProps {
  vehicleId?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleType?: 'car' | 'truck' | 'van' | 'motorcycle';
  size: 'thumbnail' | 'card' | 'detail' | 'fullsize';
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  showBrand?: boolean;
  showType?: boolean;
  fallbackColor?: string;
  onClick?: () => void;
  className?: string;
}

const VehicleImage: React.FC<VehicleImageProps> = ({
  vehicleId,
  vehicleBrand,
  vehicleModel,
  vehicleType = 'car',
  size,
  width,
  height,
  borderRadius = 2,
  showBrand = false,
  showType = false,
  fallbackColor,
  onClick,
  className,
}) => {
  const [imageLoadTime] = useState(performance.now());

  // Generate image URLs
  const imageUrl = vehicleId
    ? VehicleImageUtils.getVehicleImageUrl(vehicleId, size)
    : null;

  // const placeholderUrl = VehicleImageUtils.getVehiclePlaceholder(
  //   vehicleType,
  //   fallbackColor
  // ); // Nepoužívané
  const lowQualityUrl = vehicleId
    ? VehicleImageUtils.getVehicleImageUrl(vehicleId, 'thumbnail')
    : null;

  // Performance callbacks
  const handleImageLoad = useCallback(() => {
    const loadTime = performance.now() - imageLoadTime;
    if (imageUrl) {
      ImagePerformanceMonitor.onImageLoad(imageUrl, loadTime);
    }
  }, [imageUrl, imageLoadTime]);

  const handleImageError = useCallback(
    (error: React.SyntheticEvent<HTMLImageElement>) => {
      if (imageUrl) {
        ImagePerformanceMonitor.onImageError(imageUrl, error);
      }
    },
    [imageUrl]
  );

  // Get vehicle type icon
  const getVehicleTypeIcon = () => {
    const iconClass = "w-5 h-5";
    switch (vehicleType) {
      case 'truck':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
        );
      case 'motorcycle':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.44 9.03L15.41 5H11v2h3.59l2 2H5c-2.8 0-5 2.2-5 5s2.2 5 5 5c2.46 0 4.45-1.69 4.9-4h1.65l.95-.95c.39-.39.39-1.02 0-1.41L9.41 9.03c-.39-.39-1.02-.39-1.41 0L5.03 12H5c-1.66 0-3-1.34-3-3s1.34-3 3-3c1.66 0 3 1.34 3 3 0 .35-.07.69-.18 1H9.5c.28-.72.9-1.25 1.66-1.42L13.5 9.5h1.91l2.09 2.09c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41L19.44 9.03z"/>
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        );
    }
  };

  // Get default dimensions based on size
  const getDimensions = () => {
    const sizeConfig = {
      thumbnail: { width: 100, height: 75 },
      card: { width: 300, height: 200 },
      detail: { width: 600, height: 400 },
      fullsize: { width: '100%', height: 400 },
    };

    const config = sizeConfig[size];
    return {
      width: width || config.width,
      height: height || config.height,
    };
  };

  const dimensions = getDimensions();

  // Custom placeholder for vehicles
  const vehiclePlaceholder = (
    <div 
      className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-500"
      style={{ backgroundColor: fallbackColor || '#f5f5f5' }}
    >
      {getVehicleTypeIcon()}
      <span className="text-xs text-center">
        {vehicleBrand && vehicleModel
          ? `${vehicleBrand} ${vehicleModel}`
          : 'Obrázok vozidla'}
      </span>
      <svg className="w-4 h-4 opacity-50" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    </div>
  );

  return (
    <div
      className={cn(
        "relative",
        onClick ? "cursor-pointer" : "cursor-default",
        className
      )}
      onClick={onClick}
    >
      {/* Main Image */}
      {imageUrl ? (
        <LazyImage
          src={imageUrl}
          lowQualitySrc={lowQualityUrl ?? ''}
          alt={`${vehicleBrand} ${vehicleModel}`.trim() || 'Vozidlo'}
          width={dimensions.width}
          height={dimensions.height}
          borderRadius={borderRadius}
          placeholder={vehiclePlaceholder}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onClick={onClick ?? (() => {})}
          threshold={0.2} // Load slightly earlier for better UX
          rootMargin="100px" // Larger margin for vehicles
        />
      ) : (
        <div
          className={cn(
            "overflow-hidden",
            onClick ? "cursor-pointer" : "cursor-default"
          )}
          style={{
            width: dimensions.width,
            height: dimensions.height,
            borderRadius: borderRadius || 4,
          }}
          onClick={onClick}
        >
          {vehiclePlaceholder}
        </div>
      )}

      {/* Brand Badge */}
      {showBrand && vehicleBrand && (
        <CompactChip
          label={vehicleBrand}
          className="h-8 px-3 text-sm absolute top-2 left-2 bg-black/70 text-white text-xs px-2" 
        />
      )}

      {/* Vehicle Type Badge */}
      {showType && (
        <div className="absolute top-2 right-2 bg-white/90 rounded p-1 flex items-center text-gray-600">
          {getVehicleTypeIcon()}
        </div>
      )}
    </div>
  );
};

// Export with memo for performance
export default memo(VehicleImage, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.vehicleId === nextProps.vehicleId &&
    prevProps.size === nextProps.size &&
    prevProps.vehicleBrand === nextProps.vehicleBrand &&
    prevProps.vehicleModel === nextProps.vehicleModel &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.showBrand === nextProps.showBrand &&
    prevProps.showType === nextProps.showType
  );
});
