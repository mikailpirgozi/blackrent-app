/**
 * 🎨 UNIFIED CHIP COMPONENT
 *
 * Konzistentný chip komponent pre celú BlackRent aplikáciu
 * Nahradí všetky rôzne chip štýly jednotným dizajnom
 */

import type { ChipProps } from '@mui/material';
import { Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

// 🎨 Definované chip varianty pre BlackRent
export type ChipVariant =
  | 'default'
  | 'status'
  | 'priority'
  | 'trend'
  | 'role'
  | 'compact';

// 🎨 Definované farby pre BlackRent chips
const CHIP_COLORS = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  neutral: '#6b7280',
} as const;

// 🎨 Styled Chip s BlackRent dizajnom
const StyledChip = styled(Chip)<{
  variant?: ChipVariant;
  chipColor?: keyof typeof CHIP_COLORS | 'inherit';
}>(({ theme, variant = 'default', chipColor = 'primary' }) => {
  const baseColor =
    chipColor === 'inherit'
      ? theme.palette.primary.main
      : CHIP_COLORS[chipColor as keyof typeof CHIP_COLORS] ||
        CHIP_COLORS.primary;

  // 🎨 Base štýly
  const baseStyles = {
    fontWeight: 600,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '& .MuiChip-label': {
      fontSize: '0.75rem',
      fontWeight: 600,
    },
    '& .MuiChip-icon': {
      fontSize: '16px',
    },
  };

  // 🎨 Variant štýly
  const variantStyles = {
    default: {
      backgroundColor: `${baseColor}15`,
      color: baseColor,
      border: `1px solid ${baseColor}30`,
      '&:hover': {
        backgroundColor: `${baseColor}25`,
        transform: 'translateY(-1px)',
        boxShadow: `0 2px 8px ${baseColor}30`,
      },
      '& .MuiChip-icon': {
        color: baseColor,
      },
    },
    status: {
      backgroundColor: baseColor,
      color: '#ffffff',
      fontWeight: 700,
      fontSize: '0.75rem',
      height: 24,
      '&:hover': {
        backgroundColor: `${baseColor}dd`,
        transform: 'scale(1.05)',
      },
      '& .MuiChip-icon': {
        color: '#ffffff',
      },
      '& .MuiChip-label': {
        px: 1,
      },
    },
    priority: {
      backgroundColor: baseColor,
      color: '#ffffff',
      fontWeight: 700,
      fontSize: '0.7rem',
      height: 20,
      minWidth: 32,
      borderRadius: '10px',
      '&:hover': {
        backgroundColor: `${baseColor}dd`,
        transform: 'scale(1.1)',
        boxShadow: `0 2px 8px ${baseColor}50`,
      },
      '& .MuiChip-label': {
        px: 0.5,
      },
    },
    trend: {
      backgroundColor: `${baseColor}20`,
      color: baseColor,
      fontSize: '0.7rem',
      height: 20,
      '& .MuiChip-icon': {
        color: baseColor,
        fontSize: 12,
      },
      '& .MuiChip-label': {
        px: 0.5,
      },
      '&:hover': {
        backgroundColor: `${baseColor}30`,
      },
    },
    role: {
      backgroundColor: baseColor,
      color: '#ffffff',
      fontSize: '0.75rem',
      fontWeight: 600,
      '&:hover': {
        backgroundColor: `${baseColor}dd`,
      },
      '& .MuiChip-label': {
        px: 1,
      },
    },
    compact: {
      backgroundColor: `${baseColor}10`,
      color: baseColor,
      fontSize: '0.7rem',
      height: 18,
      '& .MuiChip-label': {
        px: 0.5,
      },
      '& .MuiChip-icon': {
        fontSize: 12,
      },
    },
  };

  return {
    ...baseStyles,
    ...variantStyles[variant as keyof typeof variantStyles],
  };
});

// 🎨 Props interface
export interface UnifiedChipProps extends Omit<ChipProps, 'color' | 'variant'> {
  variant?: ChipVariant;
  chipColor?: keyof typeof CHIP_COLORS | 'inherit';
  animated?: boolean;
}

// 🎨 Unified Chip Component
export const UnifiedChip: React.FC<UnifiedChipProps> = ({
  variant = 'default',
  chipColor = 'primary',
  animated = false,
  sx,
  ...props
}) => {
  const animatedStyles = animated
    ? {
        '&:hover': {
          animation: 'chipPulse 0.6s ease',
        },
        '@keyframes chipPulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      }
    : {};

  const { variant: _, chipColor: __, ...chipProps } = props as any;

  return (
    <StyledChip
      variant={variant}
      chipColor={chipColor}
      sx={{
        ...animatedStyles,
        ...sx,
      }}
      {...chipProps}
    />
  );
};

// 🎨 Predefined chip variants pre rýchle použitie
export const StatusChip: React.FC<
  Omit<UnifiedChipProps, 'variant'>
> = props => <UnifiedChip variant="status" {...props} />;

export const PriorityChip: React.FC<
  Omit<UnifiedChipProps, 'variant'>
> = props => <UnifiedChip variant="priority" {...props} />;

export const TrendChip: React.FC<Omit<UnifiedChipProps, 'variant'>> = props => (
  <UnifiedChip variant="trend" {...props} />
);

export const RoleChip: React.FC<Omit<UnifiedChipProps, 'variant'>> = props => (
  <UnifiedChip variant="role" {...props} />
);

export const CompactChip: React.FC<
  Omit<UnifiedChipProps, 'variant'>
> = props => <UnifiedChip variant="compact" {...props} />;

// 🎨 Predefined status chips pre BlackRent stavy
export const PendingChip: React.FC<
  Omit<UnifiedChipProps, 'chipColor' | 'variant'>
> = props => <StatusChip chipColor="warning" label="Čaká" {...props} />;

export const ActiveChip: React.FC<
  Omit<UnifiedChipProps, 'chipColor' | 'variant'>
> = props => <StatusChip chipColor="success" label="Aktívny" {...props} />;

export const CompletedChip: React.FC<
  Omit<UnifiedChipProps, 'chipColor' | 'variant'>
> = props => <StatusChip chipColor="info" label="Dokončený" {...props} />;

export const CancelledChip: React.FC<
  Omit<UnifiedChipProps, 'chipColor' | 'variant'>
> = props => <StatusChip chipColor="error" label="Zrušený" {...props} />;

export default UnifiedChip;
