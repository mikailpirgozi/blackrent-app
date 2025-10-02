import React from 'react';
import { Card } from '@/components/ui/card';

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
      <Card className="p-4 shadow-md">
        <p className="text-sm font-bold mb-2">
          {label}
        </p>
        {payload.map((entry: Record<string, unknown>, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color as string }}>
            {entry.name as string}: {(entry.value as number).toLocaleString()} €
          </p>
        ))}
      </Card>
    );
  }
  return null;
};

export default CustomTooltip;
