import { NextFunction, Request, Response } from 'express';
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
export declare function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=requestId.d.ts.map