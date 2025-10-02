/**
 * Formátovanie pre peniaze
 * Používa Intl API pre lokalizáciu
 *
 * NOTE: formatDate() bolo odstránené (duplicita s src/utils/formatters.ts)
 * Pre formátovanie dátumov použite: import { formatDate } from '@/utils/formatters'
 */

/**
 * Formátuje sumu v centoch na text s menou
 * @param cents - suma v centoch (integer)
 * @param currency - kód meny (predvolene EUR)
 * @param locale - lokalizácia (predvolene sk-SK)
 * @returns formátovaný text s menou
 *
 * @example
 * formatMoney(12345) // "123,45 €"
 * formatMoney(12345, 'USD', 'en-US') // "$123.45"
 */
export function formatMoney(
  cents: number,
  currency = 'EUR',
  locale = 'sk-SK'
): string {
  const euros = cents / 100;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(euros);
}
