/**
 * Centralizovaný prístup k environment premenným pre Vite
 * Nahradza process.env.REACT_APP_* za import.meta.env.VITE_*
 */

/// <reference types="vite/client" />

// Extend Window interface for environment logging
declare global {
  interface Window {
    __ENV_LOGGED__?: boolean;
  }
}

export const env = {
  // API konfigurácia
  API_URL: import.meta.env.VITE_API_URL as string,
  USE_WORKER_PROXY: import.meta.env.VITE_USE_WORKER_PROXY === 'true',
  WORKER_URL: import.meta.env.VITE_WORKER_URL as string,

  // Debugging
  DEBUG: import.meta.env.VITE_DEBUG === 'true',

  // Vite systémové premenné
  MODE: import.meta.env.MODE as string,
  DEV: import.meta.env.DEV as boolean,
  PROD: import.meta.env.PROD as boolean,
} as const;

// Type safety helper
export type EnvKeys = keyof typeof env;

// Debug log pre development - len raz pri načítaní
if (env.DEV && !window.__ENV_LOGGED__) {
  console.log('🔧 Environment variables loaded:', {
    API_URL: env.API_URL,
    USE_WORKER_PROXY: env.USE_WORKER_PROXY,
    WORKER_URL: env.WORKER_URL,
    DEBUG: env.DEBUG,
    MODE: env.MODE,
  });
  window.__ENV_LOGGED__ = true;
}
