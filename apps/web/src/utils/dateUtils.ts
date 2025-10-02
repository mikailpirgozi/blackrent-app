/**
 * 🕐 GLOBÁLNA DATE UTILITY - TIMEZONE SAFE
 *
 * Táto utility nahradí všetky problematické Date operácie v aplikácii.
 * Zabezpečuje že časy sa vždy zobrazujú presne ako sú uložené v databáze.
 */

/**
 * Parsuje dátum string bez timezone konverzie
 */
export function parseDate(
  dateValue: string | Date | null | undefined
): Date | null {
  if (!dateValue) return null;

  if (dateValue instanceof Date) {
    return dateValue;
  }

  // Ak je string vo formáte "YYYY-MM-DD HH:MM:SS", parsuj ho ako lokálny čas
  const match = dateValue.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/
  );
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    // Vytvor Date objekt s explicitnými hodnotami - bez timezone konverzie
    return new Date(
      parseInt(year!),
      parseInt(month!) - 1, // Mesiace sú 0-indexed
      parseInt(day!),
      parseInt(hour!),
      parseInt(minute!),
      parseInt(second!)
    );
  }

  // Ak je ISO formát (2025-09-04T17:00:00Z), extrahuj čas bez timezone
  if (dateValue.includes('T')) {
    const isoMatch = dateValue.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/
    );
    if (isoMatch) {
      const [, year, month, day, hour, minute, second] = isoMatch;
      return new Date(
        parseInt(year!),
        parseInt(month!) - 1,
        parseInt(day!),
        parseInt(hour!),
        parseInt(minute!),
        parseInt(second!)
      );
    }
  }

  // Fallback pre iné formáty - ale môže spôsobiť timezone konverziu
  console.warn('⚠️ parseDate fallback pre formát:', dateValue);
  return new Date(dateValue);
}

/**
 * Formátuje dátum do stringu bez timezone konverzie
 */
export function formatDateToString(date: Date): string {
  if (!date || isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * Vytvorí nový Date objekt s aktuálnym časom
 */
export function createCurrentDate(): Date {
  return new Date();
}

/**
 * Vytvorí Date objekt z komponentov (rok, mesiac, deň, hodina, minúta)
 */
export function createDate(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0
): Date {
  return new Date(year, month - 1, day, hour, minute, second);
}

/**
 * HLAVNÁ FUNKCIA - nahradí všetky new Date() volania
 */
export function safeDate(dateValue?: string | Date | null): Date | null {
  if (dateValue === undefined || dateValue === null) {
    return createCurrentDate();
  }

  return parseDate(dateValue);
}

// Re-export formatters pre kompatibilitu
export {
  formatDate,
  formatDateTime,
  formatTime,
  parseTimezoneFreeDateString,
} from './formatters';
