/**
 * Pomocné funkcie pre prácu s číslami
 */

/**
 * Parsuje string na číslo s podporou slovenského formátu
 * @param input - string na parsovanie
 * @returns číslo alebo null ak nie je validné
 *
 * @example
 * parseNumber("12.34") // 12.34
 * parseNumber("12,34") // 12.34
 * parseNumber(" 123 ") // 123
 * parseNumber("abc") // null
 * parseNumber("") // null
 */
export function parseNumber(input: string): number | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Odstráni whitespaces
  const cleaned = input.trim();

  if (cleaned === '') {
    return null;
  }

  // Nahradí čiarku bodkou (slovenský formát)
  const normalized = cleaned.replace(',', '.');

  // Kontrola či obsahuje len validné znaky pre číslo
  const validNumberRegex = /^-?\d+(\.\d+)?$/;
  if (!validNumberRegex.test(normalized)) {
    return null;
  }

  // Parsuje ako číslo
  const parsed = parseFloat(normalized);

  // Vráti null ak nie je validné číslo
  return isNaN(parsed) ? null : parsed;
}
