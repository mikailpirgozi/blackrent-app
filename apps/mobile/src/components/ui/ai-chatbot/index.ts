/**
 * 🤖 AI Chatbot Components
 * Intelligent 24/7 customer support with multi-language capabilities
 */

export { AIChatbot } from './ai-chatbot';
export { ChatMessage } from './chat-message';
export { QuickActions } from './quick-actions';
export { VoiceInput } from './voice-input';
export { ChatInput } from './chat-input';
export { ChatHeader } from './chat-header';
export { TypingIndicator } from './typing-indicator';
export { MessageBubble } from './message-bubble';
export { FileUpload } from './file-upload';
export { LocationPicker } from './location-picker';
export { ChatbotFAB } from './chatbot-fab';

export type {
  ChatMessage as ChatMessageType,
  ChatSession,
  AIResponse,
  QuickAction,
  ChatContext,
  MessageType,
  AttachmentType
} from './types';
