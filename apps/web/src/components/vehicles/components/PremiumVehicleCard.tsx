import {
  Car,
  Calendar,
  MapPin,
  DollarSign,
  Edit,
  Trash2,
  Gauge,
  CheckCircle,
  AlertTriangle,
  Clock,
  Wrench,
  Ban,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Typography } from '@/components/ui/typography';
import React from 'react';
import type { Vehicle } from '../../../types';
import { Can } from '../../common/PermissionGuard';

interface PremiumVehicleCardProps {
  vehicle: Vehicle;
  isSelected: boolean;
  onSelect: (vehicleId: string, checked: boolean) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicleId: string) => void;
  onKmHistory?: (vehicle: Vehicle) => void;
}

const PremiumVehicleCard: React.FC<PremiumVehicleCardProps> = ({
  vehicle,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onKmHistory,
}) => {
  // Status configuration with gradients
  const statusConfig = {
    available: {
      label: 'Dostupné',
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-600',
      bgClass: 'bg-green-50 dark:bg-green-950',
      textClass: 'text-green-700 dark:text-green-300',
      borderClass: 'border-green-200 dark:border-green-800',
    },
    rented: {
      label: 'Prenajatý',
      icon: Clock,
      gradient: 'from-blue-500 to-cyan-600',
      bgClass: 'bg-blue-50 dark:bg-blue-950',
      textClass: 'text-blue-700 dark:text-blue-300',
      borderClass: 'border-blue-200 dark:border-blue-800',
    },
    maintenance: {
      label: 'Údržba',
      icon: Wrench,
      gradient: 'from-orange-500 to-amber-600',
      bgClass: 'bg-orange-50 dark:bg-orange-950',
      textClass: 'text-orange-700 dark:text-orange-300',
      borderClass: 'border-orange-200 dark:border-orange-800',
    },
    temporarily_removed: {
      label: 'Dočasne odstránený',
      icon: AlertTriangle,
      gradient: 'from-yellow-500 to-orange-600',
      bgClass: 'bg-yellow-50 dark:bg-yellow-950',
      textClass: 'text-yellow-700 dark:text-yellow-300',
      borderClass: 'border-yellow-200 dark:border-yellow-800',
    },
    removed: {
      label: 'Odstránený',
      icon: Ban,
      gradient: 'from-red-500 to-pink-600',
      bgClass: 'bg-red-50 dark:bg-red-950',
      textClass: 'text-red-700 dark:text-red-300',
      borderClass: 'border-red-200 dark:border-red-800',
    },
    transferred: {
      label: 'Prevedený',
      icon: MapPin,
      gradient: 'from-purple-500 to-pink-600',
      bgClass: 'bg-purple-50 dark:bg-purple-950',
      textClass: 'text-purple-700 dark:text-purple-300',
      borderClass: 'border-purple-200 dark:border-purple-800',
    },
    private: {
      label: 'Súkromné',
      icon: Eye,
      gradient: 'from-gray-500 to-slate-600',
      bgClass: 'bg-gray-50 dark:bg-gray-950',
      textClass: 'text-gray-700 dark:text-gray-300',
      borderClass: 'border-gray-200 dark:border-gray-800',
    },
  };

  const config = statusConfig[vehicle.status as keyof typeof statusConfig] || statusConfig.available;
  const StatusIcon = config.icon;

  // Get lowest price from pricing tiers
  const getLowestPrice = () => {
    if (!vehicle.pricing || vehicle.pricing.length === 0) return null;
    return Math.min(...vehicle.pricing.map(p => p.pricePerDay));
  };

  const lowestPrice = getLowestPrice();

  return (
    <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
      {/* Selection Checkbox - Top Left */}
      <div className="absolute top-3 left-3 z-10">
        <div className="p-1 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-lg">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked: boolean) => onSelect(vehicle.id, checked)}
            onClick={(e) => e.stopPropagation()}
            className="h-5 w-5"
          />
        </div>
      </div>

      {/* Status Badge - Top Right */}
      <div className="absolute top-3 right-3 z-10">
        <Badge className={`${config.bgClass} ${config.textClass} ${config.borderClass} border flex items-center gap-1 px-3 py-1 shadow-lg`}>
          <StatusIcon className="h-3 w-3" />
          {config.label}
        </Badge>
      </div>

      {/* Car Image/Icon Section */}
      <div className={`relative h-48 bg-gradient-to-br ${config.gradient} overflow-hidden`}>
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000" />
        </div>

        {/* Vehicle Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <Car className="h-24 w-24 text-white/90 transform group-hover:scale-110 transition-transform duration-300" />
            {vehicle.imageUrl && (
              <img
                src={vehicle.imageUrl}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
            )}
          </div>
        </div>

        {/* Price Badge - Bottom Left */}
        {lowestPrice && (
          <div className="absolute bottom-3 left-3 px-4 py-2 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <Typography variant="h6" className="font-bold text-green-600">
                €{lowestPrice}
              </Typography>
              <Typography variant="caption" className="text-muted-foreground">
                /deň
              </Typography>
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <CardContent className="p-5 space-y-4">
        {/* Vehicle Title */}
        <div>
          <Typography variant="h5" className="font-bold text-foreground mb-1">
            {vehicle.brand} {vehicle.model}
          </Typography>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-mono text-xs">
              {vehicle.licensePlate}
            </Badge>
            {vehicle.year && (
              <Badge variant="secondary" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {vehicle.year}
              </Badge>
            )}
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="space-y-2">
          {vehicle.company && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{vehicle.company}</span>
            </div>
          )}
          {vehicle.vin && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Typography variant="caption" className="font-mono">
                VIN: {vehicle.vin}
              </Typography>
            </div>
          )}
          {vehicle.category && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs capitalize">
                {vehicle.category}
              </Badge>
            </div>
          )}
        </div>

        {/* Commission Info */}
        {vehicle.commission && (
          <div className="p-3 rounded-lg bg-muted/50">
            <Typography variant="caption" className="text-muted-foreground">
              Provízia:{' '}
              <span className="font-semibold text-foreground">
                {vehicle.commission.type === 'percentage'
                  ? `${vehicle.commission.value}%`
                  : `€${vehicle.commission.value}`}
              </span>
            </Typography>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Can update="vehicles">
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(vehicle);
              }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
            >
              <Edit className="h-4 w-4 mr-1" />
              Upraviť
            </Button>
          </Can>

          {onKmHistory && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onKmHistory(vehicle);
              }}
              className="flex-1"
            >
              <Gauge className="h-4 w-4 mr-1" />
              KM
            </Button>
          )}

          <Can delete="vehicles">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(vehicle.id);
              }}
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Can>
        </div>
      </CardContent>

      {/* Hover overlay effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
    </Card>
  );
};

export default PremiumVehicleCard;

