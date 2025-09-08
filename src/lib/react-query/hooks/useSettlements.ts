import { apiService } from '@/services/api';
import type { Settlement } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

// GET settlements
export function useSettlements() {
  return useQuery({
    queryKey: queryKeys.settlements.list(),
    queryFn: () => apiService.getSettlements(),
    staleTime: 5 * 60 * 1000, // 5 minút
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
    },
  });
}
