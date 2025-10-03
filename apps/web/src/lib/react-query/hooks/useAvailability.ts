import { apiService } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { queryKeys } from '../queryKeys';

// Types
export interface CalendarVehicle {
  vehicleId: number;
  vehicleName: string;
  licensePlate: string;
  status: 'available' | 'rented' | 'flexible' | 'maintenance' | 'unavailable';
  rentalId?: number;
  customerName?: string;
  isFlexible?: boolean;
  unavailabilityType?: string;
  unavailabilityReason?: string;
}

export interface CalendarDay {
  date: string;
  vehicles: CalendarVehicle[];
}

export interface CalendarData {
  calendar: CalendarDay[];
  vehicles: Array<{
    id: number;
    brand: string;
    model: string;
    licensePlate: string;
    status: string;
  }>;
  rentals?: Record<string, unknown>[];
  unavailabilities?: Record<string, unknown>[];
}

// GET availability calendar data
export function useAvailabilityCalendar(month: Date) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  const startDate = format(monthStart, 'yyyy-MM-dd');
  const endDate = format(monthEnd, 'yyyy-MM-dd');

  return useQuery({
    queryKey: queryKeys.availability.calendar(startDate, endDate),
    queryFn: async () => {
      console.log('📅 Loading calendar data for:', startDate, 'to', endDate);

      const calendarData = await apiService.get<CalendarData>(
        `/availability/calendar?startDate=${startDate}&endDate=${endDate}`
      );

      if (!calendarData) {
        throw new Error('Failed to load calendar data');
      }

      console.log('✅ Calendar data loaded:', calendarData);
      return calendarData;
    },
    staleTime: 0, // ✅ FIX: 0s pre okamžité real-time updates (bolo 1 min)
    gcTime: 0,
    refetchOnMount: 'always', // ✅ Availability musí byť vždy fresh!
    refetchInterval: 30000, // Auto-refresh každých 30 sekúnd
    refetchOnWindowFocus: true, // Refresh pri focus
    retry: (failureCount, error) => {
      // Neretryuj 401/403 errory
      if (error instanceof Error) {
        const message = error.message;
        if (message.includes('401') || message.includes('403')) {
          return false;
        }
      }
      // Max 3 retry
      return failureCount < 3;
    },
  });
}
