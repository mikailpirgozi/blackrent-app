import React from 'react';
import { Card, CardProps, CardContent, CardActions, Box, useTheme } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

// 🎨 UNIFIED CARD VARIANTS
export type UnifiedCardVariant = 
  | 'default'     // Standard card
  | 'elevated'    // Card with more shadow
  | 'outlined'    // Card with border
  | 'glass'       // Glassmorphism effect
  | 'gradient'    // Gradient background
  | 'compact'     // Smaller padding
  | 'mobile'      // Mobile-optimized
  | 'interactive' // Hover effects
  | 'premium';    // Premium styling

// 🎨 UNIFIED CARD INTERFACE
export interface UnifiedCardProps extends Omit<CardProps, 'variant'> {
  variant?: UnifiedCardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: boolean;
  animated?: boolean;
  clickable?: boolean;
  header?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

// 🎨 VARIANT STYLES MAPPING
const getVariantStyles = (variant: UnifiedCardVariant, theme: Theme): any => {
  const variants = {
    default: {
      background: theme.palette.background.paper,
      border: '1px solid rgba(226, 232, 240, 0.5)',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
    },
    elevated: {
      background: theme.palette.background.paper,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
      border: 'none',
    },
    outlined: {
      background: theme.palette.background.paper,
      border: '2px solid #e2e8f0',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#667eea',
      },
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    },
    gradient: {
      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
      border: '1px solid rgba(102, 126, 234, 0.1)',
      boxShadow: '0 4px 24px rgba(102, 126, 234, 0.1)',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
        opacity: 0.7,
      },
    },
    compact: {
      background: theme.palette.background.paper,
      border: '1px solid rgba(226, 232, 240, 0.3)',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
    },
    mobile: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(102, 126, 234, 0.1)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
      borderRadius: '12px',
    },
    interactive: {
      background: theme.palette.background.paper,
      border: '1px solid rgba(226, 232, 240, 0.5)',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
        borderColor: 'rgba(102, 126, 234, 0.3)',
      },
      '&:active': {
        transform: 'translateY(-2px)',
      },
    },
    premium: {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(102, 126, 234, 0.2)',
      boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
        transition: 'left 0.6s',
      },
      '&:hover::after': {
        left: '100%',
      },
    },
  };

  return variants[variant] || variants.default;
};

// 🎨 PADDING STYLES MAPPING
const getPaddingStyles = (padding: UnifiedCardProps['padding']): any => {
  const paddings = {
    none: { p: 0 },
    sm: { p: 1.5 },
    md: { p: 2.5 },
    lg: { p: 3.5 },
    xl: { p: 4.5 },
  };

  return paddings[padding || 'md'];
};

// 🎨 UNIFIED CARD COMPONENT
export const UnifiedCard: React.FC<UnifiedCardProps> = ({
  variant = 'default',
  padding = 'md',
  rounded = false,
  animated = true,
  clickable = false,
  header,
  actions,
  children,
  sx,
  onClick,
  ...props
}) => {
  const theme = useTheme();

  // 🎯 Determine if card should be interactive
  const isInteractive = clickable || onClick || variant === 'interactive';

  // 🎯 Combine all styles
  const combinedSx: any = {
    // Base styles
    borderRadius: rounded ? '24px' : '16px',
    transition: animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    
    // Variant styles
    ...getVariantStyles(isInteractive ? 'interactive' : variant, theme),
    
    // Interactive styles
    ...(isInteractive && {
      cursor: 'pointer',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
      },
    }),
    
    // Custom sx
    ...sx,
  };

  return (
    <Card
      {...props}
      onClick={onClick}
      sx={combinedSx}
    >
      {/* Header section */}
      {header && (
        <Box sx={{ 
          p: padding === 'none' ? 0 : 2.5,
          pb: padding === 'none' ? 0 : 1,
          borderBottom: '1px solid rgba(226, 232, 240, 0.3)',
        }}>
          {header}
        </Box>
      )}

      {/* Main content */}
      <CardContent sx={{
        ...getPaddingStyles(padding),
        '&:last-child': {
          pb: padding === 'none' ? 0 : padding === 'sm' ? 1.5 : padding === 'md' ? 2.5 : padding === 'lg' ? 3.5 : 4.5,
        },
      }}>
        {children}
      </CardContent>

      {/* Actions section */}
      {actions && (
        <CardActions sx={{
          p: padding === 'none' ? 0 : 2.5,
          pt: padding === 'none' ? 0 : 1,
          borderTop: '1px solid rgba(226, 232, 240, 0.3)',
          justifyContent: 'flex-end',
          gap: 1,
        }}>
          {actions}
        </CardActions>
      )}
    </Card>
  );
};

export default UnifiedCard;
