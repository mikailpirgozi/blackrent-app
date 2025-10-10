/**
 * 🎨 TYPOGRAPHY COMPONENT
 * 
 * Náhrada za MUI Typography komponent
 * Podporuje všetky MUI Typography varianty a props
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Mapovanie MUI variantov na HTML elementy
const variantElementMap = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  subtitle1: 'h6',
  subtitle2: 'h6',
  body1: 'p',
  body2: 'p',
  caption: 'span',
  overline: 'span',
  button: 'span',
  inherit: 'span',
} as const;

// CVA varianty pre Typography
const typographyVariants = cva(
  'text-foreground',
  {
    variants: {
      variant: {
        h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
        h2: 'scroll-m-20 text-3xl font-semibold tracking-tight',
        h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
        h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
        h5: 'text-lg font-semibold',
        h6: 'text-base font-semibold',
        subtitle1: 'text-base font-medium',
        subtitle2: 'text-sm font-medium text-muted-foreground',
        body1: 'text-base',
        body2: 'text-sm',
        caption: 'text-xs text-muted-foreground',
        overline: 'text-xs uppercase tracking-wider font-medium',
        button: 'text-sm font-medium uppercase tracking-wide',
        inherit: '', // Zdedí štýly od parent elementu
      },
      color: {
        primary: 'text-primary',
        secondary: 'text-secondary-foreground',
        error: 'text-destructive',
        warning: 'text-orange-600 dark:text-orange-400',
        info: 'text-blue-600 dark:text-blue-400',
        success: 'text-green-600 dark:text-green-400',
        textPrimary: 'text-foreground',
        textSecondary: 'text-muted-foreground',
        inherit: '',
        disabled: 'text-muted-foreground opacity-50',
      },
      align: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
        justify: 'text-justify',
        inherit: '',
      },
      gutterBottom: {
        true: 'mb-4',
        false: '',
      },
      paragraph: {
        true: 'mb-4',
        false: '',
      },
      noWrap: {
        true: 'truncate',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'body1',
      color: 'textPrimary',
      align: 'inherit',
      gutterBottom: false,
      paragraph: false,
      noWrap: false,
    },
  }
);

// Helper funkcia na konverziu MUI sx prop na inline styles
const convertSxToStyle = (sx: Record<string, unknown> | undefined) => {
  if (!sx || typeof sx !== 'object') return undefined;
  
  const style: React.CSSProperties = {};
  
  // Helper to safely multiply numeric values
  const toPixels = (val: unknown): number | undefined => {
    if (typeof val === 'number' && !isNaN(val)) return val * 8;
    if (typeof val === 'string') {
      const num = parseFloat(val);
      if (!isNaN(num)) return num * 8;
    }
    return undefined;
  };
  
  // Spacing (mb, mt, ml, mr, m, pb, pt, pl, pr, px, py, p)
  const mb = toPixels(sx.mb);
  if (mb !== undefined) style.marginBottom = mb;
  
  const mt = toPixels(sx.mt);
  if (mt !== undefined) style.marginTop = mt;
  
  const ml = toPixels(sx.ml);
  if (ml !== undefined) style.marginLeft = ml;
  
  const mr = toPixels(sx.mr);
  if (mr !== undefined) style.marginRight = mr;
  
  const m = toPixels(sx.m);
  if (m !== undefined) style.margin = m;
  
  const pb = toPixels(sx.pb);
  if (pb !== undefined) style.paddingBottom = pb;
  
  const pt = toPixels(sx.pt);
  if (pt !== undefined) style.paddingTop = pt;
  
  const pl = toPixels(sx.pl);
  if (pl !== undefined) style.paddingLeft = pl;
  
  const pr = toPixels(sx.pr);
  if (pr !== undefined) style.paddingRight = pr;
  
  const px = toPixels(sx.px);
  if (px !== undefined) {
    style.paddingLeft = px;
    style.paddingRight = px;
  }
  
  const py = toPixels(sx.py);
  if (py !== undefined) {
    style.paddingTop = py;
    style.paddingBottom = py;
  }
  
  const p = toPixels(sx.p);
  if (p !== undefined) style.padding = p;
  
  // Typography
  if (sx.fontSize && typeof sx.fontSize === 'string' || typeof sx.fontSize === 'number') {
    style.fontSize = sx.fontSize as string | number;
  }
  if (sx.fontWeight && (typeof sx.fontWeight === 'string' || typeof sx.fontWeight === 'number')) {
    style.fontWeight = sx.fontWeight as string | number;
  }
  if (sx.fontFamily && typeof sx.fontFamily === 'string') {
    style.fontFamily = sx.fontFamily;
  }
  if (sx.lineHeight && (typeof sx.lineHeight === 'string' || typeof sx.lineHeight === 'number')) {
    style.lineHeight = sx.lineHeight as string | number;
  }
  if (sx.letterSpacing && (typeof sx.letterSpacing === 'string' || typeof sx.letterSpacing === 'number')) {
    style.letterSpacing = sx.letterSpacing as string | number;
  }
  if (sx.textAlign && typeof sx.textAlign === 'string') {
    style.textAlign = sx.textAlign as React.CSSProperties['textAlign'];
  }
  if (sx.textTransform && typeof sx.textTransform === 'string') {
    style.textTransform = sx.textTransform as React.CSSProperties['textTransform'];
  }
  
  // Colors
  if (sx.color && typeof sx.color === 'string') {
    style.color = sx.color;
  }
  if ((sx.backgroundColor || sx.bgcolor) && (typeof sx.backgroundColor === 'string' || typeof sx.bgcolor === 'string')) {
    style.backgroundColor = (sx.backgroundColor || sx.bgcolor) as string;
  }
  
  // Display
  if (sx.display && typeof sx.display === 'string') {
    style.display = sx.display as React.CSSProperties['display'];
  }
  if (sx.opacity && typeof sx.opacity === 'number') {
    style.opacity = sx.opacity;
  }
  
  // Flexbox
  if (sx.flexGrow && typeof sx.flexGrow === 'number') {
    style.flexGrow = sx.flexGrow;
  }
  if (sx.flexShrink && typeof sx.flexShrink === 'number') {
    style.flexShrink = sx.flexShrink;
  }
  
  // Width & Height
  if (sx.width && (typeof sx.width === 'string' || typeof sx.width === 'number')) {
    style.width = sx.width as string | number;
  }
  if (sx.height && (typeof sx.height === 'string' || typeof sx.height === 'number')) {
    style.height = sx.height as string | number;
  }
  if (sx.minWidth && (typeof sx.minWidth === 'string' || typeof sx.minWidth === 'number')) {
    style.minWidth = sx.minWidth as string | number;
  }
  if (sx.maxWidth && (typeof sx.maxWidth === 'string' || typeof sx.maxWidth === 'number')) {
    style.maxWidth = sx.maxWidth as string | number;
  }
  if (sx.minHeight && (typeof sx.minHeight === 'string' || typeof sx.minHeight === 'number')) {
    style.minHeight = sx.minHeight as string | number;
  }
  if (sx.maxHeight && (typeof sx.maxHeight === 'string' || typeof sx.maxHeight === 'number')) {
    style.maxHeight = sx.maxHeight as string | number;
  }
  
  return Object.keys(style).length > 0 ? style : undefined;
};

// Props interface
export interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    VariantProps<typeof typographyVariants> {
  component?: React.ElementType;
  sx?: Record<string, unknown>;
  fontWeight?: string | number;
  fontSize?: string | number;
  lineHeight?: string | number;
  letterSpacing?: string | number;
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
}

// Typography Component  
export const Typography = React.forwardRef<
  HTMLElement,
  TypographyProps
>(({
  className,
  variant = 'body1',
  color = 'textPrimary',
  align,
  gutterBottom,
  paragraph,
  noWrap,
  component,
  sx,
  style,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
  textTransform,
  children,
  ...props
}, ref) => {
  // Určenie elementu na renderovanie
  const Component = component || (
    paragraph ? 'p' : variantElementMap[variant as keyof typeof variantElementMap] || 'span'
  );
  
  // Kombinovanie inline styles
  const combinedStyle: React.CSSProperties = {
    ...convertSxToStyle(sx),
    ...style,
    ...(fontWeight && { fontWeight }),
    ...(fontSize && { fontSize }),
    ...(lineHeight && { lineHeight }),
    ...(letterSpacing && { letterSpacing }),
    ...(textTransform && { textTransform }),
  };
  
  return (
    <Component
      ref={ref}
      className={cn(
        typographyVariants({
          variant,
          color: color as TypographyProps['color'],
          align,
          gutterBottom,
          paragraph,
          noWrap,
        }),
        className
      )}
      style={combinedStyle}
      {...props}
    >
      {children}
    </Component>
  );
});
Typography.displayName = 'Typography';

// Export aliasov pre ľahšie používanie
export const Text = Typography;
export const Heading = Typography;

// Predefinované varianty
export const H1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h1" {...props} />
);

export const H2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h2" {...props} />
);

export const H3: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h3" {...props} />
);

export const H4: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h4" {...props} />
);

export const H5: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h5" {...props} />
);

export const H6: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h6" {...props} />
);

export const Body: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body1" {...props} />
);

export const Caption: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="caption" {...props} />
);

export const Subtitle: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="subtitle1" {...props} />
);

export default Typography;
