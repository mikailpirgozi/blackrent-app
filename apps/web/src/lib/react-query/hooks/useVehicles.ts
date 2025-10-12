import { apiService } from '@/services/api';
import type { Vehicle } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Declare browser APIs
declare const CustomEvent: new <T>(
  event: string,
  eventInitDict?: CustomEventInit<T>
) => Event;
import { queryKeys } from '../queryKeys';
import { swCacheInvalidators } from '../invalidateServiceWorkerCache';
// import { CACHE_TIMES } from '../queryClient'; // Disabled for platform isolation debugging

// Filter interface pre vehicles
export interface VehicleFilters {
  status?: string;
  company?: string;
  search?: string;
  category?: string;
  includeRemoved?: boolean;
  includePrivate?: boolean;
}

// GET vehicles
export function useVehicles(filters?: VehicleFilters) {
  return useQuery({
    queryKey: queryKeys.vehicles.list(filters as Record<string, unknown>),
    queryFn: () =>
      apiService.getVehicles({
        includeRemoved: filters?.includeRemoved,
        includePrivate: filters?.includePrivate,
      }),
    // 🔍 DEBUG: Disable cache to test platform isolation
    staleTime: 0, // Force refetch every time
    gcTime: 0,
    refetchOnMount: 'always', // Always refetch on mount
    // Real-time updates handled by WebSocket invalidation
    select: (data: Vehicle[]) => {
      // Tu môžeme aplikovať filtrovanie
      if (!filters) return data;

      return data.filter(vehicle => {
        if (filters.status && vehicle.status !== filters.status) return false;
        if (filters.company && vehicle.company !== filters.company)
          return false;
        if (filters.category && vehicle.category !== filters.category)
          return false;
        if (filters.search) {
          const search = filters.search.toLowerCase();
          return (
            vehicle.brand.toLowerCase().includes(search) ||
            vehicle.model.toLowerCase().includes(search) ||
            vehicle.licensePlate.toLowerCase().includes(search)
          );
        }
        return true;
      });
    },
  });
}

// GET single vehicle
export function useVehicle(id: string) {
  return useQuery({
    queryKey: queryKeys.vehicles.detail(id),
    queryFn: () => apiService.getVehicle(id),
    enabled: !!id, // Len ak máme ID
  });
}

// CREATE vehicle
export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vehicle: Vehicle) => apiService.createVehicle(vehicle),
    onSuccess: data => {
      // Trigger WebSocket notification (background)
      window.dispatchEvent(
        new CustomEvent('vehicle-created', { detail: data })
      );
    },
    onSettled: () => {
      // ✅ CRITICAL FIX: Invalidate all vehicle queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.all,
      });

      // ✅ Background Service Worker cache invalidation
      setTimeout(() => {
        swCacheInvalidators.vehicles();
      }, 100);
    },
  });
}

// UPDATE vehicle
export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vehicle: Vehicle) => apiService.updateVehicle(vehicle),
    onSuccess: (data: void | Vehicle) => {
      // Trigger WebSocket notification (background)
      window.dispatchEvent(
        new CustomEvent('vehicle-updated', { detail: data })
      );
    },
    onSettled: () => {
      // ✅ CRITICAL FIX: Invalidate all vehicle queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.all,
      });

      // ✅ Background Service Worker cache invalidation
      setTimeout(() => {
        swCacheInvalidators.vehicles();
      }, 100);
    },
  });
}

// DELETE vehicle
export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteVehicle(id),
    onSuccess: (_data, deletedId) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('vehicle-deleted', { detail: { id: deletedId } })
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.all,
      });
      // ✅ Invaliduj Service Worker cache
      swCacheInvalidators.vehicles();
    },
  });
}
