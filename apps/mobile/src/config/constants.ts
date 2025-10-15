/**
 * App Constants
 * Central configuration for the BlackRent mobile app
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api',
  WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3001/ws',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Feature Flags
export const FEATURES = {
  PUSH_NOTIFICATIONS: process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true',
  REAL_TIME: process.env.EXPO_PUBLIC_ENABLE_REAL_TIME === 'true',
  OFFLINE_MODE: process.env.EXPO_PUBLIC_ENABLE_OFFLINE_MODE === 'true',
  DEBUG_MODE: process.env.EXPO_PUBLIC_ENABLE_DEBUG_MODE === 'true',
} as const;

// App Information
export const APP_INFO = {
  NAME: process.env.EXPO_PUBLIC_APP_NAME || 'BlackRent',
  VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  BUNDLE_ID: 'sk.blackrent.mobile',
} as const;

// Language Configuration
export const LANGUAGES = {
  DEFAULT: (process.env.EXPO_PUBLIC_DEFAULT_LANGUAGE || 'sk') as SupportedLanguage,
  SUPPORTED: (process.env.EXPO_PUBLIC_SUPPORTED_LANGUAGES || 'sk,cs,de,en,pl,hu')
    .split(',') as SupportedLanguage[],
} as const;

export type SupportedLanguage = 'sk' | 'cs' | 'de' | 'en' | 'pl' | 'hu';

// Currency Configuration
export const CURRENCY = {
  CODE: 'EUR',
  SYMBOL: '€',
  DECIMAL_PLACES: 2,
} as const;

// Date/Time Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd.MM.yyyy',
  DISPLAY_WITH_TIME: 'dd.MM.yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Cache Configuration
export const CACHE = {
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
  CACHE_TIME: 30 * 60 * 1000, // 30 minutes
  RETRY_DELAY: 1000,
  MAX_RETRIES: 3,
} as const;

// Image Configuration
export const IMAGES = {
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  COMPRESSION_QUALITY: 0.8,
  THUMBNAIL_SIZE: { width: 300, height: 200 },
  FULL_SIZE: { width: 1920, height: 1280 },
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

// Booking Configuration
export const BOOKING = {
  MIN_RENTAL_DAYS: 1,
  MAX_RENTAL_DAYS: 90,
  RESERVATION_LOCK_DURATION: 10 * 60 * 1000, // 10 minutes
  ADVANCE_BOOKING_DAYS: 365, // 1 year ahead
} as const;

// Protocol Configuration
export const PROTOCOL = {
  MAX_PHOTOS: 20,
  MAX_DAMAGE_PHOTOS: 10,
  SIGNATURE_REQUIRED: true,
} as const;

// Payment Configuration
export const PAYMENT = {
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  SUPPORTED_METHODS: ['card', 'apple_pay', 'google_pay'] as const,
  CURRENCY: 'eur',
} as const;

// Map Configuration
export const MAP = {
  DEFAULT_LOCATION: {
    latitude: 48.1486, // Bratislava
    longitude: 17.1077,
  },
  DEFAULT_ZOOM: 12,
  MAX_DELIVERY_DISTANCE_KM: 100,
} as const;

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_NUMBER: true,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_SPECIAL_CHAR: true,
  PHONE_REGEX: /^\+?[1-9]\d{1,14}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// Storage Keys (SecureStore only allows alphanumeric, ".", "-", and "_")
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'blackrent.auth_token',
  REFRESH_TOKEN: 'blackrent.refresh_token',
  USER_DATA: 'blackrent.user_data',
  TOKEN_EXPIRY: 'blackrent.token_expiry',
  LANGUAGE: 'blackrent.language',
  THEME: 'blackrent.theme',
  RECENT_SEARCHES: 'blackrent.recent_searches',
  FAVORITES: 'blackrent.favorites',
  ONBOARDING_COMPLETED: 'blackrent.onboarding_completed',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Skontrolujte internetové pripojenie',
  SERVER_ERROR: 'Chyba servera. Skúste to znova neskôr.',
  UNAUTHORIZED: 'Musíte sa prihlásiť',
  FORBIDDEN: 'Nemáte oprávnenie na túto akciu',
  NOT_FOUND: 'Zdroj nebol nájdený',
  VALIDATION_ERROR: 'Neplatné údaje',
  UNKNOWN_ERROR: 'Neznáma chyba',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  BOOKING_CREATED: 'Rezervácia úspešne vytvorená',
  PAYMENT_SUCCESS: 'Platba úspešná',
  PROFILE_UPDATED: 'Profil aktualizovaný',
  PROTOCOL_SUBMITTED: 'Protokol odoslaný',
} as const;

// External Services
export const EXTERNAL_SERVICES = {
  UNSPLASH_ACCESS_KEY: process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY || '',
  GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
  APPLE_CLIENT_ID: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID || '',
} as const;

// Deep Linking
export const DEEP_LINKS = {
  SCHEME: 'blackrent',
  DOMAIN: 'blackrent.sk',
  PATHS: {
    VEHICLE: '/vehicle',
    BOOKING: '/booking',
    PROFILE: '/profile',
    AUTH: '/auth',
  },
} as const;



