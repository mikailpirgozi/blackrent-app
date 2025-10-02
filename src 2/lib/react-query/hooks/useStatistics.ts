import { apiService } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

// GET statistics
export function useStatistics(period?: string) {
  return useQuery({
    queryKey: period
      ? queryKeys.statistics.revenue(period)
      : queryKeys.statistics.dashboard(),
    queryFn: () =>
      apiService.get(period ? `/statistics?period=${period}` : '/statistics'),
    staleTime: 1 * 60 * 1000, // 1 minúta
    refetchInterval: 60000, // Auto-refresh každú minútu
  });
}
