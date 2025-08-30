/**
 * 🔤 TEXT NORMALIZATION UTILITIES
 *
 * Utility funkcie pre normalizáciu textu - odstránenie diakritiky,
 * konverzia na malé písmená pre vyhľadávanie bez ohľadu na diakritiku
 */

/**
 * Normalizuje text - odstráni diakritiku a konvertuje na malé písmená
 * @param text - text na normalizáciu
 * @returns normalizovaný text bez diakritiky a malými písmenami
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .toLowerCase()
    .normalize('NFD') // Rozloží znaky s diakritikou na základné znaky + diakritické značky
    .replace(/[\u0300-\u036f]/g, '') // Odstráni diakritické značky
    .trim();
}

/**
 * Kontroluje či text obsahuje hľadaný výraz (bez ohľadu na diakritiku a veľkosť písmen)
 * @param text - text v ktorom hľadáme
 * @param searchTerm - hľadaný výraz
 * @returns true ak text obsahuje hľadaný výraz
 */
export function textContains(
  text: string | null | undefined,
  searchTerm: string
): boolean {
  if (!text || !searchTerm) return false;

  const normalizedText = normalizeText(text);
  const normalizedSearch = normalizeText(searchTerm);

  return normalizedText.includes(normalizedSearch);
}

/**
 * Kontroluje či text presne zodpovedá hľadanému výrazu (bez ohľadu na diakritiku a veľkosť písmen)
 * @param text - text na porovnanie
 * @param searchTerm - hľadaný výraz
 * @returns true ak texty sa zhodujú
 */
export function textEquals(
  text: string | null | undefined,
  searchTerm: string
): boolean {
  if (!text || !searchTerm) return false;

  const normalizedText = normalizeText(text);
  const normalizedSearch = normalizeText(searchTerm);

  return normalizedText === normalizedSearch;
}

/**
 * Vyhľadáva v poli textov (bez ohľadu na diakritiku a veľkosť písmen)
 * @param texts - pole textov na prehľadanie
 * @param searchTerm - hľadaný výraz
 * @returns true ak niektorý z textov obsahuje hľadaný výraz
 */
export function searchInTexts(
  texts: (string | null | undefined)[],
  searchTerm: string
): boolean {
  if (!searchTerm) return false;

  return texts.some(text => textContains(text, searchTerm));
}

/**
 * Príklady použitia:
 *
 * normalizeText('Švantnerová') // 'svantnerova'
 * normalizeText('ĽUBOŠ') // 'lubos'
 * textContains('Švantnerová', 'svatner') // true
 * textContains('ĽUBOŠ NOVÁK', 'lubos') // true
 * searchInTexts(['Švantnerová', 'Bratislava'], 'svatner') // true
 */
