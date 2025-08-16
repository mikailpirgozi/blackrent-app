"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = exports.AuditService = void 0;
const postgres_database_1 = require("../models/postgres-database");
class AuditService {
    // =====================================================
    // 📊 HLAVNÉ AUDIT FUNKCIE
    // =====================================================
    /**
     * Vytvorí nový audit log
     */
    static async createAuditLog(data) {
        try {
            const query = `
        INSERT INTO audit_logs (
          user_id, username, action, resource_type, resource_id,
          details, metadata, ip_address, user_agent, success, error_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;
            const values = [
                data.userId || null,
                data.username || null,
                data.action,
                data.resourceType,
                data.resourceId || null,
                data.details ? JSON.stringify(data.details) : null,
                data.metadata ? JSON.stringify(data.metadata) : null,
                data.ipAddress || null,
                data.userAgent || null,
                data.success !== undefined ? data.success : true,
                data.errorMessage || null
            ];
            await postgres_database_1.postgresDatabase.query(query, values);
            console.log(`📊 Audit Log: ${data.username || 'System'} - ${data.action} - ${data.resourceType}${data.resourceId ? ` (${data.resourceId})` : ''}`);
        }
        catch (error) {
            console.error('❌ Audit Service Error:', error.message);
            // Neblokujeme operáciu kvôli audit chybe
        }
    }
    /**
     * Získa audit logy s filtračnými možnosťami
     */
    static async getAuditLogs(filters) {
        try {
            let whereConditions = [];
            let queryParams = [];
            let paramIndex = 1;
            // Filtrovanie podľa parametrov
            if (filters?.userId) {
                whereConditions.push(`user_id = $${paramIndex}`);
                queryParams.push(filters.userId);
                paramIndex++;
            }
            if (filters?.action) {
                whereConditions.push(`action = $${paramIndex}`);
                queryParams.push(filters.action);
                paramIndex++;
            }
            if (filters?.resourceType) {
                whereConditions.push(`resource_type = $${paramIndex}`);
                queryParams.push(filters.resourceType);
                paramIndex++;
            }
            if (filters?.success !== undefined) {
                whereConditions.push(`success = $${paramIndex}`);
                queryParams.push(filters.success);
                paramIndex++;
            }
            if (filters?.startDate) {
                whereConditions.push(`created_at >= $${paramIndex}`);
                queryParams.push(filters.startDate);
                paramIndex++;
            }
            if (filters?.endDate) {
                whereConditions.push(`created_at <= $${paramIndex}`);
                queryParams.push(filters.endDate);
                paramIndex++;
            }
            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
            // Získanie počtu záznamov
            const countQuery = `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`;
            const countResult = await postgres_database_1.postgresDatabase.query(countQuery, queryParams);
            const total = parseInt(countResult.rows[0].total);
            // Získanie dát s pagináciou
            const limit = filters?.limit || 50;
            const offset = filters?.offset || 0;
            const dataQuery = `
        SELECT 
          id, user_id, username, action, resource_type, resource_id,
          details, metadata, ip_address, user_agent, success, 
          error_message, created_at
        FROM audit_logs 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
            queryParams.push(limit, offset);
            const dataResult = await postgres_database_1.postgresDatabase.query(dataQuery, queryParams);
            const logs = dataResult.rows.map((row) => {
                // Safe JSON parsing - ak parsing zlyhá, vráti undefined
                const safeParseJSON = (jsonString) => {
                    if (!jsonString)
                        return undefined;
                    try {
                        return JSON.parse(jsonString);
                    }
                    catch (error) {
                        console.warn('⚠️ Audit Log JSON parse error:', jsonString, error);
                        return undefined;
                    }
                };
                return {
                    id: row.id,
                    userId: row.user_id,
                    username: row.username,
                    action: row.action,
                    resourceType: row.resource_type,
                    resourceId: row.resource_id,
                    details: safeParseJSON(row.details),
                    metadata: safeParseJSON(row.metadata),
                    ipAddress: row.ip_address,
                    userAgent: row.user_agent,
                    success: row.success,
                    errorMessage: row.error_message,
                    createdAt: row.created_at.toISOString()
                };
            });
            return { logs, total };
        }
        catch (error) {
            console.error('❌ Get Audit Logs Error:', error.message);
            return { logs: [], total: 0 };
        }
    }
    // =====================================================
    // 🛠️ HELPER FUNKCIE PRE RÔZNE OPERÁCIE
    // =====================================================
    /**
     * Audit pre email operácie
     */
    static async logEmailOperation(action, req, resourceId, details) {
        const user = req.user;
        await this.createAuditLog({
            userId: user?.id,
            username: user?.username || 'System',
            action,
            resourceType: 'email',
            resourceId,
            details,
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            success: true
        });
    }
    /**
     * Audit pre rental operácie
     */
    static async logRentalOperation(action, req, rentalId, details) {
        const user = req.user;
        await this.createAuditLog({
            userId: user?.id,
            username: user?.username,
            action,
            resourceType: 'rental',
            resourceId: rentalId,
            details,
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            success: true
        });
    }
    /**
     * Audit pre login/logout operácie
     */
    static async logAuthOperation(action, req, username, success, errorMessage) {
        await this.createAuditLog({
            username,
            action,
            resourceType: 'auth',
            success,
            errorMessage,
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent')
        });
    }
    /**
     * Audit pre CRUD operácie
     */
    static async logCRUDOperation(action, req, resourceType, resourceId, details) {
        const user = req.user;
        await this.createAuditLog({
            userId: user?.id,
            username: user?.username,
            action,
            resourceType,
            resourceId,
            details,
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            success: true
        });
    }
    /**
     * Audit pre systémové chyby
     */
    static async logSystemError(error, resourceType, resourceId, details) {
        await this.createAuditLog({
            username: 'System',
            action: 'system_error',
            resourceType,
            resourceId,
            details: {
                error: error.message,
                stack: error.stack,
                ...details
            },
            success: false,
            errorMessage: error.message
        });
    }
    // =====================================================
    // 🔧 UTILITY FUNKCIE
    // =====================================================
    /**
     * Získa IP adresu klienta z requestu
     */
    static getClientIP(req) {
        const forwarded = req.get('X-Forwarded-For');
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }
        return req.get('X-Real-IP') ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            'unknown';
    }
    /**
     * Získa štatistiky audit logov
     */
    static async getAuditStats(days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            // Celkový počet operácií
            const totalQuery = `
        SELECT COUNT(*) as total,
               SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful,
               SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as failed
        FROM audit_logs 
        WHERE created_at >= $1
      `;
            const totalResult = await postgres_database_1.postgresDatabase.query(totalQuery, [startDate]);
            const { total, successful, failed } = totalResult.rows[0];
            // Top akcie
            const actionsQuery = `
        SELECT action, COUNT(*) as count
        FROM audit_logs 
        WHERE created_at >= $1
        GROUP BY action
        ORDER BY count DESC
        LIMIT 10
      `;
            const actionsResult = await postgres_database_1.postgresDatabase.query(actionsQuery, [startDate]);
            // Top používatelia
            const usersQuery = `
        SELECT username, COUNT(*) as count
        FROM audit_logs 
        WHERE created_at >= $1 AND username IS NOT NULL
        GROUP BY username
        ORDER BY count DESC
        LIMIT 10
      `;
            const usersResult = await postgres_database_1.postgresDatabase.query(usersQuery, [startDate]);
            return {
                totalOperations: parseInt(total) || 0,
                successfulOperations: parseInt(successful) || 0,
                failedOperations: parseInt(failed) || 0,
                topActions: actionsResult.rows || [],
                topUsers: usersResult.rows || [],
                errorRate: total > 0 ? (parseInt(failed) / parseInt(total)) * 100 : 0
            };
        }
        catch (error) {
            console.error('❌ Get Audit Stats Error:', error.message);
            return {
                totalOperations: 0,
                successfulOperations: 0,
                failedOperations: 0,
                topActions: [],
                topUsers: [],
                errorRate: 0
            };
        }
    }
}
exports.AuditService = AuditService;
exports.auditService = new AuditService();
//# sourceMappingURL=audit-service.js.map