// 🎨 UNIFIED UI DESIGN SYSTEM
// Centralizované komponenty pre konzistentné UI

// Card System
export { UnifiedCard } from './UnifiedCard';
export type { UnifiedCardProps, UnifiedCardVariant } from './UnifiedCard';

// Demo Component
export { UnifiedDemo } from './UnifiedDemo';

// 🎯 QUICK IMPORTS
export { UnifiedCard as UCard } from './UnifiedCard';

// 🎨 DESIGN TOKENS
export const designTokens = {
  // Colors
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    gray: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  
  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  
  // Border radius
  borderRadius: {
    none: '0px',
    sm: '6px',
    md: '10px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    full: '50px',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 15px rgba(0, 0, 0, 0.1)',
    lg: '0 8px 25px rgba(0, 0, 0, 0.15)',
    xl: '0 12px 40px rgba(0, 0, 0, 0.2)',
    colored: '0 8px 32px rgba(102, 126, 234, 0.3)',
  },
  
  // Typography
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    fontSize: {
      xs: '0.625rem',
      sm: '0.75rem',
      md: '0.875rem',
      lg: '1rem',
      xl: '1.125rem',
      '2xl': '1.25rem',
      '3xl': '1.5rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },
  
  // Breakpoints
  breakpoints: {
    xs: '0px',
    sm: '600px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
} as const;

// 🎨 UTILITY FUNCTIONS
export const getColorWithOpacity = (color: string, opacity: number) => {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

export const getGradient = (from: string, to: string, direction = '135deg') => {
  return `linear-gradient(${direction}, ${from} 0%, ${to} 100%)`;
};
