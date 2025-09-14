/**
 * ErrorNotice komponent pre zobrazenie API chýb
 * Zobrazuje pekne naformátované hlášky z ApiError
 */

import { ApiError } from '@/lib/errors';
import React from 'react';

/**
 * Props pre ErrorNotice komponent
 */
interface ErrorNoticeProps {
  error: ApiError | Error | string;
  className?: string;
  showRequestId?: boolean;
  showDetails?: boolean;
  onClose?: () => void;
}

/**
 * ErrorNotice komponent
 */
export const ErrorNotice: React.FC<ErrorNoticeProps> = ({
  error,
  className = '',
  showRequestId = true,
  showDetails = false,
  onClose,
}) => {
  // Normalizuj error do ApiError formátu
  const normalizedError = React.useMemo(() => {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof Error) {
      return new ApiError('GENERIC_ERROR', error.message);
    }

    return new ApiError('UNKNOWN_ERROR', String(error));
  }, [error]);

  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        {/* Error icon */}
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Error content */}
        <div className="ml-3 flex-1">
          {/* Error message */}
          <h3 className="text-sm font-medium text-red-800">
            {normalizedError.message}
          </h3>

          {/* Error code */}
          {normalizedError.code && (
            <p className="mt-1 text-sm text-red-600">
              <span className="font-medium">Kód chyby:</span>{' '}
              {normalizedError.code}
            </p>
          )}

          {/* Request ID */}
          {showRequestId && normalizedError.requestId && (
            <p className="mt-1 text-sm text-red-600">
              <span className="font-medium">Request ID:</span>{' '}
              <code className="bg-red-100 px-1 py-0.5 rounded text-xs">
                {normalizedError.requestId}
              </code>
            </p>
          )}

          {/* HTTP Status */}
          {normalizedError.status && (
            <p className="mt-1 text-sm text-red-600">
              <span className="font-medium">HTTP Status:</span>{' '}
              {normalizedError.status}
            </p>
          )}

          {/* Error details */}
          {showDetails && normalizedError.details && (
            <details className="mt-2">
              <summary className="text-sm text-red-600 cursor-pointer hover:text-red-800">
                Zobraziť detaily
              </summary>
              <pre className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(normalizedError.details, null, 2)}
              </pre>
            </details>
          )}
        </div>

        {/* Close button */}
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
              onClick={onClose}
              aria-label="Zavrieť"
            >
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Kompaktná verzia pre inline použitie
 */
export const ErrorNoticeInline: React.FC<{
  error: ApiError | Error | string;
  className?: string;
}> = ({ error, className = '' }) => {
  const normalizedError = React.useMemo(() => {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof Error) {
      return new ApiError('GENERIC_ERROR', error.message);
    }

    return new ApiError('UNKNOWN_ERROR', String(error));
  }, [error]);

  return (
    <div
      className={`inline-flex items-center text-sm text-red-600 ${className}`}
      role="alert"
    >
      <svg
        className="h-4 w-4 mr-1 flex-shrink-0"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      <span>{normalizedError.message}</span>
      {normalizedError.requestId && (
        <code className="ml-1 text-xs bg-red-100 px-1 py-0.5 rounded">
          {normalizedError.requestId}
        </code>
      )}
    </div>
  );
};

export default ErrorNotice;
