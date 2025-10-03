import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { logger } from '@/utils/smartLogger';

/**
 * Hook pre invalidáciu React Query cache
 * Používa sa po zmene dát aby sa cache invalidoval
 */
export function useBulkCacheInvalidation() {
  const queryClient = useQueryClient();

  const invalidateBulkCache = () => {
    logger.debug('🔄 Invalidating React Query cache...');

    // Invalidate React Query cache for insurances
    logger.debug('🔄 Invalidating React Query cache for insurances...');
    queryClient.invalidateQueries({
      queryKey: queryKeys.insurances.all,
    });
  };

  return { invalidateBulkCache };
}
