/**
 * Vite-friendly feature flags (frontend)
 * Centralizovaný prístup k VITE_FLAG_* premenným
 */

/// <reference types="vite/client" />

/**
 * Získa hodnotu feature flag z environment premenných
 * @param name - názov flagu (bez VITE_FLAG_ prefixu)
 * @param fallback - predvolená hodnota ak flag nie je nastavený
 * @returns boolean hodnota flagu
 *
 * @example
 * // V .env.local: VITE_FLAG_EXTRA_KM=true
 * const showExtraKm = flag('EXTRA_KM'); // true
 * const newFeature = flag('NEW_FEATURE', false); // false (default)
 */
export function flag(name: string, fallback = false): boolean {
  const key = `VITE_FLAG_${name}`;
  const v = (import.meta.env as any)[key];

  if (v === '1' || v === 'true') return true;
  if (v === '0' || v === 'false') return false;

  return fallback;
}

/**
 * Získa všetky aktívne feature flags pre debugging
 */
export function getAllFlags(): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  const env = import.meta.env;

  Object.keys(env).forEach(key => {
    if (key.startsWith('VITE_FLAG_')) {
      const flagName = key.replace('VITE_FLAG_', '');
      flags[flagName] = flag(flagName);
    }
  });

  return flags;
}

// Debug output v development mode
if (import.meta.env.DEV) {
  const activeFlags = getAllFlags();
  if (Object.keys(activeFlags).length > 0) {
    console.log('🚩 Active feature flags:', activeFlags);
  }
}
