// Unified Typography component for BlackRent
// Centralized typography management with MUI compatibility

import { cn } from '../../lib/utils';
import { forwardRef } from 'react';
import * as React from 'react';

// MUI Typography variants mapping to shadcn/Tailwind
const VARIANT_MAPPING = {
  h1: 'h1',
  h2: 'h2', 
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body1: 'p',
  body2: 'p',
  subtitle1: 'h6',
  subtitle2: 'h6',
  caption: 'span',
  overline: 'span',
  button: 'span',
  inherit: 'span'
} as const;

// Typography styles mapping
const VARIANT_STYLES = {
  h1: 'text-4xl font-bold leading-tight tracking-tight',
  h2: 'text-3xl font-semibold leading-tight tracking-tight',
  h3: 'text-2xl font-semibold leading-snug tracking-tight',
  h4: 'text-xl font-medium leading-snug tracking-tight',
  h5: 'text-lg font-medium leading-snug tracking-tight',
  h6: 'text-base font-medium leading-snug tracking-tight',
  body1: 'text-base leading-relaxed',
  body2: 'text-sm leading-relaxed',
  subtitle1: 'text-base font-medium leading-snug',
  subtitle2: 'text-sm font-medium leading-snug',
  caption: 'text-xs leading-tight',
  overline: 'text-xs font-medium uppercase tracking-wider leading-tight',
  button: 'text-sm font-medium leading-tight',
  inherit: 'text-inherit'
} as const;

// Color mapping from MUI to Tailwind
const COLOR_MAPPING = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  textPrimary: 'text-foreground',
  textSecondary: 'text-muted-foreground',
  'text.primary': 'text-foreground',
  'text.secondary': 'text-muted-foreground',
  'primary.main': 'text-primary',
  'secondary.main': 'text-secondary',
  'error.main': 'text-destructive',
  'warning.main': 'text-yellow-600',
  'success.main': 'text-green-600',
  'info.main': 'text-blue-600',
  error: 'text-destructive',
  warning: 'text-yellow-600',
  success: 'text-green-600',
  info: 'text-blue-600',
  inherit: 'text-inherit'
} as const;

// Alignment mapping
const ALIGN_MAPPING = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
  inherit: 'text-inherit'
} as const;

// Font weight mapping
const FONT_WEIGHT_MAPPING = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  inherit: 'font-inherit',
  // Support numeric values
  300: 'font-light',
  400: 'font-normal',
  500: 'font-medium',
  600: 'font-semibold',
  700: 'font-bold'
} as const;

export interface UnifiedTypographyProps {
  variant?: keyof typeof VARIANT_MAPPING;
  color?: keyof typeof COLOR_MAPPING | string; // Allow any string for flexibility
  align?: keyof typeof ALIGN_MAPPING;
  fontWeight?: keyof typeof FONT_WEIGHT_MAPPING | number | string; // Allow numbers and strings too
  className?: string;
  children?: React.ReactNode;
  component?: keyof JSX.IntrinsicElements;
  gutterBottom?: boolean;
  noWrap?: boolean;
  paragraph?: boolean;
  display?: string; // Add display prop support
  alignItems?: string; // Add alignItems prop support
  gap?: number; // Add gap prop support
  sx?: any; // Allow any sx props for MUI compatibility
  textAlign?: string; // Support textAlign prop
  fontFamily?: string; // Support fontFamily prop
}

export const UnifiedTypography = forwardRef<any, UnifiedTypographyProps>(
  ({
    variant = 'body1',
    color = 'textPrimary',
    align = 'inherit',
    fontWeight = 'inherit',
    className,
    children,
    component,
    gutterBottom = false,
    noWrap = false,
    paragraph = false,
    display,
    alignItems,
    gap,
    sx,
    ...props
  }, ref) => {
    // Determine the HTML element to use
    const Component = component || VARIANT_MAPPING[variant] || 'p';
    
    // Build className from all props
    const classes = cn(
      // Base variant styles
      VARIANT_STYLES[variant],
      
      // Color - handle both string and mapped values
      typeof color === 'string' && color in COLOR_MAPPING ? COLOR_MAPPING[color as keyof typeof COLOR_MAPPING] : '',
      
      // Alignment
      ALIGN_MAPPING[align],
      
      // Font weight - handle string, number and mapped values
      fontWeight !== 'inherit' && fontWeight !== undefined ? (
        typeof fontWeight === 'string' && fontWeight in FONT_WEIGHT_MAPPING ? FONT_WEIGHT_MAPPING[fontWeight as keyof typeof FONT_WEIGHT_MAPPING] :
        typeof fontWeight === 'number' && fontWeight in FONT_WEIGHT_MAPPING ? FONT_WEIGHT_MAPPING[fontWeight as keyof typeof FONT_WEIGHT_MAPPING] :
        typeof fontWeight === 'string' && !isNaN(Number(fontWeight)) ? FONT_WEIGHT_MAPPING[Number(fontWeight) as keyof typeof FONT_WEIGHT_MAPPING] :
        ''
      ) : '',
      
      // MUI compatibility props
      gutterBottom && 'mb-4',
      noWrap && 'whitespace-nowrap overflow-hidden text-ellipsis',
      paragraph && 'mb-4',
      
      // Display props
      display === 'flex' && 'flex',
      display === 'block' && 'block',
      display === 'inline' && 'inline',
      display === 'inline-block' && 'inline-block',
      alignItems === 'center' && 'items-center',
      alignItems === 'flex-start' && 'items-start',
      alignItems === 'flex-end' && 'items-end',
      gap && `gap-${gap}`,
      
      // Custom className
      className
    );

    // Convert sx props to Tailwind classes (basic conversion)
    const sxClasses = sx ? convertSxToTailwind(sx) : '';

    return React.createElement(
      Component,
      {
        ref: ref as any,
        className: cn(classes, sxClasses),
        ...props
      },
      children
    );
  }
);

UnifiedTypography.displayName = 'UnifiedTypography';

// Helper function to convert sx props to Tailwind classes
function convertSxToTailwind(sx: any): string {
  const classes: string[] = [];
  
  if (sx.margin) classes.push(`m-${sx.margin}`);
  if (sx.marginTop) classes.push(`mt-${sx.marginTop}`);
  if (sx.marginBottom) classes.push(`mb-${sx.marginBottom}`);
  if (sx.marginLeft) classes.push(`ml-${sx.marginLeft}`);
  if (sx.marginRight) classes.push(`mr-${sx.marginRight}`);
  
  if (sx.padding) classes.push(`p-${sx.padding}`);
  if (sx.paddingTop) classes.push(`pt-${sx.paddingTop}`);
  if (sx.paddingBottom) classes.push(`pb-${sx.paddingBottom}`);
  if (sx.paddingLeft) classes.push(`pl-${sx.paddingLeft}`);
  if (sx.paddingRight) classes.push(`pr-${sx.paddingRight}`);
  
  return classes.join(' ');
}

// Export default
export default UnifiedTypography;