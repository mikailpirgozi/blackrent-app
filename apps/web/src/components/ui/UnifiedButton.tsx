/**
 * 🎨 UNIFIED BUTTON COMPONENT
 *
 * Konzistentný button komponent pre celú BlackRent aplikáciu
 * Nahradí všetky rôzne button štýly jednotným dizajnom
 */

import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Spinner } from './spinner';

// 🎨 Button varianty pomocou CVA (class-variance-authority)
const unifiedButtonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // MUI varianty
        contained: "text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        outlined: "bg-transparent border-2 hover:-translate-y-0.5 active:translate-y-0",
        text: "bg-transparent hover:bg-opacity-10 hover:-translate-y-0.5 active:translate-y-0",
        // shadcn varianty
        default: "text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        outline: "bg-transparent border-2 hover:-translate-y-0.5 active:translate-y-0",
        ghost: "bg-transparent hover:bg-opacity-10 hover:-translate-y-0.5 active:translate-y-0",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        small: "h-8 px-3 text-xs",
        medium: "h-9 px-4 text-sm",
        large: "h-11 px-6 text-base",
        // shadcn sizes
        sm: "h-9 px-3",
        default: "h-10 px-4 py-2",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
      color: {
        primary: "",
        secondary: "",
        success: "",
        warning: "",
        error: "",
        info: "",
        inherit: "",
      }
    },
    compoundVariants: [
      // Primary color variants
      { variant: "contained", color: "primary", className: "bg-blue-600 hover:bg-blue-700" },
      { variant: "outlined", color: "primary", className: "text-blue-600 border-blue-600 hover:bg-blue-50" },
      { variant: "text", color: "primary", className: "text-blue-600 hover:bg-blue-50" },
      
      // Secondary color variants
      { variant: "contained", color: "secondary", className: "bg-pink-600 hover:bg-pink-700" },
      { variant: "outlined", color: "secondary", className: "text-pink-600 border-pink-600 hover:bg-pink-50" },
      { variant: "text", color: "secondary", className: "text-pink-600 hover:bg-pink-50" },
      
      // Success color variants
      { variant: "contained", color: "success", className: "bg-green-700 hover:bg-green-800" },
      { variant: "outlined", color: "success", className: "text-green-700 border-green-700 hover:bg-green-50" },
      { variant: "text", color: "success", className: "text-green-700 hover:bg-green-50" },
      
      // Warning color variants
      { variant: "contained", color: "warning", className: "bg-orange-600 hover:bg-orange-700" },
      { variant: "outlined", color: "warning", className: "text-orange-600 border-orange-600 hover:bg-orange-50" },
      { variant: "text", color: "warning", className: "text-orange-600 hover:bg-orange-50" },
      
      // Error color variants
      { variant: "contained", color: "error", className: "bg-red-600 hover:bg-red-700" },
      { variant: "outlined", color: "error", className: "text-red-600 border-red-600 hover:bg-red-50" },
      { variant: "text", color: "error", className: "text-red-600 hover:bg-red-50" },
      
      // Info color variants
      { variant: "contained", color: "info", className: "bg-cyan-600 hover:bg-cyan-700" },
      { variant: "outlined", color: "info", className: "text-cyan-600 border-cyan-600 hover:bg-cyan-50" },
      { variant: "text", color: "info", className: "text-cyan-600 hover:bg-cyan-50" },
      
      // Inherit uses primary colors
      { variant: "contained", color: "inherit", className: "bg-primary hover:bg-primary/90" },
      { variant: "outlined", color: "inherit", className: "text-primary border-primary hover:bg-primary/10" },
      { variant: "text", color: "inherit", className: "text-primary hover:bg-primary/10" },
    ],
    defaultVariants: {
      variant: "contained",
      size: "medium",
      color: "primary",
    },
  }
);

// 🎨 Props interface
export interface UnifiedButtonProps 
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    VariantProps<typeof unifiedButtonVariants> {
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  asChild?: boolean;
  component?: string | React.ElementType; // Pre kompatibilitu s MUI component prop
  sx?: Record<string, unknown>; // Pre spätnu kompatibilitu s MUI sx prop
}

// Helper funkcia na konverziu MUI sx prop na inline styles (základná podpora)
const convertSxToStyle = (sx: Record<string, unknown> | undefined): React.CSSProperties | undefined => {
  if (!sx) return undefined;
  
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
  
  // Základná konverzia niektorých častých sx properties
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
  
  if (sx.fontSize && (typeof sx.fontSize === 'string' || typeof sx.fontSize === 'number')) {
    style.fontSize = sx.fontSize as string | number;
  }
  if (sx.color && typeof sx.color === 'string') {
    style.color = sx.color;
  }
  if (sx.backgroundColor && typeof sx.backgroundColor === 'string') {
    style.backgroundColor = sx.backgroundColor;
  }
  if (sx.borderColor && typeof sx.borderColor === 'string') {
    style.borderColor = sx.borderColor;
  }
  if (sx.borderStyle && typeof sx.borderStyle === 'string') {
    style.borderStyle = sx.borderStyle as React.CSSProperties['borderStyle'];
  }
  if (sx.borderWidth && (typeof sx.borderWidth === 'string' || typeof sx.borderWidth === 'number')) {
    style.borderWidth = sx.borderWidth as string | number;
  }
  
  return Object.keys(style).length > 0 ? style : undefined;
};

// 🎨 Unified Button Component
export const UnifiedButton = React.forwardRef<
  HTMLButtonElement,
  UnifiedButtonProps
>(({
  className,
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
  asChild = false,
  component,
  sx,
  style,
  ...props
}, ref) => {
  // Ak je component prop, použijeme ho (pre spätnú kompatibilitu s MUI)
  const Comp = component || (asChild ? Slot : 'button');
  
  const content = (
    <>
      {loading && <Spinner size={16} className="mr-2" />}
      {!loading && startIcon && <span className="mr-2">{startIcon}</span>}
      {loading ? loadingText || 'Načítavam...' : children}
      {!loading && endIcon && <span className="ml-2">{endIcon}</span>}
    </>
  );
  
  // Kombinujeme style z sx prop a existujúci style prop
  const combinedStyle = {
    ...convertSxToStyle(sx),
    ...style
  };
  
  // Pre component="label" alebo iné HTML elementy, musíme props trochu upraviť
  const buttonProps: Record<string, unknown> = {
    ref,
    className: cn(
      unifiedButtonVariants({ variant, size, color }),
      fullWidth && "w-full",
      className
    ),
    style: combinedStyle,
    ...props
  };
  
  // Pridáme disabled len ak je to button element
  if (typeof Comp === 'string' && Comp === 'button') {
    buttonProps.disabled = disabled || loading;
  } else if (!component) {
    buttonProps.disabled = disabled || loading;
  }
  
  return (
    <Comp {...buttonProps}>
      {content}
    </Comp>
  );
});
UnifiedButton.displayName = "UnifiedButton";

// 🎨 Predefined button variants pre rýchle použitie
export const PrimaryButton: React.FC<
  Omit<UnifiedButtonProps, 'color' | 'variant'>
> = props => <UnifiedButton color="primary" variant="default" {...props} />;

export const SecondaryButton: React.FC<
  Omit<UnifiedButtonProps, 'color' | 'variant'>
> = props => <UnifiedButton color="secondary" variant="outline" {...props} />;

export const SuccessButton: React.FC<
  Omit<UnifiedButtonProps, 'color' | 'variant'>
> = props => <UnifiedButton color="success" variant="default" {...props} />;

export const WarningButton: React.FC<
  Omit<UnifiedButtonProps, 'color' | 'variant'>
> = props => <UnifiedButton color="warning" variant="default" {...props} />;

export const ErrorButton: React.FC<
  Omit<UnifiedButtonProps, 'color' | 'variant'>
> = props => <UnifiedButton color="error" variant="default" {...props} />;

export const TextButton: React.FC<
  Omit<UnifiedButtonProps, 'variant'>
> = props => <UnifiedButton variant="ghost" {...props} />;

export default UnifiedButton;
