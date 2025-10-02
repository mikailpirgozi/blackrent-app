// 🔧 API Service Hook with Error Handling Integration
// Provides API service instance with automatic error handling setup

import { useEffect, useMemo } from 'react';

import { useError } from '../context/ErrorContext';
import { apiService } from '../services/api';

/**
 * Hook that provides API service instance with error context integration
 * Automatically sets up error handling for API calls
 */
export const useApiService = () => {
  const { showError } = useError();

  // Setup error handler when error context is available
  useEffect(() => {
    apiService.setErrorHandler((error: Error) => {
      showError({
        message: error.message,
        category: 'server',
        severity: 'error',
        details: error.message,
        context: {
          originalError: error,
          timestamp: new Date().toISOString(),
        },
      });
    });
  }, [showError]);

  return useMemo(() => apiService, []);
};

/**
 * Hook for API calls with built-in error handling
 * Use this for one-off API calls in components
 */
export const useApiCall = () => {
  const api = useApiService();
  const { showError } = useError();

  return useMemo(
    () => ({
      api,
      showError,

      // Convenience method for handling API errors in try-catch blocks
      handleError: (error: Error) => {
        const errorMessage = error?.message || 'Neznáma chyba API';
        return showError({
          message: errorMessage,
          category: 'server',
          severity: 'error',
          details: errorMessage,
          context: {
            originalError: error,
            timestamp: new Date().toISOString(),
          },
        });
      },
    }),
    [api, showError]
  );
};
