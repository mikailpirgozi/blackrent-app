import { apiService } from '@/services/api';
import type { Settlement } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { swCacheInvalidators } from '../invalidateServiceWorkerCache';

// GET settlements
export function useSettlements() {
  return useQuery({
    queryKey: queryKeys.settlements.list(),
    queryFn: () => apiService.getSettlements(),
    staleTime: 0, // ✅ FIX: 0s pre okamžité real-time updates (+ NO_CACHE v SW)
    gcTime: 0, // ✅ CRITICAL FIX: No GC cache
    refetchOnMount: 'always', // ✅ FIX: Vždy refetch pri mounte
  });
}

// CREATE settlement
export function useCreateSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settlement: Settlement) =>
      apiService.createSettlement(settlement),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements.all });
      // ✅ Invaliduj Service Worker cache
      swCacheInvalidators.settlements();
    },
  });
}

// UPDATE settlement
export function useUpdateSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      settlement,
    }: {
      id: string;
      settlement: Partial<Settlement>;
    }) => apiService.updateSettlement(id, settlement),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements.all });
      // ✅ Invaliduj Service Worker cache
      swCacheInvalidators.settlements();
    },
  });
}

// DELETE settlement
export function useDeleteSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteSettlement(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements.all });
      // ✅ Invaliduj Service Worker cache
      swCacheInvalidators.settlements();
    },
  });
}
