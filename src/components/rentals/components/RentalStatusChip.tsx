import React from 'react';
import { StatusChip } from '../../ui';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';

interface RentalStatusChipProps {
  status: string;
  confirmed?: boolean;
  paid?: boolean;
  size?: 'small' | 'medium';
}

const RentalStatusChip = React.memo<RentalStatusChipProps>(({
  status,
  confirmed,
  paid,
  size = 'small'
}) => {
  const getStatusProps = () => {
    switch (status) {
      case 'active':
        return {
          label: 'Aktívny',
          color: 'success' as const,
          icon: <CheckCircleIcon sx={{ fontSize: 16 }} />
        };
      case 'finished':
        return {
          label: 'Ukončený',
          color: 'neutral' as const,
          icon: <CheckCircleIcon sx={{ fontSize: 16 }} />
        };
      case 'pending':
        return {
          label: 'Čakajúci',
          color: 'warning' as const,
          icon: <PendingIcon sx={{ fontSize: 16 }} />
        };
      case 'cancelled':
        return {
          label: 'Zrušený',
          color: 'error' as const,
          icon: <ErrorIcon sx={{ fontSize: 16 }} />
        };
      default:
        return {
          label: status || 'Neznámy',
          color: 'neutral' as const,
          icon: <PendingIcon sx={{ fontSize: 16 }} />
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
      sx={{
        fontWeight: 600,
        borderRadius: 1.5,
        '& .MuiChip-icon': {
          fontSize: 16
        }
      }}
    />
  );
});

RentalStatusChip.displayName = 'RentalStatusChip';

export default RentalStatusChip;
