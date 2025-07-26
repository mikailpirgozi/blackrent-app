import { Request, Response, NextFunction } from 'express';
import { UserRole, Permission, PermissionCheck, PermissionResult, User } from '../types';

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
      if (!req.user) {
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

      // Ulož výsledok do request
      req.permissionCheck = permissionCheck;

      if (!permissionCheck.hasAccess) {
        return res.status(403).json({
          success: false,
          error: permissionCheck.reason || 'Nemáte oprávnenie pre túto akciu'
        });
      }

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