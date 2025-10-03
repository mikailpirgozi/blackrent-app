import { QueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/smartLogger';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Čas kedy sú dáta považované za "čerstvé"
      staleTime: 2 * 60 * 1000, // 2 minúty

      // Čas kedy sa dáta držia v cache
      gcTime: 5 * 60 * 1000, // 5 minút (predtým cacheTime)

      // Automatický refresh pri focus
      refetchOnWindowFocus: true,

      // Automatický refresh pri reconnect
      refetchOnReconnect: true,

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
