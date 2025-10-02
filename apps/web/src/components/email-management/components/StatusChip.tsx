/**
 * Status Chip Component
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

import { Badge } from '@/components/ui/badge';
import React from 'react';

import { getStatusColor, getStatusLabel } from '../utils/email-formatters';

interface StatusChipProps {
  status: string;
  actionTaken?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  actionTaken,
}) => {
  const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'primary': 'default',
    'secondary': 'secondary',
    'error': 'destructive',
    'warning': 'secondary',
    'success': 'default',
    'default': 'outline',
  };
  
  const color = getStatusColor(status, actionTaken);
  const variant = variantMap[color] || 'default';
  
  return (
    <Badge variant={variant}>
      {getStatusLabel(status, actionTaken)}
    </Badge>
  );
};
