// Shared constants
export const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://api.blackrent.sk'
    : 'http://localhost:3001';
export const APP_NAME = 'BlackRent';
export const APP_VERSION = '1.0.0';
