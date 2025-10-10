/**
 * Jednotný výber API base URL (proxy v dev, absolútne v prod)
 * Optimalizovaná verzia pre Vite environment
 */

/// <reference types="vite/client" />

import { env } from '@/lib/env';
import { logger } from './logger';

/**
 * Získa správnu API base URL na základe prostredia
 * @returns API base URL string
 */
export function getApiPath(): string {
  // PRIORITA 1: Custom API URL z environment
  if (env.API_URL) {
    return env.API_URL;
  }

  // PRIORITA 2: Production - absolútna Railway URL
  if (env.PROD) {
    return 'https://blackrent-app-production-4d6f.up.railway.app/api';
  }

  // PRIORITA 3: Development - Vite proxy
  return '/api';
}

/**
 * Získa base URL bez /api suffixu (pre WebSocket a iné účely)
 */
export function getBaseUrl(): string {
  return getApiPath().replace('/api', '');
}

/**
 * Vytvorí kompletný endpoint path
 * @param endpoint - endpoint path (napr. '/vehicles')
 * @returns kompletná URL
 */
export function apiPath(endpoint: string): string {
  const base = getApiPath();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
}

// Debug log len v development
if (env.DEV) {
  logger.debug('🔗 API Path configured:', {
    base: getApiPath(),
    mode: env.MODE,
    customUrl: !!env.API_URL,
  });
}
