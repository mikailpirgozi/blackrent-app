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
    // ⚡ OPTIMIZED: Smart caching pre okamžitý UX
    staleTime: 10 * 60 * 1000, // 10 minút - consider data fresh
    gcTime: 15 * 60 * 1000, // 15 minút - keep in memory
    refetchOnMount: false, // ✅ Don't refetch if data is fresh
    refetchOnWindowFocus: true, // ✅ Refetch when user returns to tab
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
    onMutate: async newVehicle => {
      // Cancel queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.vehicles.all,
      });

      // Optimistická aktualizácia
      const previousVehicles = queryClient.getQueryData(
        queryKeys.vehicles.lists()
      );

      const optimisticVehicle = {
        ...newVehicle,
        id: `temp-${Date.now()}`,
      };

      queryClient.setQueryData(
        queryKeys.vehicles.lists(),
        (old: Vehicle[] = []) => [...old, optimisticVehicle as Vehicle]
      );

      return { previousVehicles };
    },
    onError: (_err, _newVehicle, context) => {
      // Rollback pri chybe
      if (context?.previousVehicles) {
        queryClient.setQueryData(
          queryKeys.vehicles.lists(),
          context.previousVehicles
        );
      }
    },
    onSuccess: data => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('vehicle-created', { detail: data })
      );
    },
    onSettled: () => {
      // Refresh po dokončení
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.all,
      });
      // ✅ Invaliduj Service Worker cache
      swCacheInvalidators.vehicles();
    },
  });
}

// UPDATE vehicle
export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vehicle: Vehicle) => apiService.updateVehicle(vehicle),
    onMutate: async updatedVehicle => {
      // Cancel queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.vehicles.detail(updatedVehicle.id),
      });

      // Optimistická aktualizácia detailu
      const previousVehicle = queryClient.getQueryData(
        queryKeys.vehicles.detail(updatedVehicle.id)
      );

      queryClient.setQueryData(
        queryKeys.vehicles.detail(updatedVehicle.id),
        updatedVehicle
      );

      // Optimistická aktualizácia listu
      queryClient.setQueryData(
        queryKeys.vehicles.lists(),
        (old: Vehicle[] = []) =>
          old.map(v => (v.id === updatedVehicle.id ? updatedVehicle : v))
      );

      return { previousVehicle };
    },
    onError: (_err, _updatedVehicle, context) => {
      // Rollback
      if (context?.previousVehicle) {
        queryClient.setQueryData(
          queryKeys.vehicles.detail(_updatedVehicle.id),
          context.previousVehicle
        );
      }
    },
    onSuccess: data => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('vehicle-updated', { detail: data })
      );
    },
    onSettled: (_data, _error, variables) => {
      // Refresh
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.lists(),
      });
      // ✅ Invaliduj Service Worker cache
      swCacheInvalidators.vehicles();
    },
  });
}

// DELETE vehicle
export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteVehicle(id),
    onMutate: async deletedId => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.vehicles.all,
      });

      const previousVehicles = queryClient.getQueryData(
        queryKeys.vehicles.lists()
      );

      queryClient.setQueryData(
        queryKeys.vehicles.lists(),
        (old: Vehicle[] = []) => old.filter(v => v.id !== deletedId)
      );

      return { previousVehicles };
    },
    onError: (_err, _deletedId, context) => {
      if (context?.previousVehicles) {
        queryClient.setQueryData(
          queryKeys.vehicles.lists(),
          context.previousVehicles
        );
      }
    },
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
