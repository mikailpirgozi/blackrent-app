/**
 * 📝 UNIFIED TYPOGRAPHY COMPONENT
 *
 * Konzistentný typography pre celú BlackRent aplikáciu
 * Nahradí všetky MUI Typography implementácie
 *
 * Features:
 * - Všetky MUI Typography varianty
 * - Konzistentné spacing a farby
 * - Responsive typography
 * - MUI Typography API kompatibilita
 */

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface UnifiedTypographyProps
  extends React.HTMLAttributes<HTMLElement> {
  // MUI Typography variants
  variant?:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'subtitle1'
    | 'subtitle2'
    | 'body1'
    | 'body2'
    | 'caption'
    | 'overline'
    | 'button'
    | 'inherit';

  // Color variants
  color?:
    | 'primary'
    | 'secondary'
    | 'error'
    | 'warning'
    | 'info'
    | 'success'
    | 'textPrimary'
    | 'textSecondary'
    | 'textDisabled'
    | 'inherit';

  // Alignment
  align?: 'left' | 'center' | 'right' | 'justify';

  // Display
  display?: 'initial' | 'block' | 'inline';

  // Gutter
  gutterBottom?: boolean;
  noWrap?: boolean;
  paragraph?: boolean;

  // MUI compatibility
  component?: React.ElementType;
  sx?: Record<string, unknown>;

  // Styling
  className?: string;
}

export const UnifiedTypography = forwardRef<
  HTMLElement,
  UnifiedTypographyProps
>(
  (
    {
      variant = 'body1',
      color = 'textPrimary',
      align = 'inherit',
      display = 'initial',
      gutterBottom = false,
      noWrap = false,
      paragraph = false,
      component,
      sx,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Determine HTML element based on variant
    const getElement = (): React.ElementType => {
      if (component) return component;

      switch (variant) {
        case 'h1':
          return 'h1';
        case 'h2':
          return 'h2';
        case 'h3':
          return 'h3';
        case 'h4':
          return 'h4';
        case 'h5':
          return 'h5';
        case 'h6':
          return 'h6';
        case 'subtitle1':
        case 'subtitle2':
          return 'h6';
        case 'body1':
        case 'body2':
          return paragraph ? 'p' : 'span';
        case 'caption':
          return 'span';
        case 'overline':
          return 'span';
        case 'button':
          return 'span';
        case 'inherit':
          return 'span';
        default:
          return 'span';
      }
    };

    // Variant styles
    const getVariantStyles = () => {
      switch (variant) {
        case 'h1':
          return 'text-4xl font-bold leading-tight tracking-tight';
        case 'h2':
          return 'text-3xl font-bold leading-tight tracking-tight';
        case 'h3':
          return 'text-2xl font-semibold leading-snug tracking-tight';
        case 'h4':
          return 'text-xl font-semibold leading-snug tracking-tight';
        case 'h5':
          return 'text-lg font-medium leading-snug';
        case 'h6':
          return 'text-base font-medium leading-snug';
        case 'subtitle1':
          return 'text-lg font-normal leading-relaxed';
        case 'subtitle2':
          return 'text-base font-medium leading-relaxed';
        case 'body1':
          return 'text-base font-normal leading-relaxed';
        case 'body2':
          return 'text-sm font-normal leading-relaxed';
        case 'caption':
          return 'text-xs font-normal leading-relaxed';
        case 'overline':
          return 'text-xs font-medium uppercase tracking-wider leading-relaxed';
        case 'button':
          return 'text-sm font-medium uppercase tracking-wide leading-none';
        case 'inherit':
          return 'inherit';
        default:
          return 'text-base font-normal leading-relaxed';
      }
    };

    // Color styles
    const getColorStyles = () => {
      switch (color) {
        case 'primary':
          return 'text-primary';
        case 'secondary':
          return 'text-secondary';
        case 'error':
          return 'text-destructive';
        case 'warning':
          return 'text-orange-600';
        case 'info':
          return 'text-blue-600';
        case 'success':
          return 'text-green-600';
        case 'textPrimary':
          return 'text-foreground';
        case 'textSecondary':
          return 'text-muted-foreground';
        case 'textDisabled':
          return 'text-muted-foreground/50';
        case 'inherit':
          return 'inherit';
        default:
          return 'text-foreground';
      }
    };

    // Alignment styles
    const getAlignStyles = () => {
      switch (align) {
        case 'left':
          return 'text-left';
        case 'center':
          return 'text-center';
        case 'right':
          return 'text-right';
        case 'justify':
          return 'text-justify';
        case 'inherit':
          return '';
        default:
          return '';
      }
    };

    // Display styles
    const getDisplayStyles = () => {
      switch (display) {
        case 'block':
          return 'block';
        case 'inline':
          return 'inline';
        case 'initial':
          return '';
        default:
          return '';
      }
    };

    // Additional styles
    const getAdditionalStyles = () => {
      const styles = [];

      if (gutterBottom) {
        styles.push('mb-4');
      }

      if (noWrap) {
        styles.push('truncate');
      }

      if (paragraph) {
        styles.push('mb-4');
      }

      return styles.join(' ');
    };

    // Convert sx to className (basic implementation)
    const convertSxToClassName = (sx: Record<string, unknown>): string => {
      const classes: string[] = [];

      // Basic sx to Tailwind conversion
      if (sx.fontSize) {
        const size = sx.fontSize as number;
        if (size <= 12) classes.push('text-xs');
        else if (size <= 14) classes.push('text-sm');
        else if (size <= 16) classes.push('text-base');
        else if (size <= 18) classes.push('text-lg');
        else if (size <= 20) classes.push('text-xl');
        else if (size <= 24) classes.push('text-2xl');
        else if (size <= 30) classes.push('text-3xl');
        else if (size <= 36) classes.push('text-4xl');
      }

      if (sx.fontWeight) {
        const weight = sx.fontWeight as string | number;
        if (weight === 'bold' || weight === 700) classes.push('font-bold');
        else if (weight === 'semibold' || weight === 600)
          classes.push('font-semibold');
        else if (weight === 'medium' || weight === 500)
          classes.push('font-medium');
        else if (weight === 'normal' || weight === 400)
          classes.push('font-normal');
        else if (weight === 'light' || weight === 300)
          classes.push('font-light');
      }

      if (sx.color) {
        const color = sx.color as string;
        if (color.startsWith('#')) {
          classes.push(`text-[${color}]`);
        } else if (color === 'text.secondary') {
          classes.push('text-muted-foreground');
        } else if (color === 'error.main') {
          classes.push('text-destructive');
        }
      }

      if (sx.marginTop) {
        const mt = sx.marginTop as number;
        classes.push(`mt-${mt * 2}`);
      }

      if (sx.marginBottom) {
        const mb = sx.marginBottom as number;
        classes.push(`mb-${mb * 2}`);
      }

      if (sx.textAlign) {
        const align = sx.textAlign as string;
        if (align === 'center') classes.push('text-center');
        else if (align === 'right') classes.push('text-right');
        else if (align === 'justify') classes.push('text-justify');
      }

      return classes.join(' ');
    };

    const Element = getElement();
    const sxClasses = sx ? convertSxToClassName(sx) : '';

    return React.createElement(
      Element,
      {
        ref,
        className: cn(
          getVariantStyles(),
          getColorStyles(),
          getAlignStyles(),
          getDisplayStyles(),
          getAdditionalStyles(),
          sxClasses,
          className
        ),
        ...props,
      },
      children
    );
  }
);

UnifiedTypography.displayName = 'UnifiedTypography';

// Export convenience components for common variants
export const H1 = forwardRef<
  HTMLHeadingElement,
  Omit<UnifiedTypographyProps, 'variant'>
>((props, ref) => <UnifiedTypography ref={ref} variant="h1" {...props} />);
H1.displayName = 'H1';

export const H2 = forwardRef<
  HTMLHeadingElement,
  Omit<UnifiedTypographyProps, 'variant'>
>((props, ref) => <UnifiedTypography ref={ref} variant="h2" {...props} />);
H2.displayName = 'H2';

export const H3 = forwardRef<
  HTMLHeadingElement,
  Omit<UnifiedTypographyProps, 'variant'>
>((props, ref) => <UnifiedTypography ref={ref} variant="h3" {...props} />);
H3.displayName = 'H3';

export const H4 = forwardRef<
  HTMLHeadingElement,
  Omit<UnifiedTypographyProps, 'variant'>
>((props, ref) => <UnifiedTypography ref={ref} variant="h4" {...props} />);
H4.displayName = 'H4';

export const H5 = forwardRef<
  HTMLHeadingElement,
  Omit<UnifiedTypographyProps, 'variant'>
>((props, ref) => <UnifiedTypography ref={ref} variant="h5" {...props} />);
H5.displayName = 'H5';

export const H6 = forwardRef<
  HTMLHeadingElement,
  Omit<UnifiedTypographyProps, 'variant'>
>((props, ref) => <UnifiedTypography ref={ref} variant="h6" {...props} />);
H6.displayName = 'H6';

export const Subtitle1 = forwardRef<
  HTMLElement,
  Omit<UnifiedTypographyProps, 'variant'>
>((props, ref) => (
  <UnifiedTypography ref={ref} variant="subtitle1" {...props} />
));
Subtitle1.displayName = 'Subtitle1';

export const Subtitle2 = forwardRef<
  HTMLElement,
  Omit<UnifiedTypographyProps, 'variant'>
>((props, ref) => (
  <UnifiedTypography ref={ref} variant="subtitle2" {...props} />
));
Subtitle2.displayName = 'Subtitle2';

export const Body1 = forwardRef<
  HTMLElement,
  Omit<UnifiedTypographyProps, 'variant'>
>((props, ref) => <UnifiedTypography ref={ref} variant="body1" {...props} />);
Body1.displayName = 'Body1';

export const Body2 = forwardRef<
  HTMLElement,
  Omit<UnifiedTypographyProps, 'variant'>
>((props, ref) => <UnifiedTypography ref={ref} variant="body2" {...props} />);
Body2.displayName = 'Body2';

export const Caption = forwardRef<
  HTMLElement,
  Omit<UnifiedTypographyProps, 'variant'>
>((props, ref) => <UnifiedTypography ref={ref} variant="caption" {...props} />);
Caption.displayName = 'Caption';

export const Overline = forwardRef<
  HTMLElement,
  Omit<UnifiedTypographyProps, 'variant'>
>((props, ref) => (
  <UnifiedTypography ref={ref} variant="overline" {...props} />
));
Overline.displayName = 'Overline';

// Export aliases
export const Typography = UnifiedTypography;

export default UnifiedTypography;
