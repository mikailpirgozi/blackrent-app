/**
 * 🧪 TESTOVANIE RENTAL STATUS UTILITIES
 * 
 * Testuje logiku výpočtu statusu prenájmu založenú na aktuálnom dátume
 */

import { 
  calculateRentalStatus, 
  getRentalStatusCounts, 
  getRentalPriority,
  isRentalOverdue,
  getRentalStatusText,
  getRentalStatusColor
} from '../rentalStatusUtils';
import type { Rental } from '../../types';

// Test data
const createTestRental = (overrides: Partial<Rental> = {}): Rental => ({
  id: 'test-rental-1',
  customerName: 'Test Customer',
  startDate: new Date('2024-01-10T10:00:00'),
  endDate: new Date('2024-01-15T10:00:00'),
  totalPrice: 100,
  commission: 10,
  paymentMethod: 'cash',
  createdAt: new Date('2024-01-01T10:00:00'),
  ...overrides
});

describe('calculateRentalStatus', () => {
  it('should return "pending" for future rentals', () => {
    const rental = createTestRental({
      startDate: new Date('2024-12-01T10:00:00'),
      endDate: new Date('2024-12-05T10:00:00')
    });
    const currentDate = new Date('2024-01-15T10:00:00');
    
    expect(calculateRentalStatus(rental, currentDate)).toBe('pending');
  });

  it('should return "active" for current rentals', () => {
    const rental = createTestRental({
      startDate: new Date('2024-01-10T10:00:00'),
      endDate: new Date('2024-01-20T10:00:00')
    });
    const currentDate = new Date('2024-01-15T10:00:00');
    
    expect(calculateRentalStatus(rental, currentDate)).toBe('active');
  });

  it('should return "finished" for past rentals', () => {
    const rental = createTestRental({
      startDate: new Date('2024-01-01T10:00:00'),
      endDate: new Date('2024-01-05T10:00:00')
    });
    const currentDate = new Date('2024-01-15T10:00:00');
    
    expect(calculateRentalStatus(rental, currentDate)).toBe('finished');
  });

  // it('should return "cancelled" for explicitly cancelled rentals', () => {
  //   const rental = createTestRental({
  //     status: 'cancelled',
  //     startDate: new Date('2024-01-10T10:00:00'),
  //     endDate: new Date('2024-01-15T10:00:00')
  //   });
  //   const currentDate = new Date('2024-01-15T10:00:00');
  //   
  //   expect(calculateRentalStatus(rental, currentDate)).toBe('cancelled');
  // });

  it('should handle edge case - rental starting today', () => {
    const currentDate = new Date('2024-01-15T10:00:00');
    const rental = createTestRental({
      startDate: currentDate,
      endDate: new Date('2024-01-20T10:00:00')
    });
    
    expect(calculateRentalStatus(rental, currentDate)).toBe('active');
  });

  it('should handle edge case - rental ending today', () => {
    const currentDate = new Date('2024-01-15T10:00:00');
    const rental = createTestRental({
      startDate: new Date('2024-01-10T10:00:00'),
      endDate: currentDate
    });
    
    expect(calculateRentalStatus(rental, currentDate)).toBe('active');
  });

  it('should handle string dates', () => {
    const rental = createTestRental({
      startDate: '2024-01-10T10:00:00',
      endDate: '2024-01-20T10:00:00'
    });
    const currentDate = new Date('2024-01-15T10:00:00');
    
    expect(calculateRentalStatus(rental, currentDate)).toBe('active');
  });
});

describe('getRentalStatusCounts', () => {
  it('should count rentals by status correctly', () => {
    const rentals = [
      createTestRental({ id: '1', startDate: new Date('2024-12-01'), endDate: new Date('2024-12-05') }), // pending
      createTestRental({ id: '2', startDate: new Date('2024-01-10'), endDate: new Date('2024-01-20') }), // active
      createTestRental({ id: '3', startDate: new Date('2024-01-01'), endDate: new Date('2024-01-05') }), // finished
    ];
    const currentDate = new Date('2024-01-15T10:00:00');
    
    const counts = getRentalStatusCounts(rentals, currentDate);
    
    expect(counts.pending).toBe(1);
    expect(counts.active).toBe(1);
    expect(counts.finished).toBe(1);
  });
});

describe('getRentalPriority', () => {
  it('should return correct priorities for sorting', () => {
    const currentDate = new Date('2024-01-15T10:00:00');
    
    const activeRental = createTestRental({
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-01-20')
    });
    
    const pendingRental = createTestRental({
      startDate: new Date('2024-12-01'),
      endDate: new Date('2024-12-05')
    });
    
    const finishedRental = createTestRental({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-05')
    });
    
    // const cancelledRental = createTestRental({
    //   status: 'cancelled',
    //   startDate: new Date('2024-01-10'),
    //   endDate: new Date('2024-01-15')
    // });
    
    expect(getRentalPriority(activeRental, currentDate)).toBe(1); // highest priority
    expect(getRentalPriority(pendingRental, currentDate)).toBe(2);
    expect(getRentalPriority(finishedRental, currentDate)).toBe(3); // lowest priority
  });
});

describe('isRentalOverdue', () => {
  it('should return true for finished rentals without return protocol', () => {
    const rental = createTestRental({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-05')
    });
    const currentDate = new Date('2024-01-15T10:00:00');
    const protocols = {};
    
    expect(isRentalOverdue(rental, protocols, currentDate)).toBe(true);
  });

  it('should return false for finished rentals with return protocol', () => {
    const rental = createTestRental({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-05')
    });
    const currentDate = new Date('2024-01-15T10:00:00');
    const protocols = {
      'test-rental-1': {
        return: { id: 'return-protocol-1' }
      }
    };
    
    expect(isRentalOverdue(rental, protocols, currentDate)).toBe(false);
  });

  it('should return false for active rentals', () => {
    const rental = createTestRental({
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-01-20')
    });
    const currentDate = new Date('2024-01-15T10:00:00');
    const protocols = {};
    
    expect(isRentalOverdue(rental, protocols, currentDate)).toBe(false);
  });
});

describe('getRentalStatusText', () => {
  it('should return correct Slovak text for each status', () => {
    expect(getRentalStatusText('pending')).toBe('Čakajúci');
    expect(getRentalStatusText('active')).toBe('Aktívny');
    expect(getRentalStatusText('finished')).toBe('Ukončený');
  });
});

describe('getRentalStatusColor', () => {
  it('should return correct CSS classes for each status', () => {
    expect(getRentalStatusColor('pending')).toBe('bg-yellow-100 text-yellow-800');
    expect(getRentalStatusColor('active')).toBe('bg-green-100 text-green-800');
    expect(getRentalStatusColor('finished')).toBe('bg-gray-100 text-gray-800');
  });
});
