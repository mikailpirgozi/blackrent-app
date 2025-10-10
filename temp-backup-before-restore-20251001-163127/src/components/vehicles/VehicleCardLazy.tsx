/**
 * 🚗 VEHICLE CARD LAZY
 *
 * Optimalizovaná vehicle card s lazy loading pre lepší performance
 */

import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  DirectionsCar as CarIcon,
  Business as BusinessIcon,
  Speed as SpeedIcon,
  LocalGasStation as FuelIcon,
} from '@mui/icons-material';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
        color: 'success' as const,
        backgroundColor: theme.palette.success.main + '20',
      },
      rented: {
        label: 'Prenajatý',
        color: 'primary' as const,
        backgroundColor: theme.palette.primary.main + '20',
      },
      maintenance: {
        label: 'Údržba',
        color: 'warning' as const,
        backgroundColor: theme.palette.warning.main + '20',
      },
      inactive: {
        label: 'Neaktívny',
        color: 'error' as const,
        backgroundColor: theme.palette.error.main + '20',
      },
    };

    return configs[status as keyof typeof configs] || configs.available;
  };

  const statusConfig = getStatusConfig(vehicle.status || 'available');

  return (
    <Card
      className={className}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        boxShadow: theme.shadows[2],
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: theme.shadows[8],
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* Vehicle Image */}
      <Box sx={{ position: 'relative' }}>
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
          <Chip
            label={statusConfig.label}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: statusConfig.backgroundColor,
              color:
                statusConfig.color === 'success'
                  ? theme.palette.success.main
                  : statusConfig.color === 'primary'
                    ? theme.palette.primary.main
                    : statusConfig.color === 'warning'
                      ? theme.palette.warning.main
                      : theme.palette.error.main,
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />
        )}

        {/* Daily Rate Badge */}
        {vehicle.dailyRate && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: 'white',
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            €{vehicle.dailyRate}/deň
          </Box>
        )}
      </Box>

      {/* Card Content */}
      <CardContent sx={{ flexGrow: 1, pb: compact ? 1 : 2 }}>
        {/* Title */}
        <Typography
          variant={compact ? 'subtitle2' : 'h6'}
          sx={{
            fontWeight: 600,
            mb: 1,
            lineHeight: 1.2,
          }}
        >
          {vehicle.brand} {vehicle.model}
        </Typography>

        {/* License Plate */}
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mb: compact ? 0.5 : 1,
            fontFamily: 'monospace',
            fontWeight: 600,
            backgroundColor: theme.palette.grey[100],
            px: 1,
            py: 0.5,
            borderRadius: 1,
            display: 'inline-block',
          }}
        >
          {vehicle.licensePlate}
        </Typography>

        {/* Details */}
        {!compact && (
          <Stack direction="row" spacing={2} sx={{ mt: 1, mb: 1 }}>
            {vehicle.year && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CarIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography variant="caption">{vehicle.year}</Typography>
              </Box>
            )}

            {vehicle.fuelType && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <UnifiedIcon name="fuel" fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography variant="caption">{vehicle.fuelType}</Typography>
              </Box>
            )}

            {vehicle.mileage && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <UnifiedIcon name="speed" fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography variant="caption">
                  {vehicle.mileage.toLocaleString()} km
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        {/* Company */}
        {showCompany && vehicle.company && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
            <UnifiedIcon name="building" fontSize="small" sx={{ color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {vehicle.company}
            </Typography>
          </Box>
        )}

        {/* Description */}
        {!compact && vehicle.description && (
          <Typography
            variant="body2"
            sx={{
              mt: 1,
              color: 'text.secondary',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {vehicle.description}
          </Typography>
        )}
      </CardContent>

      {/* Actions */}
      {showActions && (
        <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
            {/* Primary Actions */}
            <Button
              size="small"
              variant="outlined"
              startIcon={<UnifiedIcon name="eye" />}
              onClick={handleView}
              sx={{ flex: 1, textTransform: 'none' }}
            >
              {isMobile ? 'Detail' : 'Zobraziť'}
            </Button>

            {/* Secondary Actions */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Upraviť">
                <IconButton size="small" onClick={handleEdit}>
                  <UnifiedIcon name="edit" fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Zmazať">
                <IconButton size="small" onClick={handleDelete} color="error">
                  <UnifiedIcon name="delete" fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardActions>
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
