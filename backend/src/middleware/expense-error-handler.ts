// ✅ FÁZA 3.3: Unified error handling pre expense API endpoints
import type { Request, Response, NextFunction } from 'express';

interface ExpenseError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Error handler middleware pre expense routes
 */
export function expenseErrorHandler(
  error: ExpenseError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error pre debugging
  console.error('💥 Expense API Error:', {
    error: error.message,
    stack: error.stack,
    user: req.user?.username,
    endpoint: req.path,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString(),
  });

  // Validation errors (400)
  if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
    return res.status(400).json({
      success: false,
      error: error.message,
      type: 'validation',
      details: (error as unknown as { details?: unknown }).details || null,
    });
  }

  // Not found errors (404)
  if (error.code === 'NOT_FOUND' || error.message.includes('not found')) {
    return res.status(404).json({
      success: false,
      error: 'Náklad nebol nájdený',
      type: 'not_found',
    });
  }

  // Permission errors (403)
  if (error.code === 'FORBIDDEN' || error.message.includes('permission')) {
    return res.status(403).json({
      success: false,
      error: 'Nemáte oprávnenie na túto operáciu',
      type: 'forbidden',
    });
  }

  // Database errors (500)
  if (error.code?.startsWith('23')) {
    // PostgreSQL constraint violations
    let message = 'Chyba pri práci s databázou';
    
    if (error.code === '23503') {
      message = 'Referenčná integrita porušená - súvisiace záznamy existujú';
    } else if (error.code === '23505') {
      message = 'Duplicitný záznam';
    }

    return res.status(500).json({
      success: false,
      error: message,
      type: 'database',
    });
  }

  // Default server error (500)
  const statusCode = error.statusCode || 500;
  const message = 
    process.env.NODE_ENV === 'production'
      ? 'Interná chyba servera'
      : error.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    type: 'server',
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
    }),
  });
}

/**
 * Async handler wrapper - chytá async errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

