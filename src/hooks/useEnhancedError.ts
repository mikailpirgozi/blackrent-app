/**
 * 🪝 ENHANCED ERROR HOOK
 * 
 * Jednoduchý hook pre error handling s kontextom
 */

import { useState, useCallback } from 'react';
import { EnhancedError } from '../utils/errorHandling';
import { ErrorContext } from '../utils/enhancedErrorMessages';

interface UseEnhancedErrorOptions {
  context?: ErrorContext;
  autoHideDuration?: number;
  onError?: (error: EnhancedError, context?: ErrorContext) => void;
}

export const useEnhancedError = (options: UseEnhancedErrorOptions = {}) => {
  const [error, setError] = useState<EnhancedError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const showError = useCallback((
    errorOrMessage: Error | EnhancedError | string,
    context?: ErrorContext
  ) => {
    let enhancedError: EnhancedError;
    
    if (typeof errorOrMessage === 'string') {
      // Create error from string message
      enhancedError = new EnhancedError(new Error(errorOrMessage));
    } else if (errorOrMessage instanceof EnhancedError) {
      enhancedError = errorOrMessage;
    } else {
      // Create EnhancedError from regular Error
      enhancedError = new EnhancedError(errorOrMessage);
    }
    
    setError(enhancedError);
    options.onError?.(enhancedError, { ...options.context, ...context });
  }, [options]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retryWithError = useCallback(async (retryFn: () => Promise<void>) => {
    if (!retryFn) return;
    
    setIsRetrying(true);
    try {
      await retryFn();
      setError(null);
    } catch (err) {
      // Show new error if retry fails
      showError(err as Error);
    } finally {
      setIsRetrying(false);
    }
  }, [showError]);

  // Wrapper pre async operations s automatic error handling
  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T | null> => {
    try {
      setError(null);
      return await operation();
    } catch (err) {
      showError(err as Error, context);
      return null;
    }
  }, [showError]);

  return {
    error,
    isRetrying,
    showError,
    clearError,
    retryWithError,
    executeWithErrorHandling,
  };
};

// Context-specific hooks pre common use cases
export const useAuthError = () => {
  return useEnhancedError({
    context: { action: 'login', location: 'auth' }
  });
};

export const useApiError = (entity?: string) => {
  return useEnhancedError({
    context: { entity, location: 'api' }
  });
};

export const useFormError = (entity?: string) => {
  return useEnhancedError({
    context: { action: 'save', entity, location: 'form' }
  });
};