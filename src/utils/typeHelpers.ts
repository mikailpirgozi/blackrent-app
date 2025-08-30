/**
 * 🔧 TYPE HELPERS
 *
 * Utility funkcie pre type-safe operácie v BlackRent aplikácii
 */

/**
 * Vytvorí unique array zo strings s type safety
 */
export const createUniqueStringArray = <T>(
  items: T[],
  mapper: (item: T) => string | undefined
): string[] => {
  return [...new Set(items.map(mapper).filter(Boolean))].sort() as string[];
};

/**
 * Vytvorí unique array z objektov s type safety
 */
export const createUniqueArray = <T, K>(
  items: T[],
  mapper: (item: T) => K | undefined
): K[] => {
  return [...new Set(items.map(mapper).filter(Boolean))] as K[];
};

/**
 * Type-safe filter pre odstránenie undefined hodnôt
 */
export const filterDefined = <T>(items: (T | undefined)[]): T[] => {
  return items.filter((item): item is T => item !== undefined);
};

/**
 * Type-safe unique brands extractor
 */
export const extractUniqueBrands = (vehicles: any[]): string[] => {
  return createUniqueStringArray(vehicles, v => v.brand);
};

/**
 * Type-safe unique models extractor
 */
export const extractUniqueModels = (vehicles: any[]): string[] => {
  return createUniqueStringArray(vehicles, v => v.model);
};

/**
 * Type-safe unique companies extractor
 */
export const extractUniqueCompanies = (vehicles: any[]): string[] => {
  return createUniqueStringArray(vehicles, v => v.company);
};
