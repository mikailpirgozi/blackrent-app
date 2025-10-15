/**
 * 💰 PRICE CALCULATOR UTILITY
 * Centrálna logika pre počítanie cien prenájmov s podporou zliav
 */

import type { Rental } from '../types';

export interface PriceBreakdown {
  originalPrice: number;
  discountAmount: number;
  discountedPrice: number;
  extraKmCharge: number;
  finalPrice: number;
  hasDiscount: boolean;
  discountPercentage: number | undefined;
}

/**
 * Vypočíta detailný rozpis ceny prenájmu vrátane zliav
 * 
 * BUSINESS LOGIC:
 * - totalPrice v DB = základná cena po zľave + extraKmCharge
 * - Ak existuje zľava, originalPrice = cena pred zľavou (bez extraKm)
 * - finalPrice = totalPrice (už obsahuje všetko)
 */
export function calculatePriceBreakdown(rental: Rental): PriceBreakdown {
  const totalPrice = rental.totalPrice || 0;
  const extraKmCharge = rental.extraKmCharge || 0;

  // 💡 DÔLEŽITÉ: totalPrice už obsahuje extraKmCharge!
  // Preto základná cena = totalPrice - extraKmCharge
  const basePrice = totalPrice - extraKmCharge;

  let originalPrice = basePrice;
  let discountAmount = 0;
  let hasDiscount = false;
  let discountPercentage: number | undefined;

  // Ak existuje zľava, vypočítaj originálnu cenu (pred zľavou, bez extra km)
  if (rental.discount?.value && rental.discount.value > 0) {
    hasDiscount = true;

    if (rental.discount.type === 'percentage') {
      // Pre percentuálnu zľavu: discountedPrice = originalPrice * (1 - discount/100)
      // Takže: originalPrice = discountedPrice / (1 - discount/100)
      const discountRate = rental.discount.value / 100;
      originalPrice = basePrice / (1 - discountRate);
      discountAmount = originalPrice - basePrice;
      discountPercentage = rental.discount.value;
    } else if (rental.discount.type === 'fixed') {
      // Pre fixnú zľavu: originalPrice = discountedPrice + discount
      originalPrice = basePrice + rental.discount.value;
      discountAmount = rental.discount.value;
      discountPercentage = Math.round((discountAmount / originalPrice) * 100);
    } else {
      // Fallback pre staré záznamy bez type - ticho považuj za fixnú zľavu
      // (Toto je normálne pre existujúce dáta pred implementáciou typov zliav)
      originalPrice = basePrice + rental.discount.value;
      discountAmount = rental.discount.value;
      discountPercentage = Math.round((discountAmount / originalPrice) * 100);
    }
  }

  // 📊 VÝSLEDOK:
  // - originalPrice = cena pred zľavou (bez extra km)
  // - discountAmount = výška zľavy
  // - discountedPrice (basePrice) = cena po zľave (bez extra km)
  // - extraKmCharge = doplatok za km
  // - finalPrice (totalPrice) = cena po zľave + extra km = FINÁLNA SUMA
  return {
    originalPrice: Math.round(originalPrice * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    discountedPrice: Math.round(basePrice * 100) / 100,
    extraKmCharge: Math.round(extraKmCharge * 100) / 100,
    finalPrice: Math.round(totalPrice * 100) / 100, // ✅ Toto je SPRÁVNA finálna cena
    hasDiscount,
    discountPercentage,
  };
}

/**
 * Formátuje cenu s možnosťou zobrazenia zľavy
 */
export function formatPriceWithDiscount(priceBreakdown: PriceBreakdown): {
  originalPriceText: string;
  finalPriceText: string;
  discountText: string;
  hasDiscount: boolean;
} {
  const {
    originalPrice,
    finalPrice,
    discountAmount,
    hasDiscount,
    discountPercentage,
  } = priceBreakdown;

  return {
    originalPriceText: `${originalPrice.toFixed(2)}€`,
    finalPriceText: `${finalPrice.toFixed(2)}€`,
    discountText: discountPercentage
      ? `Zľava ${discountPercentage}% (-${discountAmount.toFixed(2)}€)`
      : `Zľava -${discountAmount.toFixed(2)}€`,
    hasDiscount,
  };
}

/**
 * Vypočíta originálnu cenu pred aplikovaním zľavy (pre formuláre)
 */
export function calculateOriginalPriceFromDiscounted(
  discountedPrice: number,
  discount: { type: 'percentage' | 'fixed'; value: number }
): number {
  if (!discount?.value || discount.value <= 0) {
    return discountedPrice;
  }

  if (discount.type === 'percentage') {
    const discountRate = discount.value / 100;
    return discountedPrice / (1 - discountRate);
  } else {
    return discountedPrice + discount.value;
  }
}

/**
 * Vypočíta zľavnenú cenu z originálnej ceny
 */
export function calculateDiscountedPrice(
  originalPrice: number,
  discount: { type: 'percentage' | 'fixed'; value: number }
): number {
  if (!discount?.value || discount.value <= 0) {
    return originalPrice;
  }

  if (discount.type === 'percentage') {
    const discountRate = discount.value / 100;
    return originalPrice * (1 - discountRate);
  } else {
    return Math.max(0, originalPrice - discount.value);
  }
}
