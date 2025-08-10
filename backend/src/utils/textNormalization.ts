/**
 * Utility funkcie na normalizáciu textu pre vyhľadávanie
 * Odstráni diakritiku a normalizuje text pre porovnávanie
 */

/**
 * Odstráni diakritiku z textu
 * @param text - vstupný text s diakritikou
 * @returns text bez diakritiky
 */
export function removeDiacritics(text: string): string {
  if (!text) return '';
  // Normalizácia NFD rozdelí znaky na základný znak + diakritické znamienka
  // \u0300-\u036f je rozsah Unicode pre diakritické znamienka
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalizuje text pre vyhľadávanie - odstráni diakritiku a prevedie na malé písmená
 * @param text - vstupný text
 * @returns normalizovaný text
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return removeDiacritics(String(text).toLowerCase());
}

/**
 * Kontroluje či text obsahuje hľadaný výraz bez ohľadu na diakritiku
 * @param text - text v ktorom hľadáme
 * @param searchTerm - hľadaný výraz
 * @returns true ak text obsahuje hľadaný výraz
 */
export function textIncludes(text: string | null | undefined, searchTerm: string): boolean {
  if (!searchTerm) return true;
  if (!text) return false;
  return normalizeText(text).includes(normalizeText(searchTerm));
}

/**
 * Vytvorí filter funkciu pre vyhľadávanie v objektoch
 * @param searchTerm - hľadaný výraz
 * @param fields - funkcie na získanie hodnôt polí
 * @returns filter funkcia
 */
export function createSearchFilter<T>(
  searchTerm: string,
  fields: ((item: T) => string | null | undefined)[]
): (item: T) => boolean {
  if (!searchTerm) return () => true;
  
  const normalizedSearch = normalizeText(searchTerm);
  
  return (item: T) => {
    return fields.some(getField => {
      const value = getField(item);
      return textIncludes(value, searchTerm);
    });
  };
}