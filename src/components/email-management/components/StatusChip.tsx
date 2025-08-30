/**
 * Status Chip Component
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

import { Chip } from '@mui/material';
import React from 'react';

import { getStatusColor, getStatusLabel } from '../utils/email-formatters';

interface StatusChipProps {
  status: string;
  actionTaken?: string;
  size?: 'small' | 'medium';
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  actionTaken,
  size = 'small',
}) => {
  return (
    <Chip
      label={getStatusLabel(status, actionTaken)}
      color={getStatusColor(status, actionTaken)}
      size={size}
    />
  );
};
