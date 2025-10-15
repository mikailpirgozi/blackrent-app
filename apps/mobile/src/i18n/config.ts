/**
 * i18next Configuration
 * Enterprise-grade multi-language setup with namespace support
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGUAGES, STORAGE_KEYS } from '../config/constants';

// Import translations
import sk_common from './locales/sk/common.json';
import sk_catalog from './locales/sk/catalog.json';
import sk_vehicle from './locales/sk/vehicle.json';
import sk_auth from './locales/sk/auth.json';
import sk_booking from './locales/sk/booking.json';
import sk_protocol from './locales/sk/protocol.json';
import en_common from './locales/en/common.json';
import en_catalog from './locales/en/catalog.json';
import en_vehicle from './locales/en/vehicle.json';
import en_auth from './locales/en/auth.json';
import en_booking from './locales/en/booking.json';
import en_protocol from './locales/en/protocol.json';
import cs_common from './locales/cs/common.json';
import cs_catalog from './locales/cs/catalog.json';
import cs_vehicle from './locales/cs/vehicle.json';
import de_common from './locales/de/common.json';
import de_catalog from './locales/de/catalog.json';
import de_vehicle from './locales/de/vehicle.json';

// Define resources
const resources = {
  sk: {
    common: sk_common,
    catalog: sk_catalog,
    vehicle: sk_vehicle,
    auth: sk_auth,
    booking: sk_booking,
    protocol: sk_protocol,
  },
  en: {
    common: en_common,
    catalog: en_catalog,
    vehicle: en_vehicle,
    auth: en_auth,
    booking: en_booking,
    protocol: en_protocol,
  },
  cs: {
    common: cs_common,
    catalog: cs_catalog,
    vehicle: cs_vehicle,
    auth: en_auth, // Use English fallback for now
    booking: en_booking, // Use English fallback for now
    protocol: en_protocol, // Use English fallback for now
  },
  de: {
    common: de_common,
    catalog: de_catalog,
    vehicle: de_vehicle,
    auth: en_auth, // Use English fallback for now
    booking: en_booking, // Use English fallback for now
    protocol: en_protocol, // Use English fallback for now
  },
  // PL and HU will be added later
} as const;

// Get saved language from storage
async function getSavedLanguage(): Promise<string> {
  try {
    const savedLanguage = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return savedLanguage || LANGUAGES.DEFAULT;
  } catch (error) {
    console.error('Failed to load saved language:', error);
    return LANGUAGES.DEFAULT;
  }
}

// Initialize i18next
export async function initI18n() {
  const savedLanguage = await getSavedLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      resources,
          lng: savedLanguage,
          fallbackLng: ['en', 'sk'], // Fallback chain
          defaultNS: 'common',
          ns: ['common', 'catalog', 'vehicle', 'auth', 'booking', 'protocol'], // Available namespaces
      
      // Interpolation options
      interpolation: {
        escapeValue: false, // React already escapes
        format: (value, format, lng) => {
          // Custom formatters
          if (format === 'uppercase') return value.toUpperCase();
          if (format === 'lowercase') return value.toLowerCase();
          if (format === 'capitalize') {
            return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
          }
          return value;
        },
      },

      // Pluralization
      pluralSeparator: '_',
      
      // React options
      react: {
        useSuspense: false,
      },

      // Debug in development
      debug: __DEV__,

      // Load namespaces on demand
      load: 'languageOnly', // Don't load region-specific resources (sk-SK -> sk)
      
      // Namespace loading strategy
      partialBundledLanguages: true,
    });

  // Listen for language changes
  i18n.on('languageChanged', async (lng) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lng);
      console.log(`Language changed to: ${lng}`);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  });

  return i18n;
}

// Export i18n instance
export default i18n;

// Type-safe namespace keys
export type Namespace = keyof typeof resources.sk;
export type TranslationKey = string; // Will be enhanced with TypeScript path inference

// Helper to check if language is supported
export function isSupportedLanguage(lng: string): boolean {
  return LANGUAGES.SUPPORTED.includes(lng as typeof LANGUAGES.SUPPORTED[number]);
}

// Helper to get current language
export function getCurrentLanguage(): string {
  return i18n.language || LANGUAGES.DEFAULT;
}

// Helper to change language
export async function changeLanguage(lng: string): Promise<void> {
  if (isSupportedLanguage(lng)) {
    await i18n.changeLanguage(lng);
  } else {
    console.warn(`Language ${lng} is not supported. Falling back to ${LANGUAGES.DEFAULT}`);
    await i18n.changeLanguage(LANGUAGES.DEFAULT);
  }
}



