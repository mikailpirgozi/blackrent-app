import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Button } from './button';
import { SmartImage } from './smart-image/smart-image';
// Simple mock translation for emergency components
const useTranslation = () => ({
  t: (key: string, fallback?: string) => fallback || key.split('.').pop() || key
});
import { realTimeService, ChatMessage } from '@/services/real-time-service';
// Simple mock auth hook for emergency components
const _useAuth = () => ({
  user: { id: 'user_123', name: 'Test User' }
});
// Temporarily disabled Reanimated - using simple View instead
const Animated = { View };

interface LiveChatProps {
  recipientId: string;
  recipientType: 'company' | 'support';
  recipientName: string;
  bookingId?: string;
  className?: string;
}

export function LiveChat({
  recipientId,
  recipientType,
  recipientName,
  bookingId,
  className = ''
}: LiveChatProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Subscribe to chat messages
    const handleChatMessage = (message: ChatMessage) => {
      if (
        (message.senderId === recipientId && message.recipientId === user?.id) ||
        (message.senderId === user?.id && message.recipientId === recipientId)
      ) {
        setMessages(prev => {
          // Avoid duplicates
          const exists = prev.find(m => m.id === message.id);
          if (exists) {
            // Update existing message (e.g., status change)
            return prev.map(m => m.id === message.id ? message : m);
          }
          return [...prev, message].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        });
        
        // Auto-scroll to bottom
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    const handleConnectionStatus = (connected: boolean) => {
      setIsOnline(connected);
    };

    realTimeService.on('chat_message', handleChatMessage);
    realTimeService.on('connected', () => handleConnectionStatus(true));
    realTimeService.on('disconnected', () => handleConnectionStatus(false));

    // Subscribe to chat channel
    realTimeService.subscribe([`chat_${user?.id}`, `chat_${recipientId}`]);

    // Load chat history (mock for now)
    loadChatHistory();

    return () => {
      realTimeService.off('chat_message', handleChatMessage);
      realTimeService.off('connected', () => handleConnectionStatus(true));
      realTimeService.off('disconnected', () => handleConnectionStatus(false));
    };
  }, [recipientId, user?.id]);

  const loadChatHistory = () => {
    // Mock chat history - in production, load from API
    const mockHistory: ChatMessage[] = [
      {
        id: 'msg_1',
        senderId: recipientId,
        senderName: recipientName,
        senderType: recipientType,
        recipientId: user?.id || '',
        recipientType: 'customer',
        message: 'Ahoj! Ako vám môžem pomôcť s vašou rezerváciou?',
        timestamp: new Date(Date.now() - 60000),
        type: 'text',
        status: 'read',
        bookingId
      }
    ];
    
    setMessages(mockHistory);
  };

  const sendMessage = async (messageText?: string, attachments?: any[]) => {
    const text = messageText || newMessage.trim();
    if (!text && !attachments?.length) return;

    setIsSending(true);
    
    try {
      await realTimeService.sendChatMessage({
        senderId: user?.id || '',
        senderName: user?.name || 'Zákazník',
        senderType: 'customer',
        recipientId,
        recipientType,
        message: text,
        type: attachments?.length ? 'image' : 'text',
        attachments,
        bookingId
      });

      setNewMessage('');
    } catch (error) {
            Alert.alert(
        t('error.title', 'Chyba'),
        t('chat.sendError', 'Nepodarilo sa odoslať správu.')
      );
    } finally {
      setIsSending(false);
    }
  };

  const sendImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('camera.permissionDenied', 'Povolenie zamietnuté'),
          t('camera.permissionMessage', 'Potrebujeme prístup k galérii.')
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const attachment = {
          type: 'image' as const,
          url: result.assets[0].uri,
          fileName: 'image.jpg',
          fileSize: result.assets[0].fileSize || 0
        };

        await sendMessage(t('chat.imageMessage', 'Obrázok'), [attachment]);
      }
    } catch (error) {
            Alert.alert(
        t('error.title', 'Chyba'),
        t('chat.imageError', 'Nepodarilo sa odoslať obrázok.')
      );
    }
  };

  const sendLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('location.permissionDenied', 'Povolenie zamietnuté'),
          t('location.permissionMessage', 'Potrebujeme prístup k lokácii.')
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const attachment = {
        type: 'location' as const,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: 'Moja aktuálna poloha'
        }
      };

      await sendMessage(t('chat.locationMessage', 'Moja poloha'), [attachment]);
    } catch (error) {
            Alert.alert(
        t('error.title', 'Chyba'),
        t('chat.locationError', 'Nepodarilo sa odoslať polohu.')
      );
    }
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);
    
    // Send typing indicator
    if (!isTyping) {
      setIsTyping(true);
      // In production, send typing event to server
    }
    
    // Clear typing after 2 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000) as any;
  };

  const formatMessageTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    if (diff < 60000) { // Less than 1 minute
      return t('chat.justNow', 'Práve teraz');
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return t('chat.minutesAgo', `Pred ${minutes} min`);
    } else if (diff < 86400000) { // Less than 1 day
      return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const getMessageStatusIcon = (status: ChatMessage['status']) => {
    switch (status) {
      case 'sending': return 'time-outline';
      case 'sent': return 'checkmark-outline';
      case 'delivered': return 'checkmark-done-outline';
      case 'read': return 'checkmark-done';
      default: return 'time-outline';
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isOwn = message.senderId === user?.id;
    const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.senderId !== message.senderId);
    
    return (
      <View
        key={message.id}
        className={`flex-row mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
      >
        {/* Avatar */}
        {!isOwn && (
          <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-2">
            {showAvatar ? (
              <Text className="text-blue-600 text-xs font-semibold">
                {message.senderName.charAt(0).toUpperCase()}
              </Text>
            ) : (
              <View className="w-2 h-2" />
            )}
          </View>
        )}
        
        {/* Message Bubble */}
        <View className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Sender Name */}
          {!isOwn && showAvatar && (
            <Text className="text-xs text-gray-500 mb-1 ml-3">
              {message.senderName}
            </Text>
          )}
          
          {/* Message Content */}
          <View
            className={`
              px-4 py-2 rounded-2xl
              ${isOwn 
                ? 'bg-blue-500 rounded-br-md' 
                : 'bg-gray-100 rounded-bl-md'
              }
            `}
          >
            {/* Text Message */}
            {message.type === 'text' && (
              <Text className={`${isOwn ? 'text-white' : 'text-gray-900'}`}>
                {message.message}
              </Text>
            )}
            
            {/* Image Message */}
            {message.type === 'image' && message.attachments?.[0] && (
              <View>
                {message.message && (
                  <Text className={`${isOwn ? 'text-white' : 'text-gray-900'} mb-2`}>
                    {message.message}
                  </Text>
                )}
                <SmartImage
                  images={[message.attachments[0].url || '']}
                  style={{ width: 192, height: 144 }}
                />
              </View>
            )}
            
            {/* Location Message */}
            {message.type === 'location' && message.attachments?.[0]?.location && (
              <View>
                {message.message && (
                  <Text className={`${isOwn ? 'text-white' : 'text-gray-900'} mb-2`}>
                    {message.message}
                  </Text>
                )}
                <View className="flex-row items-center">
                  <Ionicons 
                    name="location" 
                    size={16} 
                    color={isOwn ? 'white' : '#6B7280'} 
                  />
                  <Text className={`ml-2 ${isOwn ? 'text-white' : 'text-gray-700'} text-sm`}>
                    {message.attachments[0].location.address}
                  </Text>
                </View>
              </View>
            )}
          </View>
          
          {/* Message Info */}
          <View className={`flex-row items-center mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <Text className="text-xs text-gray-400 mr-1">
              {formatMessageTime(message.timestamp)}
            </Text>
            {isOwn && (
              <Ionicons 
                name={getMessageStatusIcon(message.status) as any} 
                size={12} 
                color={message.status === 'read' ? '#10B981' : '#9CA3AF'} 
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={`flex-1 bg-white ${className}`}
    >
      {/* Chat Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
            <Text className="text-blue-600 font-semibold">
              {recipientName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="ml-3 flex-1">
            <Text className="font-semibold text-gray-900">
              {recipientName}
            </Text>
            <View className="flex-row items-center">
              <View className={`w-2 h-2 rounded-full mr-2 ${
                isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <Text className="text-sm text-gray-500">
                {isOnline 
                  ? t('chat.online', 'Online') 
                  : t('chat.offline', 'Offline')
                }
              </Text>
            </View>
          </View>
        </View>
        
        <Button variant="ghost" className="p-2">
          <Ionicons name="call" size={20} color="#6B7280" />
        </Button>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4 py-2"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message, index) => renderMessage(message, index))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-2">
              <Text className="text-blue-600 text-xs font-semibold">
                {recipientName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-md">
              <View className="flex-row space-x-1">
                <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Message Input */}
      <View className="flex-row items-end p-4 border-t border-gray-200">
        {/* Attachment Buttons */}
        <View className="flex-row space-x-2 mr-3">
          <Button
            onPress={sendImage}
            variant="ghost"
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <Ionicons name="camera" size={20} color="#6B7280" />
          </Button>
          
          <Button
            onPress={sendLocation}
            variant="ghost"
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <Ionicons name="location" size={20} color="#6B7280" />
          </Button>
        </View>

        {/* Text Input */}
        <View className="flex-1 flex-row items-end">
          <TextInput
            value={newMessage}
            onChangeText={handleTyping}
            placeholder={t('chat.placeholder', 'Napíšte správu...')}
            multiline
            maxLength={1000}
            className="flex-1 max-h-24 border border-gray-300 rounded-2xl px-4 py-2 text-gray-900 bg-white"
            textAlignVertical="top"
          />
          
          <Button
            onPress={() => sendMessage()}
            disabled={!newMessage.trim() || isSending}
            className={`
              ml-2 w-10 h-10 rounded-full items-center justify-center
              ${newMessage.trim() ? 'bg-blue-500' : 'bg-gray-300'}
            `}
          >
            <Ionicons 
              name={isSending ? "hourglass" : "send"} 
              size={20} 
              color="white" 
            />
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
