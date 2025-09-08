import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

/**
 * Hook pre invalidáciu React Query cache
 * Používa sa po zmene dát aby sa cache invalidoval
 */
export function useBulkCacheInvalidation() {
  const queryClient = useQueryClient();

  const invalidateBulkCache = () => {
    console.log('🔄 Invalidating React Query cache...');

    // Invalidate React Query cache for insurances
    console.log('🔄 Invalidating React Query cache for insurances...');
    queryClient.invalidateQueries({
      queryKey: queryKeys.insurances.all,
    });
  };

  return { invalidateBulkCache };
}
