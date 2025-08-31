import { useMemo } from 'react';

import { useAuth } from '../context/AuthContext';
import { usePermissionsContext } from '../context/PermissionsContext';
import type {
  UserRole,
  Permission,
  PermissionResult,
  UserCompanyAccess,
  CompanyPermissions} from '../types';
import {
  ResourcePermission,
} from '../types';

// 🔐 FRONTEND ROLE PERMISSIONS MATRIX (fallback pre admin)
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // 👑 ADMIN - Úplné práva na všetko
  admin: [
    {
      resource: '*',
      actions: ['read', 'create', 'update', 'delete'],
      conditions: {},
    },
  ],

  // Ostatné roly sa teraz riadia company-based permissions
  employee: [],
  temp_worker: [],
  mechanic: [],
  sales_rep: [],
  company_owner: [],
};

// 🛡️ COMPANY-BASED PERMISSION CHECK FUNCTION
export function hasCompanyPermission(
  userCompanyAccess: UserCompanyAccess[],
  userRole: UserRole,
  resource: string,
  action: 'read' | 'write' | 'delete',
  context?: {
    companyId?: string;
    userId?: string;
  }
): PermissionResult {
  // Admin má vždy práva
  if (userRole === 'admin') {
    return { hasAccess: true, requiresApproval: false };
  }

  // Ak nie je zadané companyId, skontroluj všetky firmy používateľa
  if (!context?.companyId) {
    // Má používateľ prístup k tomuto resource aspoň v jednej firme?
    const hasAnyAccess = userCompanyAccess.some(access => {
      const resourcePermission =
        access.permissions[resource as keyof CompanyPermissions];
      if (!resourcePermission) return false;

      if (action === 'read') return resourcePermission.read;
      if (action === 'write') return resourcePermission.write;
      if (action === 'delete') return resourcePermission.delete;
      return false;
    });

    if (hasAnyAccess) {
      return { hasAccess: true, requiresApproval: false };
    } else {
      return {
        hasAccess: false,
        requiresApproval: false,
        reason: 'Nemáte oprávnenie k tomuto zdroju v žiadnej firme',
      };
    }
  }

  // Kontrola pre konkrétnu firmu
  const companyAccess = userCompanyAccess.find(
    access => access.companyId === context.companyId
  );
  if (!companyAccess) {
    return {
      hasAccess: false,
      requiresApproval: false,
      reason: 'Nemáte prístup k tejto firme',
    };
  }

  const resourcePermission =
    companyAccess.permissions[resource as keyof CompanyPermissions];
  if (!resourcePermission) {
    return {
      hasAccess: false,
      requiresApproval: false,
      reason: 'Neznámy zdroj',
    };
  }

  let hasAccess = false;
  if (action === 'read') hasAccess = resourcePermission.read;
  if (action === 'write') hasAccess = resourcePermission.write;
  if (action === 'delete') hasAccess = resourcePermission.delete;

  if (hasAccess) {
    return { hasAccess: true, requiresApproval: false };
  } else {
    return {
      hasAccess: false,
      requiresApproval: false,
      reason: `Nemáte oprávnenie na '${action}' pre '${resource}' v tejto firme`,
    };
  }
}

// 🛡️ LEGACY PERMISSION CHECK FUNCTION (pre spätnú kompatibilitu)
export function hasLegacyPermission(
  userRole: UserRole,
  resource: Permission['resource'],
  action: Permission['actions'][0],
  context?: {
    userId?: string;
    companyId?: string;
    resourceOwnerId?: string;
    resourceCompanyId?: string;
    amount?: number;
  }
): PermissionResult {
  const rolePermissions = ROLE_PERMISSIONS[userRole];

  // Admin má vždy práva
  if (userRole === 'admin') {
    return { hasAccess: true, requiresApproval: false };
  }

  // Pre ostatné roly vráti false - používajú sa company permissions
  return {
    hasAccess: false,
    requiresApproval: false,
    reason: 'Používajte company-based permissions',
  };
}

// 🎯 REACT HOOK PRE PERMISSIONS
export function usePermissions() {
  const { state } = useAuth();
  const user = state.user;
  const { userCompanyAccess, permissionsLoading, permissionsError } =
    usePermissionsContext();

  const permissions = useMemo(() => {
    if (!user) {
      return {
        canRead: () => false,
        canCreate: () => false,
        canUpdate: () => false,
        canDelete: () => false,
        hasPermission: (): PermissionResult => ({
          hasAccess: false,
          requiresApproval: false,
          reason: 'Používateľ nie je prihlásený',
        }),
        hasCompanyPermission: (): PermissionResult => ({
          hasAccess: false,
          requiresApproval: false,
          reason: 'Používateľ nie je prihlásený',
        }),
        getUserPermissions: () => [],
        getUserCompanyAccess: () => [],
        getAccessibleCompanies: () => [],
        currentUser: null,
        isAdmin: false,
        isEmployee: false,
        isTempWorker: false,
        isMechanic: false,
        isSalesRep: false,
        isCompanyOwner: false,
        permissionsLoading: false,
        permissionsError: null,
      };
    }

    return {
      // 🔍 COMPANY-BASED PERMISSION FUNCTIONS
      canRead: (resource: string, context?: { companyId?: string }) => {
        // Pre company_owner - automaticky povolí resources definované v backend ROLE_PERMISSIONS
        if (user.role === 'company_owner') {
          const backendPermissions = [
            'vehicles',
            'rentals',
            'expenses',
            'insurances',
            'companies',
            'finances',
            'protocols',
            'settlements',
            'customers',
          ];
          if (backendPermissions.includes(resource)) {
            return true;
          }
        }
        return hasCompanyPermission(
          userCompanyAccess,
          user.role,
          resource,
          'read',
          context
        ).hasAccess;
      },

      canCreate: (resource: string, context?: { companyId?: string }) => {
        // Pre company_owner - obmedzené create permissions
        if (user.role === 'company_owner') {
          const writePermissions = ['rentals', 'expenses', 'settlements']; // len niektoré resources môže vytvárať
          if (writePermissions.includes(resource)) {
            return true;
          }
          return false;
        }
        return hasCompanyPermission(
          userCompanyAccess,
          user.role,
          resource,
          'write',
          context
        ).hasAccess;
      },

      canUpdate: (resource: string, context?: { companyId?: string }) => {
        // Pre company_owner - obmedzené update permissions
        if (user.role === 'company_owner') {
          const updatePermissions = ['companies', 'settlements']; // len svoju firmu a vyúčtovania môže upraviť
          if (updatePermissions.includes(resource)) {
            return true;
          }
          return false;
        }
        return hasCompanyPermission(
          userCompanyAccess,
          user.role,
          resource,
          'write',
          context
        ).hasAccess;
      },

      canDelete: (resource: string, context?: { companyId?: string }) => {
        // Pre company_owner - obmedzené delete permissions
        if (user.role === 'company_owner') {
          const deletePermissions = ['settlements']; // len vyúčtovania môže mazať
          if (deletePermissions.includes(resource)) {
            return true;
          }
          return false;
        }
        return hasCompanyPermission(
          userCompanyAccess,
          user.role,
          resource,
          'delete',
          context
        ).hasAccess;
      },

      // 🛡️ FULL PERMISSION CHECK
      hasPermission: (
        resource: Permission['resource'],
        action: Permission['actions'][0],
        context?: any
      ): PermissionResult => {
        // Pre admin používame legacy funkciu
        if (user.role === 'admin') {
          return hasLegacyPermission(user.role, resource, action, {
            userId: user.id,
            companyId: user.companyId,
            ...context,
          });
        }

        // Pre company_owner používame vlastnú logiku
        if (user.role === 'company_owner') {
          const backendPermissions = [
            'vehicles',
            'rentals',
            'expenses',
            'insurances',
            'companies',
            'finances',
            'protocols',
            'settlements',
            'customers',
          ];

          if (action === 'read' && backendPermissions.includes(resource)) {
            return { hasAccess: true, requiresApproval: false };
          }

          if (
            action === 'create' &&
            ['rentals', 'expenses', 'settlements'].includes(resource)
          ) {
            return { hasAccess: true, requiresApproval: false };
          }

          if (
            action === 'update' &&
            ['companies', 'settlements'].includes(resource)
          ) {
            return { hasAccess: true, requiresApproval: false };
          }

          if (action === 'delete' && ['settlements'].includes(resource)) {
            return { hasAccess: true, requiresApproval: false };
          }

          return {
            hasAccess: false,
            requiresApproval: false,
            reason: 'Company owner nemá oprávnenie na túto akciu',
          };
        }

        // Pre ostatných používame company-based permissions
        const actionMap = {
          read: 'read',
          create: 'write',
          update: 'write',
          delete: 'delete',
        } as const;

        const mappedAction = actionMap[action as keyof typeof actionMap];
        if (!mappedAction) {
          return {
            hasAccess: false,
            requiresApproval: false,
            reason: 'Neznáma akcia',
          };
        }

        return hasCompanyPermission(
          userCompanyAccess,
          user.role,
          resource,
          mappedAction,
          {
            userId: user.id,
            companyId: user.companyId,
            ...context,
          }
        );
      },

      // 🏢 COMPANY-BASED PERMISSION CHECK
      hasCompanyPermission: (
        resource: string,
        action: 'read' | 'write' | 'delete',
        context?: { companyId?: string }
      ): PermissionResult => {
        // Pre company_owner používame vlastnú logiku
        if (user.role === 'company_owner') {
          const backendPermissions = [
            'vehicles',
            'rentals',
            'expenses',
            'insurances',
            'companies',
            'finances',
            'protocols',
            'settlements',
            'customers',
          ];

          if (action === 'read' && backendPermissions.includes(resource)) {
            return { hasAccess: true, requiresApproval: false };
          }

          if (
            action === 'write' &&
            ['rentals', 'expenses', 'companies', 'settlements'].includes(
              resource
            )
          ) {
            return { hasAccess: true, requiresApproval: false };
          }

          if (action === 'delete' && ['settlements'].includes(resource)) {
            return { hasAccess: true, requiresApproval: false };
          }

          return {
            hasAccess: false,
            requiresApproval: false,
            reason: 'Company owner nemá oprávnenie na túto akciu',
          };
        }

        return hasCompanyPermission(
          userCompanyAccess,
          user.role,
          resource,
          action,
          {
            userId: user.id,
            ...context,
          }
        );
      },

      // 📋 GET ALL USER PERMISSIONS
      getUserPermissions: () => ROLE_PERMISSIONS[user.role] || [],

      // 🏢 GET USER COMPANY ACCESS
      getUserCompanyAccess: () => userCompanyAccess,

      // 🏢 GET ACCESSIBLE COMPANIES
      getAccessibleCompanies: () =>
        userCompanyAccess.map(access => ({
          id: access.companyId,
          name: access.companyName,
        })),

      // 👤 CURRENT USER INFO
      currentUser: user,

      // 🏢 ROLE CHECKS
      isAdmin: user.role === 'admin',
      isEmployee: user.role === 'employee',
      isTempWorker: user.role === 'temp_worker',
      isMechanic: user.role === 'mechanic',
      isSalesRep: user.role === 'sales_rep',
      isCompanyOwner: user.role === 'company_owner',

      // 📊 LOADING & ERROR STATES
      permissionsLoading,
      permissionsError,
    };
  }, [user, userCompanyAccess, permissionsLoading, permissionsError]);

  return permissions;
}

// 🎯 UTILITY FUNCTIONS
export function canUserAccess(
  userRole: UserRole,
  resource: Permission['resource'],
  action: Permission['actions'][0]
): boolean {
  return hasLegacyPermission(userRole, resource, action).hasAccess;
}

export function getUserRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    admin: '👑 Administrátor',
    employee: '👥 Zamestnanec',
    temp_worker: '🔧 Brigádnik',
    mechanic: '🔨 Mechanik',
    sales_rep: '💼 Obchodný zástupca',
    company_owner: '🏢 Majiteľ vozidiel',
  };

  return roleNames[role] || role;
}
