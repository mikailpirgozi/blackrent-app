/**
 * 🎨 UNIFIED CARD COMPONENT
 *
 * Konzistentný card komponent pre celú BlackRent aplikáciu
 * Nahradí všetky rôzne card štýly jednotným dizajnom
 */

import React from 'react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { cn } from '../../lib/utils';

// 🎨 Definované card varianty pre BlackRent
export type CardVariant =
  | 'default'
  | 'elevated'
  | 'outlined'
  | 'interactive'
  | 'statistics'
  | 'compact';

// 🎨 Card variant štýly
const getCardVariantClasses = (variant: CardVariant, clickable: boolean) => {
  const baseClasses = 'rounded-xl transition-all duration-200 overflow-hidden';
  
  const variantClasses = {
    default: cn(
      'shadow-sm border border-border',
      clickable && 'hover:shadow-md hover:-translate-y-0.5'
    ),
    elevated: cn(
      'shadow-lg border-0',
      clickable && 'hover:shadow-xl hover:-translate-y-1'
    ),
    outlined: cn(
      'shadow-none border-2 border-primary',
      clickable && 'hover:border-primary/80 hover:shadow-sm'
    ),
    interactive: cn(
      'shadow-sm border border-border cursor-pointer',
      'hover:shadow-lg hover:-translate-y-0.5 hover:border-primary',
      'active:translate-y-0 active:shadow-sm'
    ),
    statistics: cn(
      'shadow-md border border-border bg-gradient-to-br from-background to-muted',
      clickable && 'hover:shadow-lg hover:-translate-y-0.5'
    ),
    compact: cn(
      'shadow-sm border border-border rounded-lg',
      clickable && 'hover:shadow-md'
    ),
  };

  return cn(baseClasses, variantClasses[variant]);
};

// 🎨 Props interface
export interface UnifiedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  clickable?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  children?: React.ReactNode;
  actions?: React.ReactNode;
  contentProps?: React.HTMLAttributes<HTMLDivElement>;
  actionsProps?: React.HTMLAttributes<HTMLDivElement>;
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
  className,
  ...props
}) => {
  // 📏 Padding štýly
  const paddingClasses = {
    none: 'p-0',
    small: 'p-2',
    medium: 'p-4',
    large: 'p-6',
  };

  const cardClasses = getCardVariantClasses(variant, clickable);

  return (
    <Card className={cn(cardClasses, className)} {...props}>
      <CardContent className={cn(paddingClasses[padding])} {...contentProps}>
        {children}
      </CardContent>
      {actions && (
        <CardFooter
          className={cn(
            padding === 'none' ? 'px-0 pb-0' : 'px-4 pb-4'
          )}
          {...actionsProps}
        >
          {actions}
        </CardFooter>
      )}
    </Card>
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
> = props => <UnifiedCard variant="outline" {...props} />;

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
