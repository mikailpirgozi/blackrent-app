import { describe, it, expect } from 'vitest';
import { 
  calculatePriceBreakdown, 
  formatPriceWithDiscount,
  calculateOriginalPriceFromDiscounted,
  calculateDiscountedPrice
} from '../priceCalculator';
import type { Rental } from '../../types';

describe('priceCalculator', () => {
  describe('calculatePriceBreakdown', () => {
    it('should handle rental without discount', () => {
      const rental: Partial<Rental> = {
        totalPrice: 100,
        extraKmCharge: 20
      };

      const result = calculatePriceBreakdown(rental as Rental);

      expect(result).toEqual({
        originalPrice: 80,
        discountAmount: 0,
        discountedPrice: 80,
        extraKmCharge: 20,
        finalPrice: 100,
        hasDiscount: false,
        discountPercentage: undefined
      });
    });

    it('should handle rental with percentage discount', () => {
      const rental: Partial<Rental> = {
        totalPrice: 100,
        extraKmCharge: 20,
        discount: {
          type: 'percentage',
          value: 20
        }
      };

      const result = calculatePriceBreakdown(rental as Rental);

      expect(result.hasDiscount).toBe(true);
      expect(result.discountPercentage).toBe(20);
      expect(result.discountedPrice).toBe(80);
      expect(result.originalPrice).toBe(100);
      expect(result.discountAmount).toBe(20);
      expect(result.finalPrice).toBe(100);
    });

    it('should handle rental with fixed discount', () => {
      const rental: Partial<Rental> = {
        totalPrice: 100,
        extraKmCharge: 20,
        discount: {
          type: 'fixed',
          value: 30
        }
      };

      const result = calculatePriceBreakdown(rental as Rental);

      expect(result.hasDiscount).toBe(true);
      expect(result.discountedPrice).toBe(80);
      expect(result.originalPrice).toBe(110);
      expect(result.discountAmount).toBe(30);
      expect(result.finalPrice).toBe(100);
    });

    it('should handle rental with only extra km charge', () => {
      const rental: Partial<Rental> = {
        totalPrice: 50,
        extraKmCharge: 50
      };

      const result = calculatePriceBreakdown(rental as Rental);

      expect(result.originalPrice).toBe(0);
      expect(result.discountedPrice).toBe(0);
      expect(result.extraKmCharge).toBe(50);
      expect(result.finalPrice).toBe(50);
      expect(result.hasDiscount).toBe(false);
    });
  });

  describe('formatPriceWithDiscount', () => {
    it('should format price without discount', () => {
      const priceBreakdown = {
        originalPrice: 100,
        discountAmount: 0,
        discountedPrice: 100,
        extraKmCharge: 0,
        finalPrice: 100,
        hasDiscount: false
      };

      const result = formatPriceWithDiscount(priceBreakdown);

      expect(result.hasDiscount).toBe(false);
      expect(result.finalPriceText).toBe('100.00€');
    });

    it('should format price with percentage discount', () => {
      const priceBreakdown = {
        originalPrice: 100,
        discountAmount: 20,
        discountedPrice: 80,
        extraKmCharge: 0,
        finalPrice: 80,
        hasDiscount: true,
        discountPercentage: 20
      };

      const result = formatPriceWithDiscount(priceBreakdown);

      expect(result.hasDiscount).toBe(true);
      expect(result.originalPriceText).toBe('100.00€');
      expect(result.finalPriceText).toBe('80.00€');
      expect(result.discountText).toBe('Zľava 20% (-20.00€)');
    });
  });

  describe('calculateOriginalPriceFromDiscounted', () => {
    it('should calculate original price from percentage discount', () => {
      const result = calculateOriginalPriceFromDiscounted(80, {
        type: 'percentage',
        value: 20
      });

      expect(result).toBe(100);
    });

    it('should calculate original price from fixed discount', () => {
      const result = calculateOriginalPriceFromDiscounted(70, {
        type: 'fixed',
        value: 30
      });

      expect(result).toBe(100);
    });

    it('should return same price when no discount', () => {
      const result = calculateOriginalPriceFromDiscounted(100, {
        type: 'percentage',
        value: 0
      });

      expect(result).toBe(100);
    });
  });

  describe('calculateDiscountedPrice', () => {
    it('should calculate discounted price with percentage', () => {
      const result = calculateDiscountedPrice(100, {
        type: 'percentage',
        value: 25
      });

      expect(result).toBe(75);
    });

    it('should calculate discounted price with fixed amount', () => {
      const result = calculateDiscountedPrice(100, {
        type: 'fixed',
        value: 40
      });

      expect(result).toBe(60);
    });

    it('should not go below zero', () => {
      const result = calculateDiscountedPrice(50, {
        type: 'fixed',
        value: 100
      });

      expect(result).toBe(0);
    });
  });
});
