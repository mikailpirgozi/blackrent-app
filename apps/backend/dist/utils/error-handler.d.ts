import { NextFunction, Request, Response } from 'express';
/**
 * Global error handler pre backend
 * Zabráni pádu aplikácie pri network chybách
 */
export declare class ErrorHandler {
    static handleUncaughtErrors(): void;
    private static isCriticalError;
    private static gracefulShutdown;
    static expressErrorHandler(err: any, req: Request, res: Response, next: NextFunction): void;
}
//# sourceMappingURL=error-handler.d.ts.map