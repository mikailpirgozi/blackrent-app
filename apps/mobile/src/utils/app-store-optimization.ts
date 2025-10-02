/**
 * 📱 App Store Optimization (ASO) Manager
 * Comprehensive ASO for iOS App Store and Google Play Store
 */

import { logger } from './logger';

interface ASOConfig {
  appName: string;
  shortDescription: string;
  fullDescription: string;
  keywords: string[];
  category: string;
  targetAudience: string[];
  supportedLanguages: string[];
  marketingUrl?: string;
  supportUrl?: string;
  privacyPolicyUrl?: string;
}

interface AppStoreMetadata {
  ios: {
    name: string;
    subtitle: string;
    description: string;
    keywords: string;
    marketingUrl?: string;
    supportUrl?: string;
    privacyPolicyUrl?: string;
    category: string;
    contentRating: string;
  };
  android: {
    title: string;
    shortDescription: string;
    fullDescription: string;
    category: string;
    contentRating: string;
    targetAudience: string;
  };
}

interface ASOAssets {
  appIcon: {
    ios: string[];
    android: string[];
  };
  screenshots: {
    ios: {
      iphone: string[];
      ipad: string[];
    };
    android: {
      phone: string[];
      tablet: string[];
    };
  };
  featureGraphic?: string;
  promoVideo?: string;
}

interface ASOAnalytics {
  keywordRankings: Array<{
    keyword: string;
    rank: number;
    difficulty: number;
    searchVolume: number;
  }>;
  competitorAnalysis: Array<{
    appName: string;
    keywords: string[];
    ranking: number;
    downloads: number;
  }>;
  conversionMetrics: {
    impressions: number;
    productPageViews: number;
    downloads: number;
    conversionRate: number;
  };
}

class AppStoreOptimizationManager {
  private config: ASOConfig;
  private metadata: AppStoreMetadata;
  private assets: ASOAssets;

  constructor(config: ASOConfig) {
    this.config = config;
    this.metadata = this.generateMetadata();
    this.assets = this.initializeAssets();
  }

  /**
   * Generate optimized metadata for both app stores
   */
  private generateMetadata(): AppStoreMetadata {
    return {
      ios: {
        name: this.optimizeAppName(this.config.appName, 'ios'),
        subtitle: this.generateSubtitle(),
        description: this.optimizeDescription(this.config.fullDescription, 'ios'),
        keywords: this.optimizeKeywords(this.config.keywords, 'ios'),
        marketingUrl: this.config.marketingUrl,
        supportUrl: this.config.supportUrl,
        privacyPolicyUrl: this.config.privacyPolicyUrl,
        category: this.mapCategory(this.config.category, 'ios'),
        contentRating: '4+',
      },
      android: {
        title: this.optimizeAppName(this.config.appName, 'android'),
        shortDescription: this.config.shortDescription,
        fullDescription: this.optimizeDescription(this.config.fullDescription, 'android'),
        category: this.mapCategory(this.config.category, 'android'),
        contentRating: 'Everyone',
        targetAudience: this.config.targetAudience.join(', '),
      },
    };
  }

  /**
   * Initialize ASO assets structure
   */
  private initializeAssets(): ASOAssets {
    return {
      appIcon: {
        ios: [
          'icon-20@2x.png', 'icon-20@3x.png',
          'icon-29@2x.png', 'icon-29@3x.png',
          'icon-40@2x.png', 'icon-40@3x.png',
          'icon-60@2x.png', 'icon-60@3x.png',
          'icon-76.png', 'icon-76@2x.png',
          'icon-83.5@2x.png', 'icon-1024.png'
        ],
        android: [
          'ic_launcher-48.png', 'ic_launcher-72.png',
          'ic_launcher-96.png', 'ic_launcher-144.png',
          'ic_launcher-192.png', 'ic_launcher-512.png'
        ],
      },
      screenshots: {
        ios: {
          iphone: [
            'iphone-6.5-1.png', 'iphone-6.5-2.png', 'iphone-6.5-3.png',
            'iphone-6.5-4.png', 'iphone-6.5-5.png'
          ],
          ipad: [
            'ipad-12.9-1.png', 'ipad-12.9-2.png', 'ipad-12.9-3.png'
          ],
        },
        android: {
          phone: [
            'phone-1.png', 'phone-2.png', 'phone-3.png',
            'phone-4.png', 'phone-5.png', 'phone-6.png',
            'phone-7.png', 'phone-8.png'
          ],
          tablet: [
            'tablet-1.png', 'tablet-2.png', 'tablet-3.png'
          ],
        },
      },
    };
  }

  /**
   * Optimize app name for specific platform
   */
  private optimizeAppName(name: string, platform: 'ios' | 'android'): string {
    const maxLength = platform === 'ios' ? 30 : 50;
    
    if (name.length <= maxLength) {
      return name;
    }

    // Truncate while preserving important keywords
    const keywords = this.config.keywords.slice(0, 2); // Top 2 keywords
    const shortName = name.split(' ')[0]; // First word
    
    return `${shortName} - ${keywords.join(' ')}`.substring(0, maxLength);
  }

  /**
   * Generate optimized subtitle for iOS
   */
  private generateSubtitle(): string {
    const topKeywords = this.config.keywords.slice(0, 3);
    return topKeywords.join(' • ').substring(0, 30);
  }

  /**
   * Optimize description for specific platform
   */
  private optimizeDescription(description: string, platform: 'ios' | 'android'): string {
    const maxLength = platform === 'ios' ? 4000 : 4000;
    
    // Add keyword optimization
    let optimizedDescription = description;
    
    // Ensure top keywords appear in first 160 characters (visible without "more")
    const topKeywords = this.config.keywords.slice(0, 5);
    const firstParagraph = optimizedDescription.split('\n')[0];
    
    if (!topKeywords.some(keyword => firstParagraph.toLowerCase().includes(keyword.toLowerCase()))) {
      const keywordPhrase = `Najlepšia ${topKeywords.slice(0, 2).join(' a ')} aplikácia.`;
      optimizedDescription = `${keywordPhrase} ${optimizedDescription}`;
    }

    return optimizedDescription.substring(0, maxLength);
  }

  /**
   * Optimize keywords for iOS App Store
   */
  private optimizeKeywords(keywords: string[], platform: 'ios' | 'android'): string {
    if (platform === 'android') {
      // Android uses keywords in description, not separate field
      return '';
    }

    // iOS keyword field is limited to 100 characters
    const maxLength = 100;
    let keywordString = '';
    
    // Sort keywords by priority/relevance
    const sortedKeywords = [...keywords].sort((a, b) => {
      // Prioritize shorter, more relevant keywords
      return a.length - b.length;
    });

    for (const keyword of sortedKeywords) {
      const newString = keywordString ? `${keywordString},${keyword}` : keyword;
      if (newString.length <= maxLength) {
        keywordString = newString;
      } else {
        break;
      }
    }

    return keywordString;
  }

  /**
   * Map category to platform-specific categories
   */
  private mapCategory(category: string, platform: 'ios' | 'android'): string {
    const categoryMap = {
      ios: {
        'travel': 'Travel',
        'business': 'Business',
        'lifestyle': 'Lifestyle',
        'productivity': 'Productivity',
      },
      android: {
        'travel': 'TRAVEL_AND_LOCAL',
        'business': 'BUSINESS',
        'lifestyle': 'LIFESTYLE',
        'productivity': 'PRODUCTIVITY',
      },
    };

    return (categoryMap[platform] as any)[category.toLowerCase()] || category;
  }

  /**
   * Generate App Store Connect metadata
   */
  generateAppStoreMetadata(): any {
    return {
      name: this.metadata.ios.name,
      subtitle: this.metadata.ios.subtitle,
      description: this.metadata.ios.description,
      keywords: this.metadata.ios.keywords,
      marketingUrl: this.metadata.ios.marketingUrl,
      supportUrl: this.metadata.ios.supportUrl,
      privacyPolicyUrl: this.metadata.ios.privacyPolicyUrl,
      category: this.metadata.ios.category,
      contentRating: this.metadata.ios.contentRating,
      
      // Localization
      localizations: this.generateLocalizations('ios'),
      
      // App Review Information
      reviewInformation: {
        firstName: 'BlackRent',
        lastName: 'Team',
        phoneNumber: '+421 XXX XXX XXX',
        emailAddress: 'support@blackrent.sk',
        demoAccountName: 'demo@blackrent.sk',
        demoAccountPassword: 'Demo123!',
        notes: 'Aplikácia pre prenájom vozidiel na Slovensku. Demo účet obsahuje testovací obsah.',
      },
    };
  }

  /**
   * Generate Google Play Console metadata
   */
  generatePlayStoreMetadata(): any {
    return {
      title: this.metadata.android.title,
      shortDescription: this.metadata.android.shortDescription,
      fullDescription: this.metadata.android.fullDescription,
      category: this.metadata.android.category,
      contentRating: this.metadata.android.contentRating,
      targetAudience: this.metadata.android.targetAudience,
      
      // Localization
      localizations: this.generateLocalizations('android'),
      
      // Store Listing
      storeListing: {
        contactDetails: {
          contactEmail: 'support@blackrent.sk',
          contactPhone: '+421 XXX XXX XXX',
          contactWebsite: 'https://blackrent.sk',
        },
        privacyPolicy: this.config.privacyPolicyUrl,
      },
    };
  }

  /**
   * Generate localizations for different languages
   */
  private generateLocalizations(platform: 'ios' | 'android'): any {
    const localizations: any = {};
    
    const supportedLocales = {
      'sk': 'sk-SK', // Slovak
      'cs': 'cs-CZ', // Czech
      'de': 'de-DE', // German
      'hu': 'hu-HU', // Hungarian
      'en': 'en-US', // English
    };

    Object.entries(supportedLocales).forEach(([lang, locale]) => {
      localizations[locale] = this.generateLocalizedContent(lang, platform);
    });

    return localizations;
  }

  /**
   * Generate localized content for specific language
   */
  private generateLocalizedContent(language: string, platform: 'ios' | 'android'): any {
    const content = {
      sk: {
        name: 'BlackRent - Prenájom Áut',
        subtitle: 'Najlepší prenájom vozidiel',
        description: 'Najlepšia aplikácia pre prenájom vozidiel na Slovensku. Jednoducho si prenajmite auto, dodávku alebo luxusné vozidlo priamo cez aplikáciu.',
        keywords: 'prenájom áut,autopožičovňa,vozidlá,blackrent',
      },
      cs: {
        name: 'BlackRent - Půjčovna Aut',
        subtitle: 'Nejlepší pronájem vozidel',
        description: 'Nejlepší aplikace pro pronájem vozidel v České republice. Jednoduše si pronajměte auto, dodávku nebo luxusní vozidlo přímo přes aplikaci.',
        keywords: 'pronájem aut,autopůjčovna,vozidla,blackrent',
      },
      de: {
        name: 'BlackRent - Autovermietung',
        subtitle: 'Beste Fahrzeugvermietung',
        description: 'Die beste App für Fahrzeugvermietung in Deutschland und Österreich. Mieten Sie einfach ein Auto, Transporter oder Luxusfahrzeug direkt über die App.',
        keywords: 'autovermietung,mietwagen,fahrzeuge,blackrent',
      },
      hu: {
        name: 'BlackRent - Autókölcsönzés',
        subtitle: 'Legjobb járműkölcsönzés',
        description: 'A legjobb alkalmazás járműkölcsönzéshez Magyarországon. Egyszerűen béreljen autót, kisteherautót vagy luxusjárművet közvetlenül az alkalmazáson keresztül.',
        keywords: 'autókölcsönzés,járműbérlés,járművek,blackrent',
      },
      en: {
        name: 'BlackRent - Car Rental',
        subtitle: 'Best Vehicle Rental',
        description: 'The best car rental app in Central Europe. Easily rent a car, van, or luxury vehicle directly through the app.',
        keywords: 'car rental,vehicle rental,cars,blackrent',
      },
    };

    const langContent = content[language as keyof typeof content] || content.en;

    if (platform === 'ios') {
      return {
        name: langContent.name,
        subtitle: langContent.subtitle,
        description: langContent.description,
        keywords: langContent.keywords,
      };
    } else {
      return {
        title: langContent.name,
        shortDescription: langContent.subtitle,
        fullDescription: langContent.description,
      };
    }
  }

  /**
   * Generate screenshot requirements and guidelines
   */
  generateScreenshotGuidelines(): any {
    return {
      ios: {
        requirements: {
          'iPhone 6.7"': { width: 1290, height: 2796, count: '3-10' },
          'iPhone 6.5"': { width: 1242, height: 2688, count: '3-10' },
          'iPhone 5.5"': { width: 1242, height: 2208, count: '3-10' },
          'iPad Pro 12.9"': { width: 2048, height: 2732, count: '3-10' },
          'iPad Pro 11"': { width: 1668, height: 2388, count: '3-10' },
        },
        guidelines: [
          'Use high-quality screenshots that showcase key features',
          'Include captions and annotations to highlight benefits',
          'Show the app in use with realistic content',
          'Use consistent branding and color scheme',
          'Optimize for both light and dark modes',
        ],
        recommended_screenshots: [
          'Homepage with search functionality',
          'Vehicle catalog with filters',
          'Vehicle detail page with booking',
          'Booking confirmation and payment',
          'User profile and booking history',
        ],
      },
      android: {
        requirements: {
          'Phone': { width: 1080, height: 1920, count: '2-8' },
          'Tablet 7"': { width: 1200, height: 1920, count: '1-8' },
          'Tablet 10"': { width: 1800, height: 2560, count: '1-8' },
        },
        guidelines: [
          'Use high-quality screenshots that showcase key features',
          'Include feature graphics (1024x500)',
          'Show the app in use with realistic content',
          'Use consistent branding and color scheme',
          'Consider creating a promo video',
        ],
        recommended_screenshots: [
          'Homepage with hero section',
          'Advanced search and filters',
          'Vehicle details and gallery',
          'Booking flow and payment',
          'Profile and settings',
          'Admin dashboard (if applicable)',
        ],
      },
    };
  }

  /**
   * Generate ASO checklist
   */
  generateASOChecklist(): any {
    return {
      metadata: [
        { task: 'Optimize app name with primary keywords', completed: false },
        { task: 'Create compelling subtitle/short description', completed: false },
        { task: 'Write keyword-optimized full description', completed: false },
        { task: 'Research and select optimal keywords', completed: false },
        { task: 'Set appropriate category and content rating', completed: false },
        { task: 'Add support and privacy policy URLs', completed: false },
      ],
      assets: [
        { task: 'Design app icon for all required sizes', completed: false },
        { task: 'Create screenshots for all device types', completed: false },
        { task: 'Design feature graphic (Android)', completed: false },
        { task: 'Create app preview video (optional)', completed: false },
        { task: 'Optimize all images for app stores', completed: false },
      ],
      localization: [
        { task: 'Translate metadata to target languages', completed: false },
        { task: 'Localize screenshots with text', completed: false },
        { task: 'Review cultural appropriateness', completed: false },
        { task: 'Test app in all supported languages', completed: false },
      ],
      compliance: [
        { task: 'Review App Store guidelines compliance', completed: false },
        { task: 'Review Google Play policies compliance', completed: false },
        { task: 'Prepare app review information', completed: false },
        { task: 'Set up analytics and tracking', completed: false },
        { task: 'Configure crash reporting', completed: false },
      ],
      launch: [
        { task: 'Plan soft launch strategy', completed: false },
        { task: 'Prepare press kit and materials', completed: false },
        { task: 'Set up app store optimization monitoring', completed: false },
        { task: 'Plan post-launch ASO iterations', completed: false },
      ],
    };
  }

  /**
   * Analyze keyword performance
   */
  analyzeKeywords(analytics: ASOAnalytics): any {
    const keywordAnalysis = analytics.keywordRankings.map(keyword => {
      let recommendation = '';
      
      if (keyword.rank > 50) {
        recommendation = 'Consider replacing with lower difficulty keywords';
      } else if (keyword.rank > 20) {
        recommendation = 'Optimize content to improve ranking';
      } else if (keyword.rank <= 10) {
        recommendation = 'Maintain current optimization';
      }

      return {
        ...keyword,
        recommendation,
        priority: keyword.searchVolume > 1000 ? 'high' : keyword.searchVolume > 100 ? 'medium' : 'low',
      };
    });

    return {
      keywords: keywordAnalysis,
      summary: {
        totalKeywords: keywordAnalysis.length,
        topRankings: keywordAnalysis.filter(k => k.rank <= 10).length,
        needsImprovement: keywordAnalysis.filter(k => k.rank > 20).length,
        averageRank: keywordAnalysis.reduce((sum, k) => sum + k.rank, 0) / keywordAnalysis.length,
      },
    };
  }

  /**
   * Generate ASO report
   */
  generateASOReport(): any {
    return {
      metadata: {
        ios: this.metadata.ios,
        android: this.metadata.android,
      },
      assets: this.assets,
      checklist: this.generateASOChecklist(),
      guidelines: this.generateScreenshotGuidelines(),
      recommendations: [
        'Focus on primary keywords in app name and subtitle',
        'Use high-quality screenshots with clear value propositions',
        'Localize for all target markets',
        'Monitor and iterate based on performance data',
        'A/B test different metadata variations',
      ],
    };
  }

  /**
   * Update ASO configuration
   */
  updateConfig(newConfig: Partial<ASOConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.metadata = this.generateMetadata();
    logger.debug('ASO configuration updated', newConfig);
  }

  /**
   * Get current ASO status
   */
  getStatus(): {
    config: ASOConfig;
    metadata: AppStoreMetadata;
    assets: ASOAssets;
  } {
    return {
      config: { ...this.config },
      metadata: { ...this.metadata },
      assets: { ...this.assets },
    };
  }
}

// Default BlackRent ASO configuration
const defaultASOConfig: ASOConfig = {
  appName: 'BlackRent - Prenájom Áut',
  shortDescription: 'Najlepšia aplikácia pre prenájom vozidiel na Slovensku',
  fullDescription: `🚗 BlackRent - Najlepšia aplikácia pre prenájom vozidiel

Hľadáte spoľahlivý prenájom áut? BlackRent je vaša najlepšia voľba! Naša aplikácia vám umožňuje jednoducho a rýchlo si prenajať vozidlo priamo z vášho telefónu.

🌟 KĽÚČOVÉ FUNKCIE:
• Široký výber vozidiel - od ekonomických áut po luxusné vozidlá
• Jednoduché vyhľadávanie s pokročilými filtrami
• Okamžité rezervácie s potvrdením
• Bezpečné platby cez aplikáciu
• 24/7 zákaznícka podpora
• GPS navigácia k vozidlu
• Digitálne zmluvy a protokoly

🚙 TYPY VOZIDIEL:
• Osobné autá (Economy, Comfort, Premium)
• SUV a terénne vozidlá
• Dodávky a úžitkové vozidlá
• Luxusné a športové autá
• Elektrické vozidlá

💳 PLATBY A CENY:
• Transparentné ceny bez skrytých poplatkov
• Flexibilné platobné možnosti
• Zľavy pre dlhodobé prenájmy
• Vernostný program s bonusmi

🔒 BEZPEČNOSŤ:
• Všetky vozidlá sú pravidelne kontrolované
• Komplexné poistenie
• Overení partneri a autopožičovne
• Bezpečné spracovanie osobných údajov

📱 JEDNODUCHÉ POUŽÍVANIE:
1. Vyberte si vozidlo a termín
2. Vyplňte potrebné údaje
3. Potvrďte rezerváciu
4. Prevezmiete vozidlo na dohodnutom mieste

Stiahnite si BlackRent už dnes a zažite budúcnosť prenájmu vozidiel!`,
  keywords: [
    'prenájom áut', 'autopožičovňa', 'blackrent', 'vozidlá', 'auto',
    'prenájom', 'rezervácia', 'booking', 'car rental', 'slovensko',
    'bratislava', 'košice', 'žilina', 'prešov', 'banská bystrica',
    'luxusné autá', 'suv', 'dodávky', 'elektrické autá'
  ],
  category: 'travel',
  targetAudience: ['18-65', 'business travelers', 'tourists', 'locals'],
  supportedLanguages: ['sk', 'cs', 'de', 'hu', 'en'],
  marketingUrl: 'https://blackrent.sk',
  supportUrl: 'https://blackrent.sk/support',
  privacyPolicyUrl: 'https://blackrent.sk/privacy',
};

// Global ASO manager instance
export const asoManager = new AppStoreOptimizationManager(defaultASOConfig);

export { AppStoreOptimizationManager };
export type { ASOConfig, AppStoreMetadata, ASOAssets, ASOAnalytics };
