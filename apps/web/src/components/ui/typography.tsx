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
const convertSxToStyle = (sx: any) => {
  if (!sx || typeof sx !== 'object') return undefined;
  
  const style: React.CSSProperties = {};
  
  // Spacing (mb, mt, ml, mr, m, pb, pt, pl, pr, px, py, p)
  if (sx.mb !== undefined) style.marginBottom = sx.mb * 8;
  if (sx.mt !== undefined) style.marginTop = sx.mt * 8;
  if (sx.ml !== undefined) style.marginLeft = sx.ml * 8;
  if (sx.mr !== undefined) style.marginRight = sx.mr * 8;
  if (sx.m !== undefined) style.margin = sx.m * 8;
  
  if (sx.pb !== undefined) style.paddingBottom = sx.pb * 8;
  if (sx.pt !== undefined) style.paddingTop = sx.pt * 8;
  if (sx.pl !== undefined) style.paddingLeft = sx.pl * 8;
  if (sx.pr !== undefined) style.paddingRight = sx.pr * 8;
  if (sx.px !== undefined) {
    style.paddingLeft = sx.px * 8;
    style.paddingRight = sx.px * 8;
  }
  if (sx.py !== undefined) {
    style.paddingTop = sx.py * 8;
    style.paddingBottom = sx.py * 8;
  }
  if (sx.p !== undefined) style.padding = sx.p * 8;
  
  // Typography
  if (sx.fontSize) style.fontSize = sx.fontSize;
  if (sx.fontWeight) style.fontWeight = sx.fontWeight;
  if (sx.fontFamily) style.fontFamily = sx.fontFamily;
  if (sx.lineHeight) style.lineHeight = sx.lineHeight;
  if (sx.letterSpacing) style.letterSpacing = sx.letterSpacing;
  if (sx.textAlign) style.textAlign = sx.textAlign;
  if (sx.textTransform) style.textTransform = sx.textTransform;
  
  // Colors
  if (sx.color) style.color = sx.color;
  if (sx.backgroundColor || sx.bgcolor) style.backgroundColor = sx.backgroundColor || sx.bgcolor;
  
  // Display
  if (sx.display) style.display = sx.display;
  if (sx.opacity) style.opacity = sx.opacity;
  
  // Flexbox
  if (sx.flexGrow) style.flexGrow = sx.flexGrow;
  if (sx.flexShrink) style.flexShrink = sx.flexShrink;
  
  // Width & Height
  if (sx.width) style.width = sx.width;
  if (sx.height) style.height = sx.height;
  if (sx.minWidth) style.minWidth = sx.minWidth;
  if (sx.maxWidth) style.maxWidth = sx.maxWidth;
  if (sx.minHeight) style.minHeight = sx.minHeight;
  if (sx.maxHeight) style.maxHeight = sx.maxHeight;
  
  return Object.keys(style).length > 0 ? style : undefined;
};

// Props interface
export interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    VariantProps<typeof typographyVariants> {
  component?: React.ElementType;
  sx?: any;
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
      ref={ref as any}
      className={cn(
        typographyVariants({
          variant,
          color: color as any,
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
