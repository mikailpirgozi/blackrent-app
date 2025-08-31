/**
 * 🎨 UNIFIED BUTTON COMPONENT
 *
 * Konzistentný button komponent pre celú BlackRent aplikáciu
 * Nahradí všetky rôzne button štýly jednotným dizajnom
 */

import type { ButtonProps} from '@mui/material';
import { Button, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

// 🎨 Definované farby a štýly pre BlackRent
const BLACKRENT_COLORS = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
} as const;

// 🎨 Styled Button s BlackRent dizajnom
const StyledButton = styled(Button)<{
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  color?: keyof typeof BLACKRENT_COLORS | 'inherit';
}>(({ theme, variant = 'contained', size = 'medium', color = 'primary' }) => {
  const baseColor =
    color === 'inherit'
      ? theme.palette.primary.main
      : BLACKRENT_COLORS[color as keyof typeof BLACKRENT_COLORS] ||
        BLACKRENT_COLORS.primary;

  // 📏 Veľkosti
  const sizeStyles = {
    small: {
      padding: '6px 12px',
      fontSize: '0.75rem',
      minHeight: '32px',
    },
    medium: {
      padding: '8px 16px',
      fontSize: '0.875rem',
      minHeight: '36px',
    },
    large: {
      padding: '12px 24px',
      fontSize: '1rem',
      minHeight: '42px',
    },
  };

  // 🎨 Variant štýly
  const variantStyles = {
    contained: {
      backgroundColor: baseColor,
      color: '#ffffff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      '&:hover': {
        backgroundColor:
          theme.palette.mode === 'dark' ? `${baseColor}dd` : `${baseColor}cc`,
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        transform: 'translateY(-1px)',
      },
      '&:active': {
        transform: 'translateY(0)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    },
    outlined: {
      backgroundColor: 'transparent',
      color: baseColor,
      border: `2px solid ${baseColor}`,
      '&:hover': {
        backgroundColor: `${baseColor}08`,
        borderColor: baseColor,
        transform: 'translateY(-1px)',
      },
      '&:active': {
        transform: 'translateY(0)',
        backgroundColor: `${baseColor}12`,
      },
    },
    text: {
      backgroundColor: 'transparent',
      color: baseColor,
      '&:hover': {
        backgroundColor: `${baseColor}08`,
        transform: 'translateY(-1px)',
      },
      '&:active': {
        transform: 'translateY(0)',
        backgroundColor: `${baseColor}12`,
      },
    },
  };

  return {
    ...sizeStyles[size],
    ...variantStyles[variant],
    borderRadius: '8px',
    fontWeight: 600,
    textTransform: 'none' as const,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:disabled': {
      backgroundColor: theme.palette.action.disabledBackground,
      color: theme.palette.action.disabled,
      transform: 'none',
      boxShadow: 'none',
    },
  };
});

// 🎨 Props interface
export interface UnifiedButtonProps extends Omit<ButtonProps, 'color'> {
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  color?: keyof typeof BLACKRENT_COLORS | 'inherit';
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
}

// 🎨 Unified Button Component
export const UnifiedButton: React.FC<UnifiedButtonProps> = ({
  children,
  loading = false,
  loadingText,
  disabled,
  variant = 'contained',
  size = 'medium',
  color = 'primary',
  startIcon,
  endIcon,
  fullWidth = false,
  ...props
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      color={color}
      disabled={disabled || loading}
      startIcon={
        loading ? <CircularProgress size={16} color="inherit" /> : startIcon
      }
      endIcon={!loading ? endIcon : undefined}
      fullWidth={fullWidth}
      {...props}
    >
      {loading ? loadingText || 'Načítavam...' : children}
    </StyledButton>
  );
};

// 🎨 Predefined button variants pre rýchle použitie
export const PrimaryButton: React.FC<
  Omit<UnifiedButtonProps, 'color' | 'variant'>
> = props => <UnifiedButton color="primary" variant="contained" {...props} />;

export const SecondaryButton: React.FC<
  Omit<UnifiedButtonProps, 'color' | 'variant'>
> = props => <UnifiedButton color="secondary" variant="outlined" {...props} />;

export const SuccessButton: React.FC<
  Omit<UnifiedButtonProps, 'color' | 'variant'>
> = props => <UnifiedButton color="success" variant="contained" {...props} />;

export const WarningButton: React.FC<
  Omit<UnifiedButtonProps, 'color' | 'variant'>
> = props => <UnifiedButton color="warning" variant="contained" {...props} />;

export const ErrorButton: React.FC<
  Omit<UnifiedButtonProps, 'color' | 'variant'>
> = props => <UnifiedButton color="error" variant="contained" {...props} />;

export const TextButton: React.FC<
  Omit<UnifiedButtonProps, 'variant'>
> = props => <UnifiedButton variant="text" {...props} />;

export default UnifiedButton;
