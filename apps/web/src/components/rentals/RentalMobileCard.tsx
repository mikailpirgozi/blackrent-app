import {
  Trash2,
  Edit,
  FileText,
  Phone,
  FileCheck,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { memo } from 'react';
import PriceDisplay from './components/PriceDisplay';

import type { Rental } from '../../types';
import { formatTime } from '../../utils/formatters';

interface RentalMobileCardProps {
  rental: Rental;
  onEdit: (rental: Rental) => void;
  onDelete: (id: string) => void;
  onShowDetail: (rental: Rental) => void;
  onProtocol: (rental: Rental, type: 'handover' | 'return') => void;
  formatPrice: (price: number | string | undefined) => string;
  formatDate: (date: Date | string) => string;
  getRentalPriority: (rental: Rental) => number;
  getRentalBackgroundColor: (rental: Rental) => string;
}

const RentalMobileCard = memo<RentalMobileCardProps>(
  ({
    rental,
    onEdit,
    onDelete,
    onShowDetail,
    onProtocol,
    // formatPrice, // TODO: Implement price formatting
    formatDate,
    getRentalPriority,
    getRentalBackgroundColor,
  }) => {
    const priority = getRentalPriority(rental);

    return (
      <Card
        className={`mb-4 border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${
          priority <= 3 ? 'border-yellow-500' : 'border-border'
        }`}
        style={{ background: getRentalBackgroundColor(rental) }}
      >
        <CardContent className="pb-2">
          {/* Header with priority and vehicle */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  priority <= 3
                    ? 'destructive'
                    : priority <= 5
                      ? 'default'
                      : 'secondary'
                }
                className="text-xs"
              >
                P{priority}
              </Badge>
              {rental.vehicle ? (
                <div>
                  <p className="text-sm font-semibold">
                    {rental.vehicle.licensePlate}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rental.vehicle.brand} {rental.vehicle.model}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-destructive">
                  Bez vozidla
                </p>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShowDetail(rental)}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
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
          <div className="mb-2">
            <p className="text-sm font-medium">
              👤 {rental.customerName}
            </p>
            {(rental.customerPhone || rental.customer?.phone) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Phone className="h-3 w-3" />
                {rental.customerPhone || rental.customer?.phone}
              </p>
            )}
          </div>

          {/* Company */}
          {rental.vehicle?.company && (
            <p className="text-xs text-muted-foreground mb-2">
              🏢 {rental.vehicle.company}
            </p>
          )}

          {/* Date range */}
          <div className="flex justify-between mb-2">
            <div>
              <p className="text-xs text-muted-foreground">
                Od:
              </p>
              <p className="text-sm font-medium">
                {formatDate(rental.startDate)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatTime(rental.startDate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Do:
              </p>
              <p className="text-sm font-medium">
                {formatDate(rental.endDate)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatTime(rental.endDate)}
              </p>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Price and status */}
          <div className="flex justify-between items-center mb-2">
            <div>
              <PriceDisplay
                rental={rental}
                variant="mobile"
                showExtraKm={true}
              />
            </div>
            <div className="flex flex-col gap-1 items-end">
              <Badge
                variant={rental.paid ? 'default' : 'destructive'}
                className="text-xs"
              >
                {rental.paid ? 'Zaplatené' : 'Nezaplatené'}
              </Badge>
              <Badge
                variant={rental.confirmed ? 'default' : 'outline'}
                className="text-xs"
              >
                {rental.confirmed ? 'Potvrdené' : 'Nepotvrdené'}
              </Badge>
            </div>
          </div>

          {/* Order number and handover place */}
          {(rental.orderNumber || rental.handoverPlace) && (
            <div className="mb-2">
              {rental.orderNumber && (
                <p className="text-xs text-muted-foreground">
                  📋 Obj. č.: {rental.orderNumber}
                </p>
              )}
              {rental.handoverPlace && (
                <p className="text-xs text-muted-foreground">
                  📍 {rental.handoverPlace}
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onProtocol(rental, 'handover')}
              className="flex-1 gap-1"
            >
              <FileText className="h-3 w-3" />
              Prevzatie
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onProtocol(rental, 'return')}
              className="flex-1 gap-1"
            >
              <FileCheck className="h-3 w-3" />
              Vrátenie
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(rental.id)}
              className="gap-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-3 w-3" />
              Zmazať
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
);

RentalMobileCard.displayName = 'RentalMobileCard';

export default RentalMobileCard;
