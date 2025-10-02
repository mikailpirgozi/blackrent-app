import React from 'react';
import { View, Animated as RNAnimated } from 'react-native';

/**
 * Fallback animations for when Reanimated is not available
 * Provides basic animations using React Native's built-in Animated API
 */

// Simple fade in animation
export const FadeInUp = {
  duration: (ms: number) => ({
    entering: () => 'fadeInUp',
    exiting: () => 'fadeOutDown'
  })
};

export const FadeOutDown = {
  duration: (ms: number) => ({
    entering: () => 'fadeInUp',
    exiting: () => 'fadeOutDown'
  })
};

export const _Layout = {
  springify: () => ({
    layout: 'spring'
  })
};

// Fallback Animated View that works without Reanimated
interface AnimatedViewProps {
  children: React.ReactNode;
  entering?: any;
  exiting?: any;
  layout?: any;
  className?: string;
  style?: any;
}

export function AnimatedView({ 
  children, 
  entering, 
  exiting, 
  layout, 
  className, 
  style 
}: AnimatedViewProps) {
  return (
    <View className={className} style={style}>
      {children}
    </View>
  );
}

// Export as default for easy replacement
const Animated = {
  View: AnimatedView,
  FadeInUp,
  FadeOutDown,
  Layout
};

export default Animated;
