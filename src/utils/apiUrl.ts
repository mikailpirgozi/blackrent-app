/**
 * Centralizovaná funkcia pre získanie správnej API URL
 * na základe prostredia v ktorom aplikácia beží
 */
export const getApiBaseUrl = (): string => {
  // Ak je nastavená custom API URL v environment
  if (process.env.REACT_APP_API_URL) {
    console.log('🌐 Používam API URL z .env:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // Pre Vercel deployment používaj Railway API
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    const railwayUrl = 'https://blackrent-app-production-4d6f.up.railway.app/api';
    console.log('🌐 Vercel detekované, používam Railway API:', railwayUrl);
    return railwayUrl;
  }
  
  // Pre Railway deployment (celá aplikácia na Railway)
  if (typeof window !== 'undefined' && window.location.hostname.includes('railway.app')) {
    const apiUrl = `${window.location.origin}/api`;
    console.log('🌐 Railway detekované, používam relatívnu API URL:', apiUrl);
    return apiUrl;
  }
  
  // V produkcii používame Railway URL
  if (process.env.NODE_ENV === 'production') {
    const railwayUrl = 'https://blackrent-app-production-4d6f.up.railway.app/api';
    console.log('🌐 Production mode, používam Railway API:', railwayUrl);
    return railwayUrl;
  }
  
  // Pre lokálny development
  console.log('🌐 Development mode, používam localhost');
  return 'http://localhost:3001/api';
};

/**
 * Získa base URL bez /api pre websocket pripojenia a iné účely
 */
export const getBaseUrl = (): string => {
  const apiUrl = getApiBaseUrl();
  return apiUrl.replace('/api', '');
};

/**
 * Pre kompatibilitu s existujúcim kódom
 */
export const API_BASE_URL = getApiBaseUrl();

// Debug log
console.log('🔗 API_BASE_URL nastavené na:', API_BASE_URL);
console.log('🌍 Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'undefined',
  origin: typeof window !== 'undefined' ? window.location.origin : 'undefined'
});
