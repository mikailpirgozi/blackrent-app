/**
 * User Repository
 * Spravuje všetky databázové operácie pre používateľov
 * Extrahované z postgres-database.ts - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
 */

import type { Pool} from 'pg';
import { PoolClient } from 'pg';
import type { User, UserPermission, UserCompanyAccess, CompanyPermissions } from '../types';
import { BaseRepository } from '../models/base/BaseRepository';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

export class UserRepository extends BaseRepository {
  // 🚀 PERMISSION CACHE SYSTEM
  private permissionCache = new Map<string, {
    data: UserCompanyAccess[];
    timestamp: number;
  }>();
  private readonly PERMISSION_CACHE_TTL = 5 * 60 * 1000; // 5 minút

  constructor(pool: Pool) {
    super(pool);
  }

  /**
   * Získa používateľa podľa username
   */
  async getUserByUsername(username: string): Promise<User | null> {
    try {
      // Najprv skús v hlavnej users tabuľke
      const result = await this.pool.query(
        'SELECT id, username, email, password_hash as password, role, company_id, employee_number, hire_date, is_active, last_login, first_name, last_name, signature_template, created_at, updated_at FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length > 0) {
        return this.mapRowToUser(result.rows[0]);
      }

      return null;
    } catch (error) {
      logger.error('Error in getUserByUsername:', error);
      throw error;
    }
  }

  /**
   * Získa používateľa podľa ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const result = await this.pool.query(
        'SELECT id, username, email, password_hash as password, role, company_id, employee_number, hire_date, is_active, last_login, first_name, last_name, signature_template, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length > 0) {
        return this.mapRowToUser(result.rows[0]);
      }

      return null;
    } catch (error) {
      logger.error('Error in getUserById:', error);
      throw error;
    }
  }

  /**
   * Vytvorí nového používateľa
   */
  async createUser(userData: { 
    username: string; 
    email: string; 
    password: string; 
    role: string;
    firstName?: string | null;
    lastName?: string | null;
    companyId?: string | null;
    employeeNumber?: string | null;
    hireDate?: Date | null;
    signatureTemplate?: string | null;
  }): Promise<User> {
    return this.executeTransaction(async (client) => {
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const result = await client.query(
        'INSERT INTO users (username, email, password_hash, role, first_name, last_name, company_id, employee_number, hire_date, signature_template) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, username, email, password_hash as password, role, company_id, employee_number, hire_date, is_active, last_login, first_name, last_name, signature_template, created_at, updated_at',
        [
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
        ]
      );

      return this.mapRowToUser(result.rows[0]);
    });
  }

  /**
   * Aktualizuje používateľa
   */
  async updateUser(user: User): Promise<void> {
    const client = await this.getClient();
    try {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      await client.query(
        'UPDATE users SET username = $1, email = $2, password_hash = $3, role = $4, company_id = $5, employee_number = $6, hire_date = $7, is_active = $8, first_name = $9, last_name = $10, signature_template = $11, updated_at = CURRENT_TIMESTAMP WHERE id = $12',
        [
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
        ]
      );

      // Invalidate permission cache for this user
      this.invalidateUserPermissionCache(user.id);
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Zmaže používateľa
   */
  async deleteUser(id: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query('DELETE FROM users WHERE id = $1', [id]); // Removed parseInt for UUID
      
      // Invalidate permission cache for this user
      this.invalidateUserPermissionCache(id);
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Získa všetkých používateľov
   */
  async getUsers(): Promise<User[]> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        'SELECT id, username, email, password_hash as password, role, company_id, employee_number, hire_date, is_active, last_login, first_name, last_name, signature_template, created_at, updated_at FROM users ORDER BY created_at DESC'
      );

      return result.rows.map(row => this.mapRowToUser(row));
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Získa používateľov s pagináciou
   */
  async getUsersPaginated(params: {
    limit: number;
    offset: number;
    search?: string;
    role?: string;
    company?: string;
  }): Promise<{ users: User[]; total: number }> {
    const client = await this.getClient();
    try {
      const whereConditions: string[] = [];
      const queryParams: any[] = [];
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
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Získa oprávnenia používateľa
   */
  async getUserPermissions(userId: string): Promise<UserPermission[]> {
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
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Získa prístup používateľa k firmám
   */
  async getUserCompanyAccess(userId: string): Promise<UserCompanyAccess[]> {
    // ⚡ CACHE CHECK: Skontroluj cache najprv
    const cacheKey = `permissions:${userId}`;
    const cached = this.permissionCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.PERMISSION_CACHE_TTL) {
      logger.debug('🎯 PERMISSION CACHE HIT for user:', userId);
      return cached.data;
    }

    logger.debug('🔄 PERMISSION CACHE MISS for user:', userId);
    
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

      const accessList: UserCompanyAccess[] = result.rows.map(row => ({
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
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Nastaví oprávnenie používateľa
   */
  async setUserPermission(userId: string, companyId: string, permissions: CompanyPermissions): Promise<void> {
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
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Odstráni oprávnenie používateľa
   */
  async removeUserPermission(userId: string, companyId: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query(`
        DELETE FROM user_permissions 
        WHERE user_id = $1 AND company_id = $2
      `, [userId, companyId]);

      // Invalidate cache
      this.invalidateUserPermissionCache(userId);
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Získa používateľov s prístupom k firme
   */
  async getUsersWithCompanyAccess(companyId: string): Promise<{userId: string, username: string, permissions: CompanyPermissions}[]> {
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
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Skontroluje či má používateľ oprávnenie
   */
  async hasPermission(userId: string, companyId: string, permission: keyof CompanyPermissions): Promise<boolean> {
    try {
      const userAccess = await this.getUserCompanyAccess(userId);
      const companyAccess = userAccess.find(access => access.companyId === companyId);
      
      if (!companyAccess) {
        return false;
      }

      return Boolean(companyAccess.permissions[permission]);
    } catch (error) {
      logger.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Mapuje databázový riadok na User objekt
   */
  private mapRowToUser(row: any): User {
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
  private invalidateUserPermissionCache(userId: string): void {
    const cacheKey = `permissions:${userId}`;
    this.permissionCache.delete(cacheKey);
    logger.debug('🗑️ Permission cache invalidated for user:', userId);
  }
}
