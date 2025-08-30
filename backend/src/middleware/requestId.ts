import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/**
 * RequestId middleware - generuje jedinečný requestId pre každý request
 * a pridá ho do request objektu aj response headera
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generuj nový requestId pre každý request
  const requestId = uuidv4();

  // Ulož do request objektu
  req.requestId = requestId;

  // Pridaj do response headera
  res.setHeader('X-Request-Id', requestId);

  next();
}
