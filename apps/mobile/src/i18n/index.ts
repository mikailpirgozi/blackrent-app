import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import cz from './locales/cz.json';
import de from './locales/de.json';
import en from './locales/en.json';
import hu from './locales/hu.json';
import sk from './locales/sk.json';

// Get device locale
const deviceLocale = Localization.getLocales()[0]?.languageCode || 'sk';

// Supported languages
export const _supportedLanguages = {
  sk: 'Slovenčina',
  en: 'English',
  de: 'Deutsch',
  cz: 'Čeština',
  hu: 'Magyar',
} as const;

export type SupportedLanguage = keyof typeof supportedLanguages;

// Initialize i18next
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    sk: { translation: sk },
    de: { translation: de },
    cz: { translation: cz },
    hu: { translation: hu },
  },
  lng: deviceLocale in supportedLanguages ? deviceLocale : 'sk', // Default to Slovak
  fallbackLng: 'sk',
  interpolation: {
    escapeValue: false, // React already does escaping
  },
  compatibilityJSON: 'v4', // Use v4 format for React Native
});

export default i18n;
