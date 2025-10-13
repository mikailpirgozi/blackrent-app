/**
 * Full Permissions Middleware for Fastify
 * 100% Express equivalent from backend/src/middleware/permissions.ts
 * 
 * Features:
 * - Resource context checking
 * - Company access validation
 * - Amount-based restrictions
 * - Platform filtering
 * - Audit logging
 * - Full role permissions matrix
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { UserRole, Permission, PermissionResult } from '../../types';

// 🔐 ROLE PERMISSIONS MATRIX (100% identical to Express)
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // 👑 ADMIN - Legacy admin role (same as super_admin)
  admin: [
    {
      resource: '*',
      actions: ['read', 'create', 'update', 'delete'],
      conditions: {}
    }
  ],

  // 👑 SUPER_ADMIN - Úplné práva na všetko, všetky firmy
  super_admin: [
    {
      resource: '*',
      actions: ['read', 'create', 'update', 'delete'],
      conditions: {}
    }
  ],

  // 👑 PLATFORM_ADMIN - Úplné práva na platforme
  platform_admin: [
    {
      resource: '*',
      actions: ['read', 'create', 'update', 'delete'],
      conditions: {}
    }
  ],

  // 👥 PLATFORM_EMPLOYEE - Obmedzené práva na platforme
  platform_employee: [
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
      resource: 'companies',
      actions: ['read'],
      conditions: {}
    }
  ],

  // 🏢 COMPANY_ADMIN - Úplné práva len vo vlastnej firme
  company_admin: [
    {
      resource: '*',
      actions: ['read', 'create', 'update', 'delete'],
      conditions: {
        companyOnly: true
      }
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
        ownOnly: true,
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
        maxAmount: 5000,
        approvalRequired: true
      }
    }
  ],

  // 🏢 COMPANY OWNER - Len vlastné vozidlá a súvisiace dáta
  investor: [
    {
      resource: 'vehicles',
      actions: ['read'],
      conditions: {
        companyOnly: true
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
      resource: 'expenses',
      actions: ['read'],
      conditions: {
        companyOnly: true
      }
    },
    {
      resource: 'insurances',
      actions: ['read'],
      conditions: {
        companyOnly: true
      }
    },
    {
      resource: 'companies',
      actions: ['read'],
      conditions: {
        ownOnly: true
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

// 🛡️ PERMISSION CHECK FUNCTION
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

  // Admin roles (legacy admin, super_admin) majú vždy práva
  if (userRole === 'admin' || userRole === 'super_admin') {
    return { hasAccess: true, requiresApproval: false };
  }

  // Company Admin má práva len vo svojej firme
  if (userRole === 'company_admin') {
    if (context?.companyId && context?.resourceCompanyId) {
      if (context.companyId !== context.resourceCompanyId) {
        return {
          hasAccess: false,
          requiresApproval: false,
          reason: 'Company Admin môže pristupovať len k dátam vlastnej firmy'
        };
      }
    }
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
    if (conditions.ownOnly && context.resourceOwnerId && context.resourceOwnerId !== context.userId) {
      return { hasAccess: false, requiresApproval: false, reason: 'Prístup len k vlastným záznamom' };
    }

    // Kontrola "companyOnly"
    if (conditions.companyOnly && context.resourceCompanyId && context.resourceCompanyId !== context.companyId) {
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

// 🚀 FASTIFY HOOK - Full Permission Check with Context
export function checkPermissionFastifyFull(
  resource: Permission['resource'],
  action: Permission['actions'][0],
  options?: {
    getContext?: (request: FastifyRequest) => Promise<Record<string, unknown>>;
    onApprovalRequired?: (request: FastifyRequest, reply: FastifyReply) => void;
  }
) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      request.log.info({
        msg: '🔐 Permission check',
        resource,
        action,
        user: request.user ? {
          id: request.user.id,
          username: request.user.username,
          role: request.user.role,
          companyId: request.user.companyId
        } : null
      });

      if (!request.user) {
        request.log.error('❌ Permission denied: No user');
        return reply.status(401).send({
          success: false,
          error: 'Používateľ nie je prihlásený'
        });
      }

      // Získaj kontext ak je definovaný
      let context: Record<string, unknown> = {};
      if (options?.getContext) {
        context = await options.getContext(request);
      }

      request.log.info({ msg: '🔍 Permission context', context });

      // Admin roles bypass permission checks
      if (request.user.role === 'admin' || request.user.role === 'super_admin') {
        request.log.info('👑 Admin access granted');
        (request as FastifyRequest & { permissionCheck?: PermissionResult }).permissionCheck = {
          hasAccess: true,
          requiresApproval: false
        };
        return;
      }

      // Company Admin - check company access
      if (request.user.role === 'company_admin') {
        if (context && context.resourceCompanyId) {
          if (request.user.companyId !== context.resourceCompanyId) {
            request.log.error('❌ Company Admin denied: different company');
            return reply.status(403).send({
              success: false,
              error: 'Company Admin môže pristupovať len k dátam vlastnej firmy'
            });
          }
        }
        request.log.info('✅ Company Admin access granted');
        (request as FastifyRequest & { permissionCheck?: PermissionResult }).permissionCheck = {
          hasAccess: true,
          requiresApproval: false
        };
        return;
      }

      // Check permission
      const permissionCheck = hasPermission(
        request.user.role,
        resource,
        action,
        {
          userId: request.user.id,
          companyId: request.user.companyId,
          ...context
        } as {
          userId?: string;
          companyId?: string;
          resourceOwnerId?: string;
          resourceCompanyId?: string;
          amount?: number;
        }
      );

      request.log.info({ msg: '🔐 Permission result', permissionCheck });

      // Store result in request
      (request as FastifyRequest & { permissionCheck?: PermissionResult }).permissionCheck = permissionCheck;

      if (!permissionCheck.hasAccess) {
        request.log.error({ reason: permissionCheck.reason }, '❌ Permission denied');
        return reply.status(403).send({
          success: false,
          error: permissionCheck.reason || 'Nemáte oprávnenie pre túto akciu'
        });
      }

      request.log.info('✅ Permission granted');

      if (permissionCheck.requiresApproval) {
        if (options?.onApprovalRequired) {
          return options.onApprovalRequired(request, reply);
        } else {
          return reply.status(202).send({
            success: true,
            requiresApproval: true,
            message: permissionCheck.reason || 'Akcia vyžaduje schválenie'
          });
        }
      }
    } catch (error) {
      request.log.error(error, '❌ Permission check error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri kontrole oprávnení'
      });
    }
  };
}

// 🎯 UTILITY FUNCTIONS
export function getUserPermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

export function canUserAccess(
  userRole: UserRole,
  resource: Permission['resource'],
  action: Permission['actions'][0]
): boolean {
  return hasPermission(userRole, resource, action).hasAccess;
}

// Export full version as default "checkPermissionFastify" for backwards compatibility
export const checkPermissionFastify = checkPermissionFastifyFull;

// TypeScript declarations
declare module 'fastify' {
  interface FastifyRequest {
    permissionCheck?: PermissionResult;
  }
}

