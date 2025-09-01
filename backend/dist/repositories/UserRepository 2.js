"use strict";
/**
 * User Repository
 * Spravuje všetky databázové operácie pre používateľov
 * Extrahované z postgres-database.ts - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const BaseRepository_1 = require("../models/base/BaseRepository");
const logger_1 = require("../utils/logger");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class UserRepository extends BaseRepository_1.BaseRepository {
    constructor(pool) {
        super(pool);
        // 🚀 PERMISSION CACHE SYSTEM
        this.permissionCache = new Map();
        this.PERMISSION_CACHE_TTL = 5 * 60 * 1000; // 5 minút
    }
    /**
     * Získa používateľa podľa username
     */
    async getUserByUsername(username) {
        try {
            // Najprv skús v hlavnej users tabuľke
            const result = await this.pool.query('SELECT id, username, email, password_hash as password, role, company_id, employee_number, hire_date, is_active, last_login, first_name, last_name, signature_template, created_at, updated_at FROM users WHERE username = $1', [username]);
            if (result.rows.length > 0) {
                return this.mapRowToUser(result.rows[0]);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Error in getUserByUsername:', error);
            throw error;
        }
    }
    /**
     * Získa používateľa podľa ID
     */
    async getUserById(id) {
        try {
            const result = await this.pool.query('SELECT id, username, email, password_hash as password, role, company_id, employee_number, hire_date, is_active, last_login, first_name, last_name, signature_template, created_at, updated_at FROM users WHERE id = $1', [id]);
            if (result.rows.length > 0) {
                return this.mapRowToUser(result.rows[0]);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Error in getUserById:', error);
            throw error;
        }
    }
    /**
     * Vytvorí nového používateľa
     */
    async createUser(userData) {
        return this.executeTransaction(async (client) => {
            // Hash password
            const hashedPassword = await bcryptjs_1.default.hash(userData.password, 12);
            const result = await client.query('INSERT INTO users (username, email, password_hash, role, first_name, last_name, company_id, employee_number, hire_date, signature_template) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, username, email, password_hash as password, role, company_id, employee_number, hire_date, is_active, last_login, first_name, last_name, signature_template, created_at, updated_at', [
                userData.username,
                userData.email,
                hashedPassword,
                userData.role,
                userData.firstName || null,
                userData.lastName || null,
                userData.companyId || null,
                userData.employeeNumber || null,
                userData.hireDate || null,
                userData.signatureTemplate || null
            ]);
            return this.mapRowToUser(result.rows[0]);
        });
    }
    /**
     * Aktualizuje používateľa
     */
    async updateUser(user) {
        const client = await this.getClient();
        try {
            const hashedPassword = await bcryptjs_1.default.hash(user.password, 12);
            await client.query('UPDATE users SET username = $1, email = $2, password_hash = $3, role = $4, company_id = $5, employee_number = $6, hire_date = $7, is_active = $8, first_name = $9, last_name = $10, signature_template = $11, updated_at = CURRENT_TIMESTAMP WHERE id = $12', [
                user.username,
                user.email,
                hashedPassword,
                user.role,
                user.companyId || null,
                user.employeeNumber || null,
                user.hireDate || null,
                user.isActive !== undefined ? user.isActive : true,
                user.firstName || null,
                user.lastName || null,
                user.signatureTemplate || null,
                user.id
            ]);
            // Invalidate permission cache for this user
            this.invalidateUserPermissionCache(user.id);
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Zmaže používateľa
     */
    async deleteUser(id) {
        const client = await this.getClient();
        try {
            await client.query('DELETE FROM users WHERE id = $1', [id]); // Removed parseInt for UUID
            // Invalidate permission cache for this user
            this.invalidateUserPermissionCache(id);
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Získa všetkých používateľov
     */
    async getUsers() {
        const client = await this.getClient();
        try {
            const result = await client.query('SELECT id, username, email, password_hash as password, role, company_id, employee_number, hire_date, is_active, last_login, first_name, last_name, signature_template, created_at, updated_at FROM users ORDER BY created_at DESC');
            return result.rows.map(row => this.mapRowToUser(row));
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Získa používateľov s pagináciou
     */
    async getUsersPaginated(params) {
        const client = await this.getClient();
        try {
            let whereConditions = [];
            let queryParams = [];
            let paramIndex = 1;
            // Search filter
            if (params.search) {
                whereConditions.push(`(u.username ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`);
                queryParams.push(`%${params.search}%`);
                paramIndex++;
            }
            // Role filter
            if (params.role) {
                whereConditions.push(`u.role = $${paramIndex}`);
                queryParams.push(params.role);
                paramIndex++;
            }
            // Company filter
            if (params.company) {
                whereConditions.push(`u.company_id = $${paramIndex}`);
                queryParams.push(params.company);
                paramIndex++;
            }
            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
            // Get total count
            const countQuery = `
        SELECT COUNT(*) 
        FROM users u 
        ${whereClause}
      `;
            const countResult = await client.query(countQuery, queryParams);
            const total = parseInt(countResult.rows[0].count);
            // Get paginated results
            const dataQuery = `
        SELECT u.id, u.username, u.email, u.password_hash as password, u.role, u.company_id, u.employee_number, u.hire_date, u.is_active, u.last_login, u.first_name, u.last_name, u.signature_template, u.created_at, u.updated_at
        FROM users u 
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
            queryParams.push(params.limit, params.offset);
            const dataResult = await client.query(dataQuery, queryParams);
            const users = dataResult.rows.map(row => this.mapRowToUser(row));
            return { users, total };
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Získa oprávnenia používateľa
     */
    async getUserPermissions(userId) {
        const client = await this.getClient();
        try {
            const result = await client.query(`
        SELECT up.*, c.name as company_name
        FROM user_permissions up
        LEFT JOIN companies c ON up.company_id = c.id
        WHERE up.user_id = $1
      `, [userId]);
            return result.rows.map(row => ({
                id: row.id,
                userId: row.user_id,
                companyId: row.company_id,
                companyName: row.company_name,
                permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions,
                createdAt: new Date(row.created_at)
            }));
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Získa prístup používateľa k firmám
     */
    async getUserCompanyAccess(userId) {
        // ⚡ CACHE CHECK: Skontroluj cache najprv
        const cacheKey = `permissions:${userId}`;
        const cached = this.permissionCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.PERMISSION_CACHE_TTL) {
            logger_1.logger.debug('🎯 PERMISSION CACHE HIT for user:', userId);
            return cached.data;
        }
        logger_1.logger.debug('🔄 PERMISSION CACHE MISS for user:', userId);
        const client = await this.getClient();
        try {
            const result = await client.query(`
        SELECT 
          up.company_id,
          c.name as company_name,
          up.permissions,
          up.created_at
        FROM user_permissions up
        JOIN companies c ON up.company_id = c.id
        WHERE up.user_id = $1
        ORDER BY c.name
      `, [userId]);
            const accessList = result.rows.map(row => ({
                companyId: row.company_id,
                companyName: row.company_name,
                permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions,
                grantedAt: new Date(row.created_at)
            }));
            // Cache the result
            this.permissionCache.set(cacheKey, {
                data: accessList,
                timestamp: Date.now()
            });
            return accessList;
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Nastaví oprávnenie používateľa
     */
    async setUserPermission(userId, companyId, permissions) {
        const client = await this.getClient();
        try {
            await client.query(`
        INSERT INTO user_permissions (user_id, company_id, permissions)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, company_id) 
        DO UPDATE SET 
          permissions = EXCLUDED.permissions,
          updated_at = CURRENT_TIMESTAMP
      `, [userId, companyId, JSON.stringify(permissions)]);
            // Invalidate cache
            this.invalidateUserPermissionCache(userId);
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Odstráni oprávnenie používateľa
     */
    async removeUserPermission(userId, companyId) {
        const client = await this.getClient();
        try {
            await client.query(`
        DELETE FROM user_permissions 
        WHERE user_id = $1 AND company_id = $2
      `, [userId, companyId]);
            // Invalidate cache
            this.invalidateUserPermissionCache(userId);
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Získa používateľov s prístupom k firme
     */
    async getUsersWithCompanyAccess(companyId) {
        const client = await this.getClient();
        try {
            const result = await client.query(`
        SELECT up.user_id, u.username, up.permissions
        FROM user_permissions up
        JOIN users u ON up.user_id = u.id
        WHERE up.company_id = $1
        ORDER BY u.username
      `, [companyId]);
            return result.rows.map(row => ({
                userId: row.user_id,
                username: row.username,
                permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions
            }));
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Skontroluje či má používateľ oprávnenie
     */
    async hasPermission(userId, companyId, permission) {
        try {
            const userAccess = await this.getUserCompanyAccess(userId);
            const companyAccess = userAccess.find(access => access.companyId === companyId);
            if (!companyAccess) {
                return false;
            }
            return Boolean(companyAccess.permissions[permission]);
        }
        catch (error) {
            logger_1.logger.error('Error checking permission:', error);
            return false;
        }
    }
    /**
     * Mapuje databázový riadok na User objekt
     */
    mapRowToUser(row) {
        return {
            id: row.id,
            username: row.username,
            email: row.email,
            password: row.password, // password_hash
            role: row.role,
            companyId: row.company_id || undefined,
            employeeNumber: row.employee_number || undefined,
            hireDate: row.hire_date ? new Date(row.hire_date) : undefined,
            isActive: Boolean(row.is_active),
            lastLogin: row.last_login ? new Date(row.last_login) : undefined,
            firstName: row.first_name || undefined,
            lastName: row.last_name || undefined,
            signatureTemplate: row.signature_template || undefined,
            createdAt: new Date(row.created_at),
            updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
        };
    }
    /**
     * Invaliduje permission cache pre používateľa
     */
    invalidateUserPermissionCache(userId) {
        const cacheKey = `permissions:${userId}`;
        this.permissionCache.delete(cacheKey);
        logger_1.logger.debug('🗑️ Permission cache invalidated for user:', userId);
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=UserRepository%202.js.map