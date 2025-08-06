import { AuditLog, AuditLogCreateRequest, AuditAction } from '../types';
import { Request } from 'express';
export declare class AuditService {
    /**
     * Vytvorí nový audit log
     */
    static createAuditLog(data: AuditLogCreateRequest): Promise<void>;
    /**
     * Získa audit logy s filtračnými možnosťami
     */
    static getAuditLogs(filters?: {
        userId?: string;
        action?: AuditAction;
        resourceType?: string;
        success?: boolean;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{
        logs: AuditLog[];
        total: number;
    }>;
    /**
     * Audit pre email operácie
     */
    static logEmailOperation(action: 'email_processed' | 'email_approved' | 'email_rejected', req: Request, resourceId: string, details?: Record<string, any>): Promise<void>;
    /**
     * Audit pre rental operácie
     */
    static logRentalOperation(action: 'rental_approved' | 'rental_rejected' | 'rental_edited', req: Request, rentalId: string, details?: Record<string, any>): Promise<void>;
    /**
     * Audit pre login/logout operácie
     */
    static logAuthOperation(action: 'login' | 'logout', req: Request, username: string, success: boolean, errorMessage?: string): Promise<void>;
    /**
     * Audit pre CRUD operácie
     */
    static logCRUDOperation(action: 'create' | 'update' | 'delete' | 'read', req: Request, resourceType: string, resourceId?: string, details?: Record<string, any>): Promise<void>;
    /**
     * Audit pre systémové chyby
     */
    static logSystemError(error: Error, resourceType: string, resourceId?: string, details?: Record<string, any>): Promise<void>;
    /**
     * Získa IP adresu klienta z requestu
     */
    private static getClientIP;
    /**
     * Získa štatistiky audit logov
     */
    static getAuditStats(days?: number): Promise<{
        totalOperations: number;
        successfulOperations: number;
        failedOperations: number;
        topActions: Array<{
            action: string;
            count: number;
        }>;
        topUsers: Array<{
            username: string;
            count: number;
        }>;
        errorRate: number;
    }>;
}
export declare const auditService: AuditService;
//# sourceMappingURL=audit-service.d.ts.map