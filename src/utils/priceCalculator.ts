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
  discountPercentage?: number;
}

/**
 * Vypočíta detailný rozpis ceny prenájmu vrátane zliav
 */
export function calculatePriceBreakdown(rental: Rental): PriceBreakdown {
  const totalPrice = rental.totalPrice || 0;
  const extraKmCharge = rental.extraKmCharge || 0;

  // Základná cena bez extra km poplatkov
  const basePrice = totalPrice - extraKmCharge;

  let originalPrice = basePrice;
  let discountAmount = 0;
  let hasDiscount = false;
  let discountPercentage: number | undefined;

  // Ak existuje zľava, vypočítaj originálnu cenu
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
      // Fallback pre staré záznamy bez type - považuj za fixnú zľavu
      console.warn(
        'Discount without type detected, treating as fixed discount:',
        rental.discount
      );
      originalPrice = basePrice + rental.discount.value;
      discountAmount = rental.discount.value;
      discountPercentage = Math.round((discountAmount / originalPrice) * 100);
    }
  }

  return {
    originalPrice: Math.round(originalPrice * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    discountedPrice: Math.round(basePrice * 100) / 100,
    extraKmCharge: Math.round(extraKmCharge * 100) / 100,
    finalPrice: Math.round(totalPrice * 100) / 100,
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
