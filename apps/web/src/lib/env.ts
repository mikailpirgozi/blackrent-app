/**
 * ✅ Centralizovaný prístup k environment premenným s Zod validáciou
 * Nahradza process.env.REACT_APP_* za import.meta.env.VITE_*
 */

/// <reference types="vite/client" />

import { z } from 'zod';
import { logger } from '@/utils/smartLogger';

// Extend Window interface for environment logging
declare global {
  interface Window {
    __ENV_LOGGED__?: boolean;
  }
}

// ✅ Zod schema pre environment variables
const envSchema = z.object({
  // API konfigurácia
  API_URL: z.string().url().optional().or(z.literal('')), // Optional v development (používa Vite proxy)
  USE_WORKER_PROXY: z.boolean().default(false),
  WORKER_URL: z.string().url().optional().or(z.literal('')),

  // Debugging
  DEBUG: z.boolean().default(false),

  // Vite systémové premenné
  MODE: z.enum(['development', 'production', 'test']),
  DEV: z.boolean(),
  PROD: z.boolean(),
});

// Parse a validuj environment variables
const rawEnv = {
  API_URL: import.meta.env.VITE_API_URL || '',
  USE_WORKER_PROXY: import.meta.env.VITE_USE_WORKER_PROXY === 'true',
  WORKER_URL: import.meta.env.VITE_WORKER_URL || '',
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
};

// ✅ Validate a export
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(rawEnv);
} catch (error) {
  logger.error('❌ Environment validation failed!', error);
  throw new Error('Invalid environment configuration');
}

export { env };

// Type safety helper
export type EnvKeys = keyof typeof env;

// Debug log pre development - len raz pri načítaní
if (env.DEV && typeof window !== 'undefined' && !window.__ENV_LOGGED__) {
  logger.debug('Environment variables loaded', {
    API_URL: env.API_URL || 'Using Vite proxy',
    USE_WORKER_PROXY: env.USE_WORKER_PROXY,
    DEBUG: env.DEBUG,
    MODE: env.MODE,
  });
  window.__ENV_LOGGED__ = true;
}
