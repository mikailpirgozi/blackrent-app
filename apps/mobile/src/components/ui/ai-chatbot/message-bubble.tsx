/**
 * 🤖 Message Bubble Component
 * Reusable message bubble with different styles
 */

import React from 'react';
import { View, Text } from 'react-native';
import { theme } from '../../../styles/theme';

interface MessageBubbleProps {
  content: string;
  sender: 'user' | 'ai' | 'system';
  timestamp?: Date;
  children?: React.ReactNode;
}

export function MessageBubble({ content, sender, timestamp, children }: MessageBubbleProps) {
  const isUser = sender === 'user';
  const isSystem = sender === 'system';

  const getBubbleStyle = () => {
    if (isSystem) {
      return {
        backgroundColor: theme.colors.systemFill,
        alignSelf: 'center' as const,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginVertical: 8,
      };
    }

    return {
      backgroundColor: isUser ? theme.brand.primary : theme.colors.systemBackground,
      alignSelf: isUser ? 'flex-end' as const : 'flex-start' as const,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginVertical: 4,
      maxWidth: '80%' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    };
  };

  const getTextStyle = () => {
    if (isSystem) {
      return {
        fontSize: 14,
        color: theme.colors.secondaryLabel,
        textAlign: 'center' as const,
        fontWeight: '500' as any,
      };
    }

    return {
      fontSize: 16,
      color: isUser ? 'white' : theme.colors.label,
      lineHeight: 22,
    };
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('sk-SK', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={getBubbleStyle()}>
      <Text style={getTextStyle()}>
        {content}
      </Text>
      
      {children}

      {timestamp && !isSystem && (
        <Text
          style={{
            fontSize: 11,
            color: isUser ? 'rgba(255, 255, 255, 0.7)' : theme.colors.tertiaryLabel,
            marginTop: 4,
            textAlign: isUser ? 'right' : 'left',
          }}
        >
          {formatTime(timestamp)}
        </Text>
      )}
    </View>
  );
}
