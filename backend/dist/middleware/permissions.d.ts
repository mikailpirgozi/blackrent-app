import { Request, Response, NextFunction } from 'express';
import { UserRole, Permission, PermissionResult, User } from '../types';
declare global {
    namespace Express {
        interface Request {
            user?: Omit<User, 'password'>;
            permissionCheck?: PermissionResult;
        }
    }
}
export declare const ROLE_PERMISSIONS: Record<UserRole, Permission[]>;
export declare function hasPermission(userRole: UserRole, resource: Permission['resource'], action: Permission['actions'][0], context?: {
    userId?: string;
    companyId?: string;
    resourceOwnerId?: string;
    resourceCompanyId?: string;
    amount?: number;
}): PermissionResult;
export declare function checkPermission(resource: Permission['resource'], action: Permission['actions'][0], options?: {
    getContext?: (req: Request) => Promise<any>;
    onApprovalRequired?: (req: Request, res: Response) => void;
}): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare function getUserPermissions(userRole: UserRole): Permission[];
export declare function canUserAccess(userRole: UserRole, resource: Permission['resource'], action: Permission['actions'][0]): boolean;
//# sourceMappingURL=permissions.d.ts.map