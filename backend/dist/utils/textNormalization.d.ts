/**
 * Utility funkcie na normalizáciu textu pre vyhľadávanie
 * Odstráni diakritiku a normalizuje text pre porovnávanie
 */
/**
 * Odstráni diakritiku z textu
 * @param text - vstupný text s diakritikou
 * @returns text bez diakritiky
 */
export declare function removeDiacritics(text: string): string;
/**
 * Normalizuje text pre vyhľadávanie - odstráni diakritiku a prevedie na malé písmená
 * @param text - vstupný text
 * @returns normalizovaný text
 */
export declare function normalizeText(text: string | null | undefined): string;
/**
 * Kontroluje či text obsahuje hľadaný výraz bez ohľadu na diakritiku
 * @param text - text v ktorom hľadáme
 * @param searchTerm - hľadaný výraz
 * @returns true ak text obsahuje hľadaný výraz
 */
export declare function textIncludes(text: string | null | undefined, searchTerm: string): boolean;
/**
 * Vytvorí filter funkciu pre vyhľadávanie v objektoch
 * @param searchTerm - hľadaný výraz
 * @param fields - funkcie na získanie hodnôt polí
 * @returns filter funkcia
 */
export declare function createSearchFilter<T>(searchTerm: string, fields: ((item: T) => string | null | undefined)[]): (item: T) => boolean;
//# sourceMappingURL=textNormalization.d.ts.map