// Lucide icons (replacing MUI icons)
import {
  CheckCircle as CheckCircleIcon,
  AlertCircle as ErrorIcon,
  Clock as PendingIcon,
} from 'lucide-react';
import React from 'react';

import { StatusChip } from '../../ui';

interface RentalStatusChipProps {
  status: string;
  confirmed?: boolean;
  paid?: boolean;
  size?: 'small' | 'medium';
}

const RentalStatusChip = React.memo<RentalStatusChipProps>(
  ({ status, /* confirmed, paid, */ size = 'small' }) => {
    const getStatusProps = () => {
      switch (status) {
        case 'active':
          return {
            label: 'Aktívny',
            color: 'success' as const,
            icon: <CheckCircleIcon className="h-4 w-4" />,
          };
        case 'finished':
          return {
            label: 'Ukončený',
            color: 'neutral' as const,
            icon: <CheckCircleIcon className="h-4 w-4" />,
          };
        case 'pending':
          return {
            label: 'Čakajúci',
            color: 'warning' as const,
            icon: <PendingIcon className="h-4 w-4" />,
          };
        case 'cancelled':
          return {
            label: 'Zrušený',
            color: 'error' as const,
            icon: <ErrorIcon className="h-4 w-4" />,
          };
        default:
          return {
            label: status || 'Neznámy',
            color: 'neutral' as const,
            icon: <PendingIcon className="h-4 w-4" />,
          };
      }
    };

    const statusProps = getStatusProps();

    return (
      <StatusChip
        label={statusProps.label}
        chipColor={statusProps.color}
        size={size}
        icon={statusProps.icon}
        className="font-semibold rounded-md"
      />
    );
  }
);

RentalStatusChip.displayName = 'RentalStatusChip';

export default RentalStatusChip;
