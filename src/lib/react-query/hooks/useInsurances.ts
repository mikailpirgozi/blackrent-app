import { apiService } from '@/services/api';
import type { Insurance } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

export interface InsuranceFilters extends Record<string, unknown> {
  search?: string;
  type?: string;
  company?: string;
  status?: 'valid' | 'expiring' | 'expired' | 'all';
  vehicleId?: string;
}

// GET insurances
export function useInsurances(filters?: InsuranceFilters) {
  return useQuery({
    queryKey: queryKeys.insurances.list(filters),
    queryFn: () => apiService.getInsurances(),
    staleTime: 2 * 60 * 1000, // 2 minúty
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
    staleTime: 1 * 60 * 1000, // 1 minúta
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
    staleTime: 2 * 60 * 1000, // 2 minúty
  });
}

// CREATE insurance
export function useCreateInsurance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (insurance: Insurance) => apiService.createInsurance(insurance),
    onMutate: async newInsurance => {
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
    onError: (err, newInsurance, context) => {
      // Rollback pri chybe
      if (context?.previousInsurances) {
        queryClient.setQueryData(
          queryKeys.insurances.lists(),
          context.previousInsurances
        );
      }
    },
    onSuccess: (data, variables) => {
      // Update cache with server response (replace optimistic data)
      queryClient.setQueryData(
        queryKeys.insurances.lists(),
        (old: Insurance[] = []) => {
          // Remove optimistic entry and add real one
          const withoutOptimistic = old.filter(i => !i.id.startsWith('temp-'));
          return [data, ...withoutOptimistic];
        }
      );

      // Update vehicle-specific cache
      if (variables.vehicleId) {
        queryClient.setQueryData(
          queryKeys.insurances.byVehicle(variables.vehicleId),
          (old: Insurance[] = []) => {
            const withoutOptimistic = old.filter(
              i => !i.id.startsWith('temp-')
            );
            return [data, ...withoutOptimistic];
          }
        );
      }

      // Update ALL paginated queries with server response
      queryClient.setQueriesData(
        { queryKey: queryKeys.insurances.paginated() },
        (old: unknown) => {
          const oldData = old as
            | { insurances?: Insurance[]; pagination?: { totalItems?: number } }
            | undefined;
          if (oldData?.insurances) {
            const withoutOptimistic = oldData.insurances.filter(
              i => !i.id.startsWith('temp-')
            );
            return {
              ...oldData,
              insurances: [data, ...withoutOptimistic],
              pagination: {
                ...oldData.pagination,
                totalItems: (oldData.pagination?.totalItems || 0) + 1,
              },
            };
          }
          return old;
        }
      );

      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('insurance-created', { detail: variables })
      );
    },
    onSettled: (data, error) => {
      // Only invalidate on error to get fresh data
      if (error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.insurances.all,
        });
      }
    },
  });
}

// UPDATE insurance
export function useUpdateInsurance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (insurance: Insurance) =>
      apiService.updateInsurance(insurance.id, insurance),
    onMutate: async updatedInsurance => {
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
    onError: (err, updatedInsurance, context) => {
      // Rollback
      if (context?.previousInsurance) {
        queryClient.setQueryData(
          queryKeys.insurances.detail(updatedInsurance.id),
          context.previousInsurance
        );
      }
    },
    onSuccess: (data, variables) => {
      // Update cache with server response
      queryClient.setQueryData(queryKeys.insurances.detail(variables.id), data);

      // Update list cache with server response
      queryClient.setQueryData(
        queryKeys.insurances.lists(),
        (old: Insurance[] = []) =>
          old.map(i => (i.id === variables.id ? data : i))
      );

      // Update vehicle-specific cache
      if (variables.vehicleId) {
        queryClient.setQueryData(
          queryKeys.insurances.byVehicle(variables.vehicleId),
          (old: Insurance[] = []) =>
            old.map(i => (i.id === variables.id ? data : i))
        );
      }

      // Update ALL paginated queries with server response
      queryClient.setQueriesData(
        { queryKey: queryKeys.insurances.paginated() },
        (old: unknown) => {
          const oldData = old as { insurances?: Insurance[] } | undefined;
          if (oldData?.insurances) {
            return {
              ...oldData,
              insurances: oldData.insurances.map((i: Insurance) =>
                i.id === variables.id ? data : i
              ),
            };
          }
          return old;
        }
      );

      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('insurance-updated', { detail: variables })
      );
    },
    onSettled: (data, error) => {
      // Only invalidate on error to get fresh data
      if (error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.insurances.all,
        });
      }
    },
  });
}

// DELETE insurance
export function useDeleteInsurance() {
  const queryClient = useQueryClient();

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
    onError: (err, deletedId, context) => {
      if (context?.previousInsurances) {
        queryClient.setQueryData(
          queryKeys.insurances.lists(),
          context.previousInsurances
        );
      }
    },
    onSuccess: (data, variables) => {
      // Cache is already updated optimistically, no need to update again
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('insurance-deleted', { detail: { id: variables } })
      );
    },
    onSettled: (data, error) => {
      // Only invalidate on error to get fresh data
      if (error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.insurances.all,
        });
      }
    },
  });
}
