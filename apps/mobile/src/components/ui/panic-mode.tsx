import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Alert, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Temporarily disabled Reanimated due to web compatibility issues
// Simple fallback without animations
const Animated = { View };
const useSharedValue = (val: any) => ({ value: val });
const useAnimatedStyle = (fn: any) => ({});
const withSpring = (val: any) => val;
const withSequence = (...args: any[]) => args[0];
const withTiming = (val: any, config?: any) => val;
const runOnJS = (fn: any) => fn;
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
// Simple mock translation for emergency components
const useTranslation = () => ({
  t: (key: string, fallback?: string) => fallback || key.split('.').pop() || key
});

interface PanicAlert {
  id: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  userId: string;
  vehicleId?: string;
  bookingId?: string;
  status: 'active' | 'resolved' | 'false_alarm';
}

interface PanicModeProps {
  userId: string;
  vehicleId?: string;
  bookingId?: string;
  onPanicTriggered?: (alert: PanicAlert) => void;
  emergencyContacts?: string[];
  className?: string;
}

export function PanicMode({
  userId,
  vehicleId = '',
  bookingId = '',
  onPanicTriggered,
  emergencyContacts = ['+421 911 000 000'],
  className = ''
}: PanicModeProps) {
  const { t } = useTranslation();
  const [isPanicActive, setIsPanicActive] = useState(false);
  const [isArmed, setIsArmed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [currentAlert, setCurrentAlert] = useState<PanicAlert | null>(null);
  
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);
  const pulseScale = useSharedValue(1);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Pulse animation when armed
  React.useEffect(() => {
    if (isArmed) {
      opacity.value = withTiming(1, { duration: 300 });
      
      const startPulse = () => {
        pulseScale.value = withSequence(
          withTiming(1.2, { duration: 600 }),
          withTiming(1, { duration: 600 })
        );
      };
      
      startPulse();
      const pulseInterval = setInterval(startPulse, 1200);
      
      return () => clearInterval(pulseInterval);
    } else {
      opacity.value = withTiming(0.3, { duration: 300 });
    }
  }, [isArmed]);

  const armPanicMode = () => {
    setIsArmed(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      t('panic.armed', 'Panic Mode Aktivovaný'),
      t('panic.armedMessage', 'Panic mode je teraz aktivovaný. Podržte tlačidlo 3 sekundy pre spustenie núdzového volania.'),
      [{ text: t('common.ok', 'OK') }]
    );
  };

  const disarmPanicMode = () => {
    setIsArmed(false);
    setCountdown(0);
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
      countdownRef.current = null;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const startPanicCountdown = () => {
    if (!isArmed) {
      armPanicMode();
      return;
    }

    let count = 3;
    setCountdown(count);
    
    // Intense haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    const runCountdown = () => {
      count--;
      setCountdown(count);
      
      if (count > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Vibration.vibrate(200);
        countdownRef.current = setTimeout(runCountdown, 1000) as any;
      } else {
        triggerPanic();
      }
    };
    
    countdownRef.current = setTimeout(runCountdown, 1000) as any;
  };

  const cancelCountdown = () => {
    setCountdown(0);
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const triggerPanic = async () => {
    setIsPanicActive(true);
    setCountdown(0);
    
    // Get current location
    let location: Location.LocationObject | null = null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        location = await Location.getCurrentPositionAsync({});
      }
    } catch (error) {
          }

    // Create panic alert
    const alert: PanicAlert = {
      id: Date.now().toString(),
      timestamp: new Date(),
      location: location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      } : undefined,
      userId,
      vehicleId,
      bookingId,
      status: 'active'
    };

    setCurrentAlert(alert);
    onPanicTriggered?.(alert);

    // Continuous vibration and haptics
    Vibration.vibrate([0, 1000, 500, 1000], true);
    
    Alert.alert(
      t('panic.triggered', 'PANIC MODE AKTIVOVANÝ'),
      t('panic.triggeredMessage', 'Núdzové služby boli kontaktované. Pomoc je na ceste.'),
      [
        {
          text: t('panic.falseAlarm', 'Falošný poplach'),
          style: 'destructive',
          onPress: () => resolvePanic('false_alarm')
        },
        {
          text: t('panic.confirmed', 'Potvrdené'),
          style: 'default',
          onPress: () => {} // Keep panic active
        }
      ]
    );
  };

  const resolvePanic = (status: 'resolved' | 'false_alarm') => {
    setIsPanicActive(false);
    setIsArmed(false);
    Vibration.cancel();
    
    if (currentAlert) {
      const updatedAlert = { ...currentAlert, status };
      setCurrentAlert(updatedAlert);
      onPanicTriggered?.(updatedAlert);
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const message = status === 'false_alarm' 
      ? t('panic.falseAlarmConfirmed', 'Falošný poplach potvrdený. Núdzové služby boli informované.')
      : t('panic.resolved', 'Panic mode ukončený.');
      
    Alert.alert(
      t('panic.deactivated', 'Panic Mode Deaktivovaný'),
      message,
      [{ text: t('common.ok', 'OK') }]
    );
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.9);
    startPanicCountdown();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    if (countdown > 0) {
      cancelCountdown();
    }
  };

  if (isPanicActive) {
    return (
      <View className={`items-center justify-center ${className}`}>
        {/* Active Panic State */}
        <Animated.View 
          style={[pulseStyle]}
          className="w-32 h-32 rounded-full bg-red-500 items-center justify-center"
        >
          <Ionicons name="warning" size={48} color="white" />
        </Animated.View>
        
        <Text className="text-red-600 font-bold text-xl mt-4 text-center">
          {t('panic.active', 'PANIC MODE AKTÍVNY')}
        </Text>
        
        <Text className="text-gray-600 text-center mt-2 max-w-64">
          {t('panic.activeMessage', 'Núdzové služby boli kontaktované. Zostante v bezpečí.')}
        </Text>
        
        <View className="flex-row space-x-3 mt-6">
          <Pressable
            onPress={() => resolvePanic('false_alarm')}
            className="bg-gray-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">
              {t('panic.falseAlarm', 'Falošný poplach')}
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => resolvePanic('resolved')}
            className="bg-green-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">
              {t('panic.resolved', 'Vyriešené')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className={`items-center justify-center ${className}`}>
      {/* Pulse Ring */}
      {isArmed && (
        <Animated.View 
          style={[pulseStyle]}
          className="absolute w-28 h-28 rounded-full bg-red-500/20"
        />
      )}
      
      {/* Panic Button */}
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={() => {}} // Prevent default long press
        className="relative"
      >
        <Animated.View
          style={[animatedStyle]}
          className={`
            w-24 h-24 rounded-full items-center justify-center
            ${isArmed ? 'bg-red-500' : 'bg-gray-400'}
            ${countdown > 0 ? 'bg-red-600' : ''}
            shadow-lg
          `}
        >
          <Ionicons 
            name={isArmed ? "warning" : "shield-outline"} 
            size={32} 
            color="white" 
          />
          
          {/* Countdown Overlay */}
          {countdown > 0 && (
            <View className="absolute inset-0 items-center justify-center bg-red-700/90 rounded-full">
              <Text className="text-white text-2xl font-bold">
                {countdown}
              </Text>
            </View>
          )}
        </Animated.View>
      </Pressable>

      {/* Status Text */}
      <Text className={`font-semibold text-sm mt-3 text-center ${
        isArmed ? 'text-red-600' : 'text-gray-500'
      }`}>
        {countdown > 0 
          ? t('panic.releasing', 'Uvoľnite pre zrušenie')
          : isArmed 
            ? t('panic.armed', 'PANIC ARMED')
            : t('panic.disarmed', 'Panic Mode')
        }
      </Text>
      
      {/* Instructions */}
      <Text className="text-gray-400 text-xs mt-1 text-center max-w-32">
        {isArmed 
          ? t('panic.holdInstructions', 'Podržte 3s pre núdzu')
          : t('panic.armInstructions', 'Stlačte pre aktiváciu')
        }
      </Text>
      
      {/* Disarm Button */}
      {isArmed && (
        <Pressable
          onPress={disarmPanicMode}
          className="mt-4 px-4 py-2 bg-gray-200 rounded-lg"
        >
          <Text className="text-gray-700 text-sm">
            {t('panic.disarm', 'Deaktivovať')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
