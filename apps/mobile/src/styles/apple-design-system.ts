/**
 * 🍎 Apple Design System
 * Complete design system following Apple's Human Interface Guidelines
 * Optimized for React Native and iOS/Android platforms
 */

// ===================================
// 🎨 COLORS
// ===================================
export const AppleColors = {
  // System Colors - Light Mode
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  tertiarySystemBackground: '#FFFFFF',
  systemGroupedBackground: '#F2F2F7',
  secondarySystemGroupedBackground: '#FFFFFF',
  tertiarySystemGroupedBackground: '#F2F2F7',
  
  // System Fill Colors
  systemFill: 'rgba(120, 120, 128, 0.2)',
  secondarySystemFill: 'rgba(120, 120, 128, 0.16)',
  tertiarySystemFill: 'rgba(118, 118, 128, 0.12)',
  quaternarySystemFill: 'rgba(116, 116, 128, 0.08)',
  
  // Label Colors
  label: '#000000',
  secondaryLabel: 'rgba(60, 60, 67, 0.6)',
  tertiaryLabel: 'rgba(60, 60, 67, 0.3)',
  quaternaryLabel: 'rgba(60, 60, 67, 0.18)',
  placeholderText: 'rgba(60, 60, 67, 0.3)',
  
  // Separator Colors
  separator: 'rgba(60, 60, 67, 0.29)',
  opaqueSeparator: '#C6C6C8',
  
  // System Gray Colors
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',
  
  // System Colors
  systemBlue: '#007AFF',
  systemBlueLight: 'rgba(0, 122, 255, 0.1)',
  systemGreen: '#34C759',
  systemIndigo: '#5856D6',
  systemOrange: '#FF9500',
  systemPink: '#FF2D55',
  systemPurple: '#AF52DE',
  systemRed: '#FF3B30',
  systemTeal: '#5AC8FA',
  systemYellow: '#FFCC00',
  systemYellowLight: 'rgba(255, 204, 0, 0.1)',
  
  // Dark Mode Colors
  dark: {
    systemBackground: '#000000',
    secondarySystemBackground: '#1C1C1E',
    tertiarySystemBackground: '#2C2C2E',
    systemGroupedBackground: '#000000',
    secondarySystemGroupedBackground: '#1C1C1E',
    tertiarySystemGroupedBackground: '#2C2C2E',
    
    label: '#FFFFFF',
    secondaryLabel: 'rgba(235, 235, 245, 0.6)',
    tertiaryLabel: 'rgba(235, 235, 245, 0.3)',
    quaternaryLabel: 'rgba(235, 235, 245, 0.18)',
    
    separator: 'rgba(84, 84, 88, 0.6)',
    opaqueSeparator: '#38383A',
  },
  
  // BlackRent Brand Colors
  blackrentPrimary: '#007AFF',
  blackrentSecondary: '#5856D6',
  blackrentSuccess: '#34C759',
  blackrentWarning: '#FF9500',
  blackrentError: '#FF3B30',
};

// ===================================
// 📝 TYPOGRAPHY
// ===================================
export const AppleTypography = {
  // iOS System Font Stack
  fontFamily: {
    system: 'SF Pro',
    rounded: 'SF Pro Rounded',
    mono: 'SF Mono',
  },
  
  // Text Styles
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700' as const,
    letterSpacing: 0.37,
  },
  
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: 0.36,
  },
  
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: 0.35,
  },
  
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600' as const,
    letterSpacing: 0.38,
  },
  
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.41,
  },
  
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400' as const,
    letterSpacing: -0.41,
  },
  
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400' as const,
    letterSpacing: -0.32,
  },
  
  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: -0.24,
  },
  
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: -0.08,
  },
  
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400' as const,
    letterSpacing: 0.07,
  },
};

// ===================================
// 📏 SPACING
// ===================================
export const AppleSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Semantic Spacing
  padding: {
    small: 8,
    medium: 16,
    large: 24,
  },
  
  margin: {
    small: 8,
    medium: 16,
    large: 24,
  },
  
  gap: {
    small: 8,
    medium: 12,
    large: 16,
  },
};

// ===================================
// 🔲 BORDER RADIUS
// ===================================
export const AppleBorderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 20,
  xxlarge: 24,
  circle: 9999,
  
  // Component Specific
  button: 10,
  card: 12,
  input: 10,
  modal: 16,
  sheet: 20,
};

// ===================================
// 🌟 SHADOWS
// ===================================
export const AppleShadows = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
};

// ===================================
// 🧩 COMPONENTS
// ===================================
export const AppleComponents = {
  button: {
    primary: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: AppleBorderRadius.button,
      ...AppleShadows.small,
    },
    
    secondary: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: AppleBorderRadius.button,
      backgroundColor: AppleColors.systemGray6,
    },
    
    text: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
  },
  
  card: {
    backgroundColor: AppleColors.secondarySystemGroupedBackground,
    borderRadius: AppleBorderRadius.card,
    padding: AppleSpacing.lg,
    ...AppleShadows.card,
  },
  
  input: {
    backgroundColor: AppleColors.tertiarySystemFill,
    borderRadius: AppleBorderRadius.input,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 17,
    color: AppleColors.label,
  },
  
  list: {
    backgroundColor: AppleColors.secondarySystemGroupedBackground,
    borderRadius: AppleBorderRadius.card,
    overflow: 'hidden' as const,
  },
  
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: AppleColors.separator,
  },
};

// ===================================
// ⚡ ANIMATIONS
// ===================================
export const AppleAnimations = {
  timing: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  
  easing: {
    easeInOut: 'ease-in-out',
    easeOut: 'ease-out',
    easeIn: 'ease-in',
    spring: 'spring',
  },
  
  spring: {
    damping: 15,
    mass: 1,
    stiffness: 150,
  },
};

// ===================================
// 📐 LAYOUT
// ===================================
export const AppleLayout = {
  screenPadding: {
    horizontal: 16,
    vertical: 16,
  },
  
  containerWidth: {
    small: 320,
    medium: 375,
    large: 414,
    xlarge: 768,
  },
  
  navbar: {
    height: 44,
    paddingHorizontal: 16,
  },
  
  tabBar: {
    height: 49,
    paddingBottom: 0,
  },
  
  safeArea: {
    top: 44,
    bottom: 34,
  },
};

// ===================================
// 🛠️ UTILITIES
// ===================================
export const AppleUtils = {
  // Spacing multiplier
  spacing: (multiplier: number) => AppleSpacing.xs * multiplier,
  
  // Opacity levels
  opacity: {
    disabled: 0.4,
    hover: 0.8,
    pressed: 0.6,
    dim: 0.5,
  },
  
  // Z-Index scale
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
  },
  
  // Border widths
  borderWidth: {
    thin: 0.5,
    normal: 1,
    thick: 2,
  },
  
  // Icon sizes
  iconSize: {
    small: 16,
    medium: 24,
    large: 32,
    xlarge: 48,
  },
};

// ===================================
// 📦 DEFAULT EXPORT
// ===================================
const AppleDesign = {
  Colors: AppleColors,
  Typography: AppleTypography,
  Spacing: AppleSpacing,
  BorderRadius: AppleBorderRadius,
  Shadows: AppleShadows,
  Components: AppleComponents,
  Animations: AppleAnimations,
  Layout: AppleLayout,
  Utils: AppleUtils,
};

export default AppleDesign;
export { AppleDesign };

