import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Temporarily disabled Reanimated due to web compatibility issues
// import Animated, { 
//   useSharedValue, 
//   useAnimatedStyle, 
//   withSpring, 
//   withSequence,
//   withTiming,
//   runOnJS
// } from 'react-native-reanimated';

// Simple fallback without animations
const Animated = { View };
const useSharedValue = (val: any) => ({ value: val });
const useAnimatedStyle = (fn: any) => ({});
const withSpring = (val: any) => val;
const withSequence = (...args: any[]) => args[0];
const withTiming = (val: any, config?: any) => val;
const runOnJS = (fn: any) => fn;
import * as Haptics from 'expo-haptics';
// Simple mock translation for emergency components
const useTranslation = () => ({
  t: (key: string, fallback?: string) => fallback || key.split('.').pop() || key
});

interface EmergencyButtonProps {
  onEmergencyCall?: () => void;
  emergencyNumber?: string;
  className?: string;
}

export function EmergencyButton({ 
  onEmergencyCall, 
  emergencyNumber = '+421 911 000 000',
  className = '' 
}: EmergencyButtonProps) {
  const { t } = useTranslation();
  const [isPressed, setIsPressed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const startEmergencyCall = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    Alert.alert(
      t('emergency.confirmTitle', 'Núdzové volanie'),
      t('emergency.confirmMessage', 'Naozaj chcete zavolať na núdzovú linku?'),
      [
        {
          text: t('common.cancel', 'Zrušiť'),
          style: 'cancel',
        },
        {
          text: t('emergency.call', 'Volať'),
          style: 'destructive',
          onPress: () => {
            onEmergencyCall?.();
            Linking.openURL(`tel:${emergencyNumber}`);
          },
        },
      ]
    );
  };

  const handlePressIn = () => {
    setIsPressed(true);
    scale.value = withSpring(0.95);
    
    // Start countdown for long press
    let count = 3;
    setCountdown(count);
    
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count <= 0) {
        clearInterval(interval);
        runOnJS(startEmergencyCall)();
        runOnJS(setIsPressed)(false);
        runOnJS(setCountdown)(0);
      }
    }, 1000);

    // Store interval for cleanup
    countdownIntervalRef.current = interval as unknown as NodeJS.Timeout;
  };

  const handlePressOut = () => {
    setIsPressed(false);
    setCountdown(0);
    scale.value = withSpring(1);
    
    // Clear countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
  };

  // Pulse animation for emergency state
  React.useEffect(() => {
    pulseScale.value = withSequence(
      withTiming(1.1, { duration: 800 }),
      withTiming(1, { duration: 800 })
    );
    
    const pulseInterval = setInterval(() => {
      pulseScale.value = withSequence(
        withTiming(1.1, { duration: 800 }),
        withTiming(1, { duration: 800 })
      );
    }, 1600);

    return () => clearInterval(pulseInterval);
  }, []);

  return (
    <View className={`items-center justify-center ${className}`}>
      {/* Pulse Ring */}
      <Animated.View 
        style={[pulseStyle]}
        className="absolute w-24 h-24 rounded-full bg-red-500/20"
      />
      
      {/* Emergency Button */}
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="relative"
      >
        <Animated.View
          style={[animatedStyle]}
          className={`
            w-20 h-20 rounded-full items-center justify-center
            ${isPressed ? 'bg-red-600' : 'bg-red-500'}
            shadow-lg shadow-red-500/50
          `}
        >
          <Ionicons 
            name="call" 
            size={32} 
            color="white" 
          />
          
          {/* Countdown Overlay */}
          {countdown > 0 && (
            <View className="absolute inset-0 items-center justify-center bg-red-600/90 rounded-full">
              <Text className="text-white text-2xl font-bold">
                {countdown}
              </Text>
            </View>
          )}
        </Animated.View>
      </Pressable>

      {/* Label */}
      <Text className="text-red-600 font-semibold text-sm mt-2 text-center">
        {isPressed 
          ? t('emergency.holdToCall', 'Podržte pre volanie')
          : t('emergency.emergency', 'NÚDZA')
        }
      </Text>
      
      {/* Instructions */}
      <Text className="text-gray-500 text-xs mt-1 text-center max-w-32">
        {t('emergency.instructions', 'Podržte 3 sekundy pre núdzové volanie')}
      </Text>
    </View>
  );
}
