import {
  Building2,
  Calendar,
  Car,
  Check,
  Copy,
  Edit2,
  MoreVertical,
  Trash2,
  User,
  Wallet,
} from 'lucide-react';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDateTime } from '../../../utils/formatters';
import type { Rental, Vehicle } from '../../../types';

interface ElegantRentalCardProps {
  rental: Rental;
  vehicle: Vehicle | undefined;
  hasHandover: boolean;
  hasReturn: boolean;
  onEdit: (rental: Rental) => void;
  onDelete: (id: string) => void;
  onClone: (rental: Rental) => void;
  onOpenProtocolMenu: (rental: Rental, type: 'handover' | 'return') => void;
}

export const ElegantRentalCard: React.FC<ElegantRentalCardProps> = ({
  rental,
  vehicle,
  hasHandover,
  hasReturn,
  onEdit,
  onDelete,
  onClone,
  onOpenProtocolMenu,
}) => {
  const isFlexible = rental.isFlexible || false;

  // Status variant
  const getStatusVariant = () => {
    switch (rental.status) {
      case 'active':
        return 'default';
      case 'finished':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Protocol status
  const getProtocolStatus = () => {
    if (hasHandover && hasReturn)
      return { text: 'Kompletné', variant: 'default' as const, icon: '✓' };
    if (hasHandover)
      return { text: 'Odovzdané', variant: 'secondary' as const, icon: '→' };
    if (hasReturn)
      return { text: 'Vrátené', variant: 'secondary' as const, icon: '←' };
    return { text: 'Čaká', variant: 'outline' as const, icon: '○' };
  };

  const protocolStatus = getProtocolStatus();

  return (
    <Card
      className={cn(
        'group hover:shadow-lg transition-all duration-300 cursor-pointer border',
        isFlexible
          ? 'bg-gradient-to-r from-orange-50/50 to-orange-100/50 border-orange-200 hover:border-orange-300'
          : 'bg-card hover:border-primary/40'
      )}
      onClick={() => onEdit(rental)}
    >
      <CardContent className="p-4">
        {/* Main Content - One or Two Lines */}
        <div className="flex items-start justify-between gap-4">
          {/* Left Side - Vehicle & Customer Info */}
          <div className="flex-1 space-y-2">
            {/* Line 1: Vehicle & Customer */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Vehicle */}
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                <span className="font-semibold text-base text-foreground">
                  {vehicle?.brand} {vehicle?.model}
                </span>
                <span className="text-sm text-muted-foreground">
                  • {vehicle?.licensePlate}
                </span>
                {vehicle?.company && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-orange-600" />
                      <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                        {vehicle.company}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant()} className="text-xs">
                  {rental.status === 'active'
                    ? 'Aktívny'
                    : rental.status === 'finished'
                      ? 'Ukončený'
                      : 'Čakajúci'}
                </Badge>
                {isFlexible && (
                  <Badge
                    variant="outline"
                    className="text-xs border-orange-500 text-orange-600"
                  >
                    Flexibilný
                  </Badge>
                )}
              </div>
            </div>

            {/* Line 2: Customer, Dates, Price, Protocol Status */}
            <div className="flex items-center gap-4 flex-wrap text-sm">
              {/* Customer */}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">
                  {rental.customerName}
                </span>
              </div>

              <span className="text-muted-foreground">•</span>

              {/* Dates */}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {formatDateTime(rental.startDate)} -{' '}
                  {formatDateTime(rental.endDate)}
                </span>
              </div>

              <span className="text-muted-foreground">•</span>

              {/* Price */}
              <div className="flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-green-600" />
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {rental.totalPrice?.toFixed(2)}€
                </span>
                <Badge
                  variant={rental.paid ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {rental.paid ? 'Uhradené' : 'Neuhradené'}
                </Badge>
              </div>

              <span className="text-muted-foreground">•</span>

              {/* Protocol Status */}
              <Badge variant={protocolStatus.variant} className="text-xs">
                {protocolStatus.icon} {protocolStatus.text}
              </Badge>
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-2">
            {/* Protocol Buttons */}
            <Button
              variant={hasHandover ? 'default' : 'outline'}
              size="sm"
              onClick={e => {
                e.stopPropagation();
                onOpenProtocolMenu(rental, 'handover');
              }}
              className={cn(
                'h-8 text-xs transition-all',
                hasHandover
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'border-orange-500 text-orange-600 hover:bg-orange-50'
              )}
            >
              {hasHandover ? <Check className="h-3 w-3 mr-1" /> : null}
              Odovzdať
            </Button>

            <Button
              variant={hasReturn ? 'default' : 'outline'}
              size="sm"
              onClick={e => {
                e.stopPropagation();
                onOpenProtocolMenu(rental, 'return');
              }}
              className={cn(
                'h-8 text-xs transition-all',
                hasReturn
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'border-orange-500 text-orange-600 hover:bg-orange-50'
              )}
            >
              {hasReturn ? <Check className="h-3 w-3 mr-1" /> : null}
              Prevziať
            </Button>

            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={e => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation();
                    onEdit(rental);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Upraviť
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation();
                    onClone(rental);
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Kopírovať
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={e => {
                    e.stopPropagation();
                    onDelete(rental.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Zmazať
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
