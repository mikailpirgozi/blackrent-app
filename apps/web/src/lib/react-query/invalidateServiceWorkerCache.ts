/**
 * 🔄 SERVICE WORKER CACHE INVALIDATION
 *
 * Utility funkcia pre invalidáciu Service Worker cache po mutations.
 * Zabezpečuje že po zmene dát sa invaliduje nielen React Query cache,
 * ale aj Service Worker cache pre okamžité zobrazenie zmien.
 */

/**
 * Invaliduje Service Worker cache pre špecifikované API endpointy
 *
 * @param urls - Zoznam API endpoint URLs na invalidáciu (napr. ['/api/insurances', '/api/vehicles'])
 *
 * @example
 * ```typescript
 * // V mutation hooku:
 * onSuccess: () => {
 *   queryClient.invalidateQueries(queryKeys.insurances.all);
 *   invalidateServiceWorkerCache(['/api/insurances']); // ✅ Invaliduj SW cache
 * }
 * ```
 */
export function invalidateServiceWorkerCache(urls: string[]): void {
  // Skontroluj či Service Worker je podporovaný
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Worker nie je podporovaný v tomto prehliadači');
    return;
  }

  // Skontroluj či je Service Worker aktívny
  if (!navigator.serviceWorker.controller) {
    console.warn('⚠️ Service Worker nie je aktívny');
    return;
  }

  try {
    // Pošli správu Service Workeru na invalidáciu cache
    navigator.serviceWorker.controller.postMessage({
      type: 'INVALIDATE_CACHE',
      payload: { urls },
    });

    console.log('🔄 Service Worker cache invalidation requested for:', urls);
  } catch (error) {
    console.error('❌ Failed to invalidate Service Worker cache:', error);
  }
}

/**
 * Helper funkcia pre invalidáciu single entity cache
 */
export function invalidateSingleEntityCache(
  entityType: string,
  entityId?: string
): void {
  const urls = entityId
    ? [`/api/${entityType}/${entityId}`, `/api/${entityType}`]
    : [`/api/${entityType}`];

  invalidateServiceWorkerCache(urls);
}

/**
 * Helper funkcie pre jednotlivé entity typy
 */
export const swCacheInvalidators = {
  insurances: () => invalidateServiceWorkerCache(['/api/insurances']),
  expenses: () => invalidateServiceWorkerCache(['/api/expenses']),
  settlements: () => invalidateServiceWorkerCache(['/api/settlements']),
  vehicles: () => invalidateServiceWorkerCache(['/api/vehicles']),
  customers: () => invalidateServiceWorkerCache(['/api/customers']),
  insuranceClaims: () =>
    invalidateServiceWorkerCache(['/api/insurance-claims']),
  rentals: () => invalidateServiceWorkerCache(['/api/rentals']),
};
