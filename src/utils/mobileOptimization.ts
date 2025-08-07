// 📱 Mobile Experience Optimization
// Advanced touch interactions, responsive design, and mobile-specific enhancements

import { Theme } from '@mui/material/styles';

// Touch interaction utilities
export class TouchInteractionManager {
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private isScrolling: boolean = false;
  private longPressTimer: NodeJS.Timeout | null = null;

  // Swipe detection configuration
  private config = {
    minSwipeDistance: 50,
    maxSwipeTime: 300,
    longPressDelay: 500,
    scrollThreshold: 10,
  };

  // Enhanced touch event handlers
  handleTouchStart = (event: TouchEvent, callbacks?: {
    onSwipeStart?: (direction: 'left' | 'right' | 'up' | 'down') => void;
    onLongPressStart?: () => void;
  }) => {
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
    this.isScrolling = false;

    // Start long press detection
    if (callbacks?.onLongPressStart) {
      this.longPressTimer = setTimeout(() => {
        if (!this.isScrolling) {
          callbacks.onLongPressStart!();
          // Haptic feedback for long press
          this.triggerHapticFeedback('medium');
        }
      }, this.config.longPressDelay);
    }
  };

  handleTouchMove = (event: TouchEvent) => {
    if (!this.touchStartX || !this.touchStartY) return;

    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - this.touchStartX);
    const deltaY = Math.abs(touch.clientY - this.touchStartY);

    // Detect if user is scrolling
    if (deltaY > this.config.scrollThreshold || deltaX > this.config.scrollThreshold) {
      this.isScrolling = true;
      this.clearLongPress();
    }
  };

  handleTouchEnd = (event: TouchEvent, callbacks?: {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    onTap?: () => void;
  }) => {
    this.clearLongPress();

    if (this.isScrolling) {
      this.reset();
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;
    const deltaTime = Date.now() - this.touchStartTime;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Check for swipe gesture
    if (deltaTime < this.config.maxSwipeTime && 
        (absDeltaX > this.config.minSwipeDistance || absDeltaY > this.config.minSwipeDistance)) {
      
      // Determine swipe direction
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0 && callbacks?.onSwipeRight) {
          callbacks.onSwipeRight();
          this.triggerHapticFeedback('light');
        } else if (deltaX < 0 && callbacks?.onSwipeLeft) {
          callbacks.onSwipeLeft();
          this.triggerHapticFeedback('light');
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && callbacks?.onSwipeDown) {
          callbacks.onSwipeDown();
          this.triggerHapticFeedback('light');
        } else if (deltaY < 0 && callbacks?.onSwipeUp) {
          callbacks.onSwipeUp();
          this.triggerHapticFeedback('light');
        }
      }
    } else if (absDeltaX < 10 && absDeltaY < 10 && callbacks?.onTap) {
      // Simple tap
      callbacks.onTap();
      this.triggerHapticFeedback('light');
    }

    this.reset();
  };

  // Haptic feedback with different intensities
  triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: 10,
        medium: 20,
        heavy: [30, 10, 30],
      };
      navigator.vibrate(patterns[type]);
    }

    // iOS haptic feedback (if available)
    if ('hapticFeedback' in navigator) {
      const feedbackTypes = {
        light: 'impactLight',
        medium: 'impactMedium',
        heavy: 'impactHeavy',
      };
      // @ts-ignore - iOS specific API
      navigator.hapticFeedback?.(feedbackTypes[type]);
    }
  };

  private clearLongPress() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private reset() {
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.isScrolling = false;
    this.clearLongPress();
  }
}

// Mobile-responsive breakpoint utilities
export const mobileBreakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const;

export const isMobile = () => window.innerWidth < mobileBreakpoints.md;
export const isTablet = () => window.innerWidth >= mobileBreakpoints.sm && window.innerWidth < mobileBreakpoints.lg;
export const isDesktop = () => window.innerWidth >= mobileBreakpoints.lg;

// Enhanced responsive utilities
export const getResponsiveValue = <T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
}, fallback: T): T => {
  const width = window.innerWidth;
  
  if (width >= mobileBreakpoints.xl && values.xl !== undefined) return values.xl;
  if (width >= mobileBreakpoints.lg && values.lg !== undefined) return values.lg;
  if (width >= mobileBreakpoints.md && values.md !== undefined) return values.md;
  if (width >= mobileBreakpoints.sm && values.sm !== undefined) return values.sm;
  if (values.xs !== undefined) return values.xs;
  
  return fallback;
};

// Mobile-optimized theme enhancements
export const createMobileThemeOverrides = (theme: Theme) => ({
  // Enhanced touch targets
  MuiButton: {
    styleOverrides: {
      root: {
        minHeight: 44, // iOS recommended minimum touch target
        minWidth: 44,
        '@media (max-width: 900px)': {
          minHeight: 48, // Slightly larger on mobile
          fontSize: '1rem',
          padding: '12px 24px',
        },
      },
      fab: {
        width: 56,
        height: 56,
        '@media (max-width: 900px)': {
          width: 64,
          height: 64,
        },
      },
    },
  },

  // Enhanced form inputs for mobile
  MuiTextField: {
    styleOverrides: {
      root: {
        '@media (max-width: 900px)': {
          '& .MuiInputBase-root': {
            minHeight: 48,
            fontSize: '16px', // Prevents zoom on iOS
          },
          '& .MuiInputBase-input': {
            padding: '14px 16px',
          },
        },
      },
    },
  },

  // Enhanced list items for mobile
  MuiListItem: {
    styleOverrides: {
      root: {
        minHeight: 48,
        '@media (max-width: 900px)': {
          minHeight: 56,
          padding: '12px 16px',
        },
      },
    },
  },

  // Enhanced cards for mobile
  MuiCard: {
    styleOverrides: {
      root: {
        '@media (max-width: 900px)': {
          borderRadius: 16,
          margin: '8px',
          boxShadow: theme.shadows[2],
        },
      },
    },
  },

  // Enhanced app bar for mobile
  MuiAppBar: {
    styleOverrides: {
      root: {
        '@media (max-width: 900px)': {
          height: 64,
          '& .MuiToolbar-root': {
            minHeight: 64,
            padding: '0 16px',
          },
        },
      },
    },
  },

  // Enhanced table for mobile
  MuiTable: {
    styleOverrides: {
      root: {
        '@media (max-width: 900px)': {
          '& .MuiTableCell-root': {
            padding: '12px 8px',
            fontSize: '0.875rem',
          },
          '& .MuiTableHead-root .MuiTableCell-root': {
            fontSize: '0.75rem',
            fontWeight: 600,
          },
        },
      },
    },
  },

  // Enhanced dialog for mobile
  MuiDialog: {
    styleOverrides: {
      paper: {
        '@media (max-width: 900px)': {
          margin: 16,
          width: 'calc(100% - 32px)',
          maxWidth: 'none',
          borderRadius: 16,
        },
      },
    },
  },

  // Enhanced drawer for mobile
  MuiDrawer: {
    styleOverrides: {
      paper: {
        '@media (max-width: 900px)': {
          width: '85%',
          maxWidth: 320,
        },
      },
    },
  },
});

// Mobile performance optimizations
export class MobilePerformanceOptimizer {
  private resizeObserver: ResizeObserver | null = null;
  private orientationChangeTimeout: NodeJS.Timeout | null = null;

  // Optimize for device orientation changes
  setupOrientationHandling(callback?: (orientation: 'portrait' | 'landscape') => void) {
    const handleOrientationChange = () => {
      // Clear previous timeout
      if (this.orientationChangeTimeout) {
        clearTimeout(this.orientationChangeTimeout);
      }

      // Delay to allow for orientation change completion
      this.orientationChangeTimeout = setTimeout(() => {
        const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        callback?.(orientation);

        // Force layout recalculation
        document.body.style.height = '100vh';
        setTimeout(() => {
          document.body.style.height = '';
        }, 100);
      }, 300);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      if (this.orientationChangeTimeout) {
        clearTimeout(this.orientationChangeTimeout);
      }
    };
  }

  // Optimize scroll performance
  optimizeScrolling(element: HTMLElement) {
    // Enable smooth scrolling with momentum
    (element.style as any).webkitOverflowScrolling = 'touch';
    (element.style as any).overflowScrolling = 'touch';

    // Prevent overscroll behavior
    element.style.overscrollBehavior = 'contain';

    // Enable hardware acceleration
    element.style.transform = 'translateZ(0)';
    element.style.willChange = 'scroll-position';
  }

  // Reduce motion for users who prefer it
  respectMotionPreferences() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      document.documentElement.style.setProperty('--animation-duration', '0.01s');
      document.documentElement.style.setProperty('--transition-duration', '0.01s');
    }

    return prefersReducedMotion;
  }

  // Battery-aware optimizations
  setupBatteryOptimizations() {
    if ('getBattery' in navigator) {
      // @ts-ignore - Battery API
      navigator.getBattery().then((battery: any) => {
        const optimizeForBattery = () => {
          const isLowBattery = battery.level < 0.2;
          const isCharging = battery.charging;

          if (isLowBattery && !isCharging) {
            // Reduce animations and effects
            document.documentElement.classList.add('low-battery-mode');
            console.log('📱 Low battery mode activated - reducing animations');
          } else {
            document.documentElement.classList.remove('low-battery-mode');
          }
        };

        battery.addEventListener('levelchange', optimizeForBattery);
        battery.addEventListener('chargingchange', optimizeForBattery);
        optimizeForBattery();
      });
    }
  }

  // Network-aware optimizations
  setupNetworkOptimizations() {
    if ('connection' in navigator) {
      // @ts-ignore - Network Information API
      const connection = navigator.connection;
      
      const optimizeForConnection = () => {
        const conn = connection as any;
        const isSlowConnection = conn?.effectiveType === 'slow-2g' || 
                                 conn?.effectiveType === '2g' ||
                                 conn?.saveData;

        if (isSlowConnection) {
          document.documentElement.classList.add('slow-connection');
          console.log('📱 Slow connection detected - optimizing experience');
        } else {
          document.documentElement.classList.remove('slow-connection');
        }
      };

      (connection as any)?.addEventListener('change', optimizeForConnection);
      optimizeForConnection();
    }
  }

  // Initialize all mobile optimizations
  initializeMobileOptimizations() {
    this.respectMotionPreferences();
    this.setupBatteryOptimizations();
    this.setupNetworkOptimizations();

    // Add mobile-specific CSS classes
    if (isMobile()) {
      document.documentElement.classList.add('is-mobile');
    }
    if (isTablet()) {
      document.documentElement.classList.add('is-tablet');
    }

    // iOS specific optimizations
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      document.documentElement.classList.add('is-ios');
      
      // Prevent zoom on input focus
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
        );
      }
    }

    // Android specific optimizations
    const isAndroid = /Android/.test(navigator.userAgent);
    if (isAndroid) {
      document.documentElement.classList.add('is-android');
    }

    console.log('📱 Mobile optimizations initialized');
  }
}

// Mobile-specific CSS utilities
export const mobileCSS = `
  /* Mobile-specific optimizations */
  .is-mobile {
    --touch-target-size: 48px;
    --spacing-unit: 16px;
  }

  .is-tablet {
    --touch-target-size: 44px;
    --spacing-unit: 20px;
  }

  /* Low battery mode optimizations */
  .low-battery-mode * {
    animation-duration: 0.01s !important;
    transition-duration: 0.1s !important;
  }

  .low-battery-mode .shimmer-effect,
  .low-battery-mode .pulse-effect {
    animation: none !important;
  }

  /* Slow connection optimizations */
  .slow-connection img {
    loading: lazy;
  }

  .slow-connection .non-critical-animation {
    animation: none !important;
  }

  /* iOS specific styles */
  .is-ios {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
  }

  .is-ios input {
    font-size: 16px !important; /* Prevent zoom */
  }

  /* Android specific styles */
  .is-android {
    -webkit-tap-highlight-color: transparent;
  }

  /* Enhanced touch targets */
  @media (max-width: 900px) {
    .touch-target {
      min-height: var(--touch-target-size);
      min-width: var(--touch-target-size);
    }

    .enhanced-spacing {
      padding: var(--spacing-unit);
      margin: calc(var(--spacing-unit) / 2);
    }
  }

  /* Safe area support */
  .safe-area-top {
    padding-top: env(safe-area-inset-top);
  }

  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }

  .safe-area-left {
    padding-left: env(safe-area-inset-left);
  }

  .safe-area-right {
    padding-right: env(safe-area-inset-right);
  }

  /* Improved scrolling */
  .smooth-scroll {
    -webkit-overflow-scrolling: touch;
    overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01s !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01s !important;
    }
  }
`;

// Export singleton instances
export const touchManager = new TouchInteractionManager();
export const mobileOptimizer = new MobilePerformanceOptimizer();

// Initialize mobile optimizations
export const initializeMobileOptimizations = () => {
  mobileOptimizer.initializeMobileOptimizations();
  
  // Add mobile CSS to head
  const style = document.createElement('style');
  style.textContent = mobileCSS;
  document.head.appendChild(style);
};

export default {
  TouchInteractionManager,
  MobilePerformanceOptimizer,
  touchManager,
  mobileOptimizer,
  createMobileThemeOverrides,
  initializeMobileOptimizations,
  mobileBreakpoints,
  isMobile,
  isTablet,
  isDesktop,
  getResponsiveValue,
};
