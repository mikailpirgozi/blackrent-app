import { apiService } from '@/services/api';
import type { Rental } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../queryKeys';

// Filter interface pre rentals
export interface RentalFilters {
  status?: string;
  vehicleId?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// GET rentals
export function useRentals(filters?: RentalFilters) {
  return useQuery({
    queryKey: queryKeys.rentals.list(filters as Record<string, unknown>),
    queryFn: () => apiService.getRentals(),
    staleTime: 0, // ✅ FIX: 0s pre okamžité real-time updates (bolo 1 min)
    gcTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 30000, // Auto-refresh každých 30 sekúnd
    select: (data: Rental[]) => {
      if (!filters) return data;

      return data.filter(rental => {
        if (filters.status && rental.status !== filters.status) return false;
        if (filters.vehicleId && rental.vehicleId !== filters.vehicleId)
          return false;
        if (filters.customerId && rental.customerId !== filters.customerId)
          return false;
        if (
          filters.dateFrom &&
          new Date(rental.startDate) < new Date(filters.dateFrom)
        )
          return false;
        if (
          filters.dateTo &&
          new Date(rental.endDate) > new Date(filters.dateTo)
        )
          return false;
        if (filters.search) {
          const search = filters.search.toLowerCase();
          return (
            rental.customerName.toLowerCase().includes(search) ||
            rental.orderNumber?.toLowerCase().includes(search) ||
            rental.vehicle?.brand.toLowerCase().includes(search) ||
            rental.vehicle?.model.toLowerCase().includes(search) ||
            rental.vehicle?.licensePlate.toLowerCase().includes(search)
          );
        }
        return true;
      });
    },
  });
}

// GET single rental
export function useRental(id: string) {
  return useQuery({
    queryKey: queryKeys.rentals.detail(id),
    queryFn: () => apiService.getRental(id),
    enabled: !!id,
    staleTime: 0, // ✅ FIX: 0s pre okamžité real-time updates
    gcTime: 0,
    refetchOnMount: 'always',
  });
}

// GET rentals by vehicle
export function useRentalsByVehicle(vehicleId: string) {
  return useQuery({
    queryKey: queryKeys.rentals.byVehicle(vehicleId),
    queryFn: () => apiService.getRentals(),
    enabled: !!vehicleId,
    select: (data: Rental[]) =>
      data.filter(rental => rental.vehicleId === vehicleId),
  });
}

// GET rentals by customer
export function useRentalsByCustomer(customerId: string) {
  return useQuery({
    queryKey: queryKeys.rentals.byCustomer(customerId),
    queryFn: () => apiService.getRentals(),
    enabled: !!customerId,
    select: (data: Rental[]) =>
      data.filter(rental => rental.customerId === customerId),
  });
}

// CREATE rental
export function useCreateRental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rental: Rental) => apiService.createRental(rental),
    onSuccess: data => {
      // Trigger WebSocket notification
      window.dispatchEvent(new CustomEvent('rental-created', { detail: data }));

      // ⚡ OPTIMISTIC UPDATE: Trigger event for useInfiniteRentals
      window.dispatchEvent(
        new CustomEvent('rental-optimistic-update', {
          detail: { rental: data, action: 'create' },
        })
      );
    },
    onSettled: () => {
      // ✅ CRITICAL FIX: Invalidate all rental queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.rentals.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.all,
      });
    },
  });
}

// UPDATE rental
export function useUpdateRental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rental: Rental) => apiService.updateRental(rental),
    onSuccess: data => {
      // Trigger WebSocket notification
      window.dispatchEvent(new CustomEvent('rental-updated', { detail: data }));

      // ⚡ OPTIMISTIC UPDATE: Trigger event for useInfiniteRentals
      window.dispatchEvent(
        new CustomEvent('rental-optimistic-update', {
          detail: { rental: data, action: 'update' },
        })
      );
    },
    onSettled: (_data, _error, variables) => {
      // ✅ CRITICAL FIX: Invalidate all rental queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.rentals.all,
      });

      // Invaliduj vehicle availability
      if (variables.vehicleId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.vehicles.availability(variables.vehicleId),
        });
      }
    },
  });
}

// DELETE rental
export function useDeleteRental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteRental(id),
    onSuccess: (_data, deletedId) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('rental-deleted', { detail: { id: deletedId } })
      );

      // ⚡ OPTIMISTIC UPDATE: Trigger event for useInfiniteRentals
      window.dispatchEvent(
        new CustomEvent('rental-optimistic-update', {
          detail: { rental: { id: deletedId }, action: 'delete' },
        })
      );
    },
    onSettled: () => {
      // ✅ CRITICAL FIX: Invalidate all rental queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.rentals.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.all,
      });
    },
  });
}
