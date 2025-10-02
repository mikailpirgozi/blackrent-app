/**
 * 🎨 Centralizovaný Theme System pre BlackRent Mobile
 * Integruje Apple Design System s TailwindCSS a poskytuje konzistentné štýly
 */

import { Appearance } from 'react-native';
import {
  AppleColors,
  AppleTypography,
  AppleSpacing,
  AppleBorderRadius,
  AppleShadows,
  AppleComponents,
  AppleAnimations,
  AppleLayout,
  AppleUtils,
} from './apple-design-system';

// ===================================
// 🌓 THEME MODE DETECTION
// ===================================
export const getThemeMode = () => {
  return Appearance.getColorScheme() || 'light';
};

// ===================================
// 🎨 UNIFIED THEME OBJECT
// ===================================
export const theme = {
  // Apple Design System Integration
  colors: AppleColors,
  typography: AppleTypography,
  spacing: AppleSpacing,
  borderRadius: AppleBorderRadius,
  shadows: AppleShadows,
  components: AppleComponents,
  animations: AppleAnimations,
  layout: AppleLayout,
  utils: AppleUtils,

  // Theme Mode Helpers
  isDark: getThemeMode() === 'dark',
  
  // Dynamic Colors (Light/Dark Mode Support)
  dynamicColors: {
    background: (isDark = getThemeMode() === 'dark') => 
      isDark ? AppleColors.dark.systemBackground : AppleColors.systemBackground,
    
    text: (isDark = getThemeMode() === 'dark') => 
      isDark ? AppleColors.dark.label : AppleColors.label,
    
    secondaryText: (isDark = getThemeMode() === 'dark') => 
      isDark ? AppleColors.dark.secondaryLabel : AppleColors.secondaryLabel,
    
    cardBackground: (isDark = getThemeMode() === 'dark') => 
      isDark ? AppleColors.dark.secondarySystemGroupedBackground : AppleColors.secondarySystemGroupedBackground,
    
    separator: (isDark = getThemeMode() === 'dark') => 
      isDark ? AppleColors.dark.tertiaryLabel : AppleColors.separator,
  },

  // BlackRent Brand Colors
  brand: {
    primary: AppleColors.blackrentPrimary,
    secondary: AppleColors.blackrentSecondary,
    success: AppleColors.blackrentSuccess,
    warning: AppleColors.blackrentWarning,
    error: AppleColors.blackrentError,
  },

  // Semantic Colors
  semantic: {
    info: AppleColors.systemBlue,
    success: AppleColors.systemGreen,
    warning: AppleColors.systemOrange,
    error: AppleColors.systemRed,
    disabled: AppleColors.quaternaryLabel,
  },

  // Component Variants
  variants: {
    button: {
      primary: {
        ...AppleComponents.button.primary,
        backgroundColor: AppleColors.systemBlue,
        color: '#FFFFFF',
      },
      secondary: {
        ...AppleComponents.button.secondary,
        backgroundColor: AppleColors.secondarySystemFill,
        color: AppleColors.label,
      },
      outline: {
        ...AppleComponents.button.secondary,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: AppleColors.systemBlue,
        color: AppleColors.systemBlue,
      },
      ghost: {
        ...AppleComponents.button.text,
        backgroundColor: 'transparent',
        color: AppleColors.systemBlue,
      },
      danger: {
        ...AppleComponents.button.primary,
        backgroundColor: AppleColors.systemRed,
        color: '#FFFFFF',
      },
    },
    
    card: {
      default: {
        ...AppleComponents.card,
      },
      elevated: {
        ...AppleComponents.card,
        ...AppleShadows.modal,
      },
      flat: {
        ...AppleComponents.card,
        shadowOpacity: 0,
        elevation: 0,
      },
    },
    
    input: {
      default: {
        ...AppleComponents.input,
      },
      error: {
        ...AppleComponents.input,
        borderWidth: 1,
        borderColor: AppleColors.systemRed,
      },
      focused: {
        ...AppleComponents.input,
        borderWidth: 1,
        borderColor: AppleColors.systemBlue,
      },
    },
  },

  // Responsive Breakpoints (pre TailwindCSS)
  breakpoints: {
    sm: 375,  // iPhone SE
    md: 414,  // iPhone Pro
    lg: 768,  // iPad Mini
    xl: 1024, // iPad
  },

  // Z-Index Scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
} as const;

// ===================================
// 🎯 THEME UTILITIES
// ===================================
export const themeUtils = {
  // Get responsive value
  getResponsiveValue: <T>(values: { sm?: T; md?: T; lg?: T; xl?: T }, screenWidth: number): T | undefined => {
    if (screenWidth >= theme.breakpoints.xl && values.xl !== undefined) return values.xl;
    if (screenWidth >= theme.breakpoints.lg && values.lg !== undefined) return values.lg;
    if (screenWidth >= theme.breakpoints.md && values.md !== undefined) return values.md;
    if (screenWidth >= theme.breakpoints.sm && values.sm !== undefined) return values.sm;
    return values.sm;
  },

  // Create consistent spacing
  spacing: (multiplier: number) => theme.spacing.xs * multiplier,

  // Get semantic color
  getSemanticColor: (type: keyof typeof theme.semantic) => theme.semantic[type],

  // Get brand color
  getBrandColor: (type: keyof typeof theme.brand) => theme.brand[type],

  // Get dynamic color based on theme
  getDynamicColor: (lightColor: string, darkColor: string) => 
    theme.isDark ? darkColor : lightColor,

  // Create shadow with elevation
  createElevation: (level: number) => ({
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: level / 2 },
    shadowOpacity: 0.1 + (level * 0.02),
    shadowRadius: level,
    elevation: level,
  }),

  // Get component variant
  getVariant: <T extends keyof typeof theme.variants>(
    component: T,
    variant: keyof typeof theme.variants[T]
  ) => theme.variants[component][variant],
};

// ===================================
// 🎨 STYLED SYSTEM HELPERS
// ===================================
export const styledSystem = {
  // Margin helpers
  m: (value: number) => ({ margin: theme.utils.spacing(value) }),
  mt: (value: number) => ({ marginTop: theme.utils.spacing(value) }),
  mb: (value: number) => ({ marginBottom: theme.utils.spacing(value) }),
  ml: (value: number) => ({ marginLeft: theme.utils.spacing(value) }),
  mr: (value: number) => ({ marginRight: theme.utils.spacing(value) }),
  mx: (value: number) => ({ 
    marginLeft: theme.utils.spacing(value), 
    marginRight: theme.utils.spacing(value) 
  }),
  my: (value: number) => ({ 
    marginTop: theme.utils.spacing(value), 
    marginBottom: theme.utils.spacing(value) 
  }),

  // Padding helpers
  p: (value: number) => ({ padding: theme.utils.spacing(value) }),
  pt: (value: number) => ({ paddingTop: theme.utils.spacing(value) }),
  pb: (value: number) => ({ paddingBottom: theme.utils.spacing(value) }),
  pl: (value: number) => ({ paddingLeft: theme.utils.spacing(value) }),
  pr: (value: number) => ({ paddingRight: theme.utils.spacing(value) }),
  px: (value: number) => ({ 
    paddingLeft: theme.utils.spacing(value), 
    paddingRight: theme.utils.spacing(value) 
  }),
  py: (value: number) => ({ 
    paddingTop: theme.utils.spacing(value), 
    paddingBottom: theme.utils.spacing(value) 
  }),

  // Flexbox helpers
  flex: {
    center: {
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    row: {
      flexDirection: 'row' as const,
    },
    column: {
      flexDirection: 'column' as const,
    },
    spaceBetween: {
      justifyContent: 'space-between' as const,
    },
    spaceAround: {
      justifyContent: 'space-around' as const,
    },
    wrap: {
      flexWrap: 'wrap' as const,
    },
  },

  // Typography helpers
  text: {
    center: { textAlign: 'center' as const },
    left: { textAlign: 'left' as const },
    right: { textAlign: 'right' as const },
    primary: { color: theme.colors.label },
    secondary: { color: theme.colors.secondaryLabel },
    muted: { color: theme.colors.tertiaryLabel },
    brand: { color: theme.brand.primary },
    success: { color: theme.semantic.success },
    warning: { color: theme.semantic.warning },
    error: { color: theme.semantic.error },
  },
};

// ===================================
// 🎭 THEME PROVIDER CONTEXT
// ===================================
export type ThemeContextType = {
  theme: typeof theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme?: (theme: 'light' | 'dark' | 'system') => void;
  themeMode?: 'light' | 'dark' | 'system';
  systemColorScheme?: 'light' | 'dark' | null;
  utils: typeof themeUtils;
  styled: typeof styledSystem;
};

// Export default theme
export default theme;

// Export individual parts for convenience
export {
  AppleColors,
  AppleTypography,
  AppleSpacing,
  AppleBorderRadius,
  AppleShadows,
  AppleComponents,
  AppleAnimations,
  AppleLayout,
  AppleUtils,
};
