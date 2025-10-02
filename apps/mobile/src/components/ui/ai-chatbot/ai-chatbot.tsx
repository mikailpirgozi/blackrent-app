/**
 * 🤖 AI Chatbot Component - Full Screen Mobile Design
 * Intelligent 24/7 customer support with full screen mobile-first design
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Alert,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { BlurView } from 'expo-blur';
import { theme } from '../../../styles/theme';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { ChatHeader } from './chat-header';
import { QuickActions } from './quick-actions';
import { TypingIndicator } from './typing-indicator';
import { aiChatbotService } from '../../../services/ai-chatbot-service';
import { useTranslation } from '../../../hooks/use-translation';
import { useAuth } from '../../../hooks/use-auth';
import type {
  ChatMessage as ChatMessageType,
  ChatSession,
  ChatContext,
  AIResponse,
  QuickAction
} from './types';

interface AIChatbotProps {
  onClose?: () => void;
  initialMessage?: string;
  context?: Partial<ChatContext>;
  language?: string;
}

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export function AIChatbot({
  onClose,
  initialMessage,
  context = {},
  language = 'sk'
}: AIChatbotProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [chatContext, setChatContext] = useState<ChatContext>({
    userProfile: user ? {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone,
      preferredLanguage: language
    } : undefined,
    conversationHistory: [],
    ...context
  });

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  // Initialize chatbot
  useEffect(() => {
    initializeChatbot();
    showChatbot();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  /**
   * Initialize chatbot with welcome message
   */
  const initializeChatbot = useCallback(async () => {
    const welcomeMessage: ChatMessageType = {
      id: `msg_${Date.now()}`,
      type: 'text',
      content: getWelcomeMessage(language),
      sender: 'ai',
      timestamp: new Date(),
      quickActions: getWelcomeQuickActions()
    };

    setMessages([welcomeMessage]);

    // If there's an initial message, send it
    if (initialMessage) {
      setTimeout(() => {
        sendMessage(initialMessage);
      }, 1000);
    }

    // Load previous session if exists
    try {
      const previousSession = await aiChatbotService.loadChatSession(sessionId);
      if (previousSession && previousSession.messages.length > 1) {
        setMessages(previousSession.messages);
        setChatContext(previousSession.context);
      }
    } catch (error) {
          }
  }, [sessionId, language, initialMessage]);

  /**
   * Show chatbot with smooth animation
   */
  const showChatbot = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, slideAnim]);

  /**
   * Hide chatbot with smooth animation
   */
  const hideChatbot = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose?.();
    });
  }, [fadeAnim, slideAnim, onClose]);

  /**
   * Send message to AI
   */
  const sendMessage = useCallback(async (text: string, attachments?: any[]) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: ChatMessageType = {
      id: `msg_${Date.now()}_user`,
      type: 'text',
      content: text.trim(),
      sender: 'user',
      timestamp: new Date(),
      attachments
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Update conversation history
      const updatedContext = {
        ...chatContext,
        conversationHistory: [
          ...chatContext.conversationHistory,
          `User: ${text}`
        ].slice(-10) // Keep last 10 messages for context
      };

      // Send to AI service
      const aiResponse: AIResponse = await aiChatbotService.sendMessage(
        text,
        updatedContext,
        language
      );

      // Add AI response
      const aiMessage: ChatMessageType = {
        id: `msg_${Date.now()}_ai`,
        type: 'text',
        content: aiResponse.message,
        sender: 'ai',
        timestamp: new Date(),
        quickActions: aiResponse.quickActions,
        attachments: aiResponse.attachments
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update context with AI response
      const finalContext = {
        ...updatedContext,
        conversationHistory: [
          ...updatedContext.conversationHistory,
          `AI: ${aiResponse.message}`
        ].slice(-10),
        intent: aiResponse.intent,
        sentiment: aiResponse.metadata?.sentiment
      };

      setChatContext(finalContext);

      // Save session
      const session: ChatSession = {
        id: sessionId,
        userId: user?.id || 'anonymous',
        messages: [...messages, userMessage, aiMessage],
        context: finalContext,
        language,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await aiChatbotService.saveChatSession(session);

      // Handle escalation to human support
      if (aiResponse.shouldEscalate) {
        setTimeout(() => {
          handleEscalationToHuman();
        }, 2000);
      }

    } catch (error) {
            
      // Add error message
      const errorMessage: ChatMessageType = {
        id: `msg_${Date.now()}_error`,
        type: 'text',
        content: getErrorMessage(language),
        sender: 'system',
        timestamp: new Date(),
        quickActions: [{
          id: 'retry',
          label: '🔄 Skúsiť znovu',
          action: 'retry_message',
          data: { originalMessage: text }
        }]
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [chatContext, language, sessionId, user, messages]);

  /**
   * Handle quick action selection
   */
  const handleQuickAction = useCallback(async (action: QuickAction) => {
    switch (action.action) {
      case 'navigate_to_booking':
        Alert.alert('Navigácia', 'Presmerovanie na rezerváciu...');
        break;

      case 'navigate_to_catalog':
        Alert.alert('Navigácia', 'Presmerovanie na katalóg...');
        break;

      case 'show_pricing':
        await sendMessage('Zobrazte mi informácie o cenách vozidiel');
        break;

      case 'escalate_to_human':
        handleEscalationToHuman();
        break;

      case 'retry_message':
        if (action.data?.originalMessage) {
          await sendMessage(action.data.originalMessage);
        }
        break;

      default:
        await sendMessage(action.label);
        break;
    }
  }, [sendMessage]);

  /**
   * Handle escalation to human support
   */
  const handleEscalationToHuman = useCallback(() => {
    Alert.alert(
      'Ľudská podpora',
      'Chcete sa spojiť s našou ľudskou podporou? Operátor vám bude k dispozícii do 5 minút.',
      [
        {
          text: 'Zrušiť',
          style: 'cancel'
        },
        {
          text: 'Áno, spojiť',
          onPress: () => {
            const escalationMessage: ChatMessageType = {
              id: `msg_${Date.now()}_escalation`,
              type: 'system',
              content: '👨‍💼 Spájam vás s ľudskou podporou. Operátor bude s vami do 5 minút.',
              sender: 'system',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, escalationMessage]);
          }
        }
      ]
    );
  }, []);

  /**
   * Get welcome message based on language
   */
  const getWelcomeMessage = (lang: string): string => {
    const messages = {
      'sk': '👋 Ahoj! Som BlackRent AI asistent. Som tu 24/7 aby som vám pomohol s rezerváciami, otázkami o vozidlách a všetkým čo potrebujete. Ako vám môžem pomôcť?',
      'cs': '👋 Ahoj! Jsem BlackRent AI asistent. Jsem tu 24/7, abych vám pomohl s rezervacemi, otázkami o vozidlech a vším, co potřebujete. Jak vám mohu pomoci?',
      'de': '👋 Hallo! Ich bin der BlackRent AI-Assistent. Ich bin 24/7 hier, um Ihnen bei Buchungen, Fahrzeugfragen und allem, was Sie brauchen, zu helfen. Wie kann ich Ihnen helfen?',
      'hu': '👋 Szia! BlackRent AI asszisztens vagyok. 24/7 itt vagyok, hogy segítsek a foglalásokban, járműkérdésekben és mindenben, amire szüksége van. Hogyan segíthetek?',
      'en': '👋 Hello! I\'m the BlackRent AI assistant. I\'m here 24/7 to help you with bookings, vehicle questions, and everything you need. How can I help you?'
    };

    return messages[lang as keyof typeof messages] || messages.sk;
  };

  /**
   * Get welcome quick actions
   */
  const getWelcomeQuickActions = (): QuickAction[] => [
    {
      id: 'booking_help',
      label: '🚗 Pomoc s rezerváciou',
      action: 'show_booking_help'
    },
    {
      id: 'vehicle_info',
      label: '📋 Info o vozidlách',
      action: 'show_vehicle_info'
    },
    {
      id: 'pricing',
      label: '💰 Cenník',
      action: 'show_pricing'
    },
    {
      id: 'contact',
      label: '📞 Kontakt',
      action: 'show_contact'
    }
  ];

  /**
   * Get error message based on language
   */
  const getErrorMessage = (lang: string): string => {
    const messages = {
      'sk': '😔 Prepáčte, vyskytla sa chyba. Skúste to prosím znovu alebo sa spojte s našou podporou.',
      'cs': '😔 Omlouvám se, vyskytla se chyba. Zkuste to prosím znovu nebo se spojte s naší podporou.',
      'de': '😔 Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie unseren Support.',
      'hu': '😔 Elnézést, hiba történt. Kérjük, próbálja újra, vagy lépjen kapcsolatba ügyfélszolgálatunkkal.',
      'en': '😔 Sorry, an error occurred. Please try again or contact our support.'
    };

    return messages[lang as keyof typeof messages] || messages.sk;
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme.brand.primary} />
      
      {/* Full Screen Chat Container */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.systemBackground,
          zIndex: 1000,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            {/* Header */}
            <ChatHeader
              onClose={hideChatbot}
              onEscalate={handleEscalationToHuman}
              language={language}
            />

            {/* Messages Container - Full Screen */}
            <View style={{ 
              flex: 1, 
              backgroundColor: '#F8F9FA'
            }}>
              <ScrollView
                ref={scrollViewRef}
                style={{ flex: 1 }}
                contentContainerStyle={{
                  paddingTop: 16,
                  paddingHorizontal: 16,
                  paddingBottom: 20,
                  flexGrow: 1,
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={true}
                alwaysBounceVertical={false}
              >
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onQuickAction={handleQuickAction}
                    isFirstMessage={index === 0}
                    isLastMessage={index === messages.length - 1}
                  />
                ))}

                {isTyping && <TypingIndicator />}
                
                {/* Bottom spacing for better UX */}
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>

            {/* Input - Fixed at bottom */}
            <ChatInput
              onSendMessage={sendMessage}
              placeholder={t('chatbot.placeholder', 'Napíšte správu...')}
              language={language}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}