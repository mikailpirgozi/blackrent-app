import {
  Calendar,
  Car,
  Edit,
  Euro,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// import { useApp } from '../../../context/AppContext'; // Migrated to React Query
import { useVehicles } from '../../../lib/react-query/hooks/useVehicles';
import type { Rental } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface RentalCardProps {
  rental: Rental;
  onEdit: (rental: Rental) => void;
  index: number;
}

export function RentalCard({ rental, onEdit }: RentalCardProps) {
  // const { state } = useApp(); // Migrated to React Query
  const { data: vehicles = [] } = useVehicles();

  // Nájdi vehicle pre tento rental
  const vehicle = vehicles.find(v => v.id === rental.vehicleId);

  // Status color mapping
  const getStatusVariant = (status: string | undefined): 'default' | 'secondary' | 'destructive' | 'outline' => {
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
    <Card className="relative border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <CardContent className="pb-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Car className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">
                {vehicle
                  ? `${vehicle.brand} ${vehicle.model}`
                  : 'Neznáme vozidlo'}
              </p>
              <p className="text-xs text-muted-foreground">
                {vehicle?.licensePlate || 'Bez ŠPZ'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={getStatusVariant(rental.status)}
              className="text-xs"
            >
              {rental.status}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(rental)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Customer info */}
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm">
            {rental.customerName || 'Neznámy zákazník'}
          </p>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm">
            {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
          </p>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-4">
          <Euro className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">
            {formatCurrency(rental.totalPrice)}
          </p>
          {rental.paymentMethod && (
            <Badge
              variant="outline"
              className="text-xs ml-auto"
            >
              {rental.paymentMethod}
            </Badge>
          )}
        </div>

        {/* Company */}
        {vehicle?.company && (
          <div>
            <p className="text-xs text-muted-foreground">
              Firma: {vehicle.company}
            </p>
          </div>
        )}

        {/* Additional info for flexible rentals */}
        {rental.isFlexible && (
          <Badge
            variant="outline"
            className="text-xs mt-2"
          >
            Flexibilný prenájom
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
