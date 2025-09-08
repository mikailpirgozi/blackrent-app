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
    staleTime: 1 * 60 * 1000, // 1 minúta - rentals sa menia často
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

// CREATE rental s optimistickými updates
export function useCreateRental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rental: Rental) => apiService.createRental(rental),
    onMutate: async newRental => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.rentals.all,
      });

      const previousRentals = queryClient.getQueryData(
        queryKeys.rentals.lists()
      );

      const optimisticRental = {
        ...newRental,
        id: `temp-${Date.now()}`,
        status: 'pending' as const,
        createdAt: new Date(),
      };

      queryClient.setQueryData(
        queryKeys.rentals.lists(),
        (old: Rental[] = []) => [optimisticRental as Rental, ...old]
      );

      // Invaliduj vehicle availability
      if (newRental.vehicleId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.vehicles.availability(newRental.vehicleId),
        });
      }

      return { previousRentals };
    },
    onError: (err, newRental, context) => {
      if (context?.previousRentals) {
        queryClient.setQueryData(
          queryKeys.rentals.lists(),
          context.previousRentals
        );
      }
    },
    onSuccess: data => {
      // Trigger WebSocket notification
      window.dispatchEvent(new CustomEvent('rental-created', { detail: data }));
    },
    onSettled: () => {
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
    onMutate: async updatedRental => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.rentals.detail(updatedRental.id),
      });

      const previousRental = queryClient.getQueryData(
        queryKeys.rentals.detail(updatedRental.id)
      );

      // Update detail
      queryClient.setQueryData(
        queryKeys.rentals.detail(updatedRental.id),
        updatedRental
      );

      // Update list
      queryClient.setQueryData(
        queryKeys.rentals.lists(),
        (old: Rental[] = []) =>
          old.map(r => (r.id === updatedRental.id ? updatedRental : r))
      );

      return { previousRental };
    },
    onError: (err, updatedRental, context) => {
      if (context?.previousRental) {
        queryClient.setQueryData(
          queryKeys.rentals.detail(updatedRental.id),
          context.previousRental
        );
      }
    },
    onSuccess: data => {
      // Trigger WebSocket notification
      window.dispatchEvent(new CustomEvent('rental-updated', { detail: data }));
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.rentals.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.rentals.lists(),
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
    onMutate: async deletedId => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.rentals.all,
      });

      const previousRentals = queryClient.getQueryData(
        queryKeys.rentals.lists()
      );

      queryClient.setQueryData(
        queryKeys.rentals.lists(),
        (old: Rental[] = []) => old.filter(r => r.id !== deletedId)
      );

      return { previousRentals };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousRentals) {
        queryClient.setQueryData(
          queryKeys.rentals.lists(),
          context.previousRentals
        );
      }
    },
    onSuccess: (data, deletedId) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('rental-deleted', { detail: { id: deletedId } })
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.rentals.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.all,
      });
    },
  });
}
