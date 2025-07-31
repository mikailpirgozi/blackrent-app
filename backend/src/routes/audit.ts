import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { ApiResponse, AuditAction } from '../types';
import { AuditService } from '../services/audit-service';

const router = express.Router();

// =====================================================
// 📊 AUDIT LOGS ROUTES
// =====================================================

/**
 * GET /api/audit/logs - Získanie audit logov s filtračnými možnosťami
 */
router.get('/logs',
  authenticateToken,
  checkPermission('*', 'read'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      console.log('📊 Načítavam audit logs...');

      const {
        userId,
        action,
        resourceType,
        success,
        startDate,
        endDate,
        limit = '50',
        offset = '0'
      } = req.query;

      const filters = {
        userId: userId as string,
        action: action as AuditAction,
        resourceType: resourceType as string,
        success: success === 'true' ? true : success === 'false' ? false : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };

      const result = await AuditService.getAuditLogs(filters);

      console.log(`📊 Načítané audit logs: ${result.logs.length}/${result.total}`);

      res.json({
        success: true,
        data: {
          logs: result.logs,
          total: result.total,
          page: Math.floor(filters.offset / filters.limit) + 1,
          totalPages: Math.ceil(result.total / filters.limit)
        }
      });

      // Audit pre čítanie logov - serialize dates to strings
      await AuditService.logCRUDOperation('read', req, 'audit_logs', undefined, {
        filters: {
          ...filters,
          startDate: filters.startDate?.toISOString(),
          endDate: filters.endDate?.toISOString()
        },
        resultCount: result.logs.length
      });

    } catch (error: any) {
      console.error('❌ Get audit logs error:', error);
      
      await AuditService.logSystemError(error, 'audit_logs', undefined, {
        operation: 'get_logs',
        filters: req.query
      });

      res.status(500).json({
        success: false,
        error: 'Chyba pri načítaní audit logov'
      });
    }
  }
);

/**
 * GET /api/audit/stats - Získanie štatistík audit logov
 */
router.get('/stats',
  authenticateToken,
  checkPermission('*', 'read'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      console.log('📊 Načítavam audit štatistiky...');

      const { days = '30' } = req.query;
      const daysNumber = parseInt(days as string);

      const stats = await AuditService.getAuditStats(daysNumber);

      console.log(`📊 Štatistiky za ${daysNumber} dní: ${stats.totalOperations} operácií`);

      res.json({
        success: true,
        data: {
          ...stats,
          period: {
            days: daysNumber,
            from: new Date(Date.now() - daysNumber * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString()
          }
        }
      });

      // Audit pre čítanie štatistík
      await AuditService.logCRUDOperation('read', req, 'audit_stats', undefined, {
        period: daysNumber,
        totalOperations: stats.totalOperations
      });

    } catch (error: any) {
      console.error('❌ Get audit stats error:', error);
      
      await AuditService.logSystemError(error, 'audit_stats', undefined, {
        operation: 'get_stats',
        days: req.query.days
      });

      res.status(500).json({
        success: false,
        error: 'Chyba pri načítaní audit štatistík'
      });
    }
  }
);

/**
 * GET /api/audit/actions - Získanie zoznamu dostupných audit akcií
 */
router.get('/actions',
  authenticateToken,
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const actions: AuditAction[] = [
        'create', 'update', 'delete', 'read', 'login', 'logout',
        'email_processed', 'email_approved', 'email_rejected',
        'rental_approved', 'rental_rejected', 'rental_edited',
        'system_error', 'api_call', 'file_upload', 'file_delete'
      ];

      const actionGroups = {
        crud: ['create', 'update', 'delete', 'read'],
        auth: ['login', 'logout'],
        email: ['email_processed', 'email_approved', 'email_rejected'],
        rental: ['rental_approved', 'rental_rejected', 'rental_edited'],
        system: ['system_error', 'api_call', 'file_upload', 'file_delete']
      };

      res.json({
        success: true,
        data: {
          actions,
          groups: actionGroups
        }
      });

    } catch (error: any) {
      console.error('❌ Get audit actions error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri načítaní audit akcií'
      });
    }
  }
);

/**
 * DELETE /api/audit/logs/cleanup - Vyčistenie starých audit logov
 */
router.delete('/logs/cleanup',
  authenticateToken,
  checkPermission('*', 'delete'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      console.log('🧹 Spúšťam cleanup audit logov...');

      const { days = '90' } = req.query;
      const daysNumber = parseInt(days as string);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysNumber);

      const deleteQuery = `
        DELETE FROM audit_logs 
        WHERE created_at < $1
        RETURNING id
      `;

      const result = await (AuditService as any).postgresDatabase.query(deleteQuery, [cutoffDate]);
      const deletedCount = result.rows.length;

      console.log(`🧹 Vymazané audit logs: ${deletedCount} záznamov starších ako ${daysNumber} dní`);

      res.json({
        success: true,
        data: {
          deletedCount,
          cutoffDate: cutoffDate.toISOString(),
          days: daysNumber
        }
      });

      // Audit pre cleanup operáciu
      await AuditService.logCRUDOperation('delete', req, 'audit_logs', undefined, {
        operation: 'cleanup',
        deletedCount,
        days: daysNumber,
        cutoffDate: cutoffDate.toISOString()
      });

    } catch (error: any) {
      console.error('❌ Audit logs cleanup error:', error);
      
      await AuditService.logSystemError(error, 'audit_logs', undefined, {
        operation: 'cleanup',
        days: req.query.days
      });

      res.status(500).json({
        success: false,
        error: 'Chyba pri vyčistení audit logov'
      });
    }
  }
);

export default router;