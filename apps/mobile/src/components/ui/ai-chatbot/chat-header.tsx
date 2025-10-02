/**
 * 🤖 Chat Header Component - Redesigned for Mobile
 * Modern header for AI chatbot with enhanced UX
 */

import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../../styles/theme';

interface ChatHeaderProps {
  onClose: () => void;
  onEscalate: () => void;
  language?: string;
}

export function ChatHeader({ onClose, onEscalate, language = 'sk' }: ChatHeaderProps) {
  const getTitle = (lang: string): string => {
    const titles = {
      'sk': 'BlackRent AI',
      'cs': 'BlackRent AI',
      'de': 'BlackRent AI',
      'hu': 'BlackRent AI',
      'en': 'BlackRent AI'
    };
    return titles[lang as keyof typeof titles] || titles.sk;
  };

  const getSubtitle = (lang: string): string => {
    const subtitles = {
      'sk': 'Inteligentný asistent • Online',
      'cs': 'Inteligentní asistent • Online',
      'de': 'Intelligenter Assistent • Online',
      'hu': 'Intelligens asszisztens • Online',
      'en': 'Intelligent Assistant • Online'
    };
    return subtitles[lang as keyof typeof subtitles] || subtitles.sk;
  };

  const _getHumanSupportTooltip = (lang: string): string => {
    const tooltips = {
      'sk': 'Ľudská podpora',
      'cs': 'Lidská podpora',
      'de': 'Menschlicher Support',
      'hu': 'Emberi támogatás',
      'en': 'Human Support'
    };
    return tooltips[lang as keyof typeof tooltips] || tooltips.sk;
  };

  return (
    <>
      <StatusBar 
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'} 
        backgroundColor="transparent" 
        translucent 
      />
      
      <LinearGradient
        colors={[
          theme.brand.primary,
          theme.brand.secondary || '#1E40AF'
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: Platform.OS === 'ios' ? 0 : 8,
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 56,
          }}
        >
          {/* Left side - AI info with enhanced design */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            flex: 1,
            paddingRight: 16 
          }}>
            {/* Enhanced AI Avatar */}
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
                borderWidth: 2,
                borderColor: 'rgba(255, 255, 255, 0.3)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons 
                  name="chatbubble-ellipses" 
                  size={22} 
                  color={theme.brand.primary} 
                />
              </LinearGradient>
            </View>

            {/* Enhanced AI Info */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: 'white',
                  marginBottom: 2,
                  textShadowColor: 'rgba(0, 0, 0, 0.2)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                }}
              >
                {getTitle(language)}
              </Text>
              
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 12,
                alignSelf: 'flex-start',
              }}>
                {/* Enhanced online indicator */}
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#00FF88',
                    marginRight: 6,
                    shadowColor: '#00FF88',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: '600',
                  }}
                >
                  {getSubtitle(language)}
                </Text>
              </View>
            </View>
          </View>

          {/* Right side - Enhanced Controls */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center',
            gap: 8,
          }}>
            {/* Enhanced Human support button */}
            <TouchableOpacity
              onPress={onEscalate}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="person" 
                size={20} 
                color="rgba(255, 255, 255, 0.9)" 
              />
            </TouchableOpacity>

            {/* Enhanced Close button */}
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="close" 
                size={20} 
                color="rgba(255, 255, 255, 0.9)" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Subtle bottom border */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          }}
        />
      </LinearGradient>
    </>
  );
}