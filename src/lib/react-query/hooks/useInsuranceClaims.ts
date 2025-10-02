import { apiService } from '@/services/api';
import type { InsuranceClaim } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

export interface InsuranceClaimFilters {
  search?: string;
  vehicleId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: unknown;
}

// GET insurance claims
export function useInsuranceClaims(filters?: InsuranceClaimFilters) {
  return useQuery({
    queryKey: queryKeys.insuranceClaims.list(filters),
    queryFn: () => apiService.getInsuranceClaims(),
    staleTime: 2 * 60 * 1000, // 2 minúty
    select: data => {
      if (!filters) return data;

      return data.filter(claim => {
        if (filters.vehicleId && claim.vehicleId !== filters.vehicleId)
          return false;
        if (filters.status && claim.status !== filters.status) return false;
        if (
          filters.dateFrom &&
          new Date(claim.incidentDate) < new Date(filters.dateFrom)
        )
          return false;
        if (
          filters.dateTo &&
          new Date(claim.incidentDate) > new Date(filters.dateTo)
        )
          return false;
        if (filters.search) {
          const search = filters.search.toLowerCase();
          return (
            claim.claimNumber?.toLowerCase().includes(search) ||
            claim.description?.toLowerCase().includes(search) ||
            claim.status.toLowerCase().includes(search)
          );
        }
        return true;
      });
    },
  });
}

// GET single insurance claim
export function useInsuranceClaim(id: string) {
  return useQuery({
    queryKey: queryKeys.insuranceClaims.detail(id),
    queryFn: () =>
      apiService
        .getInsuranceClaims()
        .then(claims => claims.find(claim => claim.id === id)),
    enabled: !!id,
  });
}

// GET insurance claims by vehicle
export function useInsuranceClaimsByVehicle(vehicleId: string) {
  return useQuery({
    queryKey: queryKeys.insuranceClaims.byVehicle(vehicleId),
    queryFn: () => apiService.getInsuranceClaims(vehicleId),
    enabled: !!vehicleId,
    staleTime: 2 * 60 * 1000, // 2 minúty
  });
}

// CREATE insurance claim
export function useCreateInsuranceClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (claim: InsuranceClaim) =>
      apiService.createInsuranceClaim(claim),
    onMutate: async newClaim => {
      // Cancel queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.insuranceClaims.all,
      });

      // Optimistická aktualizácia
      const previousClaims = queryClient.getQueryData(
        queryKeys.insuranceClaims.lists()
      );

      const optimisticClaim = {
        ...newClaim,
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
      };

      queryClient.setQueryData(
        queryKeys.insuranceClaims.lists(),
        (old: InsuranceClaim[] = []) => [
          ...old,
          optimisticClaim as InsuranceClaim,
        ]
      );

      // Update vehicle-specific cache
      if (newClaim.vehicleId) {
        queryClient.setQueryData(
          queryKeys.insuranceClaims.byVehicle(newClaim.vehicleId),
          (old: InsuranceClaim[] = []) => [
            ...old,
            optimisticClaim as InsuranceClaim,
          ]
        );
      }

      return { previousClaims };
    },
    onError: (err, newClaim, context) => {
      // Rollback pri chybe
      if (context?.previousClaims) {
        queryClient.setQueryData(
          queryKeys.insuranceClaims.lists(),
          context.previousClaims
        );
      }
    },
    onSuccess: (data, variables) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('insurance-claim-created', { detail: variables })
      );
    },
    onSettled: () => {
      // Refresh po dokončení
      queryClient.invalidateQueries({
        queryKey: queryKeys.insuranceClaims.all,
      });
    },
  });
}

// UPDATE insurance claim
export function useUpdateInsuranceClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (claim: InsuranceClaim) =>
      apiService.updateInsuranceClaim(claim),
    onMutate: async updatedClaim => {
      // Cancel queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.insuranceClaims.detail(updatedClaim.id),
      });

      // Optimistická aktualizácia detailu
      const previousClaim = queryClient.getQueryData(
        queryKeys.insuranceClaims.detail(updatedClaim.id)
      );

      queryClient.setQueryData(
        queryKeys.insuranceClaims.detail(updatedClaim.id),
        updatedClaim
      );

      // Optimistická aktualizácia listu
      queryClient.setQueryData(
        queryKeys.insuranceClaims.lists(),
        (old: InsuranceClaim[] = []) =>
          old.map(c => (c.id === updatedClaim.id ? updatedClaim : c))
      );

      // Update vehicle-specific cache
      if (updatedClaim.vehicleId) {
        queryClient.setQueryData(
          queryKeys.insuranceClaims.byVehicle(updatedClaim.vehicleId),
          (old: InsuranceClaim[] = []) =>
            old.map(c => (c.id === updatedClaim.id ? updatedClaim : c))
        );
      }

      return { previousClaim };
    },
    onError: (err, updatedClaim, context) => {
      // Rollback
      if (context?.previousClaim) {
        queryClient.setQueryData(
          queryKeys.insuranceClaims.detail(updatedClaim.id),
          context.previousClaim
        );
      }
    },
    onSuccess: (data, variables) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('insurance-claim-updated', { detail: variables })
      );
    },
    onSettled: (data, error, variables) => {
      // Refresh
      queryClient.invalidateQueries({
        queryKey: queryKeys.insuranceClaims.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.insuranceClaims.lists(),
      });
      if (variables.vehicleId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.insuranceClaims.byVehicle(variables.vehicleId),
        });
      }
    },
  });
}

// DELETE insurance claim
export function useDeleteInsuranceClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteInsuranceClaim(id),
    onMutate: async deletedId => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.insuranceClaims.all,
      });

      // Find claim to get vehicleId for cache update
      const allClaims = queryClient.getQueriesData({
        queryKey: queryKeys.insuranceClaims.all,
      });

      let vehicleId: string | null = null;
      for (const [, data] of allClaims) {
        if (Array.isArray(data)) {
          const claim = data.find((c: InsuranceClaim) => c.id === deletedId);
          if (claim) {
            vehicleId = claim.vehicleId;
            break;
          }
        }
      }

      const previousClaims = queryClient.getQueryData(
        queryKeys.insuranceClaims.lists()
      );

      queryClient.setQueryData(
        queryKeys.insuranceClaims.lists(),
        (old: InsuranceClaim[] = []) => old.filter(c => c.id !== deletedId)
      );

      // Update vehicle-specific cache
      if (vehicleId) {
        queryClient.setQueryData(
          queryKeys.insuranceClaims.byVehicle(vehicleId),
          (old: InsuranceClaim[] = []) => old.filter(c => c.id !== deletedId)
        );
      }

      return { previousClaims, vehicleId };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousClaims) {
        queryClient.setQueryData(
          queryKeys.insuranceClaims.lists(),
          context.previousClaims
        );
      }
    },
    onSuccess: (data, variables) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('insurance-claim-deleted', {
          detail: { id: variables },
        })
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.insuranceClaims.all,
      });
    },
  });
}
