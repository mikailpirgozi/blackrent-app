// 🏢 Advanced User Management Service
// Multi-tenant user management with enhanced permissions

import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { postgresDatabase } from '../models/postgres-database';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  businessId?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  subscriptionPlan: 'basic' | 'premium' | 'enterprise';
  subscriptionStatus: 'active' | 'suspended' | 'cancelled';
  subscriptionExpiresAt?: Date;
  maxUsers: number;
  maxVehicles: number;
  settings: Record<string, any>;
  branding: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
}

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  parentDepartmentId?: string;
  managerId?: string;
  monthlyBudget?: number;
  vehicleLimit?: number;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Role {
  id: string;
  organizationId: string;
  name: string;
  displayName: string;
  description?: string;
  level: number;
  parentRoleId?: string;
  permissions: Record<string, any>;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
}

export interface AdvancedUser {
  id: string;
  organizationId: string;
  departmentId?: string;
  username: string;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
  avatarUrl?: string;
  employeeNumber?: string;
  jobTitle?: string;
  hireDate?: Date;
  terminationDate?: Date;
  salary?: number;
  managerId?: string;
  roleId: string;
  customPermissions: Record<string, any>;
  isActive: boolean;
  isVerified: boolean;
  emailVerifiedAt?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  loginCount: number;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
  language: string;
  timezone: string;
  theme: string;
  preferences: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
}

export interface UserSession {
  id: string;
  userId: string;
  tokenHash: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: Record<string, any>;
  location?: Record<string, any>;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string;
  organizationId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  endpoint?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
  durationMs?: number;
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  teamLeadId?: string;
  isActive: boolean;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
}

class AdvancedUserService {
  private pool: Pool;

  constructor() {
    this.pool = (postgresDatabase as any).pool;
  }

  // ================================================================================
  // ORGANIZATION MANAGEMENT
  // ================================================================================

  async createOrganization(data: Partial<Organization>, createdBy?: string): Promise<Organization> {
    const {
      name,
      slug,
      domain,
      businessId,
      taxId,
      address,
      phone,
      email,
      website,
      logoUrl,
      subscriptionPlan = 'basic',
      maxUsers = 10,
      maxVehicles = 50,
      settings = {},
      branding = {}
    } = data;

    const result = await this.pool.query(
      `INSERT INTO organizations (
        name, slug, domain, business_id, tax_id, address, phone, email, website, logo_url,
        subscription_plan, max_users, max_vehicles, settings, branding, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        name, slug, domain, businessId, taxId, address, phone, email, website, logoUrl,
        subscriptionPlan, maxUsers, maxVehicles, JSON.stringify(settings), JSON.stringify(branding), createdBy
      ]
    );

    const organization = this.mapOrganization(result.rows[0]);

    // Create default roles for the organization
    await this.pool.query('SELECT create_default_roles($1)', [organization.id]);

    return organization;
  }

  async getOrganization(id: string): Promise<Organization | null> {
    const result = await this.pool.query(
      'SELECT * FROM organizations WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? this.mapOrganization(result.rows[0]) : null;
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    const result = await this.pool.query(
      'SELECT * FROM organizations WHERE slug = $1',
      [slug]
    );

    return result.rows.length > 0 ? this.mapOrganization(result.rows[0]) : null;
  }

  async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'createdAt') {
        const dbKey = this.camelToSnake(key);
        fields.push(`${dbKey} = $${paramCount}`);
        values.push(typeof value === 'object' ? JSON.stringify(value) : value);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.pool.query(
      `UPDATE organizations SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? this.mapOrganization(result.rows[0]) : null;
  }

  async getOrganizationStats(organizationId: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM organization_stats WHERE id = $1',
      [organizationId]
    );

    return result.rows[0] || null;
  }

  // ================================================================================
  // DEPARTMENT MANAGEMENT
  // ================================================================================

  async createDepartment(data: Partial<Department>): Promise<Department> {
    const {
      organizationId,
      name,
      description,
      parentDepartmentId,
      managerId,
      monthlyBudget,
      vehicleLimit,
      settings = {}
    } = data;

    const result = await this.pool.query(
      `INSERT INTO departments (
        organization_id, name, description, parent_department_id, manager_id,
        monthly_budget, vehicle_limit, settings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        organizationId, name, description, parentDepartmentId, managerId,
        monthlyBudget, vehicleLimit, JSON.stringify(settings)
      ]
    );

    return this.mapDepartment(result.rows[0]);
  }

  async getDepartmentsByOrganization(organizationId: string): Promise<Department[]> {
    const result = await this.pool.query(
      'SELECT * FROM departments WHERE organization_id = $1 ORDER BY name',
      [organizationId]
    );

    return result.rows.map(row => this.mapDepartment(row));
  }

  async updateDepartment(id: string, data: Partial<Department>): Promise<Department | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'createdAt') {
        const dbKey = this.camelToSnake(key);
        fields.push(`${dbKey} = $${paramCount}`);
        values.push(typeof value === 'object' ? JSON.stringify(value) : value);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.pool.query(
      `UPDATE departments SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? this.mapDepartment(result.rows[0]) : null;
  }

  // ================================================================================
  // ROLE MANAGEMENT
  // ================================================================================

  async createRole(data: Partial<Role>, createdBy?: string): Promise<Role> {
    const {
      organizationId,
      name,
      displayName,
      description,
      level = 1,
      parentRoleId,
      permissions = {},
      isActive = true
    } = data;

    const result = await this.pool.query(
      `INSERT INTO roles (
        organization_id, name, display_name, description, level, parent_role_id,
        permissions, is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        organizationId, name, displayName, description, level, parentRoleId,
        JSON.stringify(permissions), isActive, createdBy
      ]
    );

    return this.mapRole(result.rows[0]);
  }

  async getRolesByOrganization(organizationId: string): Promise<Role[]> {
    const result = await this.pool.query(
      'SELECT * FROM roles WHERE organization_id = $1 ORDER BY level DESC, name',
      [organizationId]
    );

    return result.rows.map(row => this.mapRole(row));
  }

  async getRole(id: string): Promise<Role | null> {
    const result = await this.pool.query(
      'SELECT * FROM roles WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? this.mapRole(result.rows[0]) : null;
  }

  async updateRole(id: string, data: Partial<Role>): Promise<Role | null> {
    // Prevent updating system roles
    const existingRole = await this.getRole(id);
    if (existingRole?.isSystem) {
      throw new Error('Cannot update system roles');
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'isSystem') {
        const dbKey = this.camelToSnake(key);
        fields.push(`${dbKey} = $${paramCount}`);
        values.push(typeof value === 'object' ? JSON.stringify(value) : value);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.pool.query(
      `UPDATE roles SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? this.mapRole(result.rows[0]) : null;
  }

  async deleteRole(id: string): Promise<boolean> {
    // Prevent deleting system roles
    const existingRole = await this.getRole(id);
    if (existingRole?.isSystem) {
      throw new Error('Cannot delete system roles');
    }

    // Check if role is in use
    const usageCheck = await this.pool.query(
      'SELECT COUNT(*) as count FROM users_advanced WHERE role_id = $1',
      [id]
    );

    if (parseInt(usageCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete role that is assigned to users');
    }

    const result = await this.pool.query(
      'DELETE FROM roles WHERE id = $1 AND is_system = FALSE',
      [id]
    );

    return (result.rowCount || 0) > 0;
  }

  // ================================================================================
  // ADVANCED USER MANAGEMENT
  // ================================================================================

  async createAdvancedUser(data: Partial<AdvancedUser>, createdBy?: string): Promise<AdvancedUser> {
    const {
      organizationId,
      departmentId,
      username,
      email,
      password,
      firstName,
      lastName,
      middleName,
      phone,
      avatarUrl,
      employeeNumber,
      jobTitle,
      hireDate,
      salary,
      managerId,
      roleId,
      customPermissions = {},
      language = 'sk',
      timezone = 'Europe/Bratislava',
      theme = 'light',
      preferences = {}
    } = data as any;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await this.pool.query(
      `INSERT INTO users_advanced (
        organization_id, department_id, username, email, password_hash,
        first_name, last_name, middle_name, phone, avatar_url,
        employee_number, job_title, hire_date, salary, manager_id,
        role_id, custom_permissions, language, timezone, theme, preferences, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        organizationId, departmentId, username, email, passwordHash,
        firstName, lastName, middleName, phone, avatarUrl,
        employeeNumber, jobTitle, hireDate, salary, managerId,
        roleId, JSON.stringify(customPermissions), language, timezone, theme, JSON.stringify(preferences), createdBy
      ]
    );

    return this.mapAdvancedUser(result.rows[0]);
  }

  async getAdvancedUser(id: string): Promise<AdvancedUser | null> {
    const result = await this.pool.query(
      'SELECT * FROM users_advanced WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? this.mapAdvancedUser(result.rows[0]) : null;
  }

  async getUsersByOrganization(organizationId: string): Promise<AdvancedUser[]> {
    const result = await this.pool.query(
      'SELECT * FROM users_advanced WHERE organization_id = $1 ORDER BY last_name, first_name',
      [organizationId]
    );

    return result.rows.map(row => this.mapAdvancedUser(row));
  }

  async getUserDetails(userId: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM user_details WHERE id = $1',
      [userId]
    );

    return result.rows[0] || null;
  }

  async updateAdvancedUser(id: string, data: Partial<AdvancedUser>): Promise<AdvancedUser | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'passwordHash') {
        const dbKey = this.camelToSnake(key);
        fields.push(`${dbKey} = $${paramCount}`);
        values.push(typeof value === 'object' ? JSON.stringify(value) : value);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.pool.query(
      `UPDATE users_advanced SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? this.mapAdvancedUser(result.rows[0]) : null;
  }

  async changeUserPassword(userId: string, newPassword: string): Promise<boolean> {
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const result = await this.pool.query(
      'UPDATE users_advanced SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, userId]
    );

    return (result.rowCount || 0) > 0;
  }

  async deactivateUser(userId: string): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE users_advanced SET is_active = FALSE, updated_at = NOW() WHERE id = $1',
      [userId]
    );

    // Also deactivate all user sessions
    await this.pool.query(
      'UPDATE user_sessions SET is_active = FALSE WHERE user_id = $1',
      [userId]
    );

    return (result.rowCount || 0) > 0;
  }

  // ================================================================================
  // ACTIVITY LOGGING
  // ================================================================================

  async logActivity(data: Partial<ActivityLog>): Promise<void> {
    const {
      userId,
      organizationId,
      action,
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
      method,
      endpoint,
      oldValues,
      newValues,
      success = true,
      errorMessage,
      durationMs
    } = data;

    await this.pool.query(
      `INSERT INTO user_activity_log (
        user_id, organization_id, action, resource_type, resource_id,
        ip_address, user_agent, method, endpoint, old_values, new_values,
        success, error_message, duration_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        userId, organizationId, action, resourceType, resourceId,
        ipAddress, userAgent, method, endpoint,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        success, errorMessage, durationMs
      ]
    );
  }

  async getActivityLog(organizationId: string, filters: any = {}, limit = 100): Promise<ActivityLog[]> {
    let query = 'SELECT * FROM user_activity_log WHERE organization_id = $1';
    const values = [organizationId];
    let paramCount = 2;

    if (filters.userId) {
      query += ` AND user_id = $${paramCount}`;
      values.push(filters.userId);
      paramCount++;
    }

    if (filters.action) {
      query += ` AND action = $${paramCount}`;
      values.push(filters.action);
      paramCount++;
    }

    if (filters.resourceType) {
      query += ` AND resource_type = $${paramCount}`;
      values.push(filters.resourceType);
      paramCount++;
    }

    if (filters.startDate) {
      query += ` AND created_at >= $${paramCount}`;
      values.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND created_at <= $${paramCount}`;
      values.push(filters.endDate);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
    values.push(limit.toString());

    const result = await this.pool.query(query, values);

    return result.rows.map(row => this.mapActivityLog(row));
  }

  // ================================================================================
  // TEAM MANAGEMENT
  // ================================================================================

  async createTeam(data: Partial<Team>, createdBy?: string): Promise<Team> {
    const {
      organizationId,
      name,
      description,
      teamLeadId,
      settings = {}
    } = data;

    const result = await this.pool.query(
      `INSERT INTO teams (organization_id, name, description, team_lead_id, settings, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [organizationId, name, description, teamLeadId, JSON.stringify(settings), createdBy]
    );

    return this.mapTeam(result.rows[0]);
  }

  async addTeamMember(teamId: string, userId: string, role = 'member'): Promise<TeamMember> {
    const result = await this.pool.query(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, $3) RETURNING *`,
      [teamId, userId, role]
    );

    return this.mapTeamMember(result.rows[0]);
  }

  async getTeamsByOrganization(organizationId: string): Promise<Team[]> {
    const result = await this.pool.query(
      'SELECT * FROM teams WHERE organization_id = $1 ORDER BY name',
      [organizationId]
    );

    return result.rows.map(row => this.mapTeam(row));
  }

  async getTeamMembers(teamId: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT tm.*, u.first_name, u.last_name, u.email, u.job_title
       FROM team_members tm
       JOIN users_advanced u ON tm.user_id = u.id
       WHERE tm.team_id = $1 AND tm.is_active = TRUE
       ORDER BY tm.role DESC, u.last_name, u.first_name`,
      [teamId]
    );

    return result.rows;
  }

  // ================================================================================
  // PERMISSION SYSTEM
  // ================================================================================

  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    // Get user with role and permissions
    const userResult = await this.pool.query(
      `SELECT u.*, r.permissions as role_permissions, r.level as role_level
       FROM users_advanced u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1 AND u.is_active = TRUE`,
      [userId]
    );

    if (userResult.rows.length === 0) return false;

    const user = userResult.rows[0];
    const rolePermissions = user.role_permissions;
    const customPermissions = user.custom_permissions;

    // Check role permissions
    if (this.hasPermission(rolePermissions, resource, action)) return true;

    // Check custom permissions
    if (this.hasPermission(customPermissions, resource, action)) return true;

    return false;
  }

  private hasPermission(permissions: any, resource: string, action: string): boolean {
    if (!permissions) return false;

    // Check wildcard permissions
    if (permissions['*'] && (permissions['*'].actions.includes('*') || permissions['*'].actions.includes(action))) {
      return true;
    }

    // Check specific resource permissions
    if (permissions[resource] && permissions[resource].actions.includes(action)) {
      return true;
    }

    return false;
  }

  // ================================================================================
  // UTILITY METHODS
  // ================================================================================

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  private mapOrganization(row: any): Organization {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      domain: row.domain,
      businessId: row.business_id,
      taxId: row.tax_id,
      address: row.address,
      phone: row.phone,
      email: row.email,
      website: row.website,
      logoUrl: row.logo_url,
      subscriptionPlan: row.subscription_plan,
      subscriptionStatus: row.subscription_status,
      subscriptionExpiresAt: row.subscription_expires_at,
      maxUsers: row.max_users,
      maxVehicles: row.max_vehicles,
      settings: row.settings || {},
      branding: row.branding || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by
    };
  }

  private mapDepartment(row: any): Department {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      description: row.description,
      parentDepartmentId: row.parent_department_id,
      managerId: row.manager_id,
      monthlyBudget: row.monthly_budget,
      vehicleLimit: row.vehicle_limit,
      settings: row.settings || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRole(row: any): Role {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      displayName: row.display_name,
      description: row.description,
      level: row.level,
      parentRoleId: row.parent_role_id,
      permissions: row.permissions || {},
      isSystem: row.is_system,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by
    };
  }

  private mapAdvancedUser(row: any): AdvancedUser {
    return {
      id: row.id,
      organizationId: row.organization_id,
      departmentId: row.department_id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      firstName: row.first_name,
      lastName: row.last_name,
      middleName: row.middle_name,
      phone: row.phone,
      avatarUrl: row.avatar_url,
      employeeNumber: row.employee_number,
      jobTitle: row.job_title,
      hireDate: row.hire_date,
      terminationDate: row.termination_date,
      salary: row.salary,
      managerId: row.manager_id,
      roleId: row.role_id,
      customPermissions: row.custom_permissions || {},
      isActive: row.is_active,
      isVerified: row.is_verified,
      emailVerifiedAt: row.email_verified_at,
      lastLoginAt: row.last_login_at,
      lastLoginIp: row.last_login_ip,
      loginCount: row.login_count,
      failedLoginAttempts: row.failed_login_attempts,
      lockedUntil: row.locked_until,
      twoFactorEnabled: row.two_factor_enabled,
      twoFactorSecret: row.two_factor_secret,
      backupCodes: row.backup_codes,
      language: row.language,
      timezone: row.timezone,
      theme: row.theme,
      preferences: row.preferences || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by
    };
  }

  private mapActivityLog(row: any): ActivityLog {
    return {
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      method: row.method,
      endpoint: row.endpoint,
      oldValues: row.old_values,
      newValues: row.new_values,
      success: row.success,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      durationMs: row.duration_ms
    };
  }

  private mapTeam(row: any): Team {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      description: row.description,
      teamLeadId: row.team_lead_id,
      isActive: row.is_active,
      settings: row.settings || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by
    };
  }

  private mapTeamMember(row: any): TeamMember {
    return {
      id: row.id,
      teamId: row.team_id,
      userId: row.user_id,
      role: row.role,
      joinedAt: row.joined_at,
      leftAt: row.left_at,
      isActive: row.is_active
    };
  }
}

export const advancedUserService = new AdvancedUserService();
