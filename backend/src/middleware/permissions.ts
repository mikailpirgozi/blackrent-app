import type { Request, Response, NextFunction } from 'express';
import type { UserRole, Permission, PermissionResult, User } from '../types';
import { PermissionCheck } from '../types';
import { logger } from '../utils/logger';

// Rozšírenie Request interface o user a permissions
declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, 'password'>;
      permissionCheck?: PermissionResult;
    }
  }
}

// 🔐 ROLE PERMISSIONS MATRIX
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
  investor: [
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
      resource: 'expenses',
      actions: ['read'],
      conditions: {
        companyOnly: true // len náklady pre vlastné vozidlá
      }
    },
    {
      resource: 'insurances',
      actions: ['read'],
      conditions: {
        companyOnly: true // len poistky pre vlastné vozidlá
      }
    },
    {
      resource: 'companies',
      actions: ['read'],
      conditions: {
        ownOnly: true // len svoju vlastnú firmu
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
  logger.auth('🛡️ hasPermission called:', { userRole, resource, action, context });
  
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  logger.auth('📋 Role permissions:', rolePermissions);
  
  // Admin roles (legacy admin, super_admin) majú vždy práva
  if (userRole === 'admin' || userRole === 'super_admin') {
    console.log('🔥 ADMIN ACCESS GRANTED:', { userRole, resource, action });
    logger.auth('👑 Admin access granted');
    return { hasAccess: true, requiresApproval: false };
  }

  // Company Admin má práva len vo svojej firme
  if (userRole === 'company_admin') {
    // Kontrola či pristupuje k vlastnej firme
    if (context?.companyId && context?.resourceCompanyId) {
      if (context.companyId !== context.resourceCompanyId) {
        logger.auth('❌ Company Admin trying to access different company');
        return { 
          hasAccess: false, 
          requiresApproval: false, 
          reason: 'Company Admin môže pristupovať len k dátam vlastnej firmy' 
        };
      }
    }
    logger.auth('✅ Company Admin access granted for own company');
    return { hasAccess: true, requiresApproval: false };
  }

  // Nájdi relevantné permission pre resource
  const permission = rolePermissions.find(p => 
    p.resource === resource || p.resource === '*'
  );

  logger.auth('🔍 Found permission:', permission);

  if (!permission) {
    logger.auth('❌ No permission found for resource');
    return { hasAccess: false, requiresApproval: false, reason: 'Žiadne oprávnenie pre tento resource' };
  }

  // Skontroluj action
  if (!permission.actions.includes(action)) {
    logger.auth('❌ Action not allowed:', { allowedActions: permission.actions, requestedAction: action });
    return { hasAccess: false, requiresApproval: false, reason: `Akcia '${action}' nie je povolená` };
  }

  logger.auth('✅ Action is allowed');

  // Skontroluj podmienky
  const conditions = permission.conditions;
  if (conditions && context) {
    // Kontrola "ownOnly" - len ak máme resourceOwnerId (nie pre list endpoints)
    if (conditions.ownOnly && context.resourceOwnerId && context.resourceOwnerId !== context.userId) {
      logger.auth('❌ OwnOnly check failed:', { 
        resourceOwnerId: context.resourceOwnerId, 
        userId: context.userId 
      });
      return { hasAccess: false, requiresApproval: false, reason: 'Prístup len k vlastným záznamom' };
    }

    // Kontrola "companyOnly" - len ak máme resourceCompanyId (nie pre list endpoints)
    if (conditions.companyOnly && context.resourceCompanyId && context.resourceCompanyId !== context.companyId) {
      logger.auth('❌ CompanyOnly check failed:', { 
        resourceCompanyId: context.resourceCompanyId, 
        userCompanyId: context.companyId 
      });
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

  const result = { 
    hasAccess: true, 
    requiresApproval: conditions?.approvalRequired || false 
  };
  
  logger.auth('✅ hasPermission final result:', result);
  return result;
}

// 🚀 EXPRESS MIDDLEWARE
export function checkPermission(
  resource: Permission['resource'], 
  action: Permission['actions'][0],
  options?: {
    getContext?: (req: Request) => Promise<any>;
    onApprovalRequired?: (req: Request, res: Response) => void;
  }
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.auth('🔐 Permission check:', {
        resource,
        action,
        user: req.user ? {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role,
          companyId: req.user.companyId
        } : null
      });

      if (!req.user) {
        logger.auth('❌ Permission denied: No user');
        return res.status(401).json({
          success: false,
          error: 'Používateľ nie je prihlásený'
        });
      }

      // Získaj kontext ak je definovaný
      let context = {};
      if (options?.getContext) {
        context = await options.getContext(req);
      }

      logger.auth('🔍 Permission context:', context);

      // Skontroluj oprávnenie
      const permissionCheck = hasPermission(
        req.user.role,
        resource,
        action,
        {
          userId: req.user.id,
          companyId: req.user.companyId,
          ...context
        }
      );

      // Admin roles (legacy admin, super_admin) majú práva na všetko
      if (req.user.role === 'admin' || req.user.role === 'super_admin') {
        console.log('🔥 MIDDLEWARE: Admin access granted', { username: req.user.username, role: req.user.role });
        logger.auth('✅ Admin access granted');
        req.permissionCheck = { hasAccess: true, requiresApproval: false };
        return next();
      }

      // Company Admin má práva len vo svojej firme
      if (req.user.role === 'company_admin') {
        // Ak má context, skontroluj či ide o vlastnú firmu
        if (context && (context as any).resourceCompanyId) {
          if (req.user.companyId !== (context as any).resourceCompanyId) {
            logger.auth('❌ Company Admin denied: different company');
            return res.status(403).json({
              success: false,
              error: 'Company Admin môže pristupovať len k dátam vlastnej firmy'
            });
          }
        }
        logger.auth('✅ Company Admin access granted');
        req.permissionCheck = { hasAccess: true, requiresApproval: false };
        return next();
      }

      logger.auth('🔐 Permission result:', permissionCheck);

      // Ulož výsledok do request
      req.permissionCheck = permissionCheck;

      if (!permissionCheck.hasAccess) {
        logger.auth('❌ Permission denied:', permissionCheck.reason);
        return res.status(403).json({
          success: false,
          error: permissionCheck.reason || 'Nemáte oprávnenie pre túto akciu'
        });
      }

      logger.auth('✅ Permission granted');

      if (permissionCheck.requiresApproval) {
        if (options?.onApprovalRequired) {
          return options.onApprovalRequired(req, res);
        } else {
          return res.status(202).json({
            success: true,
            requiresApproval: true,
            message: permissionCheck.reason || 'Akcia vyžaduje schválenie'
          });
        }
      }

      next();
    } catch (error) {
      console.error('❌ Permission check error:', error);
      res.status(500).json({
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