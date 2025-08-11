/**
 * 🔍 Text Normalization Utility
 * Removes diacritics, converts to lowercase for search matching
 * 
 * Examples:
 * - "Červený" → "cerveny"
 * - "MODRÝ" → "modry"
 * - "Žltá" → "zlta"
 */

/**
 * Normalize text for search - removes diacritics and converts to lowercase
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose characters with diacritics
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .trim();
}

/**
 * Check if text contains search query (normalized)
 */
export function textContains(text: string, searchQuery: string): boolean {
  if (!text || !searchQuery) return false;
  
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(searchQuery);
  
  return normalizedText.includes(normalizedQuery);
}

/**
 * Check if any of the provided texts contains the search query
 */
export function anyTextContains(texts: (string | undefined | null)[], searchQuery: string): boolean {
  if (!searchQuery.trim()) return true;
  
  return texts.some(text => text && textContains(text, searchQuery));
}

/**
 * Highlight matching text in search results
 */
export function highlightText(text: string, searchQuery: string): string {
  if (!searchQuery.trim() || !text) return text;
  
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(searchQuery);
  
  if (!normalizedText.includes(normalizedQuery)) return text;
  
  // Find the actual position in the original text
  const regex = new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Test examples for development
 */
export const testNormalization = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 Text normalization tests:');
    console.log('normalizeText("Červený") =', normalizeText("Červený")); // Should be "cerveny"
    console.log('normalizeText("MODRÝ") =', normalizeText("MODRÝ")); // Should be "modry"
    console.log('normalizeText("Žltá") =', normalizeText("Žltá")); // Should be "zlta"
    console.log('textContains("Červený", "cerveny") =', textContains("Červený", "cerveny")); // Should be true
    console.log('textContains("BMW X5", "bmw") =', textContains("BMW X5", "bmw")); // Should be true
  }
};
