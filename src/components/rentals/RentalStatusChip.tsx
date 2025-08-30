/**
 * 🏷️ RENTAL STATUS CHIP
 *
 * Memoized status chip komponent pre optimálny performance
 */

import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  PlayArrow as ActiveIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import React, { memo } from 'react';

import { StatusChip } from '../ui';

interface RentalStatusChipProps {
  status: string;
  size?: 'small' | 'medium';
}

const RentalStatusChip: React.FC<RentalStatusChipProps> = ({
  status,
  size = 'small',
}) => {
  const theme = useTheme();

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        label: 'Čaká',
        color: 'warning' as const,
        icon: <PendingIcon />,
        backgroundColor: theme.palette.warning.main + '15',
        textColor: theme.palette.warning.main,
      },
      confirmed: {
        label: 'Potvrdené',
        color: 'success' as const,
        icon: <CheckCircleIcon />,
        backgroundColor: theme.palette.success.main + '15',
        textColor: theme.palette.success.main,
      },
      active: {
        label: 'Aktívne',
        color: 'primary' as const,
        icon: <ActiveIcon />,
        backgroundColor: theme.palette.primary.main + '15',
        textColor: theme.palette.primary.main,
      },
      completed: {
        label: 'Dokončené',
        color: 'success' as const,
        icon: <CheckCircleIcon />,
        backgroundColor: theme.palette.success.main + '15',
        textColor: theme.palette.success.main,
      },
      cancelled: {
        label: 'Zrušené',
        color: 'error' as const,
        icon: <CancelIcon />,
        backgroundColor: theme.palette.error.main + '15',
        textColor: theme.palette.error.main,
      },
      overdue: {
        label: 'Po termíne',
        color: 'error' as const,
        icon: <ErrorIcon />,
        backgroundColor: theme.palette.error.main + '15',
        textColor: theme.palette.error.main,
      },
      scheduled: {
        label: 'Naplánované',
        color: 'info' as const,
        icon: <ScheduleIcon />,
        backgroundColor: theme.palette.info.main + '15',
        textColor: theme.palette.info.main,
      },
    };

    return (
      configs[status as keyof typeof configs] || {
        label: status || 'Neznámy',
        color: 'default' as const,
        icon: <PendingIcon />,
        backgroundColor: theme.palette.grey[200],
        textColor: theme.palette.text.primary,
      }
    );
  };

  const config = getStatusConfig(status);

  return (
    <StatusChip
      label={config.label}
      size={size}
      icon={config.icon}
      sx={{
        backgroundColor: config.backgroundColor,
        color: config.textColor,
        fontWeight: 600,
        fontSize: '0.75rem',
        '& .MuiChip-icon': {
          color: config.textColor,
          fontSize: 16,
        },
        '& .MuiChip-label': {
          px: 1,
        },
      }}
    />
  );
};

// Export memoized component s custom comparison
export default memo(RentalStatusChip, (prevProps, nextProps) => {
  return (
    prevProps.status === nextProps.status && prevProps.size === nextProps.size
  );
});
