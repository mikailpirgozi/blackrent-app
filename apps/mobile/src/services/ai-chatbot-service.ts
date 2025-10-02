/**
 * 🤖 AI Chatbot Service
 * OpenAI GPT-4 integration with BlackRent knowledge base
 */

import { ChatMessage, AIResponse, ChatContext, ChatSession } from '../components/ui/ai-chatbot/types';

export class AIChatbotService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private systemPrompt: string;

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
    this.baseUrl = 'https://api.openai.com/v1';
    this.model = 'gpt-4o-mini';
    this.systemPrompt = this.getSystemPrompt();
  }

  /**
   * Send message to AI and get response
   */
  async sendMessage(
    message: string,
    context: ChatContext,
    language: string = 'sk'
  ): Promise<AIResponse> {
    try {
      // Add delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: this.getLocalizedSystemPrompt(language)
            },
            {
              role: 'user',
              content: this.buildContextualMessage(message, context)
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
          presence_penalty: 0.1,
          frequency_penalty: 0.1
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limit exceeded - wait and retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          throw new Error(`OpenAI API rate limit exceeded. Please try again in a moment.`);
        }
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = data.choices[0]?.message?.content || 'Prepáčte, nerozumiem vašej otázke.';

      return this.parseAIResponse(aiMessage, context);
    } catch (error) {
            return this.getFallbackResponse(language);
    }
  }

  /**
   * Analyze user intent and extract entities
   */
  async analyzeIntent(message: string, language: string = 'sk'): Promise<{
    intent: string;
    entities: Record<string, any>;
    confidence: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: this.getIntentAnalysisPrompt(language)
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.3,
          max_tokens: 200
        })
      });

      const data = await response.json();
      const analysis = data.choices[0]?.message?.content;
      
      return this.parseIntentAnalysis(analysis);
    } catch (error) {
            return {
        intent: 'unknown',
        entities: {},
        confidence: 0
      };
    }
  }

  /**
   * Get system prompt with BlackRent knowledge
   */
  private getSystemPrompt(): string {
    return `
Ste AI asistent pre BlackRent - najlepšiu mobilnú aplikáciu na prenájom áut na Slovensku.

VAŠA ÚLOHA:
- Poskytovať 24/7 podporu zákazníkom v slovenčine, češtine, nemčine a maďarčine
- Pomáhať s rezerváciami, platbami a všetkými funkciami aplikácie
- Odporučovať vozidlá na základe potrieb zákazníka
- Riešiť problémy a odpovedať na otázky

BLACKRENT FUNKCIONALITA:
1. VYHĽADÁVANIE & REZERVÁCIE:
   - Pokročilé vyhľadávanie s Google Maps
   - Real-time dostupnosť vozidiel
   - Ultra-fast booking (2 kroky pre registrovaných)
   - Biometrická autentifikácia
   - Digitálne podpisy a SMS verifikácia

2. VOZIDLÁ & CENY:
   - 7 cenových hladín (24h, 2-3d, 4-7d, 8-14d, 15-23d, 24-30d, 31+)
   - Kategórie: Luxury, SUV, Economy, Sports
   - Dovoz vozidiel s automatickým výpočtom
   - Povolené km a taxa za prekročenie
   - Depozit a poistenie

3. PLATBY & DOKUMENTY:
   - Stripe platby s 3D Secure
   - Automatické PDF zmluvy
   - Faktúry a dokumenty
   - 100% garancia vrátenia depozitu

4. PODPORA & BEZPEČNOSŤ:
   - 24/7 chat podpora
   - Emergency tlačidlo
   - GPS tracking (s súhlasom)
   - Biometrická bezpečnosť

KOMUNIKAČNÝ ŠTÝL:
- Priateľský a profesionálny
- Stručný ale informatívny
- Používajte emojis pre lepší UX
- Vždy ponúknite konkrétnu pomoc
- Pri zložitých problémoch eskalujte na ľudskú podporu

JAZYKY:
- Slovenčina (primárny)
- Čeština (Česko)
- Nemčina (Rakúsko) 
- Maďarčina (Maďarsko)
- Angličtina (medzinárodná)
`;
  }

  /**
   * Get localized system prompt
   */
  private getLocalizedSystemPrompt(language: string): string {
    const basePrompt = this.getSystemPrompt();
    
    const languageInstructions = {
      'sk': 'Odpovedajte v slovenčine.',
      'cs': 'Odpovídejte v češtině.',
      'de': 'Antworten Sie auf Deutsch.',
      'hu': 'Válaszoljon magyarul.',
      'en': 'Respond in English.'
    };

    return `${basePrompt}\n\nJAZYK: ${languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.sk}`;
  }

  /**
   * Build contextual message with user data
   */
  private buildContextualMessage(message: string, context: ChatContext): string {
    let contextualMessage = message;

    if (context.userProfile) {
      contextualMessage += `\n\nKONTEXT POUŽÍVATEĽA:`;
      if (context.userProfile.name) {
        contextualMessage += `\n- Meno: ${context.userProfile.name}`;
      }
      if (context.userProfile.preferredLanguage) {
        contextualMessage += `\n- Preferovaný jazyk: ${context.userProfile.preferredLanguage}`;
      }
    }

    if (context.currentBooking) {
      contextualMessage += `\n\nAKTUÁLNA REZERVÁCIA:`;
      if (context.currentBooking.vehicleId) {
        contextualMessage += `\n- ID vozidla: ${context.currentBooking.vehicleId}`;
      }
      if (context.currentBooking.dates) {
        contextualMessage += `\n- Dátumy: ${context.currentBooking.dates.startDate.toLocaleDateString()} - ${context.currentBooking.dates.endDate.toLocaleDateString()}`;
      }
      if (context.currentBooking.location) {
        contextualMessage += `\n- Lokácia: ${context.currentBooking.location}`;
      }
    }

    if (context.conversationHistory.length > 0) {
      contextualMessage += `\n\nHISTÓRIA KONVERZÁCIE:\n${context.conversationHistory.slice(-3).join('\n')}`;
    }

    return contextualMessage;
  }

  /**
   * Parse AI response and extract quick actions
   */
  private parseAIResponse(aiMessage: string, context: ChatContext): AIResponse {
    // Extract quick actions from AI response
    const quickActions = this.extractQuickActions(aiMessage, context);
    
    // Clean message from action markers
    const cleanMessage = aiMessage.replace(/\[ACTION:.*?\]/g, '').trim();

    // Determine if escalation is needed
    const shouldEscalate = this.shouldEscalateToHuman(aiMessage, context);

    return {
      message: cleanMessage,
      quickActions,
      shouldEscalate,
      confidence: 0.85,
      metadata: {
        model: this.model,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Extract quick actions from AI response
   */
  private extractQuickActions(message: string, context: ChatContext): any[] {
    const actions = [];

    // Common quick actions based on context
    if (message.includes('rezervácia') || message.includes('booking')) {
      actions.push({
        id: 'start_booking',
        label: '🚗 Začať rezerváciu',
        action: 'navigate_to_booking',
        data: { screen: 'booking' }
      });
    }

    if (message.includes('vozidl') || message.includes('auto')) {
      actions.push({
        id: 'browse_vehicles',
        label: '🔍 Prehliadať vozidlá',
        action: 'navigate_to_catalog',
        data: { screen: 'catalog' }
      });
    }

    if (message.includes('cena') || message.includes('price')) {
      actions.push({
        id: 'check_prices',
        label: '💰 Zobraziť ceny',
        action: 'show_pricing',
        data: { type: 'pricing' }
      });
    }

    if (message.includes('pomoc') || message.includes('help')) {
      actions.push({
        id: 'human_support',
        label: '👨‍💼 Ľudská podpora',
        action: 'escalate_to_human',
        data: { urgent: false }
      });
    }

    return actions;
  }

  /**
   * Check if conversation should be escalated to human support
   */
  private shouldEscalateToHuman(message: string, context: ChatContext): boolean {
    const escalationTriggers = [
      'ľudsk',
      'human',
      'operátor',
      'complaint',
      'stažnosť',
      'problém',
      'nefunguje',
      'chyba',
      'error',
      'urgent',
      'naliehavé'
    ];

    return escalationTriggers.some(trigger => 
      message.toLowerCase().includes(trigger.toLowerCase())
    );
  }

  /**
   * Get intent analysis prompt
   */
  private getIntentAnalysisPrompt(language: string): string {
    return `
Analyzujte zámer používateľa a extrahujte entity z jeho správy.

Možné zámery:
- booking_inquiry (otázky o rezervácii)
- vehicle_search (hľadanie vozidla)
- pricing_question (otázky o cenách)
- support_request (žiadosť o podporu)
- account_help (pomoc s účtom)
- general_info (všeobecné informácie)
- complaint (sťažnosť)
- emergency (núdzová situácia)

Odpovedzte vo formáte JSON:
{
  "intent": "názov_zámeru",
  "entities": {
    "location": "lokácia ak je spomenutá",
    "dates": "dátumy ak sú spomenuté",
    "vehicle_type": "typ vozidla ak je spomenutý",
    "price_range": "cenové rozpätie ak je spomenuté"
  },
  "confidence": 0.0-1.0
}
`;
  }

  /**
   * Parse intent analysis response
   */
  private parseIntentAnalysis(analysis: string): {
    intent: string;
    entities: Record<string, any>;
    confidence: number;
  } {
    try {
      const parsed = JSON.parse(analysis);
      return {
        intent: parsed.intent || 'unknown',
        entities: parsed.entities || {},
        confidence: parsed.confidence || 0.5
      };
    } catch (error) {
      return {
        intent: 'unknown',
        entities: {},
        confidence: 0
      };
    }
  }

  /**
   * Get fallback response when AI fails
   */
  private getFallbackResponse(language: string = 'sk'): AIResponse {
    const fallbackMessages = {
      'sk': 'Prepáčte, momentálne mám technické problémy. Môžem vás prepojiť s našou ľudskou podporou?',
      'cs': 'Omlouvám se, momentálně mám technické problémy. Mohu vás spojit s naší lidskou podporou?',
      'de': 'Entschuldigung, ich habe momentan technische Probleme. Kann ich Sie mit unserem menschlichen Support verbinden?',
      'hu': 'Elnézést, jelenleg technikai problémáim vannak. Összekapcsolhatom Önt emberi ügyfélszolgálatunkkal?',
      'en': 'Sorry, I\'m experiencing technical difficulties. Can I connect you with our human support?'
    };

    return {
      message: fallbackMessages[language as keyof typeof fallbackMessages] || fallbackMessages.sk,
      quickActions: [
        {
          id: 'human_support',
          label: '👨‍💼 Ľudská podpora',
          action: 'escalate_to_human',
          data: { urgent: true }
        }
      ],
      shouldEscalate: true,
      confidence: 1.0
    };
  }

  /**
   * Save chat session to storage
   */
  async saveChatSession(session: ChatSession): Promise<void> {
    try {
      // In a real app, this would save to a database
      // For now, we'll use AsyncStorage
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.setItem(
        `chat_session_${session.id}`,
        JSON.stringify(session)
      );
    } catch (error) {
          }
  }

  /**
   * Load chat session from storage
   */
  async loadChatSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      const sessionData = await AsyncStorage.getItem(`chat_session_${sessionId}`);
      
      if (sessionData) {
        const session = JSON.parse(sessionData);
        // Convert date strings back to Date objects
        session.createdAt = new Date(session.createdAt);
        session.updatedAt = new Date(session.updatedAt);
        session.messages = session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        return session;
      }
      
      return null;
    } catch (error) {
            return null;
    }
  }
}

export const aiChatbotService = new AIChatbotService();
