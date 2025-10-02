/**
 * 🤖 Quick Actions Component - Enhanced for Mobile
 * Interactive buttons for common chatbot actions with modern design
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../../styles/theme';
import type { QuickAction } from './types';

interface QuickActionsProps {
  actions: QuickAction[];
  onActionPress?: (action: QuickAction) => void;
}

export function QuickActions({ actions, onActionPress }: QuickActionsProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  if (!actions || actions.length === 0) {
    return null;
  }

  const handleActionPress = (action: QuickAction) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onActionPress?.(action);
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 8,
          paddingVertical: 4,
        }}
        style={{
          maxWidth: '100%',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
          }}
        >
          {actions.map((action, index) => (
            <Animated.View
              key={action.id}
              style={{
                opacity: fadeAnim,
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 20],
                    outputRange: [0, 20 + (index * 5)],
                  })
                }]
              }}
            >
              <TouchableOpacity
                onPress={() => handleActionPress(action)}
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 3,
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0.95)',
                    'rgba(248, 248, 248, 0.9)'
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    minWidth: 90,
                    maxWidth: 140,
                    borderWidth: 1,
                    borderColor: 'rgba(0, 0, 0, 0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: theme.brand.primary,
                      textAlign: 'center',
                      lineHeight: 18,
                    }}
                    numberOfLines={2}
                  >
                    {action.label}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );
}