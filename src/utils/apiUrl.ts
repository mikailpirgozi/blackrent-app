import { env } from '@/lib/env';

/**
 * Centralizovaná funkcia pre získanie správnej API URL
 * na základe prostredia v ktorom aplikácia beží
 */
export const getApiBaseUrl = (): string => {
  // PRIORITA 1: Ak je nastavená custom API URL v environment - VŽDY použiť túto
  if (env.API_URL) {
    console.log('🌐 Používam API URL z .env (PRIORITY):', env.API_URL);
    return env.API_URL;
  }

  // PRIORITA 2: Pre Vercel deployment používaj Railway API (len ak nie je .env)
  if (
    typeof window !== 'undefined' &&
    window.location.hostname.includes('vercel.app')
  ) {
    const railwayUrl =
      'https://blackrent-app-production-4d6f.up.railway.app/api';
    console.log('🌐 Vercel detekované, používam Railway API:', railwayUrl);
    return railwayUrl;
  }

  // Pre Railway deployment (celá aplikácia na Railway)
  if (
    typeof window !== 'undefined' &&
    window.location.hostname.includes('railway.app')
  ) {
    const apiUrl = `${window.location.origin}/api`;
    console.log('🌐 Railway detekované, používam relatívnu API URL:', apiUrl);
    return apiUrl;
  }

  // V produkcii používame Railway URL
  if (process.env.NODE_ENV === 'production') {
    const railwayUrl =
      'https://blackrent-app-production-4d6f.up.railway.app/api';
    console.log('🌐 Production mode, používam Railway API:', railwayUrl);
    return railwayUrl;
  }

  // Pre lokálny development - používaj relatívne /api (Vite proxy)
  console.log('🌐 Development mode, používam Vite proxy');
  return '/api';
};

/**
 * Získa base URL bez /api pre websocket pripojenia a iné účely
 */
export const getBaseUrl = (): string => {
  const apiUrl = getApiBaseUrl();
  return apiUrl.replace('/api', '');
};

/**
 * Pre kompatibilitu s existujúcim kódom - teraz dynamické
 */
export const API_BASE_URL = () => getApiBaseUrl();

// Debug log - len v browseri
if (typeof window !== 'undefined') {
  console.log('🔗 API_BASE_URL nastavené na:', getApiBaseUrl());
  console.log('🌍 Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    hostname: window.location.hostname,
    origin: window.location.origin,
  });
}
