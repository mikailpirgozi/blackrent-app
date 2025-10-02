import { describe, expect, it } from 'vitest';
import type { Rental } from '../../types';
import {
  calculateNextRentalPeriod,
  createClonedRental,
  formatPeriodType,
  getCloneDescription,
  validateCloneDates,
} from '../rentalCloneUtils';

describe('rentalCloneUtils', () => {
  describe('calculateNextRentalPeriod', () => {
    it('should handle daily rentals correctly', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-02'); // 1 day

      const result = calculateNextRentalPeriod(startDate, endDate);

      expect(result.periodType).toBe('daily');
      expect(result.originalDuration).toBe(1);
      expect(result.newStartDate).toEqual(new Date('2025-01-03'));
      expect(result.newEndDate).toEqual(new Date('2025-01-04'));
    });

    it('should handle weekly rentals correctly', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-08'); // 7 days

      const result = calculateNextRentalPeriod(startDate, endDate);

      expect(result.periodType).toBe('weekly');
      expect(result.originalDuration).toBe(7);
      expect(result.newStartDate).toEqual(new Date('2025-01-09'));
      expect(result.newEndDate).toEqual(new Date('2025-01-16'));
    });

    it('should handle monthly rentals correctly', () => {
      const startDate = new Date('2025-01-01T00:00:00.000Z');
      const endDate = new Date('2025-01-31T00:00:00.000Z'); // 30 days (monthly)

      const result = calculateNextRentalPeriod(startDate, endDate);

      expect(result.periodType).toBe('monthly');
      expect(result.originalDuration).toBe(30);
      // Nový začiatok = pôvodný koniec (31.1.)
      expect(result.newStartDate).toEqual(new Date('2025-01-31T00:00:00.000Z'));
      // 31. január je posledný deň mesiaca, takže 28. február je posledný deň februára
      expect(result.newEndDate).toEqual(new Date('2025-02-28T00:00:00.000Z')); // February has 28 days
    });

    it('should handle monthly rentals with regular day correctly', () => {
      const startDate = new Date('2025-09-05T08:00:00.000Z');
      const endDate = new Date('2025-10-05T08:00:00.000Z'); // 30 days (monthly)

      const result = calculateNextRentalPeriod(startDate, endDate);

      expect(result.periodType).toBe('monthly');
      expect(result.originalDuration).toBe(30);
      // Nový začiatok = pôvodný koniec (5.10. 08:00)
      expect(result.newStartDate).toEqual(new Date('2025-10-05T08:00:00.000Z'));
      // Nový koniec = +1 mesiac (5.11. 08:00)
      expect(result.newEndDate.toDateString()).toEqual(
        new Date('2025-11-05T08:00:00.000Z').toDateString()
      );
    });

    it('should handle custom duration rentals', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-11'); // 10 days (custom)

      const result = calculateNextRentalPeriod(startDate, endDate);

      expect(result.periodType).toBe('custom');
      expect(result.originalDuration).toBe(10);
      expect(result.newStartDate).toEqual(new Date('2025-01-12'));
      expect(result.newEndDate).toEqual(new Date('2025-01-22'));
    });
  });

  describe('createClonedRental', () => {
    const mockRental: Rental = {
      id: 'test-id',
      customerName: 'Test Customer',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
      totalPrice: 1000,
      commission: 100,
      paymentMethod: 'cash',
      createdAt: new Date(),
      status: 'active',
      paid: true,
      confirmed: true,
      handoverProtocolId: 'handover-123',
      returnProtocolId: 'return-123',
      deposit: 500,
      allowedKilometers: 1000,
    };

    it('should create cloned rental with new dates and reset statuses', () => {
      const cloneResult = {
        newStartDate: new Date('2025-02-01'),
        newEndDate: new Date('2025-02-28'),
        periodType: 'monthly' as const,
        originalDuration: 30,
      };

      const cloned = createClonedRental(mockRental, cloneResult);

      // Check new dates
      expect(cloned.startDate).toEqual(cloneResult.newStartDate);
      expect(cloned.endDate).toEqual(cloneResult.newEndDate);

      // Check preserved data
      expect(cloned.customerName).toBe(mockRental.customerName);
      expect(cloned.totalPrice).toBe(mockRental.totalPrice);
      expect(cloned.commission).toBe(mockRental.commission);
      expect(cloned.deposit).toBe(mockRental.deposit);
      expect(cloned.allowedKilometers).toBe(mockRental.allowedKilometers);

      // Check reset statuses
      expect(cloned.status).toBe('pending');
      expect(cloned.paid).toBe(false);
      expect(cloned.confirmed).toBe(false);
      expect(cloned.handoverProtocolId).toBeUndefined();
      expect(cloned.returnProtocolId).toBeUndefined();

      // Check reset ID
      expect(cloned.id).toBeUndefined();
    });
  });

  describe('formatPeriodType', () => {
    it('should format period types correctly', () => {
      expect(formatPeriodType('daily')).toBe('Denný prenájom');
      expect(formatPeriodType('weekly')).toBe('Týždenný prenájom');
      expect(formatPeriodType('monthly')).toBe('Mesačný prenájom');
      expect(formatPeriodType('custom')).toBe('Vlastná dĺžka');
    });
  });

  describe('validateCloneDates', () => {
    it('should validate future dates as valid', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const cloneResult = {
        newStartDate: futureDate,
        newEndDate: new Date(futureDate.getTime() + 24 * 60 * 60 * 1000), // +1 day
        periodType: 'daily' as const,
        originalDuration: 1,
      };

      expect(validateCloneDates(cloneResult)).toBe(true);
    });

    it('should invalidate past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const cloneResult = {
        newStartDate: pastDate,
        newEndDate: new Date(),
        periodType: 'daily' as const,
        originalDuration: 1,
      };

      expect(validateCloneDates(cloneResult)).toBe(false);
    });
  });

  describe('getCloneDescription', () => {
    it('should generate correct description', () => {
      const rental: Rental = {
        id: 'test',
        customerName: 'Test',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        totalPrice: 1000,
        commission: 100,
        paymentMethod: 'cash',
        createdAt: new Date(),
      };

      const cloneResult = {
        newStartDate: new Date('2025-02-01'),
        newEndDate: new Date('2025-02-28'),
        periodType: 'monthly' as const,
        originalDuration: 30,
      };

      const description = getCloneDescription(rental, cloneResult);

      expect(description).toContain('1. 1. 2025');
      expect(description).toContain('31. 1. 2025');
      expect(description).toContain('1. 2. 2025');
      expect(description).toContain('28. 2. 2025');
      expect(description).toContain('Mesačný prenájom');
    });
  });
});
