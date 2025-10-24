import { apiService } from '@/services/api';
import type { Insurance } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { useInvalidateEntity } from './useBulkDataLoader';
import { swCacheInvalidators } from '../invalidateServiceWorkerCache';
import { logger } from '@/utils/smartLogger';

export interface InsuranceFilters extends Record<string, unknown> {
  search?: string;
  type?: string;
  company?: string;
  status?: 'valid' | 'expiring' | 'expired' | 'all';
  vehicleId?: string;
}

// 🔧 SCHEMA VERSION: Increment this when database schema changes (INTEGER vs UUID)
const INSURANCE_SCHEMA_VERSION = '4'; // 🔥 FORCE RELOAD: Clear React Query cache with INTEGER IDs

// 🔥 AGGRESSIVE CACHE CLEARING: Clear on version mismatch
if (typeof window !== 'undefined') {
  const storedVersion = localStorage.getItem('insurance_schema_version');

  // 🔧 CRITICAL FIX: Only reload ONCE per session
  const hasReloadedThisSession = sessionStorage.getItem(
    'insurance_cache_reloaded'
  );

  if (storedVersion !== INSURANCE_SCHEMA_VERSION && !hasReloadedThisSession) {
    console.log('🔧 Insurance schema version changed, clearing ALL caches...');
    console.log(
      `   Old version: ${storedVersion}, New version: ${INSURANCE_SCHEMA_VERSION}`
    );

    // Mark that we're about to reload
    sessionStorage.setItem('insurance_cache_reloaded', 'true');

    // Clear localStorage insurance data
    localStorage.removeItem('insurance_schema_version');
    localStorage.removeItem('insurances');

    // Set new version BEFORE reload
    localStorage.setItem('insurance_schema_version', INSURANCE_SCHEMA_VERSION);

    console.log('✅ All caches cleared, page will reload...');
    // Force page reload to clear React Query cache
    window.location.reload();
  }
}

// GET insurances
export function useInsurances(filters?: InsuranceFilters) {
  return useQuery({
    queryKey: queryKeys.insurances.list(filters),
    queryFn: () => apiService.getInsurances(),
    staleTime: 0, // Vždy fresh data po invalidácii
    gcTime: 0, // ✅ CRITICAL FIX: No GC cache
    refetchOnMount: 'always', // ✅ Vždy refetch pri mount
    select: data => {
      if (!filters) return data;

      return data.filter(insurance => {
        if (filters.type && insurance.type !== filters.type) return false;
        if (filters.company && insurance.company !== filters.company)
          return false;
        if (filters.vehicleId && insurance.vehicleId !== filters.vehicleId)
          return false;
        if (filters.search) {
          const search = filters.search.toLowerCase();
          return (
            insurance.policyNumber.toLowerCase().includes(search) ||
            insurance.company.toLowerCase().includes(search) ||
            insurance.type.toLowerCase().includes(search)
          );
        }
        return true;
      });
    },
  });
}

// GET insurances paginated
export function useInsurancesPaginated(params: {
  page: number;
  limit: number;
  search?: string;
  type?: string;
  company?: string;
  status?: string;
  vehicleId?: string;
  sortBy?: string;
  sortOrder?: string;
}) {
  return useQuery({
    queryKey: queryKeys.insurances.paginated(params),
    queryFn: () => apiService.getInsurancesPaginated(params),
    staleTime: 0, // Vždy fresh data po invalidácii
    placeholderData: previousData => previousData, // Pre smooth pagination
  });
}

// GET single insurance
export function useInsurance(id: string) {
  return useQuery({
    queryKey: queryKeys.insurances.detail(id),
    queryFn: () =>
      apiService
        .getInsurances()
        .then(insurances => insurances.find(insurance => insurance.id === id)),
    enabled: !!id,
  });
}

// GET insurances by vehicle
export function useInsurancesByVehicle(vehicleId: string) {
  return useQuery({
    queryKey: queryKeys.insurances.byVehicle(vehicleId),
    queryFn: () => apiService.getInsurances(),
    enabled: !!vehicleId,
    select: data => data.filter(insurance => insurance.vehicleId === vehicleId),
    staleTime: 0, // Vždy fresh data po invalidácii
  });
}

// CREATE insurance
export function useCreateInsurance() {
  const queryClient = useQueryClient();
  const { invalidateInsurance } = useInvalidateEntity();

  return useMutation({
    mutationFn: (insurance: Insurance) => {
      logger.debug('🚀 CREATE INSURANCE: Sending to server:', insurance);
      return apiService.createInsurance(insurance);
    },
    onMutate: async newInsurance => {
      logger.debug('🔄 CREATE INSURANCE: onMutate called with:', newInsurance);
      // Cancel queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.insurances.all,
      });

      // Optimistická aktualizácia
      const previousInsurances = queryClient.getQueryData(
        queryKeys.insurances.lists()
      );

      const optimisticInsurance = {
        ...newInsurance,
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
      };

      queryClient.setQueryData(
        queryKeys.insurances.lists(),
        (old: Insurance[] = []) => [...old, optimisticInsurance as Insurance]
      );

      // Update vehicle-specific cache
      if (newInsurance.vehicleId) {
        queryClient.setQueryData(
          queryKeys.insurances.byVehicle(newInsurance.vehicleId),
          (old: Insurance[] = []) => [...old, optimisticInsurance as Insurance]
        );
      }

      // Update ALL paginated queries
      queryClient.setQueriesData(
        { queryKey: queryKeys.insurances.paginated() },
        (old: unknown) => {
          const oldData = old as
            | { insurances?: Insurance[]; pagination?: { totalItems?: number } }
            | undefined;
          if (oldData?.insurances) {
            return {
              ...oldData,
              insurances: [
                optimisticInsurance as Insurance,
                ...oldData.insurances,
              ],
              pagination: {
                ...oldData.pagination,
                totalItems: (oldData.pagination?.totalItems || 0) + 1,
              },
            };
          }
          return old;
        }
      );

      return { previousInsurances };
    },
    onError: (_err, _newInsurance, context) => {
      console.error('❌ CREATE INSURANCE: Error occurred:', _err);
      // Rollback pri chybe
      if (context?.previousInsurances) {
        queryClient.setQueryData(
          queryKeys.insurances.lists(),
          context.previousInsurances
        );
      }
    },
    onSuccess: (_data, variables) => {
      logger.debug('✅ CREATE INSURANCE: Success!', _data);
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('insurance-created', { detail: variables })
      );
    },
    onSettled: data => {
      // Always invalidate to get fresh data from server
      queryClient.invalidateQueries({
        queryKey: queryKeys.insurances.all,
      });
      // Invalidate specific insurance cache
      if (data && typeof data === 'object' && 'id' in data) {
        invalidateInsurance((data as Insurance).id);
      }
      // ✅ Invaliduj Service Worker cache
      swCacheInvalidators.insurances();
    },
  });
}

// UPDATE insurance
export function useUpdateInsurance() {
  const queryClient = useQueryClient();
  const { invalidateInsurance } = useInvalidateEntity();

  return useMutation({
    mutationFn: (insurance: Insurance) => {
      logger.debug('🚀 UPDATE INSURANCE: Sending to server:', insurance);
      return apiService.updateInsurance(insurance.id, insurance);
    },
    onMutate: async updatedInsurance => {
      logger.debug(
        '🔄 UPDATE INSURANCE: onMutate called with:',
        updatedInsurance
      );
      // Cancel queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.insurances.detail(updatedInsurance.id),
      });

      // Optimistická aktualizácia detailu
      const previousInsurance = queryClient.getQueryData(
        queryKeys.insurances.detail(updatedInsurance.id)
      );

      queryClient.setQueryData(
        queryKeys.insurances.detail(updatedInsurance.id),
        updatedInsurance
      );

      // Optimistická aktualizácia listu
      queryClient.setQueryData(
        queryKeys.insurances.lists(),
        (old: Insurance[] = []) =>
          old.map(i => (i.id === updatedInsurance.id ? updatedInsurance : i))
      );

      // Update vehicle-specific cache
      if (updatedInsurance.vehicleId) {
        queryClient.setQueryData(
          queryKeys.insurances.byVehicle(updatedInsurance.vehicleId),
          (old: Insurance[] = []) =>
            old.map(i => (i.id === updatedInsurance.id ? updatedInsurance : i))
        );
      }

      // Update ALL paginated queries
      queryClient.setQueriesData(
        { queryKey: queryKeys.insurances.paginated() },
        (old: unknown) => {
          const oldData = old as { insurances?: Insurance[] } | undefined;
          if (oldData?.insurances) {
            return {
              ...oldData,
              insurances: oldData.insurances.map((i: Insurance) =>
                i.id === updatedInsurance.id ? updatedInsurance : i
              ),
            };
          }
          return old;
        }
      );

      return { previousInsurance };
    },
    onError: (_err, _updatedInsurance, context) => {
      console.error('❌ UPDATE INSURANCE: Error occurred:', _err);
      // Rollback
      if (context?.previousInsurance) {
        queryClient.setQueryData(
          queryKeys.insurances.detail(_updatedInsurance.id),
          context.previousInsurance
        );
      }
    },
    onSuccess: (_data, variables) => {
      logger.debug('✅ UPDATE INSURANCE: Success!', _data);
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('insurance-updated', { detail: variables })
      );
    },
    onSettled: data => {
      // Always invalidate to get fresh data from server
      queryClient.invalidateQueries({
        queryKey: queryKeys.insurances.all,
      });
      // Invalidate specific insurance cache
      if (data && typeof data === 'object' && 'id' in data) {
        invalidateInsurance((data as Insurance).id);
      }
      // ✅ Invaliduj Service Worker cache
      swCacheInvalidators.insurances();
    },
  });
}

// DELETE insurance
export function useDeleteInsurance() {
  const queryClient = useQueryClient();
  const { invalidateInsurance } = useInvalidateEntity();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteInsurance(id),
    onMutate: async deletedId => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.insurances.all,
      });

      // Find insurance to get vehicleId for cache update
      const allInsurances = queryClient.getQueriesData({
        queryKey: queryKeys.insurances.all,
      });

      let vehicleId: string | null = null;
      for (const [, data] of allInsurances) {
        if (Array.isArray(data)) {
          const insurance = data.find((i: Insurance) => i.id === deletedId);
          if (insurance) {
            vehicleId = insurance.vehicleId;
            break;
          }
        }
      }

      const previousInsurances = queryClient.getQueryData(
        queryKeys.insurances.lists()
      );

      queryClient.setQueryData(
        queryKeys.insurances.lists(),
        (old: Insurance[] = []) => old.filter(i => i.id !== deletedId)
      );

      // Update vehicle-specific cache
      if (vehicleId) {
        queryClient.setQueryData(
          queryKeys.insurances.byVehicle(vehicleId),
          (old: Insurance[] = []) => old.filter(i => i.id !== deletedId)
        );
      }

      // Update ALL paginated queries
      queryClient.setQueriesData(
        { queryKey: queryKeys.insurances.paginated() },
        (old: unknown) => {
          const oldData = old as
            | { insurances?: Insurance[]; pagination?: { totalItems?: number } }
            | undefined;
          if (oldData?.insurances) {
            return {
              ...oldData,
              insurances: oldData.insurances.filter(
                (i: Insurance) => i.id !== deletedId
              ),
              pagination: {
                ...oldData.pagination,
                totalItems: Math.max(
                  0,
                  (oldData.pagination?.totalItems || 0) - 1
                ),
              },
            };
          }
          return old;
        }
      );

      return { previousInsurances, vehicleId };
    },
    onError: (_err, _deletedId, context) => {
      if (context?.previousInsurances) {
        queryClient.setQueryData(
          queryKeys.insurances.lists(),
          context.previousInsurances
        );
      }
    },
    onSuccess: (_data, variables) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('insurance-deleted', { detail: { id: variables } })
      );
    },
    onSettled: (_data, _error, deletedId) => {
      // Always invalidate to get fresh data from server
      queryClient.invalidateQueries({
        queryKey: queryKeys.insurances.all,
      });
      // Invalidate specific insurance cache
      invalidateInsurance(deletedId);
      // ✅ Invaliduj Service Worker cache
      swCacheInvalidators.insurances();
    },
  });
}
