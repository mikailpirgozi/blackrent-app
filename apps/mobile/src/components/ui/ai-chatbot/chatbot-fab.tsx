/**
 * 🤖 Chatbot FAB (Floating Action Button) - Industry Standard Design
 * Positioned like WhatsApp, Messenger, Intercom and other major chat apps
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  Text,
  Platform
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from 'expo-blur';
import { theme } from '../../../styles/theme';

interface ChatbotFABProps {
  onPress: () => void;
  hasUnreadMessages?: boolean;
  isVisible?: boolean;
  position?: {
    bottom?: number;
    right?: number;
  };
}

const { width, height } = Dimensions.get('window');

export function ChatbotFAB({ 
  onPress, 
  hasUnreadMessages = false,
  isVisible = true,
  position = { bottom: 24, right: 20 } // Industry standard position
}: ChatbotFABProps) {
  const scaleAnim = useRef(new Animated.Value(isVisible ? 1 : 0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Show/hide animation
    Animated.spring(scaleAnim, {
      toValue: isVisible ? 1 : 0,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [isVisible, scaleAnim]);

  useEffect(() => {
    // Pulse animation for unread messages
    if (hasUnreadMessages) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ])
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    }
  }, [hasUnreadMessages, pulseAnim]);

  useEffect(() => {
    // Badge animation
    Animated.spring(badgeAnim, {
      toValue: hasUnreadMessages ? 1 : 0,
      tension: 120,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [hasUnreadMessages, badgeAnim]);

  useEffect(() => {
    // Subtle glow animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        })
      ])
    );
    glowAnimation.start();

    return () => {
      glowAnimation.stop();
    };
  }, []);

  useEffect(() => {
    // Show tooltip on first render (like Intercom)
    const timer = setTimeout(() => {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 4000);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handlePress = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Press animation
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ]),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      rotateAnim.setValue(0);
    });

    onPress();
  };

  if (!isVisible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: position.bottom,
        right: position.right,
        zIndex: 1000,
      }}
    >
      {/* Tooltip like Intercom */}
      {showTooltip && (
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 70,
            right: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            maxWidth: 200,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            opacity: scaleAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <Text
            style={{
              color: 'white',
              fontSize: 13,
              fontWeight: '600',
              textAlign: 'center',
              lineHeight: 18,
            }}
          >
            💬 Potrebujete pomoc?{'\n'}Spýtajte sa AI asistenta!
          </Text>
          
          {/* Arrow */}
          <View
            style={{
              position: 'absolute',
              bottom: -8,
              right: 24,
              width: 0,
              height: 0,
              borderLeftWidth: 8,
              borderRightWidth: 8,
              borderTopWidth: 8,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: 'rgba(0, 0, 0, 0.9)',
            }}
          />
        </Animated.View>
      )}

      {/* Industry Standard FAB - 56dp like Material Design */}
      <Animated.View
        style={{
          transform: [
            { scale: Animated.multiply(scaleAnim, pulseAnim) },
            { 
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '15deg'],
              })
            }
          ],
        }}
      >
        {/* Subtle glow effect */}
        <Animated.View
          style={{
            position: 'absolute',
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: theme.brand.primary,
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.2],
            }),
            transform: [{
              scale: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.2],
              })
            }],
            top: -8,
            left: -8,
          }}
        />

        <TouchableOpacity
          onPress={handlePress}
          style={{
            width: 56, // Standard FAB size (Material Design)
            height: 56,
            borderRadius: 28,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[
              theme.brand.primary,
              theme.brand.secondary || '#1E40AF'
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 56,
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Animated.View
              style={{
                transform: [{
                  scale: pulseAnim.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [1, 1.05],
                  })
                }]
              }}
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={24}
                color="white"
                style={{
                  textShadowColor: 'rgba(0, 0, 0, 0.3)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                }}
              />
            </Animated.View>
          </LinearGradient>

          {/* Unread badge like WhatsApp */}
          {hasUnreadMessages && (
            <Animated.View
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: '#FF3B30',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: 'white',
                transform: [{ scale: badgeAnim }],
                shadowColor: '#FF3B30',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 4,
                elevation: 6,
              }}
            >
              <Animated.View
                style={{
                  transform: [{
                    scale: pulseAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [1, 1.1],
                    })
                  }]
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontSize: 10,
                    fontWeight: '700',
                  }}
                >
                  !
                </Text>
              </Animated.View>
            </Animated.View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}