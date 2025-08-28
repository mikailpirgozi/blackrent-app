/**
 * 💰 PRICING UTILITY: Extra Kilometers Calculation
 * 
 * Vypočíta dodatočné náklady za prekročené kilometre
 */

export interface ExtraKmParams {
  basePrice: number;
  extraKilometers: number;
  pricePerKm?: number;
}

export const DEFAULT_PRICE_PER_KM = 0.30; // €0.30 za každý extra km

/**
 * Aplikuje dodatočné náklady za extra kilometre na základnú cenu
 * 
 * @param basePrice - Základná cena prenájmu v eurách
 * @param extraKilometers - Počet extra kilometrov
 * @param pricePerKm - Cena za kilometer (default: 0.30€)
 * @returns Celková cena s extra kilometrami
 */
export function applyExtraKm({
  basePrice,
  extraKilometers,
  pricePerKm = DEFAULT_PRICE_PER_KM
}: ExtraKmParams): number {
  // Validácia vstupov
  if (basePrice < 0) {
    throw new Error('Základná cena nemôže byť záporná');
  }
  
  if (extraKilometers < 0) {
    throw new Error('Extra kilometre nemôžu byť záporné');
  }
  
  if (pricePerKm < 0) {
    throw new Error('Cena za kilometer nemôže byť záporná');
  }

  // Výpočet extra nákladov
  const extraCost = extraKilometers * pricePerKm;
  
  // Celková cena (zaokrúhlená na 2 desatinné miesta)
  const totalPrice = Math.round((basePrice + extraCost) * 100) / 100;
  
  return totalPrice;
}

/**
 * Vypočíta len extra náklady bez základnej ceny
 */
export function calculateExtraKmCost(extraKilometers: number, pricePerKm: number = DEFAULT_PRICE_PER_KM): number {
  if (extraKilometers < 0) return 0;
  return Math.round(extraKilometers * pricePerKm * 100) / 100;
}
