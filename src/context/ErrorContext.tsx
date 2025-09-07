// 🚨 Centralized Error Context Provider
// Manages all application errors with consistent user feedback

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import { v4 as uuidv4 } from 'uuid';

import type {
  AppError,
  ErrorAction,
  ErrorContext as IErrorContext,
} from '../types/errors';
import { createError } from '../types/errors';

// Error state interface
interface ErrorState {
  errors: AppError[];
  isOnline: boolean;
}

// Initial state
const initialState: ErrorState = {
  errors: [],
  isOnline: navigator.onLine,
};

// Error reducer
const errorReducer = (state: ErrorState, action: ErrorAction): ErrorState => {
  switch (action.type) {
    case 'ADD_ERROR': {
      const newError: AppError = {
        ...action.payload,
        id: uuidv4(),
        timestamp: new Date(),
      };
      return {
        ...state,
        errors: [...state.errors, newError],
      };
    }

    case 'DISMISS_ERROR':
      return {
        ...state,
        errors: state.errors.map(error =>
          error.id === action.payload ? { ...error, dismissed: true } : error
        ),
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: [],
      };

    case 'UPDATE_NETWORK_STATUS':
      return {
        ...state,
        isOnline: action.payload,
      };

    case 'UPDATE_ERROR':
      return {
        ...state,
        errors: state.errors.map(error =>
          error.id === action.payload.id
            ? { ...error, ...action.payload.updates }
            : error
        ),
      };

    default:
      return state;
  }
};

// Create context
const ErrorContext = createContext<IErrorContext | undefined>(undefined);

// Error Provider Props
interface ErrorProviderProps {
  children: React.ReactNode;
  maxErrors?: number;
  autoDismissTime?: number;
}

// Error Provider Component
export const ErrorProvider: React.FC<ErrorProviderProps> = ({
  children,
  maxErrors = 5,
  autoDismissTime = 5000, // 5 seconds
}) => {
  const [state, dispatch] = useReducer(errorReducer, initialState);

  // Show error function
  const showError = useCallback(
    (errorData: Omit<AppError, 'id' | 'timestamp'>): string => {
      const errorId = uuidv4();

      dispatch({
        type: 'ADD_ERROR',
        payload: errorData,
      });

      // Auto-dismiss non-critical errors
      if (errorData.severity !== 'critical' && autoDismissTime > 0) {
        setTimeout(() => {
          dispatch({ type: 'DISMISS_ERROR', payload: errorId });
        }, autoDismissTime);
      }

      // Clean up old errors if we exceed max limit
      if (state.errors.length >= maxErrors) {
        const oldestError = state.errors[0];
        if (oldestError) {
          dispatch({ type: 'DISMISS_ERROR', payload: oldestError.id });
        }
      }

      return errorId;
    },
    [state.errors, maxErrors, autoDismissTime]
  );

  // Dismiss error function
  const dismissError = useCallback((id: string) => {
    dispatch({ type: 'DISMISS_ERROR', payload: id });
  }, []);

  // Clear all errors function
  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: 'UPDATE_NETWORK_STATUS', payload: true });

      // Show recovery message if we were offline
      if (!state.isOnline) {
        showError({
          message: '✅ Pripojenie obnovené!',
          category: 'network',
          severity: 'info',
          retry: false,
        });
      }
    };

    const handleOffline = () => {
      dispatch({ type: 'UPDATE_NETWORK_STATUS', payload: false });
      showError({
        message: '⚠️ Stratené internetové pripojenie',
        category: 'network',
        severity: 'warning',
        details: 'Niektoré funkcie môžu byť obmedzené.',
        retry: false,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.isOnline, showError]);

  // Context value
  const contextValue: IErrorContext = {
    errors: state.errors.filter(error => !error.dismissed),
    isOnline: state.isOnline,
    showError,
    dismissError,
    clearErrors,
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
};

// Custom hook for using error context
export const useError = (): IErrorContext => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

// Convenience hooks for common error scenarios
export const useNetworkError = () => {
  const { showError } = useError();

  return useCallback(
    (endpoint?: string, statusCode?: number) => {
      return showError(
        createError(
          'Problém s pripojením k serveru',
          'network',
          'error',
          statusCode ? `HTTP ${statusCode}` : 'Network request failed',
          { endpoint, statusCode }
        )
      );
    },
    [showError]
  );
};

export const useValidationError = () => {
  const { showError } = useError();

  return useCallback(
    (field: string, message: string) => {
      return showError(
        createError(
          message,
          'validation',
          'warning',
          `Validation failed for field: ${field}`,
          { field }
        )
      );
    },
    [showError]
  );
};

export const useServerError = () => {
  const { showError } = useError();

  return useCallback(
    (message: string, statusCode: number, endpoint?: string) => {
      return showError(
        createError(
          message,
          'server',
          statusCode >= 500 ? 'critical' : 'error',
          `Server returned ${statusCode}`,
          { statusCode, endpoint }
        )
      );
    },
    [showError]
  );
};

// Error logging utility
export const logError = (
  error: AppError,
  context?: Record<string, unknown>
) => {
  const logData = {
    ...error,
    context: { ...error.context, ...context },
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  console.group(
    `🚨 ${error.severity.toUpperCase()} - ${error.category.toUpperCase()}`
  );
  console.error('Message:', error.message);
  if (error.details) console.debug('Details:', error.details);
  if (error.stack) console.debug('Stack:', error.stack);
  if (logData.context) console.debug('Context:', logData.context);
  console.groupEnd();

  // In production, you could send this to an error reporting service
  if (process.env.NODE_ENV === 'production' && error.severity === 'critical') {
    // TODO: Integrate with error reporting service (Sentry, LogRocket, etc.)
    console.warn('TODO: Send error to reporting service');
  }
};
