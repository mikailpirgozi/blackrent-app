import type { VignetteCountry } from '../types';

/**
 * Vráti flag emoji pre danú krajinu
 */
export function getCountryFlag(country: VignetteCountry): string {
  const flags: Record<VignetteCountry, string> = {
    SK: '🇸🇰',
    CZ: '🇨🇿',
    AT: '🇦🇹',
    HU: '🇭🇺',
    SI: '🇸🇮',
  };
  return flags[country] || '';
}

/**
 * Vráti celý názov krajiny
 */
export function getCountryName(country: VignetteCountry): string {
  const names: Record<VignetteCountry, string> = {
    SK: 'Slovensko',
    CZ: 'Česko',
    AT: 'Rakúsko',
    HU: 'Maďarsko',
    SI: 'Slovinsko',
  };
  return names[country] || country;
}

/**
 * Vráti flag emoji + názov krajiny
 */
export function getCountryDisplay(country: VignetteCountry): string {
  return `${getCountryFlag(country)} ${getCountryName(country)}`;
}
