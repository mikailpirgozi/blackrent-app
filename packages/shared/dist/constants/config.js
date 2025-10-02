// App configuration constants
export const APP_CONFIG = {
    // App info
    NAME: 'BlackRent',
    VERSION: '1.0.0',
    DESCRIPTION: 'Platforma pre prenájom áut na Slovensku',
    // Supported languages
    LANGUAGES: {
        SK: 'sk',
        EN: 'en',
        DE: 'de',
        CZ: 'cz',
    },
    // Default language
    DEFAULT_LANGUAGE: 'sk',
    // Supported currencies
    CURRENCIES: {
        EUR: 'EUR',
        USD: 'USD',
        CZK: 'CZK',
    },
    // Default currency
    DEFAULT_CURRENCY: 'EUR',
    // Booking constraints
    BOOKING: {
        MIN_ADVANCE_HOURS: 2, // Minimum 2 hours in advance
        MAX_ADVANCE_DAYS: 365, // Maximum 1 year in advance
        MIN_RENTAL_HOURS: 4, // Minimum 4 hours rental
        MAX_RENTAL_DAYS: 90, // Maximum 90 days rental
    },
    // Delivery
    DELIVERY: {
        FREE_DISTANCE_KM: 5, // Free delivery within 5km
        BASE_FEE: 10, // Base delivery fee in EUR
        PER_KM_FEE: 1.5, // Fee per km in EUR
        MAX_DISTANCE_KM: 200, // Maximum delivery distance
    },
    // Pagination
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 100,
    },
    // Cache
    CACHE: {
        VEHICLES_TTL: 5 * 60 * 1000, // 5 minutes
        BOOKINGS_TTL: 1 * 60 * 1000, // 1 minute
        USER_TTL: 10 * 60 * 1000, // 10 minutes
    },
    // File upload
    UPLOAD: {
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
        ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
        ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
    },
};
