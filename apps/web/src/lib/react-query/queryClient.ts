import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // DEV: Žiadne kešovanie, PROD: normálne kešovanie
      staleTime: process.env.NODE_ENV === 'development' ? 0 : 2 * 60 * 1000,
      gcTime: process.env.NODE_ENV === 'development' ? 0 : 5 * 60 * 1000,
      
      // DEV: Vypnuté auto-refetch, PROD: zapnuté
      refetchOnWindowFocus: process.env.NODE_ENV === 'development' ? false : true,
      refetchOnReconnect: process.env.NODE_ENV === 'development' ? false : true,
      
      // Retry stratégia zachovaná
      retry: (failureCount, error) => {
        if (error instanceof Error) {
          const message = error.message;
          if (message.includes('401') || message.includes('403')) {
            return false;
          }
        }
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// DEV MODE: Debug info
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 React Query: DEV mode - caching DISABLED for faster HMR');
}

// Error handler
queryClient.setMutationDefaults(['default'], {
  mutationFn: async () => {
    throw new Error('Mutation function not implemented');
  },
  onError: error => {
    console.error('🚨 Mutation error:', error);
    // Tu môžete pridať toast notification
  },
});
