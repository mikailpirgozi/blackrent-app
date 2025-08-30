import { NextFunction, Request, Response } from 'express';
type ErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'INTERNAL';
/**
 * Error handler middleware - zachytáva všetky chyby a vracia jednotný JSON formát
 */
export declare function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void;
/**
 * Helper pre vytvorenie custom error s kódom
 */
export declare class ApiErrorWithCode extends Error {
    code: ErrorCode;
    details?: Record<string, any> | undefined;
    constructor(code: ErrorCode, message: string, details?: Record<string, any> | undefined);
}
/**
 * Helper funkcie pre časté chyby
 */
export declare const createNotFoundError: (message: string, details?: Record<string, any>) => ApiErrorWithCode;
export declare const createValidationError: (message: string, details?: Record<string, any>) => ApiErrorWithCode;
export declare const createUnauthorizedError: (message: string, details?: Record<string, any>) => ApiErrorWithCode;
export declare const createForbiddenError: (message: string, details?: Record<string, any>) => ApiErrorWithCode;
export {};
//# sourceMappingURL=errorHandler.d.ts.map