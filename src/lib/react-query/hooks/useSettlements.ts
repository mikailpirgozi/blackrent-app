import { apiService } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

// GET settlements
export function useSettlements() {
  return useQuery({
    queryKey: queryKeys.settlements.list(),
    queryFn: () => apiService.getSettlements(),
    staleTime: 5 * 60 * 1000, // 5 minút
  });
}
