import React from 'react';
import { Card, Typography } from '@mui/material';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Card sx={{ p: 2, boxShadow: 3 }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          {label}
        </Typography>
        {payload.map((entry: any, index: number) => (
          <Typography key={index} variant="body2" color={entry.color}>
            {entry.name}: {entry.value.toLocaleString()} €
          </Typography>
        ))}
      </Card>
    );
  }
  return null;
};

export default CustomTooltip;
