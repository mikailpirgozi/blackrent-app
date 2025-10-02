/**
 * 🤖 Chat Input Component - Fixed Keyboard Handling
 * Modern input field with enhanced UX and proper keyboard management
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  Platform
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { theme } from '../../../styles/theme';
import { VoiceInput } from './voice-input';

interface ChatInputProps {
  onSendMessage: (text: string, attachments?: any[]) => void;
  placeholder?: string;
  language?: string;
}

export function ChatInput({ 
  onSendMessage, 
  placeholder = 'Napíšte správu...', 
  language = 'sk' 
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const focusAnim = useRef(new Animated.Value(0)).current;
  const sendButtonAnim = useRef(new Animated.Value(0)).current;

  const canSend = message.trim().length > 0 || attachments.length > 0;

  useEffect(() => {
    // Animate send button based on content
    Animated.spring(sendButtonAnim, {
      toValue: canSend ? 1 : 0,
      tension: 120,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [canSend]);

  useEffect(() => {
    // Focus animation
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  /**
   * Send message with haptic feedback
   */
  const handleSendMessage = () => {
    if (!canSend) return;

    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onSendMessage(message.trim(), attachments);
    setMessage('');
    setAttachments([]);
    
    // Keep focus on input to prevent chat from closing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    
    // Animate send button
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  /**
   * Handle image picker
   */
  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Povolenie potrebné',
          'Pre zdieľanie obrázkov potrebujeme prístup k vašej galérii.'
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
        const asset = result.assets[0];
        const attachment = {
          id: `img_${Date.now()}`,
          type: 'image',
          url: asset.uri,
          name: `image_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
          mimeType: 'image/jpeg'
        };

        setAttachments(prev => [...prev, attachment]);
        
        // Haptic feedback
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
            Alert.alert('Chyba', 'Nepodarilo sa vybrať obrázok.');
    }
  };

  /**
   * Handle document picker
   */
  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const attachment = {
          id: `doc_${Date.now()}`,
          type: 'document',
          url: asset.uri,
          name: asset.name,
          size: asset.size || 0,
          mimeType: asset.mimeType || 'application/octet-stream'
        };

        setAttachments(prev => [...prev, attachment]);
        
        // Haptic feedback
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
            Alert.alert('Chyba', 'Nepodarilo sa vybrať dokument.');
    }
  };

  /**
   * Handle voice input
   */
  const handleVoiceInput = (transcript: string) => {
    setMessage(transcript);
    setShowVoiceInput(false);
    inputRef.current?.focus();
  };

  /**
   * Remove attachment
   */
  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View
      style={{
        backgroundColor: theme.colors.systemBackground,
        borderTopWidth: 1,
        borderTopColor: theme.colors.separator,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20, // Safe area bottom
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 12,
      }}
    >
      {/* Enhanced Attachments preview */}
      {attachments.length > 0 && (
        <Animated.View
          style={{
            marginBottom: 16,
            opacity: sendButtonAnim,
            transform: [{
              translateY: sendButtonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              })
            }]
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {attachments.map((attachment) => (
              <View
                key={attachment.id}
                style={{
                  backgroundColor: theme.colors.secondarySystemFill,
                  borderRadius: 12,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  maxWidth: 180,
                  borderWidth: 1,
                  borderColor: theme.colors.tertiarySystemFill,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: theme.brand.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                  }}
                >
                  <Ionicons
                    name={attachment.type === 'image' ? 'image' : 'document'}
                    size={12}
                    color="white"
                  />
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    color: theme.colors.secondaryLabel,
                    flex: 1,
                    fontWeight: '500',
                  }}
                  numberOfLines={1}
                >
                  {attachment.name}
                </Text>
                <TouchableOpacity
                  onPress={() => removeAttachment(attachment.id)}
                  style={{ 
                    marginLeft: 6,
                    padding: 2,
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={theme.colors.tertiaryLabel}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Enhanced Input row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 12,
        }}
      >
        {/* Enhanced Attachment button */}
        <TouchableOpacity
          onPress={() => {
            // Haptic feedback
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            
            Alert.alert(
              'Priložiť súbor',
              'Vyberte typ súboru',
              [
                { text: 'Zrušiť', style: 'cancel' },
                { text: '📷 Obrázok', onPress: handleImagePicker },
                { text: '📄 Dokument', onPress: handleDocumentPicker },
              ]
            );
          }}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: theme.colors.secondarySystemFill,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: theme.colors.tertiarySystemFill,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="add"
            size={22}
            color={theme.colors.secondaryLabel}
          />
        </TouchableOpacity>

        {/* Enhanced Text input */}
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: theme.colors.secondarySystemFill,
            borderRadius: 24,
            minHeight: 48,
            maxHeight: 120,
            borderWidth: 1,
            borderColor: focusAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [theme.colors.tertiarySystemFill, theme.brand.primary],
            }),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
            transform: [{
              scale: focusAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.02],
              })
            }]
          }}
        >
          <TextInput
            ref={inputRef}
            value={message}
            onChangeText={setMessage}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.tertiaryLabel}
            multiline
            style={{
              fontSize: 16,
              color: theme.colors.label,
              lineHeight: 20,
              minHeight: 20,
              paddingHorizontal: 18,
              paddingVertical: 14,
              fontWeight: '400',
            }}
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
            blurOnSubmit={false}
            autoFocus={false}
            keyboardType="default"
            textContentType="none"
            autoCorrect={true}
            autoCapitalize="sentences"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            // Enhanced input handling
          />
        </Animated.View>

        {/* Enhanced Voice input button */}
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setShowVoiceInput(true);
          }}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: isRecording ? '#FF3B30' : theme.colors.secondarySystemFill,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: isRecording ? '#FF3B30' : theme.colors.tertiarySystemFill,
            shadowColor: isRecording ? '#FF3B30' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isRecording ? 0.3 : 0.05,
            shadowRadius: isRecording ? 8 : 4,
            elevation: isRecording ? 6 : 2,
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isRecording ? 'stop' : 'mic'}
            size={20}
            color={isRecording ? 'white' : theme.colors.secondaryLabel}
          />
        </TouchableOpacity>

        {/* Enhanced Send button */}
        <Animated.View 
          style={{ 
            transform: [
              { scale: Animated.multiply(scaleAnim, sendButtonAnim) },
            ],
            opacity: sendButtonAnim,
          }}
        >
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!canSend}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              shadowColor: canSend ? theme.brand.primary : 'transparent',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: canSend ? 6 : 0,
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={canSend ? 
                [theme.brand.primary, theme.brand.secondary || '#1E40AF'] : 
                [theme.colors.tertiarySystemFill, theme.colors.tertiarySystemFill]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 48,
                height: 48,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="send"
                size={20}
                color={canSend ? 'white' : theme.colors.tertiaryLabel}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Voice Input Modal */}
      {showVoiceInput && (
        <VoiceInput
          onTranscript={handleVoiceInput}
          onClose={() => setShowVoiceInput(false)}
          onRecordingChange={setIsRecording}
          language={language}
        />
      )}
    </View>
  );
}