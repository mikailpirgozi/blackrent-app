/**
 * 📱 MOBILE RESPONSIVE UTILITIES
 * Vylepšenia pre touch targets, viewport a horizontal scrolling
 */

import { Theme } from '@mui/material/styles';

// 🎯 TOUCH TARGET STANDARDS
export const TOUCH_TARGETS = {
  // Apple HIG & Material Design standards
  MINIMUM: 44,      // 44px minimum touch target
  COMFORTABLE: 48,   // 48px comfortable touch target
  LARGE: 56,        // 56px large touch target
  EXTRA_LARGE: 64   // 64px extra large touch target
} as const;

// 📱 RESPONSIVE BREAKPOINTS
export const MOBILE_BREAKPOINTS = {
  SMALL_MOBILE: 360,   // iPhone SE, small Android
  MOBILE: 414,         // iPhone Pro, standard mobile
  LARGE_MOBILE: 480,   // iPhone Pro Max, large mobile
  SMALL_TABLET: 768,   // iPad Mini, small tablets
  TABLET: 1024,        // iPad, standard tablets
  DESKTOP: 1200        // Desktop breakpoint
} as const;

// 🎨 MOBILE-FIRST STYLING HELPERS
export const getMobileStyles = (theme: Theme) => ({
  // ✅ PROPER TOUCH TARGETS
  touchTarget: {
    minHeight: TOUCH_TARGETS.MINIMUM,
    minWidth: TOUCH_TARGETS.MINIMUM,
    padding: theme.spacing(1),
    margin: theme.spacing(0.5),
    borderRadius: theme.spacing(1),
    // Ensure proper spacing between touch targets
    '& + &': {
      marginLeft: theme.spacing(1),
    }
  },

  // ✅ COMFORTABLE BUTTON SIZING
  mobileButton: {
    minHeight: TOUCH_TARGETS.COMFORTABLE,
    minWidth: TOUCH_TARGETS.COMFORTABLE,
    fontSize: '0.9rem',
    fontWeight: 600,
    padding: theme.spacing(1.5, 2),
    borderRadius: theme.spacing(1.5),
    // Better visual feedback
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: 'scale(1.02)',
      boxShadow: theme.shadows[4],
    },
    '&:active': {
      transform: 'scale(0.98)',
    }
  },

  // ✅ MOBILE-OPTIMIZED CARDS
  mobileCard: {
    margin: theme.spacing(1),
    borderRadius: theme.spacing(2),
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    // Prevent horizontal overflow
    maxWidth: '100%',
    overflow: 'hidden',
    // Better touch interaction
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:active': {
      transform: 'scale(0.98)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
    }
  },

  // ✅ HORIZONTAL SCROLL FIX
  horizontalScrollContainer: {
    overflowX: 'auto',
    overflowY: 'hidden',
    // iOS momentum scrolling
    WebkitOverflowScrolling: 'touch',
    // Hide scrollbar but keep functionality
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    // Snap to items (optional)
    scrollSnapType: 'x mandatory',
    '& > *': {
      scrollSnapAlign: 'start',
      flexShrink: 0, // Prevent items from shrinking
    }
  },

  // ✅ MOBILE TABLE FIXES
  responsiveTable: {
    // Prevent table from breaking layout
    width: '100%',
    tableLayout: 'fixed',
    // Enable horizontal scrolling for tables
    overflowX: 'auto',
    display: 'block',
    whiteSpace: 'nowrap',
    [theme.breakpoints.down('md')]: {
      // On mobile, show as cards instead
      display: 'none',
    }
  },

  // ✅ MOBILE FORM IMPROVEMENTS
  mobileForm: {
    '& .MuiTextField-root': {
      marginBottom: theme.spacing(2),
      // Better input sizing for mobile
      '& .MuiInputBase-input': {
        fontSize: '1rem', // Prevent zoom on iOS
        padding: theme.spacing(1.5),
      }
    },
    '& .MuiFormControl-root': {
      minHeight: TOUCH_TARGETS.COMFORTABLE,
    }
  },

  // ✅ SAFE AREA INSETS (for iPhone notch)
  safeArea: {
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)',
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)',
  }
});

// 🎯 VIEWPORT META TAG HELPER
export const VIEWPORT_META_CONTENT = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

// 📱 MOBILE DETECTION UTILITIES
export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// 🎨 RESPONSIVE FONT SCALING
export const getResponsiveFontSize = (
  baseSize: number,
  mobileSize?: number,
  tabletSize?: number
) => ({
  fontSize: baseSize,
  [MOBILE_BREAKPOINTS.MOBILE]: {
    fontSize: mobileSize || baseSize * 0.9,
  },
  [MOBILE_BREAKPOINTS.SMALL_TABLET]: {
    fontSize: tabletSize || baseSize * 0.95,
  }
});

// 🔧 MOBILE PERFORMANCE HELPERS
export const getMobilePerformanceStyles = () => ({
  // Optimize rendering performance
  willChange: 'transform',
  transform: 'translateZ(0)', // Force hardware acceleration
  backfaceVisibility: 'hidden',
  // Reduce repaints
  contain: 'layout style paint',
});

// 📏 SPACING UTILITIES
export const getMobileSpacing = (theme: Theme) => ({
  xs: theme.spacing(0.5),   // 4px
  sm: theme.spacing(1),     // 8px
  md: theme.spacing(1.5),   // 12px
  lg: theme.spacing(2),     // 16px
  xl: theme.spacing(3),     // 24px
  xxl: theme.spacing(4),    // 32px
});

export default {
  TOUCH_TARGETS,
  MOBILE_BREAKPOINTS,
  getMobileStyles,
  isMobileDevice,
  isTouchDevice,
  getResponsiveFontSize,
  getMobilePerformanceStyles,
  getMobileSpacing,
  VIEWPORT_META_CONTENT
};
