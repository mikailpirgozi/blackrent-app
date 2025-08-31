import type { NextFunction, Response } from 'express';
import type { AuthRequest } from '../types';
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requirePermission: (resource: string, action: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const filterDataByRole: (data: any[], req: AuthRequest) => any[];
//# sourceMappingURL=auth.d.ts.map