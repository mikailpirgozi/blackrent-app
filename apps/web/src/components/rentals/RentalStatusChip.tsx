/**
 * 🏷️ RENTAL STATUS CHIP
 *
 * Memoized status chip komponent pre optimálny performance
 */

import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
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
  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        label: 'Čaká',
        color: 'warning' as const,
        icon: <UnifiedIcon name="pending" />,
      },
      confirmed: {
        label: 'Potvrdené',
        color: 'success' as const,
        icon: <UnifiedIcon name="success" />,
      },
      active: {
        label: 'Aktívne',
        color: 'primary' as const,
        icon: <UnifiedIcon name="active" />,
      },
      completed: {
        label: 'Dokončené',
        color: 'success' as const,
        icon: <UnifiedIcon name="success" />,
      },
      cancelled: {
        label: 'Zrušené',
        color: 'error' as const,
        icon: <UnifiedIcon name="cancel" />,
      },
      overdue: {
        label: 'Po termíne',
        color: 'error' as const,
        icon: <UnifiedIcon name="error" />,
      },
      scheduled: {
        label: 'Naplánované',
        color: 'info' as const,
        icon: <UnifiedIcon name="clock" />,
      },
    };

    return (
      configs[status as keyof typeof configs] || {
        label: status || 'Neznámy',
        color: 'default' as const,
        icon: <UnifiedIcon name="pending" />,
      }
    );
  };

  const config = getStatusConfig(status);

  return (
    <StatusChip
      label={config.label}
      size={size}
      icon={config.icon}
      chipColor={config.color}
      className="font-semibold text-xs"
    />
  );
};

// Export memoized component s custom comparison
export default memo(RentalStatusChip, (prevProps, nextProps) => {
  return (
    prevProps.status === nextProps.status && prevProps.size === nextProps.size
  );
});
