import { AppContext } from '@/context/AppContext';
import { useContext } from 'react';

/**
 * Hook pre invalidáciu BULK cache v AppContext
 * Používa sa po zmene dát aby sa AppContext načítal s novými dátami
 */
export function useBulkCacheInvalidation() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useBulkCacheInvalidation must be used within AppProvider');
  }

  const { refreshBulkData } = context;

  const invalidateBulkCache = () => {
    console.log('🔄 Invalidating BULK cache for AppContext refresh...');
    refreshBulkData();
  };

  return { invalidateBulkCache };
}
