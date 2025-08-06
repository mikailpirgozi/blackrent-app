/**
 * 🚗 VEHICLE IMAGE COMPONENT
 * 
 * Optimalizovaný komponent pre zobrazenie vehicle obrázkov s lazy loading
 */

import React, { memo, useCallback, useState } from 'react';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import { 
  PhotoCamera as PhotoIcon,
  DirectionsCar as CarIcon,
  LocalShipping as TruckIcon,
  Refresh as RefreshIcon 
} from '@mui/icons-material';
import LazyImage from '../common/LazyImage';
import { VehicleImageUtils, ImagePerformanceMonitor } from '../../utils/imageOptimization';

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
  className
}) => {
  const [imageLoadTime] = useState(performance.now());

  // Generate image URLs
  const imageUrl = vehicleId 
    ? VehicleImageUtils.getVehicleImageUrl(vehicleId, size)
    : null;
  
  const placeholderUrl = VehicleImageUtils.getVehiclePlaceholder(vehicleType, fallbackColor);
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

  const handleImageError = useCallback((error: Event) => {
    if (imageUrl) {
      ImagePerformanceMonitor.onImageError(imageUrl, error);
    }
  }, [imageUrl]);

  // Get vehicle type icon
  const getVehicleTypeIcon = () => {
    switch (vehicleType) {
      case 'truck':
        return <TruckIcon />;
      case 'motorcycle':
        return <CarIcon />; // Could add motorcycle icon
      default:
        return <CarIcon />;
    }
  };

  // Get default dimensions based on size
  const getDimensions = () => {
    const sizeConfig = {
      thumbnail: { width: 100, height: 75 },
      card: { width: 300, height: 200 },
      detail: { width: 600, height: 400 },
      fullsize: { width: '100%', height: 400 }
    };

    const config = sizeConfig[size];
    return {
      width: width || config.width,
      height: height || config.height
    };
  };

  const dimensions = getDimensions();

  // Custom placeholder for vehicles
  const vehiclePlaceholder = (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        backgroundColor: fallbackColor || 'grey.100',
        color: 'text.disabled'
      }}
    >
      {getVehicleTypeIcon()}
      <Typography variant="caption" align="center">
        {vehicleBrand && vehicleModel 
          ? `${vehicleBrand} ${vehicleModel}`
          : 'Obrázok vozidla'
        }
      </Typography>
      <PhotoIcon sx={{ fontSize: 16, opacity: 0.5 }} />
    </Box>
  );

  return (
    <Box
      className={className}
      sx={{ 
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      {/* Main Image */}
      {imageUrl ? (
        <LazyImage
          src={imageUrl}
          lowQualitySrc={lowQualityUrl || undefined}
          alt={`${vehicleBrand} ${vehicleModel}`.trim() || 'Vozidlo'}
          width={dimensions.width}
          height={dimensions.height}
          borderRadius={borderRadius}
          placeholder={vehiclePlaceholder}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onClick={onClick}
          threshold={0.2} // Load slightly earlier for better UX
          rootMargin="100px" // Larger margin for vehicles
        />
      ) : (
        <Box
          sx={{
            width: dimensions.width,
            height: dimensions.height,
            borderRadius,
            overflow: 'hidden',
            cursor: onClick ? 'pointer' : 'default'
          }}
          onClick={onClick}
        >
          {vehiclePlaceholder}
        </Box>
      )}

      {/* Brand Badge */}
      {showBrand && vehicleBrand && (
        <Chip
          label={vehicleBrand}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            fontSize: '0.7rem',
            '& .MuiChip-label': {
              px: 1
            }
          }}
        />
      )}

      {/* Vehicle Type Badge */}
      {showType && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderRadius: 1,
            p: 0.5,
            display: 'flex',
            alignItems: 'center',
            color: 'text.secondary'
          }}
        >
          {getVehicleTypeIcon()}
        </Box>
      )}
    </Box>
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