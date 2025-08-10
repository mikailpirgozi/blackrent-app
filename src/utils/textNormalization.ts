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
  // Normalizácia NFD rozdelí znaky na základný znak + diakritické znamienka
  // \u0300-\u036f je rozsah Unicode pre diakritické znamienka
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalizuje text pre vyhľadávanie - odstráni diakritiku a prevedie na malé písmená
 * @param text - vstupný text
 * @returns normalizovaný text
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return removeDiacritics(text.toLowerCase());
}

/**
 * Porovná dva texty bez ohľadu na diakritiku a veľkosť písmen
 * @param text1 - prvý text
 * @param text2 - druhý text
 * @returns true ak sa texty zhodujú
 */
export function compareTexts(text1: string, text2: string): boolean {
  return normalizeText(text1) === normalizeText(text2);
}

/**
 * Kontroluje či text obsahuje hľadaný výraz bez ohľadu na diakritiku
 * @param text - text v ktorom hľadáme
 * @param searchTerm - hľadaný výraz
 * @returns true ak text obsahuje hľadaný výraz
 */
export function textIncludes(text: string, searchTerm: string): boolean {
  if (!text || !searchTerm) return !searchTerm;
  return normalizeText(text).includes(normalizeText(searchTerm));
}

/**
 * Filtruje pole objektov podľa hľadaného výrazu v zadaných poliach
 * @param items - pole objektov
 * @param searchTerm - hľadaný výraz
 * @param fields - polia v ktorých hľadať
 * @returns vyfiltrované pole
 */
export function filterByText<T extends Record<string, any>>(
  items: T[],
  searchTerm: string,
  fields: (keyof T)[]
): T[] {
  if (!searchTerm) return items;
  
  const normalizedSearch = normalizeText(searchTerm);
  
  return items.filter(item => {
    return fields.some(field => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      
      const textValue = String(value);
      return normalizeText(textValue).includes(normalizedSearch);
    });
  });
}

/**
 * Testovacia funkcia pre overenie správnosti
 */
export function testNormalization(): void {
  console.log('🧪 Testovanie normalizácie textu:');
  
  const testCases = [
    { input: 'Červený', expected: 'cerveny' },
    { input: 'čížiček', expected: 'cizicek' },
    { input: 'Ľuboš', expected: 'lubos' },
    { input: 'Žofia', expected: 'zofia' },
    { input: 'Ďateľ', expected: 'datel' },
    { input: 'Ňuňu', expected: 'nunu' },
    { input: 'Áčko', expected: 'acko' },
    { input: 'ŠKODA', expected: 'skoda' },
    { input: 'Prešov', expected: 'presov' },
    { input: 'Košice', expected: 'kosice' }
  ];
  
  testCases.forEach(({ input, expected }) => {
    const result = normalizeText(input);
    const passed = result === expected;
    console.log(`${passed ? '✅' : '❌'} "${input}" -> "${result}" (expected: "${expected}")`);
  });
  
  // Test vyhľadávania
  console.log('\n🔍 Testovanie vyhľadávania:');
  const searchTests = [
    { text: 'Červený automobil', search: 'cerveny', expected: true },
    { text: 'ŠKODA Octavia', search: 'skoda', expected: true },
    { text: 'Prešovský kraj', search: 'presovsky', expected: true },
    { text: 'Žltá farba', search: 'zlta', expected: true },
    { text: 'Modrý', search: 'cerveny', expected: false }
  ];
  
  searchTests.forEach(({ text, search, expected }) => {
    const result = textIncludes(text, search);
    const passed = result === expected;
    console.log(`${passed ? '✅' : '❌'} "${text}" obsahuje "${search}": ${result} (expected: ${expected})`);
  });
}