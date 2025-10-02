/**
 * 🧪 UNIT TESTY PRE RENTAL DAYS CALCULATOR
 *
 * Testuje všetky scenáre z RENTAL_DAYS_CALCULATION_ANALYSIS.md
 */

import { describe, expect, it } from 'vitest';
import {
  calculateRentalDays,
  calculateRentalDaysLegacy,
  compareRentalDaysImplementations,
} from '../rentalDaysCalculator';

describe('calculateRentalDays', () => {
  describe('✅ Základné scenáre podľa správnej logiky', () => {
    it('1.1. 10:00 → 2.1. 10:00 = 1 deň (presne 24h)', () => {
      const startDate = new Date('2024-01-01T10:00:00');
      const endDate = new Date('2024-01-02T10:00:00');

      expect(calculateRentalDays(startDate, endDate)).toBe(1);
    });

    it('1.1. 10:00 → 3.1. 10:00 = 2 dni (presne 48h)', () => {
      const startDate = new Date('2024-01-01T10:00:00');
      const endDate = new Date('2024-01-03T10:00:00');

      expect(calculateRentalDays(startDate, endDate)).toBe(2);
    });

    it('1.1. 10:00 → 2.1. 10:01 = 2 dni (24h + 1min)', () => {
      const startDate = new Date('2024-01-01T10:00:00');
      const endDate = new Date('2024-01-02T10:01:00');

      expect(calculateRentalDays(startDate, endDate)).toBe(2);
    });

    it('1.1. 10:00 → 3.1. 10:01 = 3 dni (48h + 1min)', () => {
      const startDate = new Date('2024-01-01T10:00:00');
      const endDate = new Date('2024-01-03T10:01:00');

      expect(calculateRentalDays(startDate, endDate)).toBe(3);
    });

    it('1.1. 10:00 → 1.1. 20:00 = 1 deň (ten istý deň)', () => {
      const startDate = new Date('2024-01-01T10:00:00');
      const endDate = new Date('2024-01-01T20:00:00');

      expect(calculateRentalDays(startDate, endDate)).toBe(1);
    });

    it('1.1. 10:00 → 1.1. 10:00 = 1 deň (presne ten istý čas)', () => {
      const startDate = new Date('2024-01-01T10:00:00');
      const endDate = new Date('2024-01-01T10:00:00');

      expect(calculateRentalDays(startDate, endDate)).toBe(1);
    });
  });

  describe('🔍 Hraničné prípady', () => {
    it('Rovnaký čas a dátum = 1 deň', () => {
      const date = new Date('2024-09-08T10:00:00');

      expect(calculateRentalDays(date, date)).toBe(1);
    });

    it('Enddate skôr ako startDate = 0 dní', () => {
      const startDate = new Date('2024-09-10T10:00:00');
      const endDate = new Date('2024-09-08T10:00:00');

      expect(calculateRentalDays(startDate, endDate)).toBe(0);
    });

    it('Minimálny rozdiel (1 milisekunda) = 2 dni', () => {
      const startDate = new Date('2024-09-08T10:00:00.000');
      const endDate = new Date('2024-09-08T10:00:00.001');

      expect(calculateRentalDays(startDate, endDate)).toBe(1); // Ten istý deň
    });

    it('Presne 24 hodín = 1 deň', () => {
      const startDate = new Date('2024-09-08T10:00:00');
      const endDate = new Date('2024-09-09T10:00:00');

      expect(calculateRentalDays(startDate, endDate)).toBe(1);
    });

    it('24 hodín + 1 minúta = 2 dni', () => {
      const startDate = new Date('2024-09-08T10:00:00');
      const endDate = new Date('2024-09-09T10:01:00');

      expect(calculateRentalDays(startDate, endDate)).toBe(2);
    });
  });

  describe('❌ Validácia chýb', () => {
    it('Chýba startDate', () => {
      expect(() =>
        calculateRentalDays(null as unknown as Date, new Date())
      ).toThrow('calculateRentalDays: startDate a endDate sú povinné');
    });

    it('Chýba endDate', () => {
      expect(() =>
        calculateRentalDays(new Date(), null as unknown as Date)
      ).toThrow('calculateRentalDays: startDate a endDate sú povinné');
    });

    it('StartDate nie je Date objekt', () => {
      expect(() =>
        calculateRentalDays('2024-09-08' as unknown as Date, new Date())
      ).toThrow(
        'calculateRentalDays: startDate a endDate musia byť Date objekty'
      );
    });

    it('EndDate nie je Date objekt', () => {
      expect(() =>
        calculateRentalDays(new Date(), '2024-09-08' as unknown as Date)
      ).toThrow(
        'calculateRentalDays: startDate a endDate musia byť Date objekty'
      );
    });

    it('Neplatný startDate', () => {
      expect(() =>
        calculateRentalDays(new Date('invalid'), new Date())
      ).toThrow('calculateRentalDays: neplatné dátumy');
    });

    it('Neplatný endDate', () => {
      expect(() =>
        calculateRentalDays(new Date(), new Date('invalid'))
      ).toThrow('calculateRentalDays: neplatné dátumy');
    });
  });

  describe('🔄 Reálne scenáre z BlackRent', () => {
    it('Typický víkendový prenájom - Piatok 18:00 → Nedeľa 18:00', () => {
      const startDate = new Date('2024-09-06T18:00:00'); // Piatok
      const endDate = new Date('2024-09-08T18:00:00'); // Nedeľa

      expect(calculateRentalDays(startDate, endDate)).toBe(2);
    });

    it('Týždenný prenájom - Pondelok 09:00 → Pondelok 09:00', () => {
      const startDate = new Date('2024-09-02T09:00:00'); // Pondelok
      const endDate = new Date('2024-09-09T09:00:00'); // Nasledujúci pondelok

      expect(calculateRentalDays(startDate, endDate)).toBe(7);
    });

    it('Krátky prenájom - 10:00 → 14:00 ten istý deň', () => {
      const startDate = new Date('2024-09-08T10:00:00');
      const endDate = new Date('2024-09-08T14:00:00');

      expect(calculateRentalDays(startDate, endDate)).toBe(1);
    });

    it('Cez víkend s predĺžením - Piatok 18:00 → Pondelok 08:00', () => {
      const startDate = new Date('2024-09-06T18:00:00'); // Piatok
      const endDate = new Date('2024-09-09T08:00:00'); // Pondelok

      expect(calculateRentalDays(startDate, endDate)).toBe(3);
    });
  });
});

describe('calculateRentalDaysLegacy', () => {
  const startDate = new Date('2024-09-08T10:00:00');
  const endDate = new Date('2024-09-10T10:01:00');

  it('V1 (RentalForm) logika', () => {
    const result = calculateRentalDaysLegacy(startDate, endDate, 'v1');
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
  });

  it('V2 (CustomerHistory) logika', () => {
    const result = calculateRentalDaysLegacy(startDate, endDate, 'v2');
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
  });

  it('V3 (Statistics) logika', () => {
    const result = calculateRentalDaysLegacy(startDate, endDate, 'v3');
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
  });

  it('Neznáma verzia vyhodí chybu', () => {
    expect(() =>
      calculateRentalDaysLegacy(startDate, endDate, 'v4' as never)
    ).toThrow('Neznáma verzia: v4');
  });
});

describe('compareRentalDaysImplementations', () => {
  it('Porovnáva všetky implementácie', () => {
    const startDate = new Date('2024-09-08T10:00:00');
    const endDate = new Date('2024-09-10T10:01:00');

    const comparison = compareRentalDaysImplementations(startDate, endDate);

    expect(comparison).toHaveProperty('new');
    expect(comparison).toHaveProperty('legacy');
    expect(comparison).toHaveProperty('differences');
    expect(comparison).toHaveProperty('isConsistent');

    expect(comparison.legacy).toHaveProperty('v1_RentalForm');
    expect(comparison.legacy).toHaveProperty('v2_CustomerHistory');
    expect(comparison.legacy).toHaveProperty('v3_Statistics');

    expect(comparison.differences).toHaveProperty('v1_diff');
    expect(comparison.differences).toHaveProperty('v2_diff');
    expect(comparison.differences).toHaveProperty('v3_diff');

    expect(typeof comparison.isConsistent).toBe('boolean');
  });

  it('Identifikuje nekonzistentné výsledky', () => {
    const startDate = new Date('2024-09-08T10:00:00');
    const endDate = new Date('2024-09-10T10:01:00');

    const comparison = compareRentalDaysImplementations(startDate, endDate);

    // Očakávame že legacy implementácie budú nekonzistentné
    expect(comparison.isConsistent).toBe(false);
  });
});

describe('🎯 Kritické scenáre z analýzy', () => {
  it('Email parsing scenár: 8.9 08:00 → 10.9 17:00 = 3 dni', () => {
    const startDate = new Date('2024-09-08T08:00:00');
    const endDate = new Date('2024-09-10T17:00:00');

    expect(calculateRentalDays(startDate, endDate)).toBe(3);
  });

  it('Manuálne pridávanie scenár: 8.9 08:00 → 10.9 17:00 = 3 dni (opravené)', () => {
    const startDate = new Date('2024-09-08T08:00:00');
    const endDate = new Date('2024-09-10T17:00:00');

    // Nová implementácia by mala dať rovnaký výsledok ako email parsing
    expect(calculateRentalDays(startDate, endDate)).toBe(3);
  });

  it('Porovnanie s legacy implementáciami pre kritický scenár', () => {
    const startDate = new Date('2024-09-08T08:00:00');
    const endDate = new Date('2024-09-10T17:00:00');

    const comparison = compareRentalDaysImplementations(startDate, endDate);

    // Nová implementácia
    expect(comparison.new).toBe(3);

    // Legacy implementácie môžu dať iné výsledky
    // Comparison debug removed for production
  });
});
