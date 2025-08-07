// 📱 Mobile Optimization Hooks
// Custom React hooks for mobile-specific functionality and optimizations

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { 
  isMobile, 
  isTablet, 
  isDesktop, 
  getResponsiveValue,
  touchManager,
  mobileOptimizer 
} from '../utils/mobileOptimization';

// Hook for responsive values
export const useResponsive = () => {
  const [screenType, setScreenType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });
      
      if (isMobile()) {
        setScreenType('mobile');
      } else if (isTablet()) {
        setScreenType('tablet');
      } else {
        setScreenType('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getResponsiveValueHook = useCallback(<T>(values: {
    xs?: T;
    sm?: T;
    md?: T;
    lg?: T;
    xl?: T;
  }, fallback: T): T => {
    return getResponsiveValue(values, fallback);
  }, []);

  return {
    screenType,
    windowSize,
    isMobile: screenType === 'mobile',
    isTablet: screenType === 'tablet',
    isDesktop: screenType === 'desktop',
    getResponsiveValue: getResponsiveValueHook,
  };
};

// Hook for touch interactions
export const useTouchInteractions = () => {
  const [isPressed, setIsPressed] = useState(false);
  const [longPressTriggered, setLongPressTriggered] = useState(false);

  const handleTouchStart = useCallback((
    event: React.TouchEvent,
    callbacks?: {
      onLongPress?: () => void;
    }
  ) => {
    setIsPressed(true);
    setLongPressTriggered(false);
    
    touchManager.handleTouchStart(event.nativeEvent, {
      onLongPressStart: () => {
        setLongPressTriggered(true);
        callbacks?.onLongPress?.();
      },
    });
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    touchManager.handleTouchMove(event.nativeEvent);
  }, []);

  const handleTouchEnd = useCallback((
    event: React.TouchEvent,
    callbacks?: {
      onTap?: () => void;
      onSwipeLeft?: () => void;
      onSwipeRight?: () => void;
      onSwipeUp?: () => void;
      onSwipeDown?: () => void;
    }
  ) => {
    setIsPressed(false);
    
    touchManager.handleTouchEnd(event.nativeEvent, callbacks);
  }, []);

  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    touchManager.triggerHapticFeedback(type);
  }, []);

  return {
    isPressed,
    longPressTriggered,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    triggerHapticFeedback,
  };
};

// Hook for device orientation
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    const updateOrientation = () => {
      const newOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      setOrientation(newOrientation);
      
      // Get orientation angle if available
      if ('orientation' in window) {
        setAngle(window.orientation as number);
      }
    };

    updateOrientation();
    
    const cleanup = mobileOptimizer.setupOrientationHandling(updateOrientation);
    
    return cleanup;
  }, []);

  return {
    orientation,
    angle,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
  };
};

// Hook for safe area insets
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)')) || 0,
        right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)')) || 0,
        bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
        left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)')) || 0,
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    
    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  return safeArea;
};

// Hook for device capabilities
export const useDeviceCapabilities = () => {
  const [capabilities, setCapabilities] = useState({
    hasVibration: false,
    hasTouchScreen: false,
    hasAccelerometer: false,
    hasGyroscope: false,
    hasCamera: false,
    hasGeolocation: false,
    connectionType: 'unknown' as string,
    batteryLevel: null as number | null,
    isCharging: null as boolean | null,
  });

  useEffect(() => {
    const detectCapabilities = async () => {
      const newCapabilities = { ...capabilities };

      // Vibration API
      newCapabilities.hasVibration = 'vibrate' in navigator;

      // Touch screen
      newCapabilities.hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Accelerometer/Gyroscope
      if ('DeviceMotionEvent' in window) {
        try {
          // @ts-ignore
          if (typeof DeviceMotionEvent.requestPermission === 'function') {
            // iOS 13+ permission request
            newCapabilities.hasAccelerometer = true;
            newCapabilities.hasGyroscope = true;
          } else {
            // Android or older iOS
            newCapabilities.hasAccelerometer = true;
            newCapabilities.hasGyroscope = true;
          }
        } catch (e) {
          // Not supported
        }
      }

      // Camera
      if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          newCapabilities.hasCamera = devices.some(device => device.kind === 'videoinput');
        } catch (e) {
          // Permission denied or not available
        }
      }

      // Geolocation
      newCapabilities.hasGeolocation = 'geolocation' in navigator;

      // Network connection
      if ('connection' in navigator) {
        // @ts-ignore
        const connection = navigator.connection as any;
        newCapabilities.connectionType = connection?.effectiveType || 'unknown';
      }

      // Battery status
      if ('getBattery' in navigator) {
        try {
          // @ts-ignore
          const battery = await navigator.getBattery();
          newCapabilities.batteryLevel = battery.level;
          newCapabilities.isCharging = battery.charging;
        } catch (e) {
          // Not supported
        }
      }

      setCapabilities(newCapabilities);
    };

    detectCapabilities();
  }, []);

  return capabilities;
};

// Hook for mobile-optimized theme
export const useMobileTheme = () => {
  const theme = useTheme();
  const { isMobile, isTablet } = useResponsive();

  const mobileTheme = {
    ...theme,
    spacing: (factor: number) => {
      const baseSpacing = 8;
      const mobileFactor = isMobile ? 1.2 : isTablet ? 1.1 : 1;
      return `${baseSpacing * factor * mobileFactor}px`;
    },
    typography: {
      ...theme.typography,
      fontSize: isMobile ? 16 : 14, // Prevent zoom on iOS
    },
    components: {
      ...theme.components,
      // Mobile-optimized component overrides
      MuiButton: {
        styleOverrides: {
          root: {
            minHeight: isMobile ? 48 : 36,
            fontSize: isMobile ? '1rem' : '0.875rem',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInputBase-input': {
              fontSize: isMobile ? '16px' : '14px', // Prevent zoom on iOS
            },
          },
        },
      },
    },
  };

  return mobileTheme;
};

// Hook for pull-to-refresh
export const usePullToRefresh = (
  onRefresh: () => Promise<void>,
  threshold: number = 80
) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const elementRef = useRef<HTMLElement>(null);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (elementRef.current && elementRef.current.scrollTop === 0) {
      startY.current = event.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!isPulling) return;

    const currentY = event.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    
    if (distance > 0 && elementRef.current && elementRef.current.scrollTop === 0) {
      setPullDistance(Math.min(distance, threshold * 1.5));
      
      if (distance > 10) {
        event.preventDefault();
      }
    }
  }, [isPulling, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      touchManager.triggerHapticFeedback('medium');
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  }, [isPulling, pullDistance, threshold, onRefresh, isRefreshing]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isMobile()) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    elementRef,
    isRefreshing,
    pullDistance,
    isPulling,
    progress: Math.min(pullDistance / threshold, 1),
    shouldRefresh: pullDistance >= threshold,
  };
};

// Hook for swipe gestures
export const useSwipeGestures = (callbacks: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}) => {
  const elementRef = useRef<HTMLElement>(null);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    touchManager.handleTouchStart(event.nativeEvent);
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    touchManager.handleTouchMove(event.nativeEvent);
  }, []);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    touchManager.handleTouchEnd(event.nativeEvent, callbacks);
  }, [callbacks]);

  return {
    elementRef,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};

// Hook for mobile performance monitoring
export const useMobilePerformance = () => {
  const [metrics, setMetrics] = useState({
    memoryUsage: 0,
    renderTime: 0,
    batteryLevel: null as number | null,
    connectionSpeed: 'unknown' as string,
  });

  useEffect(() => {
    const updateMetrics = () => {
      const newMetrics = { ...metrics };

      // Memory usage
      if ('memory' in performance) {
        // @ts-ignore
        const memory = (performance as any).memory;
        if (memory) {
          newMetrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        }
      }

      // Connection speed
      if ('connection' in navigator) {
        // @ts-ignore
        const connection = (navigator as any).connection;
        if (connection) {
          newMetrics.connectionSpeed = connection.effectiveType || 'unknown';
        }
      }

      setMetrics(newMetrics);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
};

export default {
  useResponsive,
  useTouchInteractions,
  useOrientation,
  useSafeArea,
  useDeviceCapabilities,
  useMobileTheme,
  usePullToRefresh,
  useSwipeGestures,
  useMobilePerformance,
};
