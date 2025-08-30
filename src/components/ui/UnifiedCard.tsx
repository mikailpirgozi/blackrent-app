/**
 * 🎨 UNIFIED CARD COMPONENT
 *
 * Konzistentný card komponent pre celú BlackRent aplikáciu
 * Nahradí všetky rôzne card štýly jednotným dizajnom
 */

import { Card, CardProps, CardContent, CardActions, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

// 🎨 Definované card varianty pre BlackRent
export type CardVariant =
  | 'default'
  | 'elevated'
  | 'outlined'
  | 'interactive'
  | 'statistics'
  | 'compact';

// 🎨 Styled Card s BlackRent dizajnom
const StyledCard = styled(Card)<{
  variant?: CardVariant;
  clickable?: boolean;
}>(({ theme, variant = 'default', clickable = false }) => {
  // 🎨 Base štýly
  const baseStyles = {
    borderRadius: '12px',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
  };

  // 🎨 Variant štýly
  const variantStyles = {
    default: {
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid',
      borderColor: theme.palette.divider,
      '&:hover': clickable
        ? {
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            transform: 'translateY(-2px)',
          }
        : {},
    },
    elevated: {
      boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
      border: 'none',
      '&:hover': clickable
        ? {
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            transform: 'translateY(-3px)',
          }
        : {},
    },
    outlined: {
      boxShadow: 'none',
      border: '2px solid',
      borderColor: theme.palette.primary.main,
      '&:hover': clickable
        ? {
            borderColor: theme.palette.primary.dark,
            boxShadow: '0 2px 8px rgba(25,118,210,0.15)',
          }
        : {},
    },
    interactive: {
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid',
      borderColor: theme.palette.divider,
      cursor: 'pointer',
      '&:hover': {
        boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
        transform: 'translateY(-2px)',
        borderColor: theme.palette.primary.main,
      },
      '&:active': {
        transform: 'translateY(0)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    },
    statistics: {
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      border: '1px solid',
      borderColor: theme.palette.divider,
      background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
      '&:hover': clickable
        ? {
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            transform: 'translateY(-1px)',
          }
        : {},
    },
    compact: {
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      border: '1px solid',
      borderColor: theme.palette.divider,
      borderRadius: '8px',
      '&:hover': clickable
        ? {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }
        : {},
    },
  };

  return {
    ...baseStyles,
    ...variantStyles[variant as keyof typeof variantStyles],
  };
});

// 🎨 Props interface
export interface UnifiedCardProps extends Omit<CardProps, 'variant'> {
  variant?: CardVariant;
  clickable?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  children?: React.ReactNode;
  actions?: React.ReactNode;
  contentProps?: any;
  actionsProps?: any;
}

// 🎨 Unified Card Component
export const UnifiedCard: React.FC<UnifiedCardProps> = ({
  children,
  variant = 'default',
  clickable = false,
  padding = 'medium',
  actions,
  contentProps,
  actionsProps,
  ...props
}) => {
  // 📏 Padding štýly
  const paddingStyles = {
    none: { p: 0 },
    small: { p: 1 },
    medium: { p: 2 },
    large: { p: 3 },
  };

  const { variant: _, clickable: __, ...cardProps } = props as any;

  return (
    <StyledCard variant={variant} clickable={clickable} {...cardProps}>
      <CardContent sx={paddingStyles[padding]} {...contentProps}>
        {children}
      </CardContent>
      {actions && (
        <CardActions
          sx={{
            px: padding === 'none' ? 0 : 2,
            pb: padding === 'none' ? 0 : 2,
          }}
          {...actionsProps}
        >
          {actions}
        </CardActions>
      )}
    </StyledCard>
  );
};

// 🎨 Predefined card variants pre rýchle použitie
export const DefaultCard: React.FC<
  Omit<UnifiedCardProps, 'variant'>
> = props => <UnifiedCard variant="default" {...props} />;

export const ElevatedCard: React.FC<
  Omit<UnifiedCardProps, 'variant'>
> = props => <UnifiedCard variant="elevated" {...props} />;

export const OutlinedCard: React.FC<
  Omit<UnifiedCardProps, 'variant'>
> = props => <UnifiedCard variant="outlined" {...props} />;

export const InteractiveCard: React.FC<
  Omit<UnifiedCardProps, 'variant'>
> = props => <UnifiedCard variant="interactive" clickable {...props} />;

export const StatisticsCard: React.FC<
  Omit<UnifiedCardProps, 'variant'>
> = props => <UnifiedCard variant="statistics" {...props} />;

export const CompactCard: React.FC<
  Omit<UnifiedCardProps, 'variant'>
> = props => <UnifiedCard variant="compact" {...props} />;

export default UnifiedCard;
