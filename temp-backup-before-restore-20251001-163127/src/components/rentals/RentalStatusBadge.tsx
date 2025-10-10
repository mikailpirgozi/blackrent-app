/**
 * 🏷️ RENTAL STATUS BADGE KOMPONENT
 * 
 * Zobrazuje status prenájmu s farbou a textom založený na aktuálnom dátume
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { calculateRentalStatus, getRentalStatusText, getRentalStatusColor } from '../../utils/rentalStatusUtils';
import type { Rental } from '../../types';

interface RentalStatusBadgeProps {
  rental: Rental;
  currentDate?: Date;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RentalStatusBadge({ 
  rental, 
  currentDate = new Date(),
  showIcon = false,
  size = 'md',
  className = ''
}: RentalStatusBadgeProps) {
  const status = calculateRentalStatus(rental, currentDate);
  const statusText = getRentalStatusText(status);
  const statusColor = getRentalStatusColor(status);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2'
  };

  const iconMap = {
    pending: '⏳',
    active: '🟢',
    finished: '✅',
    cancelled: '❌'
  };

  return (
    <Badge 
      variant="secondary" 
      className={`${statusColor} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && (
        <span className="mr-1">
          {iconMap[status]}
        </span>
      )}
      {statusText}
    </Badge>
  );
}

export default RentalStatusBadge;
