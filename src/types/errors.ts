// 🚨 Error Types & Interfaces for BlackRent Application
// Centralized error type definitions for consistent error handling

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';
export type ErrorCategory =
  | 'network'
  | 'validation'
  | 'authorization'
  | 'server'
  | 'client'
  | 'unknown';

export interface AppError {
  id: string;
  message: string;
  details?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: Date;
  stack?: string;
  retry?: boolean;
  dismissed?: boolean;
  context?: Record<string, any>;
}

export interface ErrorContext {
  errors: AppError[];
  isOnline: boolean;
  showError: (error: Omit<AppError, 'id' | 'timestamp'>) => string;
  dismissError: (id: string) => void;
  clearErrors: () => void;
  retryAction?: (errorId: string) => Promise<void>;
}

export interface NetworkError extends AppError {
  category: 'network';
  statusCode?: number;
  endpoint?: string;
  retryCount?: number;
  maxRetries?: number;
}

export interface ValidationError extends AppError {
  category: 'validation';
  field?: string;
  validationType?: 'required' | 'format' | 'range' | 'custom';
}

export interface ServerError extends AppError {
  category: 'server';
  statusCode: number;
  endpoint: string;
}

// Predefined error messages with user-friendly text
export const ERROR_MESSAGES = {
  NETWORK_OFFLINE: 'Stratené internetové pripojenie. Skúste neskôr.',
  NETWORK_TIMEOUT: 'Požiadavka trvá príliš dlho. Skontrolujte pripojenie.',
  NETWORK_SERVER_ERROR: 'Problém so serverom. Kontaktujte podporu.',
  VALIDATION_REQUIRED: 'Toto pole je povinné.',
  VALIDATION_EMAIL: 'Nesprávny formát emailu.',
  VALIDATION_PHONE: 'Nesprávny formát telefónneho čísla.',
  AUTH_UNAUTHORIZED: 'Nemáte oprávnenie pre túto akciu.',
  AUTH_SESSION_EXPIRED: 'Relácia vypršala. Prihláste sa znovu.',
  SERVER_MAINTENANCE: 'Server je v údržbe. Skúste neskôr.',
  UNKNOWN_ERROR: 'Nastala neočakávaná chyba. Skúste obnoviť stránku.',
} as const;

// Error action types
export type ErrorAction =
  | { type: 'ADD_ERROR'; payload: Omit<AppError, 'id' | 'timestamp'> }
  | { type: 'DISMISS_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'UPDATE_NETWORK_STATUS'; payload: boolean }
  | {
      type: 'UPDATE_ERROR';
      payload: { id: string; updates: Partial<AppError> };
    };

// Error utility functions
export const createError = (
  message: string,
  category: ErrorCategory,
  severity: ErrorSeverity = 'error',
  details?: string,
  context?: Record<string, any>
): Omit<AppError, 'id' | 'timestamp'> => ({
  message,
  category,
  severity,
  details,
  context,
  retry: category === 'network',
});

export const isNetworkError = (error: AppError): error is NetworkError =>
  error.category === 'network';

export const isValidationError = (error: AppError): error is ValidationError =>
  error.category === 'validation';

export const isServerError = (error: AppError): error is ServerError =>
  error.category === 'server';
