/**
 * React Query Provider
 * Provides React Query client to the entire app
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CACHE } from '../config/constants';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE.STALE_TIME,
      gcTime: CACHE.CACHE_TIME,
      retry: CACHE.MAX_RETRIES,
      retryDelay: CACHE.RETRY_DELAY,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: CACHE.MAX_RETRIES,
      retryDelay: CACHE.RETRY_DELAY,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default QueryProvider;

