/**
 * 🎬 Optimized Animations
 * Performance-optimized animations with useNativeDriver
 */

import React, { useRef, useEffect } from 'react';
import { Animated, ViewStyle, TextStyle } from 'react-native';
import { useAccessibility } from '../../utils/accessibility-helpers';

interface AnimationProps {
  children: React.ReactNode;
  style?: ViewStyle | TextStyle;
  duration?: number;
  delay?: number;
  useNativeDriver?: boolean;
}

/**
 * Optimized Fade In Animation
 */
export const OptimizedFadeIn: React.FC<AnimationProps> = ({
  children,
  style,
  duration = 300,
  delay = 0,
  useNativeDriver = true,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { isReduceMotionEnabled } = useAccessibility();

  useEffect(() => {
    // Skip animation if reduce motion is enabled
    if (isReduceMotionEnabled) {
      fadeAnim.setValue(1);
      return;
    }

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        useNativeDriver,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [fadeAnim, duration, delay, useNativeDriver, isReduceMotionEnabled]);

  return (
    <Animated.View
      style={[
        style as any,
        {
          opacity: isReduceMotionEnabled ? 1 : fadeAnim,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

/**
 * Optimized Slide In Animation
 */
export const OptimizedSlideIn: React.FC<AnimationProps & {
  direction?: 'left' | 'right' | 'up' | 'down';
  distance?: number;
}> = ({
  children,
  style,
  duration = 300,
  delay = 0,
  direction = 'right',
  distance = 50,
  useNativeDriver = true,
}) => {
  const slideAnim = useRef(new Animated.Value(distance)).current;
  const { isReduceMotionEnabled } = useAccessibility();

  useEffect(() => {
    // Skip animation if reduce motion is enabled
    if (isReduceMotionEnabled) {
      slideAnim.setValue(0);
      return;
    }

    const timer = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration,
        useNativeDriver,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [slideAnim, duration, delay, useNativeDriver, isReduceMotionEnabled]);

  const getTransform = () => {
    if (isReduceMotionEnabled) return [];

    switch (direction) {
      case 'left':
        return [{ translateX: slideAnim.interpolate({
          inputRange: [0, distance],
          outputRange: [0, -distance],
        }) }];
      case 'right':
        return [{ translateX: slideAnim }];
      case 'up':
        return [{ translateY: slideAnim.interpolate({
          inputRange: [0, distance],
          outputRange: [0, -distance],
        }) }];
      case 'down':
        return [{ translateY: slideAnim }];
      default:
        return [{ translateX: slideAnim }];
    }
  };

  return (
    <Animated.View
      style={[
        style as any,
        {
          transform: getTransform(),
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

/**
 * Optimized Scale Animation
 */
export const OptimizedScale: React.FC<AnimationProps & {
  fromScale?: number;
  toScale?: number;
}> = ({
  children,
  style,
  duration = 200,
  delay = 0,
  fromScale = 0.8,
  toScale = 1,
  useNativeDriver = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(fromScale)).current;
  const { isReduceMotionEnabled } = useAccessibility();

  useEffect(() => {
    // Skip animation if reduce motion is enabled
    if (isReduceMotionEnabled) {
      scaleAnim.setValue(toScale);
      return;
    }

    const timer = setTimeout(() => {
      Animated.timing(scaleAnim, {
        toValue: toScale,
        duration,
        useNativeDriver,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [scaleAnim, duration, delay, fromScale, toScale, useNativeDriver, isReduceMotionEnabled]);

  return (
    <Animated.View
      style={[
        style as any,
        {
          transform: [{ scale: isReduceMotionEnabled ? toScale : scaleAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

/**
 * Optimized Stagger Animation
 * For animating lists with staggered delays
 */
export const OptimizedStagger: React.FC<{
  children: React.ReactNode[];
  staggerDelay?: number;
  animationType?: 'fade' | 'slide' | 'scale';
  direction?: 'left' | 'right' | 'up' | 'down';
}> = ({
  children,
  staggerDelay = 100,
  animationType = 'fade',
  direction = 'up',
}) => {
  const { isReduceMotionEnabled } = useAccessibility();

  if (isReduceMotionEnabled) {
    return <>{children}</>;
  }

  return (
    <>
      {children.map((child, index) => {
        const delay = index * staggerDelay;
        
        switch (animationType) {
          case 'slide':
            return (
              <OptimizedSlideIn key={index} delay={delay} direction={direction}>
                {child}
              </OptimizedSlideIn>
            );
          case 'scale':
            return (
              <OptimizedScale key={index} delay={delay}>
                {child}
              </OptimizedScale>
            );
          default:
            return (
              <OptimizedFadeIn key={index} delay={delay}>
                {child}
              </OptimizedFadeIn>
            );
        }
      })}
    </>
  );
};

/**
 * Optimized Press Animation
 * For button press feedback
 */
export const OptimizedPressAnimation: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  pressScale?: number;
  pressDuration?: number;
}> = ({
  children,
  onPress,
  style,
  pressScale = 0.95,
  pressDuration = 100,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { isReduceMotionEnabled } = useAccessibility();

  const handlePressIn = () => {
    if (isReduceMotionEnabled) return;

    Animated.timing(scaleAnim, {
      toValue: pressScale,
      duration: pressDuration,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (isReduceMotionEnabled) return;

    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: pressDuration,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale: isReduceMotionEnabled ? 1 : scaleAnim }],
        },
      ]}
    >
      <Animated.View
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        onTouchCancel={handlePressOut}
        style={{ flex: 1 }}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
};

/**
 * Optimized Loading Animation
 */
export const OptimizedLoadingSpinner: React.FC<{
  size?: number;
  color?: string;
  duration?: number;
}> = ({
  size = 24,
  color = '#007AFF',
  duration = 1000,
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const { isReduceMotionEnabled } = useAccessibility();

  useEffect(() => {
    if (isReduceMotionEnabled) return;

    const startRotation = () => {
      rotateAnim.setValue(0);
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start(() => startRotation());
    };

    startRotation();
  }, [rotateAnim, duration, isReduceMotionEnabled]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (isReduceMotionEnabled) {
    return (
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color,
          borderTopColor: 'transparent',
        }}
      />
    );
  }

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        borderTopColor: 'transparent',
        transform: [{ rotate: rotation }],
      }}
    />
  );
};

/**
 * Animation utilities
 */
export const AnimationUtils = {
  /**
   * Create spring animation config
   */
  createSpringConfig: (tension = 100, friction = 8) => ({
    tension,
    friction,
    useNativeDriver: true,
  }),

  /**
   * Create timing animation config
   */
  createTimingConfig: (duration = 300, useNativeDriver = true) => ({
    duration,
    useNativeDriver,
  }),

  /**
   * Create stagger timing for multiple elements
   */
  createStaggerTiming: (count: number, staggerDelay = 100) => {
    return Array.from({ length: count }, (_, index) => index * staggerDelay);
  },
};

export default {
  OptimizedFadeIn,
  OptimizedSlideIn,
  OptimizedScale,
  OptimizedStagger,
  OptimizedPressAnimation,
  OptimizedLoadingSpinner,
  AnimationUtils,
};
