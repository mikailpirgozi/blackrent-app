/**
 * 🚀 OPTIMALIZOVANÝ LOGGER SYSTÉM
 *
 * Znížené logovanie pre lepší performance a čistšiu konzolu
 * - Development: Len kritické logy
 * - Production: Len chyby
 */

import { env } from '@/lib/env';

const isDevelopment = process.env.NODE_ENV === 'development';

// Throttling pre periodické logy
const throttledLogs = new Map<string, number>();
const THROTTLE_INTERVAL = 5000; // 5 sekúnd

function shouldThrottle(key: string): boolean {
  const now = Date.now();
  const lastLog = throttledLogs.get(key);
  
  if (!lastLog || now - lastLog > THROTTLE_INTERVAL) {
    throttledLogs.set(key, now);
    return false;
  }
  return true;
}

export const logger = {
  // 🐛 Debug logy - len kritické v development
  debug: (...args: unknown[]) => {
    if (isDevelopment && env.DEBUG) {
      // Throttle debug logy
      const key = args[0] as string;
      if (shouldThrottle(key)) return;
      
      console.log(...args);
    }
  },

  // ℹ️ Info logy - len dôležité
  info: (...args: unknown[]) => {
    if (isDevelopment && env.DEBUG) {
      // Throttle info logy
      const key = args[0] as string;
      if (shouldThrottle(key)) return;
      
      console.log(...args);
    }
  },

  // ⚠️ Warning logy - vždy (dôležité)
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },

  // 🚨 Error logy - vždy (kritické)
  error: (...args: unknown[]) => {
    console.error(...args);
  },

  // 📊 Performance logy - len v development, throttled
  perf: (...args: unknown[]) => {
    if (isDevelopment) {
      const key = args[0] as string;
      if (shouldThrottle(key)) return;
      
      console.log(...args);
    }
  },

  // 🔐 Auth logy - len kritické auth operácie
  auth: (...args: unknown[]) => {
    if (isDevelopment && env.DEBUG) {
      // Throttle auth logy
      const key = args[0] as string;
      if (shouldThrottle(key)) return;
      
      console.log(...args);
    }
  },
};

export default logger;
