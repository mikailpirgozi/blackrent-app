"use strict";
/**
 * Utility funkcie na normalizáciu textu pre vyhľadávanie
 * Odstráni diakritiku a normalizuje text pre porovnávanie
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeDiacritics = removeDiacritics;
exports.normalizeText = normalizeText;
exports.textIncludes = textIncludes;
exports.createSearchFilter = createSearchFilter;
/**
 * Odstráni diakritiku z textu
 * @param text - vstupný text s diakritikou
 * @returns text bez diakritiky
 */
function removeDiacritics(text) {
    if (!text)
        return '';
    // Normalizácia NFD rozdelí znaky na základný znak + diakritické znamienka
    // \u0300-\u036f je rozsah Unicode pre diakritické znamienka
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
/**
 * Normalizuje text pre vyhľadávanie - odstráni diakritiku a prevedie na malé písmená
 * @param text - vstupný text
 * @returns normalizovaný text
 */
function normalizeText(text) {
    if (!text)
        return '';
    return removeDiacritics(String(text).toLowerCase());
}
/**
 * Kontroluje či text obsahuje hľadaný výraz bez ohľadu na diakritiku
 * @param text - text v ktorom hľadáme
 * @param searchTerm - hľadaný výraz
 * @returns true ak text obsahuje hľadaný výraz
 */
function textIncludes(text, searchTerm) {
    if (!searchTerm)
        return true;
    if (!text)
        return false;
    return normalizeText(text).includes(normalizeText(searchTerm));
}
/**
 * Vytvorí filter funkciu pre vyhľadávanie v objektoch
 * @param searchTerm - hľadaný výraz
 * @param fields - funkcie na získanie hodnôt polí
 * @returns filter funkcia
 */
function createSearchFilter(searchTerm, fields) {
    if (!searchTerm)
        return () => true;
    const normalizedSearch = normalizeText(searchTerm);
    return (item) => {
        return fields.some(getField => {
            const value = getField(item);
            return textIncludes(value, searchTerm);
        });
    };
}
//# sourceMappingURL=textNormalization.js.map