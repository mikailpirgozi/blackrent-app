/**
 * 🛡️ ERROR HANDLING UTILITIES
 *
 * Robustný error handling systém pre API calls:
 * - Retry mechanism s exponential backoff
 * - Network error detection
 * - User-friendly error messages
 * - Graceful degradation
 */

import { logger } from './smartLogger';

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase: number;
  retryCondition?: (error: unknown) => boolean;
}

export interface NetworkError {
  isNetworkError: boolean;
  isOffline: boolean;
  errorType: 'connection' | 'timeout' | 'server' | 'unknown';
  userMessage: string;
  technicalMessage: string;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000, // 1s
  maxDelay: 10000, // 10s
  exponentialBase: 2, // 2^n backoff
  retryCondition: (error: unknown) => isRetryableError(error as Error),
};

/**
 * 🔄 Retry mechanism s exponential backoff
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> => {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        logger.debug(`🔄 Retry attempt ${attempt}/${config.maxRetries}`);
      }

      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Posledný pokus - nevykonávame delay
      if (attempt === config.maxRetries) {
        console.error(`❌ Final retry attempt failed:`, error);
        break;
      }

      // Skontroluj či je error retryable
      if (!config.retryCondition!(error as Error)) {
        logger.debug('⚠️ Error is not retryable, giving up');
        break;
      }

      // Vypočítaj delay s exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.exponentialBase, attempt),
        config.maxDelay
      );

      logger.debug(`⏳ Waiting ${delay}ms before retry...`);
      await sleep(delay);
    }
  }

  throw lastError || new Error('Unknown error occurred');
};

/**
 * 🌐 Network error detection
 */
export const analyzeError = (error: unknown): NetworkError => {
  const errorMessage = (error as Error)?.message?.toLowerCase() || '';
  const isOnline = navigator.onLine;

  // Network connection errors
  if (
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('network error') ||
    errorMessage.includes('connection refused') ||
    errorMessage.includes('net::err_')
  ) {
    return {
      isNetworkError: true,
      isOffline: !isOnline,
      errorType: 'connection',
      userMessage: isOnline
        ? '🌐 Problém s pripojením na server. Skúšam znova...'
        : '📡 Nie ste pripojený na internet. Skontrolujte pripojenie.',
      technicalMessage: (error as Error).message,
    };
  }

  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return {
      isNetworkError: true,
      isOffline: false,
      errorType: 'timeout',
      userMessage: '⏰ Server neodpovedá. Skúšam znova...',
      technicalMessage: (error as Error).message,
    };
  }

  // Server errors (5xx)
  if (
    (error as { status?: number })?.status &&
    (error as { status: number }).status >= 500 &&
    (error as { status: number }).status < 600
  ) {
    return {
      isNetworkError: false,
      isOffline: false,
      errorType: 'server',
      userMessage: '🔧 Server má problémy. Skúšam znova...',
      technicalMessage: `Server error: ${(error as { status: number }).status}`,
    };
  }

  // Client errors (4xx) - usually not retryable
  if (
    (error as { status?: number })?.status &&
    (error as { status: number }).status >= 400 &&
    (error as { status: number }).status < 500
  ) {
    const userMessages = {
      401: '🔐 Relácia vypršala. Prihláste sa znova.',
      403: '⛔ Nemáte oprávnenie na túto akciu.',
      404: '❓ Požadované dáta sa nenašli.',
      429: '⏸️ Príliš veľa requestov. Počkajte chvíľu.',
    };

    return {
      isNetworkError: false,
      isOffline: false,
      errorType: 'server',
      userMessage:
        userMessages[
          (error as { status: number }).status as keyof typeof userMessages
        ] || `❌ Chyba: ${(error as { status: number }).status}`,
      technicalMessage: `Client error: ${(error as { status: number }).status}`,
    };
  }

  // Unknown error
  return {
    isNetworkError: false,
    isOffline: !isOnline,
    errorType: 'unknown',
    userMessage: '❌ Neočakávaná chyba. Skúšam znova...',
    technicalMessage: (error as Error).message || 'Unknown error',
  };
};

/**
 * ❓ Rozhodne či je error retryable
 */
export const isRetryableError = (error: unknown): boolean => {
  const analysis = analyzeError(error);

  // Network errors sú retryable
  if (analysis.isNetworkError) return true;

  // Server errors (5xx) sú retryable
  if (
    analysis.errorType === 'server' &&
    (error as { status?: number })?.status &&
    (error as { status: number }).status >= 500
  )
    return true;

  // Rate limiting (429) je retryable
  if ((error as { status?: number })?.status === 429) return true;

  // Client errors (4xx) nie sú retryable (okrem 429)
  if (
    (error as { status?: number })?.status &&
    (error as { status: number }).status >= 400 &&
    (error as { status: number }).status < 500
  )
    return false;

  // Unknown errors sú retryable (pre istotu)
  if (analysis.errorType === 'unknown') return true;

  return false;
};

/**
 * 😴 Sleep utility
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 🎯 Enhanced error s user message
 */
export class EnhancedError extends Error {
  public readonly userMessage: string;
  public readonly technicalMessage: string;
  public readonly errorType: string;
  public readonly isRetryable: boolean;
  public readonly originalError: Error;

  constructor(error: unknown) {
    const analysis = analyzeError(error);
    super(analysis.technicalMessage);

    this.userMessage = analysis.userMessage;
    this.technicalMessage = analysis.technicalMessage;
    this.errorType = analysis.errorType;
    this.isRetryable = isRetryableError(error);
    this.originalError = error as Error;

    this.name = 'EnhancedError';
  }
}

/**
 * 🔧 Network status monitoring
 */
export const createNetworkMonitor = (
  onStatusChange?: (isOnline: boolean) => void
) => {
  const handleOnline = () => {
    logger.debug('🌐 Network connection restored');
    onStatusChange?.(true);
  };

  const handleOffline = () => {
    logger.debug('📡 Network connection lost');
    onStatusChange?.(false);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};
