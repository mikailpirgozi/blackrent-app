import {
  Car,
  User,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  CheckCircle,
  XCircle,
  Edit,
  FileText,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Separator } from '@/components/ui/separator';
import React from 'react';
import { format, differenceInDays } from 'date-fns';
import { sk } from 'date-fns/locale';
import type { Rental } from '../../../types';

interface PremiumRentalCardProps {
  rental: Rental;
  onEdit: (rental: Rental) => void;
  onViewProtocols: (rental: Rental) => void;
  onViewDetails?: (rental: Rental) => void;
}

const PremiumRentalCard: React.FC<PremiumRentalCardProps> = ({
  rental,
  onEdit,
  onViewProtocols,
  onViewDetails,
}) => {
  // Status configuration
  const statusConfig = {
    pending: {
      label: 'Čaká',
      icon: Clock,
      gradient: 'from-orange-500 to-amber-600',
      bgClass: 'bg-orange-50 dark:bg-orange-950',
      textClass: 'text-orange-700 dark:text-orange-300',
      dotClass: 'bg-orange-500',
    },
    active: {
      label: 'Aktívny',
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-600',
      bgClass: 'bg-green-50 dark:bg-green-950',
      textClass: 'text-green-700 dark:text-green-300',
      dotClass: 'bg-green-500',
    },
    finished: {
      label: 'Ukončený',
      icon: CheckCircle,
      gradient: 'from-blue-500 to-cyan-600',
      bgClass: 'bg-blue-50 dark:bg-blue-950',
      textClass: 'text-blue-700 dark:text-blue-300',
      dotClass: 'bg-blue-500',
    },
    cancelled: {
      label: 'Zrušený',
      icon: XCircle,
      gradient: 'from-red-500 to-pink-600',
      bgClass: 'bg-red-50 dark:bg-red-950',
      textClass: 'text-red-700 dark:text-red-300',
      dotClass: 'bg-red-500',
    },
  };

  const config = statusConfig[rental.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  // Calculate rental duration
  const startDate = new Date(rental.startDate);
  const endDate = new Date(rental.endDate);
  const duration = differenceInDays(endDate, startDate);
  const today = new Date();
  const isActive = rental.status === 'active';
  const daysRemaining = isActive ? differenceInDays(endDate, today) : 0;

  return (
    <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]">
      {/* Gradient header */}
      <div className={`relative h-20 bg-gradient-to-r ${config.gradient} overflow-hidden`}>
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full mix-blend-overlay filter blur-2xl animate-blob" />
        </div>

        {/* Header content */}
        <div className="relative h-full flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div>
              <Typography variant="h6" className="text-white font-bold">
                {rental.vehicle ? `${rental.vehicle.brand} ${rental.vehicle.model}` : 'Neznáme vozidlo'}
              </Typography>
              <Typography variant="caption" className="text-white/80">
                {rental.vehicle?.licensePlate || 'N/A'}
              </Typography>
            </div>
          </div>

          {/* Status Badge */}
          <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 flex items-center gap-1 px-3 py-1">
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>
      </div>

      <CardContent className="p-6 space-y-4">
        {/* Customer Info */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <Typography variant="body2" className="font-semibold">
              {rental.customer?.name || rental.customerName || 'Neznámy zákazník'}
            </Typography>
            {rental.customer?.email && (
              <Typography variant="caption" className="text-muted-foreground">
                {rental.customer.email}
              </Typography>
            )}
          </div>
        </div>

        <Separator />

        {/* Timeline */}
        <div className="relative pl-8">
          {/* Timeline line */}
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/40 to-primary/10" />

          {/* Start date */}
          <div className="relative mb-6">
            <div className={`absolute -left-6 w-4 h-4 rounded-full ${config.dotClass} border-4 border-background`} />
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Typography variant="body2" className="font-semibold">
                Začiatok prenájmu
              </Typography>
            </div>
            <Typography variant="body2" className="text-muted-foreground">
              {format(startDate, 'EEEE, d. MMMM yyyy • HH:mm', { locale: sk })}
            </Typography>
          </div>

          {/* End date */}
          <div className="relative">
            <div className={`absolute -left-6 w-4 h-4 rounded-full ${isActive ? 'bg-white border-2 border-primary animate-pulse' : config.dotClass} border-4 border-background`} />
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Typography variant="body2" className="font-semibold">
                Koniec prenájmu
              </Typography>
            </div>
            <Typography variant="body2" className="text-muted-foreground">
              {format(endDate, 'EEEE, d. MMMM yyyy • HH:mm', { locale: sk })}
            </Typography>
          </div>
        </div>

        <Separator />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Duration */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <Typography variant="caption" className="text-muted-foreground">
                Trvanie
              </Typography>
            </div>
            <Typography variant="h6" className="font-bold">
              {duration} {duration === 1 ? 'deň' : duration < 5 ? 'dni' : 'dní'}
            </Typography>
          </div>

          {/* Price */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <Typography variant="caption" className="text-muted-foreground">
                Celková cena
              </Typography>
            </div>
            <Typography variant="h6" className="font-bold text-green-600">
              €{rental.totalPrice?.toFixed(2) || '0.00'}
            </Typography>
          </div>

          {/* Company */}
          {rental.vehicle?.company && (
            <div className="col-span-2 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <Typography variant="caption" className="text-muted-foreground">
                  Firma:
                </Typography>
                <Typography variant="body2" className="font-semibold">
                  {rental.vehicle.company}
                </Typography>
              </div>
            </div>
          )}
        </div>

        {/* Active rental progress */}
        {isActive && daysRemaining >= 0 && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-2">
              <Typography variant="body2" className="font-semibold text-green-700 dark:text-green-300">
                Aktívny prenájom
              </Typography>
              <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-300">
                {daysRemaining} {daysRemaining === 1 ? 'deň' : daysRemaining < 5 ? 'dni' : 'dní'} zostáva
              </Badge>
            </div>
            <div className="w-full h-2 bg-green-100 dark:bg-green-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${((duration - daysRemaining) / duration) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => onEdit(rental)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Edit className="h-4 w-4 mr-1" />
            Upraviť
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewProtocols(rental)}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-1" />
            Protokoly
          </Button>

          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(rental)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>

      {/* Hover gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
    </Card>
  );
};

export default PremiumRentalCard;

