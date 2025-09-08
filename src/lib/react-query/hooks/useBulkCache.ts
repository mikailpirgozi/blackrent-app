import { AppContext } from '@/context/AppContext';
import { useQueryClient } from '@tanstack/react-query';
import { useContext } from 'react';
import { queryKeys } from '../queryKeys';

/**
 * Hook pre invalidáciu BULK cache v AppContext a React Query cache
 * Používa sa po zmene dát aby sa AppContext načítal s novými dátami
 */
export function useBulkCacheInvalidation() {
  const context = useContext(AppContext);
  const queryClient = useQueryClient();

  if (!context) {
    throw new Error('useBulkCacheInvalidation must be used within AppProvider');
  }

  const { refreshBulkData } = context;

  const invalidateBulkCache = () => {
    console.log('🔄 Invalidating BULK cache for AppContext refresh...');
    refreshBulkData();

    // Invalidate React Query cache for insurances
    console.log('🔄 Invalidating React Query cache for insurances...');
    queryClient.invalidateQueries({
      queryKey: queryKeys.insurances.all,
    });
  };

  return { invalidateBulkCache };
}
