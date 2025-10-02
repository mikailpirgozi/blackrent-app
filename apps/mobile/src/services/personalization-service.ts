/**
 * 🎯 Personalization Service
 * AI-powered recommendations and personalized content
 */

export interface UserPreferences {
  preferredVehicleTypes: string[];
  priceRange: { min: number; max: number };
  preferredBrands: string[];
  preferredFeatures: string[];
  preferredLocations: string[];
  bookingHistory: BookingHistoryItem[];
  searchHistory: SearchHistoryItem[];
  favoriteVehicles: string[];
  lastActivity: string;
}

export interface BookingHistoryItem {
  vehicleId: string;
  vehicleType: string;
  brand: string;
  model: string;
  pricePerDay: number;
  bookingDate: string;
  duration: number;
  rating?: number;
  location: string;
}

export interface SearchHistoryItem {
  query: string;
  filters: any;
  timestamp: string;
  clickedVehicles: string[];
}

export interface PersonalizedRecommendation {
  vehicleId: string;
  score: number;
  reasons: string[];
  type: 'similar_to_history' | 'price_match' | 'feature_match' | 'trending' | 'new_arrival';
}

export interface PersonalizedContent {
  heroMessage: string;
  recommendedVehicles: PersonalizedRecommendation[];
  personalizedOffers: PersonalizedOffer[];
  suggestedSearches: string[];
  priceAlerts: PriceAlert[];
}

export interface PersonalizedOffer {
  id: string;
  title: string;
  description: string;
  discount: number;
  validUntil: string;
  vehicleIds: string[];
  conditions: string[];
}

export interface PriceAlert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  currentPrice: number;
  targetPrice: number;
  priceChange: number;
  trend: 'up' | 'down' | 'stable';
}

class PersonalizationService {
  private baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/preferences`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
            return this.getDefaultPreferences();
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(preferences),
      });

      return response.ok;
    } catch (error) {
            return false;
    }
  }

  /**
   * Get personalized content for user
   */
  async getPersonalizedContent(userId: string): Promise<PersonalizedContent> {
    try {
      const preferences = await this.getUserPreferences(userId);
      const recommendations = await this.generateRecommendations(preferences);
      const offers = await this.getPersonalizedOffers(preferences);
      const priceAlerts = await this.getPriceAlerts(userId);

      return {
        heroMessage: this.generateHeroMessage(preferences),
        recommendedVehicles: recommendations,
        personalizedOffers: offers,
        suggestedSearches: this.generateSuggestedSearches(preferences),
        priceAlerts,
      };
    } catch (error) {
            return this.getDefaultContent();
    }
  }

  /**
   * Generate AI-powered vehicle recommendations
   */
  private async generateRecommendations(preferences: UserPreferences): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    // Algorithm 1: Similar to booking history
    if (preferences.bookingHistory.length > 0) {
      const recentBookings = preferences.bookingHistory
        .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
        .slice(0, 3);

      for (const booking of recentBookings) {
        // Find similar vehicles
        const similarVehicles = await this.findSimilarVehicles(booking);
        recommendations.push(...similarVehicles.map(vehicleId => ({
          vehicleId,
          score: 0.9,
          reasons: [`Podobné vozidlo ako ${booking.brand} ${booking.model}, ktoré ste si prenajali`],
          type: 'similar_to_history' as const,
        })));
      }
    }

    // Algorithm 2: Price range matching
    const priceMatchVehicles = await this.findVehiclesInPriceRange(preferences.priceRange);
    recommendations.push(...priceMatchVehicles.map(vehicleId => ({
      vehicleId,
      score: 0.7,
      reasons: [`V rámci vašej preferovanej cenovej kategórie €${preferences.priceRange.min}-${preferences.priceRange.max}`],
      type: 'price_match' as const,
    })));

    // Algorithm 3: Feature matching
    if (preferences.preferredFeatures.length > 0) {
      const featureMatchVehicles = await this.findVehiclesByFeatures(preferences.preferredFeatures);
      recommendations.push(...featureMatchVehicles.map(vehicleId => ({
        vehicleId,
        score: 0.8,
        reasons: [`Obsahuje vaše obľúbené vybavenie: ${preferences.preferredFeatures.join(', ')}`],
        type: 'feature_match' as const,
      })));
    }

    // Algorithm 4: Trending vehicles
    const trendingVehicles = await this.getTrendingVehicles();
    recommendations.push(...trendingVehicles.map(vehicleId => ({
      vehicleId,
      score: 0.6,
      reasons: ['Populárne medzi ostatnými používateľmi'],
      type: 'trending' as const,
    })));

    // Remove duplicates and sort by score
    const uniqueRecommendations = recommendations
      .filter((rec, index, self) => self.findIndex(r => r.vehicleId === rec.vehicleId) === index)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return uniqueRecommendations;
  }

  /**
   * Generate personalized hero message
   */
  private generateHeroMessage(preferences: UserPreferences): string {
    const messages = [
      'Vitajte späť! Máme pre vás nové vozidlá.',
      'Objavte vozidlá šité na mieru vašim potrebám.',
      'Vaše obľúbené vozidlá čakajú na rezerváciu.',
      'Nové ponuky v kategóriách, ktoré máte radi.',
    ];

    if (preferences.bookingHistory.length > 0) {
      const lastBooking = preferences.bookingHistory[0];
      return `Vitajte späť! Podobné vozidlá ako ${lastBooking.brand} ${lastBooking.model} sú k dispozícii.`;
    }

    if (preferences.preferredVehicleTypes.length > 0) {
      const types = preferences.preferredVehicleTypes.join(', ');
      return `Objavte najlepšie ${types} vozidlá v našej ponuke.`;
    }

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Generate suggested searches based on user behavior
   */
  private generateSuggestedSearches(preferences: UserPreferences): string[] {
    const suggestions: string[] = [];

    // Based on booking history
    if (preferences.bookingHistory.length > 0) {
      const popularBrands = this.getMostFrequentItems(
        preferences.bookingHistory.map(b => b.brand)
      );
      suggestions.push(...popularBrands.slice(0, 2));

      const popularTypes = this.getMostFrequentItems(
        preferences.bookingHistory.map(b => b.vehicleType)
      );
      suggestions.push(...popularTypes.slice(0, 2));
    }

    // Based on search history
    if (preferences.searchHistory.length > 0) {
      const recentSearches = preferences.searchHistory
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 3)
        .map(s => s.query);
      suggestions.push(...recentSearches);
    }

    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push('Luxusné vozidlá', 'SUV', 'Ekonomické vozidlá', 'Športové autá');
    }

    return [...new Set(suggestions)].slice(0, 4);
  }

  /**
   * Get personalized offers
   */
  private async getPersonalizedOffers(preferences: UserPreferences): Promise<PersonalizedOffer[]> {
    // Mock personalized offers based on user preferences
    const offers: PersonalizedOffer[] = [];

    if (preferences.bookingHistory.length >= 3) {
      offers.push({
        id: 'loyalty_discount',
        title: 'Vernostná zľava 15%',
        description: 'Špeciálna zľava pre našich stálych zákazníkov',
        discount: 15,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        vehicleIds: [],
        conditions: ['Platí pre rezervácie nad 3 dni'],
      });
    }

    if (preferences.preferredVehicleTypes.includes('luxury')) {
      offers.push({
        id: 'luxury_weekend',
        title: 'Luxusný víkend -20%',
        description: 'Zľava na luxusné vozidlá cez víkend',
        discount: 20,
        validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        vehicleIds: [],
        conditions: ['Platí len cez víkend', 'Minimálne 2 dni'],
      });
    }

    return offers;
  }

  /**
   * Get price alerts for user
   */
  private async getPriceAlerts(userId: string): Promise<PriceAlert[]> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/price-alerts`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      return await response.json();
    } catch (error) {
            return [];
    }
  }

  /**
   * Track user interaction for learning
   */
  async trackInteraction(userId: string, interaction: {
    type: 'view' | 'click' | 'book' | 'favorite' | 'search';
    vehicleId?: string;
    searchQuery?: string;
    timestamp: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/users/${userId}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(interaction),
      });
    } catch (error) {
          }
  }

  /**
   * Helper methods
   */
  private async findSimilarVehicles(booking: BookingHistoryItem): Promise<string[]> {
    // Mock implementation - in production, use ML similarity algorithm
    return ['vehicle-1', 'vehicle-2', 'vehicle-3'];
  }

  private async findVehiclesInPriceRange(priceRange: { min: number; max: number }): Promise<string[]> {
    // Mock implementation
    return ['vehicle-4', 'vehicle-5'];
  }

  private async findVehiclesByFeatures(features: string[]): Promise<string[]> {
    // Mock implementation
    return ['vehicle-6', 'vehicle-7'];
  }

  private async getTrendingVehicles(): Promise<string[]> {
    // Mock implementation
    return ['vehicle-8', 'vehicle-9'];
  }

  private getMostFrequentItems(items: string[]): string[] {
    const frequency: { [key: string]: number } = {};
    items.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .map(([item]) => item);
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      preferredVehicleTypes: [],
      priceRange: { min: 20, max: 200 },
      preferredBrands: [],
      preferredFeatures: [],
      preferredLocations: [],
      bookingHistory: [],
      searchHistory: [],
      favoriteVehicles: [],
      lastActivity: new Date().toISOString(),
    };
  }

  private getDefaultContent(): PersonalizedContent {
    return {
      heroMessage: 'Objavte najlepšie vozidlá pre vaše potreby',
      recommendedVehicles: [],
      personalizedOffers: [],
      suggestedSearches: ['Luxusné vozidlá', 'SUV', 'Ekonomické vozidlá', 'Športové autá'],
      priceAlerts: [],
    };
  }

  private async getAuthToken(): Promise<string> {
    // This would typically get the token from your auth store
    return 'mock-auth-token';
  }

  /**
   * Mock data for development
   */
  getMockPersonalizedContent(): PersonalizedContent {
    return {
      heroMessage: 'Vitajte späť, Marián! Máme pre vás nové BMW vozidlá.',
      recommendedVehicles: [
        {
          vehicleId: '1',
          score: 0.95,
          reasons: ['Podobné vozidlo ako BMW X5, ktoré ste si prenajali', 'V rámci vašej cenovej kategórie'],
          type: 'similar_to_history',
        },
        {
          vehicleId: '2',
          score: 0.88,
          reasons: ['Obsahuje vaše obľúbené vybavenie: GPS, Klimatizácia', 'Populárne medzi ostatnými'],
          type: 'feature_match',
        },
        {
          vehicleId: '3',
          score: 0.82,
          reasons: ['Nové vozidlo v kategórii SUV', 'Výborné hodnotenie zákazníkov'],
          type: 'new_arrival',
        },
      ],
      personalizedOffers: [
        {
          id: 'loyalty_discount',
          title: 'Vernostná zľava 15%',
          description: 'Špeciálna zľava pre našich stálych zákazníkov',
          discount: 15,
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          vehicleIds: ['1', '2', '3'],
          conditions: ['Platí pre rezervácie nad 3 dni', 'Kombinovateľné s inými zľavami'],
        },
        {
          id: 'weekend_special',
          title: 'Víkendová akcia -25%',
          description: 'Špeciálne ceny na víkendové prenájmy',
          discount: 25,
          validUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          vehicleIds: ['4', '5'],
          conditions: ['Platí len cez víkend', 'Minimálne 2 dni'],
        },
      ],
      suggestedSearches: ['BMW', 'SUV', 'Luxusné vozidlá', 'Bratislava'],
      priceAlerts: [
        {
          id: 'alert_1',
          vehicleId: '1',
          vehicleName: 'BMW X5',
          currentPrice: 85,
          targetPrice: 80,
          priceChange: -5,
          trend: 'down',
        },
        {
          id: 'alert_2',
          vehicleId: '2',
          vehicleName: 'Audi Q7',
          currentPrice: 95,
          targetPrice: 90,
          priceChange: 3,
          trend: 'up',
        },
      ],
    };
  }
}

export const personalizationService = new PersonalizationService();
