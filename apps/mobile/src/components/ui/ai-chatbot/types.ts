/**
 * 🤖 AI Chatbot Types
 * TypeScript definitions for the AI chatbot system
 */

export type MessageType = 'text' | 'image' | 'file' | 'location' | 'quick_action' | 'system';

export type AttachmentType = 'image' | 'document' | 'location' | 'voice';

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
  attachments?: Attachment[];
  quickActions?: QuickAction[];
  isTyping?: boolean;
  metadata?: Record<string, any>;
}

export interface Attachment {
  id: string;
  type: AttachmentType;
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface QuickAction {
  id: string;
  label: string;
  icon?: string;
  action: string;
  data?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  context: ChatContext;
  language: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatContext {
  userProfile?: {
    name?: string;
    email?: string;
    phone?: string;
    preferredLanguage?: string;
  };
  currentBooking?: {
    vehicleId?: string;
    dates?: {
      startDate: Date;
      endDate: Date;
    };
    location?: string;
  };
  conversationHistory: string[];
  intent?: string;
  entities?: Record<string, any>;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface AIResponse {
  message: string;
  quickActions?: QuickAction[];
  attachments?: Attachment[];
  intent?: string;
  confidence?: number;
  shouldEscalate?: boolean;
  metadata?: Record<string, any>;
}

export interface ChatbotConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  supportedLanguages: string[];
  escalationTriggers: string[];
}

export interface VoiceInputConfig {
  enabled: boolean;
  language: string;
  autoStart: boolean;
  maxDuration: number;
}

export interface FileUploadConfig {
  maxSize: number;
  allowedTypes: string[];
  maxFiles: number;
}
