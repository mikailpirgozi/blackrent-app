/**
 * 🎨 UNIFIED BADGE COMPONENT
 * Wrapper for shadcn Badge with MUI-compatible API
 */

import React from 'react';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

export interface UnifiedBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'outlined' | 'filled';
  children?: React.ReactNode;
}

export const UnifiedBadge = React.forwardRef<HTMLDivElement, UnifiedBadgeProps>(
  ({ variant = 'default', className, children, ...props }, ref) => {
    // Map MUI variants to shadcn variants
    const shadcnVariant = 
      variant === 'outlined' ? 'outline' :
      variant === 'filled' ? 'default' :
      variant as 'default' | 'secondary' | 'destructive' | 'outline';

    return (
      <Badge
        ref={ref}
        variant={shadcnVariant}
        className={cn(className)}
        {...props}
      >
        {children}
      </Badge>
    );
  }
);

UnifiedBadge.displayName = 'UnifiedBadge';

export default UnifiedBadge;

