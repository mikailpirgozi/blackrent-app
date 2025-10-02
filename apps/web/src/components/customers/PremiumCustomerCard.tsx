import {
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Car,
  TrendingUp,
  Edit,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import React from 'react';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import type { Customer } from '../../types';

interface PremiumCustomerCardProps {
  customer: Customer & {
    rentalCount?: number | undefined;
    totalSpent?: number | undefined;
    lastRentalDate?: Date | undefined;
  };
  onEdit: (customer: Customer) => void;
  onViewHistory?: (customer: Customer) => void;
}

const PremiumCustomerCard: React.FC<PremiumCustomerCardProps> = ({
  customer,
  onEdit,
  onViewHistory,
}) => {
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Determine customer tier based on spending
  const getTier = (spent: number = 0) => {
    if (spent >= 5000) return { label: 'VIP', gradient: 'from-purple-500 to-pink-600', icon: '👑' };
    if (spent >= 2000) return { label: 'Gold', gradient: 'from-yellow-500 to-orange-600', icon: '⭐' };
    if (spent >= 500) return { label: 'Silver', gradient: 'from-gray-400 to-gray-600', icon: '🥈' };
    return { label: 'Bronze', gradient: 'from-amber-700 to-amber-900', icon: '🥉' };
  };

  const tier = getTier(customer.totalSpent);
  const initials = getInitials(customer.name);

  return (
    <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]">
      {/* Background gradient */}
      <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-r ${tier.gradient} opacity-10`} />

      <CardContent className="relative p-6 space-y-4">
        {/* Header with Avatar */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar with gradient border */}
            <div className={`p-1 rounded-full bg-gradient-to-r ${tier.gradient}`}>
              <Avatar className="h-16 w-16 bg-white dark:bg-slate-900">
                <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Typography variant="h6" className="font-bold">
                  {customer.name}
                </Typography>
                <Badge className={`bg-gradient-to-r ${tier.gradient} text-white border-0`}>
                  {tier.icon} {tier.label}
                </Badge>
              </div>
              <Typography variant="caption" className="text-muted-foreground">
                Zákazník od {format(new Date(customer.createdAt), 'd. MMM yyyy', { locale: sk })}
              </Typography>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2">
          {customer.email && (
            <div className="flex items-center gap-2 text-sm">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </div>
              <Typography variant="body2" className="text-muted-foreground">
                {customer.email}
              </Typography>
            </div>
          )}

          {customer.phone && (
            <div className="flex items-center gap-2 text-sm">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <Phone className="h-4 w-4 text-green-600 dark:text-green-300" />
              </div>
              <Typography variant="body2" className="text-muted-foreground">
                {customer.phone}
              </Typography>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {/* Rental Count */}
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <div className="flex justify-center mb-1">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <Typography variant="h6" className="font-bold">
              {customer.rentalCount || 0}
            </Typography>
            <Typography variant="caption" className="text-muted-foreground">
              Prenájmov
            </Typography>
          </div>

          {/* Total Spent */}
          <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 text-center">
            <div className="flex justify-center mb-1">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <Typography variant="h6" className="font-bold text-green-600">
              €{customer.totalSpent?.toFixed(0) || '0'}
            </Typography>
            <Typography variant="caption" className="text-muted-foreground">
              Celkom
            </Typography>
          </div>

          {/* Average */}
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <div className="flex justify-center mb-1">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <Typography variant="h6" className="font-bold">
              €{customer.rentalCount ? Math.round((customer.totalSpent || 0) / customer.rentalCount) : 0}
            </Typography>
            <Typography variant="caption" className="text-muted-foreground">
              Priemer
            </Typography>
          </div>
        </div>

        {/* Last Rental */}
        {customer.lastRentalDate && (
          <div className="p-3 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Typography variant="caption" className="text-muted-foreground">
                Posledný prenájom
              </Typography>
            </div>
            <Typography variant="body2" className="font-semibold">
              {format(new Date(customer.lastRentalDate), 'd. MMMM yyyy', { locale: sk })}
            </Typography>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => onEdit(customer)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Edit className="h-4 w-4 mr-1" />
            Upraviť
          </Button>

          {onViewHistory && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewHistory(customer)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              História
            </Button>
          )}
        </div>
      </CardContent>

      {/* Hover gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${tier.gradient} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
    </Card>
  );
};

export default PremiumCustomerCard;

