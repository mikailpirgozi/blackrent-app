/**
 * 🧪 UNIT TESTS: applyExtraKm utility function
 */

import { describe, it, expect } from 'vitest';
import { applyExtraKm, calculateExtraKmCost, DEFAULT_PRICE_PER_KM } from './applyExtraKm';

describe('applyExtraKm', () => {
  describe('Happy Path Tests', () => {
    it('should calculate total price with extra kilometers correctly', () => {
      // 100€ základ + 50 km * 0.30€ = 115€
      const result = applyExtraKm({
        basePrice: 100,
        extraKilometers: 50,
        pricePerKm: 0.30
      });
      
      expect(result).toBe(115);
    });

    it('should use default price per km when not specified', () => {
      // 100€ základ + 50 km * 0.30€ (default) = 115€
      const result = applyExtraKm({
        basePrice: 100,
        extraKilometers: 50
      });
      
      expect(result).toBe(115);
    });

    it('should handle decimal prices correctly', () => {
      // 99.99€ základ + 33 km * 0.25€ = 108.24€
      const result = applyExtraKm({
        basePrice: 99.99,
        extraKilometers: 33,
        pricePerKm: 0.25
      });
      
      expect(result).toBe(108.24);
    });
  });

  describe('Edge Cases', () => {
    it('should return base price when extra kilometers is 0', () => {
      const result = applyExtraKm({
        basePrice: 100,
        extraKilometers: 0
      });
      
      expect(result).toBe(100);
    });

    it('should handle zero base price correctly', () => {
      const result = applyExtraKm({
        basePrice: 0,
        extraKilometers: 50,
        pricePerKm: 0.30
      });
      
      expect(result).toBe(15);
    });

    it('should handle zero price per km', () => {
      const result = applyExtraKm({
        basePrice: 100,
        extraKilometers: 50,
        pricePerKm: 0
      });
      
      expect(result).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for negative base price', () => {
      expect(() => applyExtraKm({
        basePrice: -100,
        extraKilometers: 50
      })).toThrow('Základná cena nemôže byť záporná');
    });

    it('should throw error for negative extra kilometers', () => {
      expect(() => applyExtraKm({
        basePrice: 100,
        extraKilometers: -10
      })).toThrow('Extra kilometre nemôžu byť záporné');
    });

    it('should throw error for negative price per km', () => {
      expect(() => applyExtraKm({
        basePrice: 100,
        extraKilometers: 50,
        pricePerKm: -0.30
      })).toThrow('Cena za kilometer nemôže byť záporná');
    });
  });

  describe('Rounding Tests', () => {
    it('should round to 2 decimal places', () => {
      // 100€ + 33 km * 0.333€ = 110.989€ -> 110.99€
      const result = applyExtraKm({
        basePrice: 100,
        extraKilometers: 33,
        pricePerKm: 0.333
      });
      
      expect(result).toBe(110.99);
    });
  });
});

describe('calculateExtraKmCost', () => {
  it('should calculate only extra cost without base price', () => {
    const result = calculateExtraKmCost(50, 0.30);
    expect(result).toBe(15);
  });

  it('should use default price per km', () => {
    const result = calculateExtraKmCost(50);
    expect(result).toBe(50 * DEFAULT_PRICE_PER_KM);
  });

  it('should return 0 for negative kilometers', () => {
    const result = calculateExtraKmCost(-10, 0.30);
    expect(result).toBe(0);
  });

  it('should handle zero kilometers', () => {
    const result = calculateExtraKmCost(0, 0.30);
    expect(result).toBe(0);
  });
});
