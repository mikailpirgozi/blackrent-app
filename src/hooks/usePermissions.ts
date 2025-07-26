import { useMemo } from 'react';
import { UserRole, Permission, PermissionResult } from '../types';
import { useAuth } from '../context/AuthContext';

// 🔐 FRONTEND ROLE PERMISSIONS MATRIX (mirror backendu)
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // 👑 ADMIN - Úplné práva na všetko
  admin: [
    {
      resource: '*',
      actions: ['read', 'create', 'update', 'delete'],
      conditions: {}
    }
  ],

  // 👥 EMPLOYEE - Základné operácie s vozidlami, prenájmami, zákazníkmi
  employee: [
    {
      resource: 'vehicles',
      actions: ['read', 'create', 'update'],
      conditions: {}
    },
    {
      resource: 'rentals',
      actions: ['read', 'create', 'update'],
      conditions: {}
    },
    {
      resource: 'customers',
      actions: ['read', 'create', 'update'],
      conditions: {}
    },
    {
      resource: 'maintenance',
      actions: ['read', 'create'],
      conditions: {}
    },
    {
      resource: 'protocols',
      actions: ['read', 'create', 'update'],
      conditions: {}
    }
  ],

  // 🔧 TEMP WORKER - Obmedzené práva, hlavne čítanie
  temp_worker: [
    {
      resource: 'vehicles',
      actions: ['read'],
      conditions: {}
    },
    {
      resource: 'rentals',
      actions: ['read', 'create'],
      conditions: {}
    },
    {
      resource: 'customers',
      actions: ['read', 'create'],
      conditions: {}
    },
    {
      resource: 'protocols',
      actions: ['read', 'create'],
      conditions: {}
    }
  ],

  // 🔨 MECHANIC - Špecializované práva na údržbu
  mechanic: [
    {
      resource: 'vehicles',
      actions: ['read', 'update'],
      conditions: {
        ownOnly: true, // len priradené vozidlá
        readOnlyFields: ['price', 'purchasePrice']
      }
    },
    {
      resource: 'maintenance',
      actions: ['read', 'create', 'update', 'delete'],
      conditions: {
        ownOnly: true
      }
    },
    {
      resource: 'protocols',
      actions: ['read', 'create', 'update'],
      conditions: {
        ownOnly: true
      }
    }
  ],

  // 💼 SALES REP - Obchodné operácie s limitmi
  sales_rep: [
    {
      resource: 'vehicles',
      actions: ['read'],
      conditions: {}
    },
    {
      resource: 'rentals',
      actions: ['read', 'create', 'update'],
      conditions: {}
    },
    {
      resource: 'customers',
      actions: ['read', 'create', 'update'],
      conditions: {}
    },
    {
      resource: 'pricing',
      actions: ['read', 'update'],
      conditions: {
        maxAmount: 5000, // max cena prenájmu
        approvalRequired: true
      }
    }
  ],

  // 🏢 COMPANY OWNER - Len vlastné vozidlá a súvisiace dáta
  company_owner: [
    {
      resource: 'vehicles',
      actions: ['read'],
      conditions: {
        companyOnly: true // len vlastné vozidlá
      }
    },
    {
      resource: 'rentals',
      actions: ['read'],
      conditions: {
        companyOnly: true
      }
    },
    {
      resource: 'finances',
      actions: ['read'],
      conditions: {
        companyOnly: true,
        readOnlyFields: ['totalRevenue', 'commission']
      }
    },
    {
      resource: 'protocols',
      actions: ['read'],
      conditions: {
        companyOnly: true
      }
    }
  ]
};

// 🛡️ PERMISSION CHECK FUNCTION (frontend verzia)
export function hasPermission(
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

  // Nájdi relevantné permission pre resource
  const permission = rolePermissions.find(p => 
    p.resource === resource || p.resource === '*'
  );

  if (!permission) {
    return { hasAccess: false, requiresApproval: false, reason: 'Žiadne oprávnenie pre tento resource' };
  }

  // Skontroluj action
  if (!permission.actions.includes(action)) {
    return { hasAccess: false, requiresApproval: false, reason: `Akcia '${action}' nie je povolená` };
  }

  // Skontroluj podmienky
  const conditions = permission.conditions;
  if (conditions && context) {
    // Kontrola "ownOnly"
    if (conditions.ownOnly && context.resourceOwnerId !== context.userId) {
      return { hasAccess: false, requiresApproval: false, reason: 'Prístup len k vlastným záznamom' };
    }

    // Kontrola "companyOnly"
    if (conditions.companyOnly && context.resourceCompanyId !== context.companyId) {
      return { hasAccess: false, requiresApproval: false, reason: 'Prístup len k záznamom vlastnej firmy' };
    }

    // Kontrola max amount
    if (conditions.maxAmount && context.amount && context.amount > conditions.maxAmount) {
      if (conditions.approvalRequired) {
        return { 
          hasAccess: true, 
          requiresApproval: true, 
          reason: `Suma ${context.amount}€ presahuje limit ${conditions.maxAmount}€` 
        };
      } else {
        return { hasAccess: false, requiresApproval: false, reason: `Maximálna povolená suma je ${conditions.maxAmount}€` };
      }
    }
  }

  return { 
    hasAccess: true, 
    requiresApproval: conditions?.approvalRequired || false 
  };
}

// 🎯 REACT HOOK PRE PERMISSIONS
export function usePermissions() {
  const { state } = useAuth();
  const user = state.user;

  const permissions = useMemo(() => {
    if (!user) {
      return {
        canRead: () => false,
        canCreate: () => false,
        canUpdate: () => false,
        canDelete: () => false,
        hasPermission: (): PermissionResult => ({ hasAccess: false, requiresApproval: false, reason: 'Používateľ nie je prihlásený' }),
        getUserPermissions: () => [],
        currentUser: null,
        isAdmin: false,
        isEmployee: false,
        isTempWorker: false,
        isMechanic: false,
        isSalesRep: false,
        isCompanyOwner: false
      };
    }

    return {
      // 🔍 QUICK ACCESS FUNCTIONS
      canRead: (resource: Permission['resource'], context?: any) => 
        hasPermission(user.role, resource, 'read', {
          userId: user.id,
          companyId: user.companyId,
          ...context
        }).hasAccess,

      canCreate: (resource: Permission['resource'], context?: any) => 
        hasPermission(user.role, resource, 'create', {
          userId: user.id,
          companyId: user.companyId,
          ...context
        }).hasAccess,

      canUpdate: (resource: Permission['resource'], context?: any) => 
        hasPermission(user.role, resource, 'update', {
          userId: user.id,
          companyId: user.companyId,
          ...context
        }).hasAccess,

      canDelete: (resource: Permission['resource'], context?: any) => 
        hasPermission(user.role, resource, 'delete', {
          userId: user.id,
          companyId: user.companyId,
          ...context
        }).hasAccess,

      // 🛡️ FULL PERMISSION CHECK
      hasPermission: (resource: Permission['resource'], action: Permission['actions'][0], context?: any): PermissionResult =>
        hasPermission(user.role, resource, action, {
          userId: user.id,
          companyId: user.companyId,
          ...context
        }),

      // 📋 GET ALL USER PERMISSIONS
      getUserPermissions: () => ROLE_PERMISSIONS[user.role] || [],

      // 👤 CURRENT USER INFO
      currentUser: user,
      
      // 🏢 ROLE CHECKS
      isAdmin: user.role === 'admin',
      isEmployee: user.role === 'employee',
      isTempWorker: user.role === 'temp_worker',
      isMechanic: user.role === 'mechanic',
      isSalesRep: user.role === 'sales_rep',
      isCompanyOwner: user.role === 'company_owner'
    };
  }, [user]);

  return permissions;
}

// 🎯 UTILITY FUNCTIONS
export function canUserAccess(
  userRole: UserRole, 
  resource: Permission['resource'], 
  action: Permission['actions'][0]
): boolean {
  return hasPermission(userRole, resource, action).hasAccess;
}

export function getUserRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    admin: '👑 Administrátor',
    employee: '👥 Zamestnanec',
    temp_worker: '🔧 Brigádnik',
    mechanic: '🔨 Mechanik',
    sales_rep: '💼 Obchodný zástupca',
    company_owner: '🏢 Majiteľ vozidiel'
  };
  
  return roleNames[role] || role;
} 