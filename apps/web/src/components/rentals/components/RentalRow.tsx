import {
  Car,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

// import { useApp } from '../../../context/AppContext'; // Migrated to React Query
import { useVehicles } from '../../../lib/react-query/hooks/useVehicles';
import type { Rental } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface RentalRowProps {
  rental: Rental;
  onEdit: (rental: Rental) => void;
  index: number;
}

export function RentalRow({ rental, onEdit }: RentalRowProps) {
  // const { state } = useApp(); // Migrated to React Query
  const { data: vehicles = [] } = useVehicles();

  // Nájdi vehicle pre tento rental
  const vehicle = vehicles.find(v => v.id === rental.vehicleId);

  // Status color mapping
  const getStatusVariant = (
    status: string | undefined
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card
      className="p-4 hover:bg-muted/50 hover:shadow-md transition-all duration-200 cursor-pointer border"
      onClick={() => onEdit(rental)}
    >
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Vehicle info */}
        <div className="sm:col-span-3">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {vehicle
                  ? `${vehicle.brand} ${vehicle.model}`
                  : 'Neznáme vozidlo'}
              </p>
              <p className="text-xs text-muted-foreground">
                {vehicle?.licensePlate || 'Bez ŠPZ'}
              </p>
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="sm:col-span-2">
          <p className="text-sm truncate">
            {rental.customerName || 'Neznámy zákazník'}
          </p>
          <p className="text-xs text-muted-foreground">
            Zákazník
          </p>
        </div>

        {/* Date range */}
        <div className="sm:col-span-2">
          <p className="text-sm truncate">
            {formatDate(rental.startDate)}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            - {formatDate(rental.endDate)}
          </p>
        </div>

        {/* Price */}
        <div className="sm:col-span-2">
          <p className="text-sm font-medium">
            {formatCurrency(rental.totalPrice)}
          </p>
          {rental.paymentMethod && (
            <p className="text-xs text-muted-foreground">
              {rental.paymentMethod}
            </p>
          )}
        </div>

        {/* Status */}
        <div className="sm:col-span-2">
          <div className="flex flex-col gap-1">
            <Badge
              variant={getStatusVariant(rental.status)}
              className="text-xs w-fit"
            >
              {rental.status}
            </Badge>
            {rental.isFlexible && (
              <Badge
                variant="outline"
                className="text-xs w-fit"
              >
                Flexibilný
              </Badge>
            )}
          </div>
        </div>

        {/* Company */}
        <div className="sm:col-span-1">
          <p className="text-sm truncate">
            {vehicle?.company || 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground">
            Firma
          </p>
        </div>

        {/* Actions */}
        <div className="sm:col-span-1">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                onEdit(rental);
              }}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
