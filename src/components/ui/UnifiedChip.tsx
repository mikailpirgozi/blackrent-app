import React from 'react';
import { Chip, ChipProps, useTheme } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

// 🎨 UNIFIED CHIP VARIANTS
export type UnifiedChipVariant = 
  | 'default'     // Standard chip
  | 'primary'     // Primary color
  | 'secondary'   // Secondary color
  | 'success'     // Success/positive state
  | 'warning'     // Warning state
  | 'danger'      // Error/danger state
  | 'info'        // Info state
  | 'outline'     // Outlined style
  | 'ghost'       // Minimal style
  | 'gradient'    // Gradient background
  | 'status'      // Status indicator
  | 'protocol';   // Protocol-specific styling

// 🎨 UNIFIED CHIP SIZES
export type UnifiedChipSize = 
  | 'xs'    // Extra small - 20px height
  | 'sm'    // Small - 24px height
  | 'md'    // Medium - 28px height (default)
  | 'lg';   // Large - 32px height

// 🎨 UNIFIED CHIP INTERFACE
export interface UnifiedChipProps extends Omit<ChipProps, 'variant' | 'size' | 'color'> {
  variant?: UnifiedChipVariant;
  size?: UnifiedChipSize;
  animated?: boolean;
  pulse?: boolean;
  glow?: boolean;
  rounded?: boolean;
}

// 🎨 VARIANT STYLES MAPPING
const getVariantStyles = (variant: UnifiedChipVariant, theme: Theme): any => {
  const variants = {
    default: {
      background: 'rgba(102, 126, 234, 0.1)',
      color: '#667eea',
      border: '1px solid rgba(102, 126, 234, 0.2)',
      '&:hover': {
        background: 'rgba(102, 126, 234, 0.2)',
      },
    },
    primary: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#ffffff',
      border: 'none',
      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
        transform: 'translateY(-1px)',
      },
    },
    secondary: {
      background: 'rgba(118, 75, 162, 0.1)',
      color: '#764ba2',
      border: '1px solid rgba(118, 75, 162, 0.2)',
      '&:hover': {
        background: 'rgba(118, 75, 162, 0.2)',
      },
    },
    success: {
      background: 'rgba(16, 185, 129, 0.1)',
      color: '#059669',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      '&:hover': {
        background: 'rgba(16, 185, 129, 0.2)',
      },
    },
    warning: {
      background: 'rgba(245, 158, 11, 0.1)',
      color: '#d97706',
      border: '1px solid rgba(245, 158, 11, 0.2)',
      '&:hover': {
        background: 'rgba(245, 158, 11, 0.2)',
      },
    },
    danger: {
      background: 'rgba(239, 68, 68, 0.1)',
      color: '#dc2626',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      '&:hover': {
        background: 'rgba(239, 68, 68, 0.2)',
      },
    },
    info: {
      background: 'rgba(6, 182, 212, 0.1)',
      color: '#0891b2',
      border: '1px solid rgba(6, 182, 212, 0.2)',
      '&:hover': {
        background: 'rgba(6, 182, 212, 0.2)',
      },
    },
    outline: {
      background: 'transparent',
      color: theme.palette.text.primary,
      border: '1px solid #e2e8f0',
      '&:hover': {
        background: 'rgba(102, 126, 234, 0.05)',
        borderColor: '#667eea',
      },
    },
    ghost: {
      background: 'transparent',
      color: theme.palette.text.secondary,
      border: 'none',
      '&:hover': {
        background: 'rgba(102, 126, 234, 0.05)',
        color: theme.palette.text.primary,
      },
    },
    gradient: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      color: '#ffffff',
      border: 'none',
      boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
        transition: 'left 0.5s',
      },
      '&:hover': {
        transform: 'scale(1.05)',
        boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
        '&::before': {
          left: '100%',
        },
      },
    },
    status: {
      background: '#4caf50',
      color: '#ffffff',
      border: 'none',
      fontWeight: 700,
      boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
      '&:hover': {
        background: '#388e3c',
        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
      },
    },
    protocol: {
      background: '#4caf50',
      color: '#ffffff',
      border: 'none',
      fontWeight: 700,
      minWidth: '44px',
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
      '&:hover': {
        background: '#388e3c',
        transform: 'scale(1.1)',
        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
      },
      '&:active': {
        transform: 'scale(0.95)',
      },
    },
  };

  return variants[variant] || variants.default;
};

// 🎨 SIZE STYLES MAPPING
const getSizeStyles = (size: UnifiedChipSize): any => {
  const sizes = {
    xs: {
      height: '20px',
      fontSize: '0.625rem',
      '& .MuiChip-label': {
        px: 1,
      },
    },
    sm: {
      height: '24px',
      fontSize: '0.75rem',
      '& .MuiChip-label': {
        px: 1.5,
      },
    },
    md: {
      height: '28px',
      fontSize: '0.8rem',
      '& .MuiChip-label': {
        px: 2,
      },
    },
    lg: {
      height: '32px',
      fontSize: '0.875rem',
      '& .MuiChip-label': {
        px: 2.5,
      },
    },
  };

  return sizes[size] || sizes.md;
};

// 🎨 UNIFIED CHIP COMPONENT
export const UnifiedChip: React.FC<UnifiedChipProps> = ({
  variant = 'default',
  size = 'md',
  animated = true,
  pulse = false,
  glow = false,
  rounded = false,
  sx,
  ...props
}) => {
  const theme = useTheme();

  // 🎯 Combine all styles
  const combinedSx: any = {
    // Base styles
    borderRadius: rounded ? '50px' : '12px',
    fontWeight: 500,
    transition: animated ? 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
    position: 'relative' as const,
    
    // Variant styles
    ...getVariantStyles(variant, theme),
    
    // Size styles
    ...getSizeStyles(size),
    
    // Modifier styles
    ...(pulse && {
      animation: 'pulse 2s infinite',
      '@keyframes pulse': {
        '0%, 100%': { opacity: 1 },
        '50%': { opacity: 0.7 },
      },
    }),
    
    ...(glow && {
      boxShadow: '0 0 20px rgba(102, 126, 234, 0.5)',
      '&:hover': {
        boxShadow: '0 0 30px rgba(102, 126, 234, 0.7)',
      },
    }),
    
    // Custom sx
    ...sx,
  };

  return (
    <Chip
      {...props}
      sx={combinedSx}
    />
  );
};

export default UnifiedChip;
