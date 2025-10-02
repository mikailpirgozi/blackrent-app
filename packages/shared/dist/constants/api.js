// API constants
export const API_ENDPOINTS = {
    // Auth
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        REFRESH: '/auth/refresh',
        LOGOUT: '/auth/logout',
        VERIFY_EMAIL: '/auth/verify-email',
        RESET_PASSWORD: '/auth/reset-password',
        OAUTH: {
            GOOGLE: '/auth/oauth/google',
            APPLE: '/auth/oauth/apple',
        },
    },
    // Vehicles
    VEHICLES: {
        LIST: '/vehicles',
        DETAIL: '/vehicles/:id',
        AVAILABILITY: '/vehicles/:id/availability',
        REVIEWS: '/vehicles/:id/reviews',
        SEARCH: '/vehicles/search',
    },
    // Bookings
    BOOKINGS: {
        QUOTE: '/bookings/quote',
        CREATE: '/bookings',
        LIST: '/bookings',
        DETAIL: '/bookings/:id',
        CANCEL: '/bookings/:id/cancel',
        MODIFY: '/bookings/:id/modify',
    },
    // Payments
    PAYMENTS: {
        INTENT: '/payments/intent',
        CONFIRM: '/payments/confirm',
        WEBHOOK: '/payments/webhook',
    },
    // User
    USER: {
        PROFILE: '/me/profile',
        BOOKINGS: '/me/bookings',
        NOTIFICATIONS: '/me/notifications',
        PREFERENCES: '/me/preferences',
    },
    // Store
    STORE: {
        PRODUCTS: '/store/products',
        CART: '/store/cart',
        CHECKOUT: '/store/checkout',
        VOUCHERS: '/me/vouchers',
    },
    // Admin
    ADMIN: {
        VEHICLES: '/admin/vehicles',
        BOOKINGS: '/admin/bookings',
        STATISTICS: '/admin/statistics',
        PAYOUTS: '/admin/payouts',
    },
};
// Detect if running on mobile device and use appropriate API URL
const getApiBaseUrl = () => {
    // Check if we have explicit environment variable
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }
    // Check if running in Expo/React Native environment
    if (typeof globalThis.navigator !== 'undefined' &&
        globalThis.navigator.product === 'ReactNative') {
        // For mobile development, use computer's IP address
        return 'http://192.168.1.12:3001/api';
    }
    // Default for web/desktop
    return 'http://localhost:3001/api';
};
export const API_BASE_URL = getApiBaseUrl();
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
};
