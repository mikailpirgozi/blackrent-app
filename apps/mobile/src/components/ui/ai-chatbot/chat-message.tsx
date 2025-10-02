/**
 * 🤖 Chat Message Component - Redesigned for Mobile
 * Enhanced message bubbles with smooth animations and modern design
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from 'expo-blur';
import { theme } from '../../../styles/theme';
import { QuickActions } from './quick-actions';
import type { ChatMessage as ChatMessageType, QuickAction } from './types';

interface ChatMessageProps {
  message: ChatMessageType;
  onQuickAction?: (action: QuickAction) => void;
  isFirstMessage?: boolean;
  isLastMessage?: boolean;
}

export function ChatMessage({ 
  message, 
  onQuickAction, 
  isFirstMessage = false,
  isLastMessage = false 
}: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';
  const isAI = message.sender === 'ai';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isUser ? 50 : -50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

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
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const getBubbleStyle = () => {
    const baseStyle = {
      borderRadius: 24,
      paddingHorizontal: 18,
      paddingVertical: 14,
      marginVertical: 4,
      maxWidth: '85%' as const,
      minWidth: 60,
    };

    if (isSystem) {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(108, 117, 125, 0.1)',
        alignSelf: 'center' as const,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginVertical: 12,
        borderWidth: 1,
        borderColor: 'rgba(108, 117, 125, 0.2)',
      };
    }

    if (isUser) {
      return {
        ...baseStyle,
        alignSelf: 'flex-end' as const,
        marginLeft: 40,
        shadowColor: theme.brand.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
      };
    }

    // AI message
    return {
      ...baseStyle,
      backgroundColor: 'white',
      alignSelf: 'flex-start' as const,
      marginRight: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.05)',
    };
  };

  const getTextStyle = () => {
    if (isSystem) {
      return {
        fontSize: 14,
        color: theme.colors.secondaryLabel,
        textAlign: 'center' as const,
        fontWeight: '500' as any,
        lineHeight: 20,
      };
    }

    return {
      fontSize: 16,
      color: isUser ? 'white' : theme.colors.label,
      lineHeight: 22,
      fontWeight: isUser ? '500' as any : '400' as any,
    };
  };

  const formatTime = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString('sk-SK', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const MessageBubble = ({ children }: { children: React.ReactNode }) => {
    if (isUser) {
      return (
        <LinearGradient
          colors={[theme.brand.primary, theme.brand.secondary || '#1E40AF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={getBubbleStyle()}
        >
          {children}
        </LinearGradient>
      );
    }

    if (Platform.OS === 'ios' && isAI) {
      return (
        <View
          style={getBubbleStyle()}
        >
          <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
            {children}
          </View>
        </View>
      );
    }

    return (
      <View style={getBubbleStyle()}>
        {children}
      </View>
    );
  };

  return (
    <Animated.View 
      style={{ 
        marginBottom: isLastMessage ? 8 : 16,
        marginTop: isFirstMessage ? 8 : 0,
        paddingHorizontal: 4,
        opacity: fadeAnim,
        transform: [
          { translateX: slideAnim },
          { scale: scaleAnim }
        ]
      }}
    >
      {/* AI Avatar and Name for AI messages */}
      {isAI && (
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
            <Ionicons name="chatbubble-ellipses" size={14} color="white" />
          </View>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: theme.colors.secondaryLabel,
            }}
          >
            BlackRent AI
          </Text>
        </View>
      )}

      {/* Message bubble */}
      <MessageBubble>
        {/* Message content */}
        <Text style={getTextStyle()}>
          {message.content}
        </Text>

        {/* Enhanced Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <View style={{ marginTop: 12, gap: 8 }}>
            {message.attachments.map((attachment) => (
              <View key={attachment.id}>
                {attachment.type === 'image' && (
                  <View
                    style={{
                      borderRadius: 16,
                      overflow: 'hidden',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 3,
                    }}
                  >
                    <Image
                      source={{ uri: attachment.url }}
                      style={{
                        width: 220,
                        height: 160,
                        backgroundColor: theme.colors.systemFill,
                      }}
                      resizeMode="cover"
                    />
                  </View>
                )}
                
                {attachment.type === 'location' && (
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isUser ? 'rgba(255, 255, 255, 0.2)' : theme.colors.systemFill,
                      padding: 14,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: isUser ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: isUser ? 'rgba(255, 255, 255, 0.3)' : theme.brand.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Ionicons 
                        name="location" 
                        size={18} 
                        color={isUser ? 'white' : 'white'} 
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 15,
                        color: isUser ? 'rgba(255, 255, 255, 0.9)' : theme.colors.label,
                        fontWeight: '600',
                        flex: 1,
                      }}
                    >
                      {attachment.name || 'Zdieľaná lokácia'}
                    </Text>
                  </TouchableOpacity>
                )}

                {attachment.type === 'document' && (
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isUser ? 'rgba(255, 255, 255, 0.2)' : theme.colors.systemFill,
                      padding: 14,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: isUser ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: isUser ? 'rgba(255, 255, 255, 0.3)' : theme.brand.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Ionicons 
                        name="document" 
                        size={18} 
                        color="white" 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          color: isUser ? 'rgba(255, 255, 255, 0.9)' : theme.colors.label,
                          fontWeight: '600',
                        }}
                      >
                        {attachment.name || 'Dokument'}
                      </Text>
                      {attachment.size && (
                        <Text
                          style={{
                            fontSize: 12,
                            color: isUser ? 'rgba(255, 255, 255, 0.7)' : theme.colors.secondaryLabel,
                            marginTop: 2,
                          }}
                        >
                          {(attachment.size / 1024 / 1024).toFixed(1)} MB
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Enhanced Timestamp */}
        {!isSystem && (
          <Text
            style={{
              fontSize: 11,
              color: isUser ? 'rgba(255, 255, 255, 0.7)' : theme.colors.tertiaryLabel,
              marginTop: 6,
              textAlign: isUser ? 'right' : 'left',
              fontWeight: '500',
            }}
          >
            {formatTime(message.timestamp)}
          </Text>
        )}
      </MessageBubble>

      {/* Enhanced Quick Actions */}
      {message.quickActions && message.quickActions.length > 0 && (
        <View style={{ 
          marginTop: 12, 
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '90%',
        }}>
          <QuickActions
            actions={message.quickActions}
            onActionPress={onQuickAction}
          />
        </View>
      )}
    </Animated.View>
  );
}