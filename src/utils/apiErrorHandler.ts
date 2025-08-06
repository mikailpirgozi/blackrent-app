// 🔧 Enhanced API Error Handler
// Provides intelligent error handling with retry mechanisms and user feedback

import { createError, ERROR_MESSAGES } from '../types/errors';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // Base delay in ms
  exponentialBackoff: boolean;
  retryCondition?: (error: any, attempt: number) => boolean;
}

interface ApiErrorHandlerConfig {
  showUserError: (error: any) => string;
  logError?: (error: any, context?: Record<string, any>) => void;
  onRetryAttempt?: (attempt: number, maxRetries: number) => void;
  onRetryFailed?: (error: any, attempts: number) => void;
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  exponentialBackoff: true,
  retryCondition: (error, attempt) => {
    // Retry on network errors, 5xx errors, and timeouts
    if (error.name === 'NetworkError') return true;
    if (error.code === 'NETWORK_ERROR') return true;
    if (error.status >= 500) return true;
    if (error.code === 'TIMEOUT') return true;
    
    // Don't retry on client errors (4xx) except 408 (timeout), 429 (rate limit)
    if (error.status >= 400 && error.status < 500) {
      return error.status === 408 || error.status === 429;
    }
    
    return false;
  },
};

// Sleep utility for delays
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Calculate retry delay with exponential backoff
const calculateDelay = (attempt: number, config: RetryConfig): number => {
  if (!config.exponentialBackoff) {
    return config.baseDelay;
  }
  
  // Exponential backoff with jitter
  const delay = config.baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
  return Math.min(delay + jitter, 30000); // Cap at 30 seconds
};

// Parse and categorize API errors
export const parseApiError = (error: any) => {
  // Network errors
  if (!navigator.onLine) {
    return createError(
      ERROR_MESSAGES.NETWORK_OFFLINE,
      'network',
      'warning',
      'Device is offline',
      { offline: true }
    );
  }
  
  if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
    return createError(
      ERROR_MESSAGES.NETWORK_TIMEOUT,
      'network',
      'error',
      error.message,
      { networkError: true, originalError: error }
    );
  }

  // HTTP errors
  if (error.status) {
    const status = error.status;
    
    if (status === 401) {
      return createError(
        ERROR_MESSAGES.AUTH_UNAUTHORIZED,
        'authorization',
        'warning',
        'Authentication required',
        { status, endpoint: error.config?.url }
      );
    }
    
    if (status === 403) {
      return createError(
        'Nemáte oprávnenie pre túto akciu',
        'authorization',
        'warning',
        'Insufficient permissions',
        { status, endpoint: error.config?.url }
      );
    }
    
    if (status === 404) {
      return createError(
        'Požadované dáta sa nenašli',
        'client',
        'warning',
        'Resource not found',
        { status, endpoint: error.config?.url }
      );
    }
    
    if (status === 422) {
      return createError(
        'Nesprávne zadané údaje',
        'validation',
        'warning',
        'Validation failed',
        { status, endpoint: error.config?.url, validationErrors: error.data?.errors }
      );
    }
    
    if (status === 429) {
      return createError(
        'Príliš veľa požiadaviek. Skúste neskôr.',
        'client',
        'warning',
        'Rate limit exceeded',
        { status, endpoint: error.config?.url }
      );
    }
    
    if (status >= 500) {
      return createError(
        ERROR_MESSAGES.NETWORK_SERVER_ERROR,
        'server',
        'error',
        `Server returned ${status}`,
        { status, endpoint: error.config?.url }
      );
    }
  }

  // Timeout errors
  if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
    return createError(
      ERROR_MESSAGES.NETWORK_TIMEOUT,
      'network',
      'error',
      'Request timed out',
      { timeout: true, originalError: error }
    );
  }

  // Generic fallback
  return createError(
    ERROR_MESSAGES.UNKNOWN_ERROR,
    'unknown',
    'error',
    error.message || 'Unknown error occurred',
    { originalError: error }
  );
};

// Enhanced API call with retry logic
export const withRetry = async <T>(
  apiCall: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  errorHandler: ApiErrorHandlerConfig
): Promise<T> => {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;
  
  for (let attempt = 1; attempt <= retryConfig.maxRetries + 1; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // If this is the last attempt, don't retry
      if (attempt === retryConfig.maxRetries + 1) {
        break;
      }
      
      // Check if we should retry this error
      if (!retryConfig.retryCondition?.(error, attempt)) {
        break;
      }
      
      // Notify about retry attempt
      if (errorHandler.onRetryAttempt) {
        errorHandler.onRetryAttempt(attempt, retryConfig.maxRetries);
      }
      
      // Calculate and wait for delay
      const delay = calculateDelay(attempt, retryConfig);
      await sleep(delay);
    }
  }
  
  // All retries failed
  const parsedError = parseApiError(lastError);
  const errorId = errorHandler.showUserError(parsedError);
  
  if (errorHandler.logError) {
    errorHandler.logError(lastError, {
      attempts: retryConfig.maxRetries + 1,
      errorId,
      parsed: parsedError,
    });
  }
  
  if (errorHandler.onRetryFailed) {
    errorHandler.onRetryFailed(lastError, retryConfig.maxRetries + 1);
  }
  
  throw lastError;
};

// Utility for handling API responses with error checking
export const handleApiResponse = async <T>(
  response: Response,
  errorHandler: Pick<ApiErrorHandlerConfig, 'showUserError'>
): Promise<T> => {
  if (!response.ok) {
    const error = {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      data: null,
    };
    
    try {
      error.data = await response.json();
    } catch {
      // Response doesn't have JSON body
    }
    
    const parsedError = parseApiError(error);
    errorHandler.showUserError(parsedError);
    
    throw error;
  }
  
  try {
    return await response.json();
  } catch (error) {
    const parsedError = createError(
      'Odpoveď servera sa nedá spracovať',
      'client',
      'error',
      'Invalid JSON response',
      { originalError: error }
    );
    
    errorHandler.showUserError(parsedError);
    throw error;
  }
};

// Pre-configured error handler factory
export const createApiErrorHandler = (
  showUserError: (error: any) => string,
  logError?: (error: any, context?: Record<string, any>) => void
): ApiErrorHandlerConfig => ({
  showUserError,
  logError,
  onRetryAttempt: (attempt, maxRetries) => {
    console.log(`🔄 API retry attempt ${attempt}/${maxRetries}`);
  },
  onRetryFailed: (error, attempts) => {
    console.error(`❌ API call failed after ${attempts} attempts:`, error);
  },
});