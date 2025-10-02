/**
 * 🤖 Typing Indicator Component - Enhanced for Mobile
 * Smooth animated dots with modern design to show AI is typing
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, Platform } from 'react-native';
import { theme } from '../../../styles/theme';

export function TypingIndicator() {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const containerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Container entrance animation
    Animated.spring(containerAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    const createDotAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation = Animated.parallel([
      createDotAnimation(dot1Anim, 0),
      createDotAnimation(dot2Anim, 200),
      createDotAnimation(dot3Anim, 400),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [dot1Anim, dot2Anim, dot3Anim, containerAnim]);

  const getDotStyle = (animValue: Animated.Value, index: number) => ({
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.brand.primary,
    marginHorizontal: 3,
    opacity: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.3],
        }),
      },
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4],
        }),
      },
    ] as any,
  });

  const IndicatorContainer = ({ children }: { children: React.ReactNode }) => {
    const containerStyle = {
      alignSelf: 'flex-start' as const,
      borderRadius: 20,
      paddingHorizontal: 18,
      paddingVertical: 14,
      marginVertical: 4,
      marginLeft: 8,
      marginRight: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.05)',
    };

    if (Platform.OS === 'ios') {
      return (
        <View style={containerStyle}>
          <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
            {children}
          </View>
        </View>
      );
    }

    return (
      <View
        style={{
          ...containerStyle,
          backgroundColor: 'white',
        }}
      >
        {children}
      </View>
    );
  };

  return (
    <Animated.View
      style={{
        opacity: containerAnim,
        transform: [
          {
            scale: containerAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            }),
          },
          {
            translateX: containerAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 0],
            }),
          },
        ],
      }}
    >
      {/* AI Avatar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8,
          marginLeft: 8,
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: theme.brand.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
            shadowColor: theme.brand.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Animated.View
            style={{
              opacity: dot2Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1],
              }),
            }}
          >
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: 'white',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: theme.brand.primary,
                }}
              />
            </View>
          </Animated.View>
        </View>
      </View>

      <IndicatorContainer>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 60,
            height: 20,
          }}
        >
          <Animated.View style={getDotStyle(dot1Anim, 0)} />
          <Animated.View style={getDotStyle(dot2Anim, 1)} />
          <Animated.View style={getDotStyle(dot3Anim, 2)} />
        </View>
      </IndicatorContainer>
    </Animated.View>
  );
}