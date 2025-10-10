import { QueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/smartLogger';

/**
 * ⚡ PERFORMANCE: Unified Cache Strategy
 * 
 * Cache Tiers:
 * - STATIC (10min stale, 15min gc): Companies, Insurers, Categories - zriedka sa menia
 * - STANDARD (2min stale, 5min gc): Vehicles, Customers - občas sa menia (default)
 * - DYNAMIC (30s stale, 2min gc): Rentals, Expenses, Settlements - často sa menia
 * - REAL-TIME (WebSocket invalidation): Critical updates (nie staleTime: 0!)
 * 
 * Každý hook môže override ak potrebuje špecifické správanie.
 */

// Export cache constants pre consistency
export const CACHE_TIMES = {
  STATIC: {
    staleTime: 10 * 60 * 1000, // 10 minút
    gcTime: 15 * 60 * 1000, // 15 minút
  },
  STANDARD: {
    staleTime: 2 * 60 * 1000, // 2 minúty
    gcTime: 5 * 60 * 1000, // 5 minút
  },
  DYNAMIC: {
    staleTime: 30 * 1000, // 30 sekúnd
    gcTime: 2 * 60 * 1000, // 2 minúty
  },
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ⚡ DEFAULT: STANDARD cache tier (vhodné pre väčšinu prípadov)
      staleTime: CACHE_TIMES.STANDARD.staleTime,
      gcTime: CACHE_TIMES.STANDARD.gcTime,

      // Automatický refresh pri focus (pre fresh data)
      refetchOnWindowFocus: true,

      // Automatický refresh pri reconnect
      refetchOnReconnect: true,

      // ⚡ PERFORMANCE: Nerefetchuj pri mount ak sú data fresh
      refetchOnMount: false,

      // Retry stratégia
      retry: (failureCount, error) => {
        // Neretryuj 401/403 errory
        if (error instanceof Error) {
          const message = error.message;
          if (message.includes('401') || message.includes('403')) {
            return false;
          }
        }
        // Max 3 retry
        return failureCount < 3;
      },

      // Retry delay
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry pre mutations
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Error handler
queryClient.setMutationDefaults(['default'], {
  mutationFn: async () => {
    throw new Error('Mutation function not implemented');
  },
  onError: error => {
    logger.error('Mutation error', error);
    // Tu môžete pridať toast notification
  },
});
