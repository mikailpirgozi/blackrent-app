import { Typography } from '@mui/material';
import React from 'react';

import { ElevatedCard } from '../ui';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Record<string, unknown>[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    return (
      <ElevatedCard sx={{ p: 2 }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          {label}
        </Typography>
        {payload.map((entry: Record<string, unknown>, index: number) => (
          <Typography key={index} variant="body2" color={entry.color as string}>
            {entry.name as string}: {(entry.value as number).toLocaleString()} €
          </Typography>
        ))}
      </ElevatedCard>
    );
  }
  return null;
};

export default CustomTooltip;
