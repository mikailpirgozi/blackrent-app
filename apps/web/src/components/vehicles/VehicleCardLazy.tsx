/**
 * 🚗 VEHICLE CARD LAZY
 *
 * Optimalizovaná vehicle card s lazy loading pre lepší performance
 */

import {
  Edit2 as EditIcon,
  Trash2 as DeleteIcon,
  Eye as VisibilityIcon,
  Car as CarIcon,
  Building as BusinessIcon,
  Gauge as SpeedIcon,
  Fuel as FuelIcon,
} from 'lucide-react';
import { UnifiedButton as Button } from '@/components/ui/UnifiedButton';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { UnifiedBadge as Badge } from '@/components/ui/UnifiedBadge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import React, { memo, useCallback } from 'react';

import VehicleImage from './VehicleImage';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
  year?: number;
  color?: string;
  fuelType?: string;
  mileage?: number;
  company?: string;
  category?: string;
  status?: 'available' | 'rented' | 'maintenance' | 'inactive';
  dailyRate?: number;
  description?: string;
}

interface VehicleCardLazyProps {
  vehicle: Vehicle;
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (vehicle: Vehicle) => void;
  onView?: (vehicle: Vehicle) => void;
  onImageClick?: (vehicle: Vehicle) => void;
  showActions?: boolean;
  showCompany?: boolean;
  showStatus?: boolean;
  compact?: boolean;
  className?: string;
}

const VehicleCardLazy: React.FC<VehicleCardLazyProps> = ({
  vehicle,
  onEdit,
  onDelete,
  onView,
  onImageClick,
  showActions = true,
  showCompany = true,
  showStatus = true,
  compact = false,
  className,
}) => {
  // Custom hook for mobile detection using Tailwind breakpoints
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Memoized handlers
  const handleEdit = useCallback(() => onEdit?.(vehicle), [onEdit, vehicle]);
  const handleDelete = useCallback(
    () => onDelete?.(vehicle),
    [onDelete, vehicle]
  );
  const handleView = useCallback(() => onView?.(vehicle), [onView, vehicle]);
  const handleImageClick = useCallback(
    () => onImageClick?.(vehicle),
    [onImageClick, vehicle]
  );

  // Status configuration
  const getStatusConfig = (status: string) => {
    const configs = {
      available: {
        label: 'Dostupné',
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800 border-green-200',
      },
      rented: {
        label: 'Prenajatý',
        variant: 'default' as const,
        className: 'bg-blue-100 text-blue-800 border-blue-200',
      },
      maintenance: {
        label: 'Údržba',
        variant: 'secondary' as const,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      },
      inactive: {
        label: 'Neaktívny',
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800 border-red-200',
      },
    };

    return configs[status as keyof typeof configs] || configs.available;
  };

  const statusConfig = getStatusConfig(vehicle.status || 'available');

  return (
    <Card className={`h-full flex flex-col rounded-xl shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${className || ''}`}>
      {/* Vehicle Image */}
      <div className="relative">
        <VehicleImage
          vehicleId={vehicle.id}
          vehicleBrand={vehicle.brand}
          vehicleModel={vehicle.model}
          size={compact ? 'card' : 'detail'}
          height={compact ? 160 : 200}
          showBrand={!compact}
          showType={true}
          onClick={handleImageClick}
        />

        {/* Status Badge */}
        {showStatus && (
          <Badge
            variant={statusConfig.variant}
            className={`absolute top-2 right-2 text-xs font-semibold ${statusConfig.className}`}
          >
            {statusConfig.label}
          </Badge>
        )}

        {/* Daily Rate Badge */}
        {vehicle.dailyRate && (
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-80 text-white px-3 py-1 rounded-lg text-sm font-semibold">
            €{vehicle.dailyRate}/deň
          </div>
        )}
      </div>

      {/* Card Content */}
      <CardContent className={`flex-grow ${compact ? 'pb-2' : 'pb-4'}`}>
        {/* Title */}
        <h3 className={`font-semibold mb-2 leading-tight ${compact ? 'text-sm' : 'text-lg'}`}>
          {vehicle.brand} {vehicle.model}
        </h3>

        {/* License Plate */}
        <div className={`text-gray-600 font-mono font-semibold bg-gray-100 px-2 py-1 rounded inline-block ${compact ? 'mb-1' : 'mb-2'} text-sm`}>
          {vehicle.licensePlate}
        </div>

        {/* Details */}
        {!compact && (
          <div className="flex gap-4 mt-2 mb-2">
            {vehicle.year && (
              <div className="flex items-center gap-1">
                <CarIcon className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-600">{vehicle.year}</span>
              </div>
            )}

            {vehicle.fuelType && (
              <div className="flex items-center gap-1">
                <FuelIcon className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-600">{vehicle.fuelType}</span>
              </div>
            )}

            {vehicle.mileage && (
              <div className="flex items-center gap-1">
                <SpeedIcon className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-600">
                  {vehicle.mileage.toLocaleString()} km
                </span>
              </div>
            )}
          </div>
        )}

        {/* Company */}
        {showCompany && vehicle.company && (
          <div className="flex items-center gap-1 mt-2">
            <BusinessIcon className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-600">{vehicle.company}</span>
          </div>
        )}

        {/* Description */}
        {!compact && vehicle.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {vehicle.description}
          </p>
        )}
      </CardContent>

      {/* Actions */}
      {showActions && (
        <CardFooter className="pt-0 px-4 pb-4">
          <div className="flex gap-2 w-full">
            {/* Primary Actions */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleView}
              className="flex-1"
            >
              <VisibilityIcon className="h-4 w-4 mr-2" />
              {isMobile ? 'Detail' : 'Zobraziť'}
            </Button>

            {/* Secondary Actions */}
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="ghost" onClick={handleEdit}>
                      <EditIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Upraviť</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="ghost" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <DeleteIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zmazať</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

// Export with memo and custom comparison
export default memo(VehicleCardLazy, (prevProps, nextProps) => {
  // Compare vehicle object deeply for critical props
  const prevVehicle = prevProps.vehicle;
  const nextVehicle = nextProps.vehicle;

  // Quick reference check first
  if (prevVehicle === nextVehicle) return true;

  // Compare critical vehicle properties
  if (prevVehicle.id !== nextVehicle.id) return false;
  if (prevVehicle.brand !== nextVehicle.brand) return false;
  if (prevVehicle.model !== nextVehicle.model) return false;
  if (prevVehicle.licensePlate !== nextVehicle.licensePlate) return false;
  if (prevVehicle.status !== nextVehicle.status) return false;
  if (prevVehicle.dailyRate !== nextVehicle.dailyRate) return false;
  if (prevVehicle.company !== nextVehicle.company) return false;

  // Compare other props
  if (prevProps.showActions !== nextProps.showActions) return false;
  if (prevProps.showCompany !== nextProps.showCompany) return false;
  if (prevProps.showStatus !== nextProps.showStatus) return false;
  if (prevProps.compact !== nextProps.compact) return false;

  // Compare callback functions (should be memoized in parent)
  if (prevProps.onEdit !== nextProps.onEdit) return false;
  if (prevProps.onDelete !== nextProps.onDelete) return false;
  if (prevProps.onView !== nextProps.onView) return false;
  if (prevProps.onImageClick !== nextProps.onImageClick) return false;

  return true;
});
