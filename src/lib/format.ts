/**
 * Formátovanie pre peniaze a dátumy
 * Používa Intl API pre lokalizáciu
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

/**
 * Formátuje ISO dátum na zrozumiteľný text
 * @param iso - ISO dátum string (UTC)
 * @param locale - lokalizácia (predvolene sk-SK)
 * @returns formátovaný dátum
 *
 * @example
 * formatDate('2025-08-30T12:00:00Z') // "30. 8. 2025"
 * formatDate('2025-08-30T12:00:00Z', 'en-US') // "8/30/2025"
 */
export function formatDate(iso: string, locale = 'sk-SK'): string {
  const date = new Date(iso);

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(date);
}
