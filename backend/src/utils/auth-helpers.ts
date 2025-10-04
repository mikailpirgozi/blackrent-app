/**
 * AUTH HELPERS
 * Utility functions for authentication and authorization
 */

import type { User, UserRole } from '../types';
import { postgresDatabase } from '../models/postgres-database';

/**
 * Check if user is super admin (sees all companies)
 * Includes legacy 'admin' role for backward compatibility
 */
export function isSuperAdmin(user?: Partial<User> | null): boolean {
  return user?.role === 'admin' || user?.role === 'super_admin';
}

/**
 * Check if user is company admin (full access to their company)
 */
export function isCompanyAdmin(user?: Partial<User> | null): boolean {
  return user?.role === 'company_admin';
}

/**
 * Check if user is company owner (read-only to own vehicles)
 */
export function isCompanyOwner(user?: Partial<User> | null): boolean {
  return user?.role === 'investor';
}

/**
 * Check if user has admin privileges (super_admin or company_admin)
 */
export function hasAdminPrivileges(user?: Partial<User> | null): boolean {
  return isSuperAdmin(user) || isCompanyAdmin(user);
}

/**
 * Filter data by company access
 * - Super Admin: sees all data
 * - Company Admin: sees only their company data
 * - Company Owner: sees only their company data
 * - Other roles: uses user_company_access table
 */
export async function filterDataByCompanyAccess<T extends { ownerCompanyId?: string; companyId?: string }>(
  data: T[],
  user?: Partial<User> | null
): Promise<T[]> {
  if (!user) return [];

  // Super Admin sees all data
  if (isSuperAdmin(user)) {
    return data;
  }

  // Company Admin and Company Owner see only their company data
  if ((isCompanyAdmin(user) || isCompanyOwner(user)) && user.companyId) {
    return data.filter((item: T) => {
      return item.ownerCompanyId === user.companyId || 
             item.companyId === user.companyId;
    });
  }

  // Other roles - check user_company_access
  if (user.id) {
    const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(user.id);
    const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
    
    return data.filter((item: T) => {
      return allowedCompanyIds.includes(item.ownerCompanyId || '') || 
             allowedCompanyIds.includes(item.companyId || '');
    });
  }

  return [];
}

/**
 * Check if user can access specific company data
 */
export async function canAccessCompany(
  userId: string,
  companyId: string,
  userRole: UserRole
): Promise<boolean> {
  // Admin roles (legacy admin, super_admin) can access all companies
  if (userRole === 'admin' || userRole === 'super_admin') {
    return true;
  }

  // Get user from database to check their companyId
  const user = await postgresDatabase.getUserById(userId);
  
  // Company Admin and Company Owner can only access their own company
  if ((userRole === 'company_admin' || userRole === 'investor') && user?.companyId) {
    return user.companyId === companyId;
  }

  // Other roles - check user_company_access
  const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(userId);
  return userCompanyAccess.some(access => access.companyId === companyId);
}

/**
 * Get allowed company IDs for user
 */
export async function getAllowedCompanyIds(
  user?: Partial<User> | null
): Promise<string[]> {
  if (!user || !user.id) return [];

  // Super Admin sees all companies
  if (isSuperAdmin(user)) {
    const allCompanies = await postgresDatabase.getCompanies();
    return allCompanies.map(c => c.id);
  }

  // Company Admin and Company Owner see only their company
  if ((isCompanyAdmin(user) || isCompanyOwner(user)) && user.companyId) {
    return [user.companyId];
  }

  // Other roles - get from user_company_access
  const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(user.id);
  return userCompanyAccess.map(access => access.companyId);
}

/**
 * Validate role transition
 * Prevents invalid role changes
 */
export function canChangeUserRole(
  currentUserRole: UserRole,
  targetUserRole: UserRole,
  newRole: UserRole
): boolean {
  // Only super_admin can create or change to super_admin
  if (newRole === 'super_admin' && currentUserRole !== 'super_admin') {
    return false;
  }

  // Only super_admin can change super_admin users
  if (targetUserRole === 'super_admin' && currentUserRole !== 'super_admin') {
    return false;
  }

  // Company admins can only manage roles in their company
  if (currentUserRole === 'company_admin') {
    // Company admins cannot create other admins
    if (newRole === 'super_admin' || newRole === 'company_admin') {
      return false;
    }
  }

  return true;
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    admin: 'Administrátor',
    super_admin: 'Super Administrátor',
    company_admin: 'Administrátor Firmy',
    investor: 'Investor',
    employee: 'Zamestnanec',
    temp_worker: 'Brigádnik',
    mechanic: 'Mechanik',
    sales_rep: 'Obchodník'
  };

  return roleNames[role] || role;
}

/**
 * Get default permissions for role
 */
export function getDefaultPermissionsForRole(role: UserRole) {
  switch (role) {
    case 'admin':
    case 'super_admin':
    case 'company_admin':
      return {
        vehicles: { read: true, write: true, delete: true },
        rentals: { read: true, write: true, delete: true },
        expenses: { read: true, write: true, delete: true },
        settlements: { read: true, write: true, delete: true },
        customers: { read: true, write: true, delete: true },
        insurances: { read: true, write: true, delete: true },
        maintenance: { read: true, write: true, delete: true },
        protocols: { read: true, write: true, delete: true },
        statistics: { read: true, write: true, delete: true }
      };

    case 'investor':
      return {
        vehicles: { read: true, write: false, delete: false },
        rentals: { read: true, write: false, delete: false },
        expenses: { read: true, write: false, delete: false },
        settlements: { read: true, write: false, delete: false },
        customers: { read: true, write: false, delete: false },
        insurances: { read: true, write: false, delete: false },
        maintenance: { read: true, write: false, delete: false },
        protocols: { read: true, write: false, delete: false },
        statistics: { read: true, write: false, delete: false }
      };

    case 'employee':
      return {
        vehicles: { read: true, write: true, delete: false },
        rentals: { read: true, write: true, delete: false },
        expenses: { read: true, write: true, delete: false },
        settlements: { read: true, write: false, delete: false },
        customers: { read: true, write: true, delete: false },
        insurances: { read: true, write: false, delete: false },
        maintenance: { read: true, write: true, delete: false },
        protocols: { read: true, write: true, delete: false },
        statistics: { read: true, write: false, delete: false }
      };

    case 'mechanic':
      return {
        vehicles: { read: true, write: true, delete: false },
        rentals: { read: true, write: false, delete: false },
        expenses: { read: true, write: false, delete: false },
        settlements: { read: false, write: false, delete: false },
        customers: { read: true, write: false, delete: false },
        insurances: { read: true, write: false, delete: false },
        maintenance: { read: true, write: true, delete: true },
        protocols: { read: true, write: true, delete: false },
        statistics: { read: true, write: false, delete: false }
      };

    case 'sales_rep':
      return {
        vehicles: { read: true, write: false, delete: false },
        rentals: { read: true, write: true, delete: false },
        expenses: { read: true, write: false, delete: false },
        settlements: { read: true, write: false, delete: false },
        customers: { read: true, write: true, delete: false },
        insurances: { read: true, write: false, delete: false },
        maintenance: { read: false, write: false, delete: false },
        protocols: { read: true, write: true, delete: false },
        statistics: { read: true, write: false, delete: false }
      };

    case 'temp_worker':
      return {
        vehicles: { read: true, write: false, delete: false },
        rentals: { read: true, write: true, delete: false },
        expenses: { read: false, write: false, delete: false },
        settlements: { read: false, write: false, delete: false },
        customers: { read: true, write: true, delete: false },
        insurances: { read: false, write: false, delete: false },
        maintenance: { read: false, write: false, delete: false },
        protocols: { read: true, write: true, delete: false },
        statistics: { read: false, write: false, delete: false }
      };

    default:
      // No permissions by default
      return {
        vehicles: { read: false, write: false, delete: false },
        rentals: { read: false, write: false, delete: false },
        expenses: { read: false, write: false, delete: false },
        settlements: { read: false, write: false, delete: false },
        customers: { read: false, write: false, delete: false },
        insurances: { read: false, write: false, delete: false },
        maintenance: { read: false, write: false, delete: false },
        protocols: { read: false, write: false, delete: false },
        statistics: { read: false, write: false, delete: false }
      };
  }
}

