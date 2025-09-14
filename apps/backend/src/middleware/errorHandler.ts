import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { log } from '../utils/logger';

// Typy error kódov
type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL';

// Štandardný JSON error model
interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  requestId: string;
}

/**
 * Vytvorí štandardizovanú API error response
 */
function createApiError(
  code: ErrorCode,
  message: string,
  requestId: string,
  details?: Record<string, any>
): ApiError {
  return {
    code,
    message,
    details,
    requestId,
  };
}

/**
 * Mapuje error na správny HTTP status kód
 */
function getHttpStatusFromErrorCode(code: ErrorCode): number {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 400;
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'INTERNAL':
    default:
      return 500;
  }
}

/**
 * Error handler middleware - zachytáva všetky chyby a vracia jednotný JSON formát
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.requestId || 'no-request-id';

  // Log chybu s kontextom
  log(
    'error',
    {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    },
    'Request error occurred',
    {
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    }
  );

  let apiError: ApiError;

  // Spracuj rôzne typy chýb
  if (err instanceof ApiErrorWithCode) {
    // Custom API errors s kódom
    apiError = createApiError(err.code, err.message, requestId, err.details);
  } else if (err instanceof ZodError) {
    // Zod validation errors
    apiError = createApiError(
      'VALIDATION_ERROR',
      'Validation failed',
      requestId,
      {
        validationErrors: err.issues.map((issue: any) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      }
    );
  } else if (err.name === 'NotFoundError' || err.status === 404) {
    // Not found errors
    apiError = createApiError(
      'NOT_FOUND',
      err.message || 'Resource not found',
      requestId
    );
  } else if (err.name === 'UnauthorizedError' || err.status === 401) {
    // Unauthorized errors
    apiError = createApiError(
      'UNAUTHORIZED',
      err.message || 'Unauthorized access',
      requestId
    );
  } else if (err.name === 'ForbiddenError' || err.status === 403) {
    // Forbidden errors
    apiError = createApiError(
      'FORBIDDEN',
      err.message || 'Access forbidden',
      requestId
    );
  } else {
    // Internal server errors
    apiError = createApiError(
      'INTERNAL',
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Internal server error',
      requestId,
      process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
    );
  }

  const httpStatus = getHttpStatusFromErrorCode(apiError.code);

  // Nastav X-Request-Id header ak ešte nie je nastavený
  if (!res.getHeader('X-Request-Id')) {
    res.setHeader('X-Request-Id', requestId);
  }

  res.status(httpStatus).json(apiError);
}

/**
 * Helper pre vytvorenie custom error s kódom
 */
export class ApiErrorWithCode extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiErrorWithCode';
  }
}

/**
 * Helper funkcie pre časté chyby
 */
export const createNotFoundError = (
  message: string,
  details?: Record<string, any>
) => new ApiErrorWithCode('NOT_FOUND', message, details);

export const createValidationError = (
  message: string,
  details?: Record<string, any>
) => new ApiErrorWithCode('VALIDATION_ERROR', message, details);

export const createUnauthorizedError = (
  message: string,
  details?: Record<string, any>
) => new ApiErrorWithCode('UNAUTHORIZED', message, details);

export const createForbiddenError = (
  message: string,
  details?: Record<string, any>
) => new ApiErrorWithCode('FORBIDDEN', message, details);
