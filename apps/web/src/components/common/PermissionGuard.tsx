import React from 'react';

import { usePermissions } from '../../hooks/usePermissions';
import type { Permission } from '../../types';
import { Alert, AlertDescription } from '../ui/alert';
import { Typography } from '../ui/typography';

// 🛡️ PERMISSION GUARD COMPONENT
interface PermissionGuardProps {
  resource: Permission['resource'];
  action: Permission['actions'][0];
  context?: {
    companyId?: string;
    amount?: number;
  };
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showAccessDeniedMessage?: boolean;
}

export function PermissionGuard({
  resource,
  action,
  context,
  children,
  fallback,
  showAccessDeniedMessage = false,
}: PermissionGuardProps) {
  const permissions = usePermissions();
  const permissionResult = permissions.hasPermission(resource, action, context);

  // Ak nemá prístup, zobraz fallback alebo nothing
  if (!permissionResult.hasAccess) {
    if (showAccessDeniedMessage) {
      return (
        <Alert variant="destructive" className="my-2">
          <AlertDescription>
            <Typography variant="body2">
              🚫 {permissionResult.reason || 'Nemáte oprávnenie pre túto akciu'}
            </Typography>
          </AlertDescription>
        </Alert>
      );
    }
    return fallback ? <>{fallback}</> : <></>;
  }

  // Ak vyžaduje schválenie, zobraz warning
  if (permissionResult.requiresApproval) {
    return (
      <div>
        <Alert variant="default" className="mb-2">
          <AlertDescription>
            <Typography variant="body2">
              ⚠️ {permissionResult.reason || 'Táto akcia vyžaduje schválenie'}
            </Typography>
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  // Má prístup, zobraz obsah
  return <>{children}</>;
}

// 🎯 ROLE-BASED GUARD
interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showAccessDeniedMessage?: boolean;
}

export function RoleGuard({
  allowedRoles,
  children,
  fallback,
  showAccessDeniedMessage = false,
}: RoleGuardProps) {
  const { currentUser } = usePermissions();

  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    if (showAccessDeniedMessage) {
      return (
        <Alert variant="destructive" className="my-2">
          <AlertDescription>
            <Typography variant="body2">
              🚫 Túto sekciu môžu vidieť len: {allowedRoles.join(', ')}
            </Typography>
          </AlertDescription>
        </Alert>
      );
    }
    return fallback ? <>{fallback}</> : <></>;
  }

  return <>{children}</>;
}

// 🔍 SIMPLE PERMISSION CHECKS
interface CanProps {
  read?: Permission['resource'];
  create?: Permission['resource'];
  update?: Permission['resource'];
  delete?: Permission['resource'];
  context?: Record<string, unknown>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Can({
  read,
  create,
  update,
  delete: deleteResource,
  context,
  children,
  fallback,
}: CanProps) {
  const permissions = usePermissions();

  let hasAccess = false;

  if (read && permissions.canRead(read, context)) hasAccess = true;
  if (create && permissions.canCreate(create, context)) hasAccess = true;
  if (update && permissions.canUpdate(update, context)) hasAccess = true;
  if (deleteResource && permissions.canDelete(deleteResource, context))
    hasAccess = true;

  return hasAccess ? <>{children}</> : fallback ? <>{fallback}</> : <></>;
}

// 🏢 COMPANY OWNER GUARD
interface CompanyOnlyProps {
  resource: Permission['resource'];
  companyId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function CompanyOnly({
  resource,
  companyId,
  children,
  fallback,
}: CompanyOnlyProps) {
  const { currentUser, canRead } = usePermissions();

  // Company owner môže vidieť len svoje company resources
  if (currentUser?.role === 'company_owner') {
    const canAccess = canRead(resource, { ...(companyId && { companyId }) });
    return canAccess ? <>{children}</> : fallback ? <>{fallback}</> : <></>;
  }

  // Iné role môžu vidieť všetko (ak majú permission)
  const canAccess = canRead(resource);
  return canAccess ? <>{children}</> : fallback ? <>{fallback}</> : <></>;
}

// 🔨 MECHANIC ONLY GUARD
interface MechanicOnlyProps {
  companyId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function MechanicOnly({
  companyId,
  children,
  fallback,
}: MechanicOnlyProps) {
  const { currentUser, canUpdate } = usePermissions();

  // Mechanic môže vidieť len vozidlá v firmách kde má oprávnenia
  if (currentUser?.role === 'mechanic') {
    const canAccess = canUpdate('vehicles', { ...(companyId && { companyId }) });
    return canAccess ? <>{children}</> : fallback ? <>{fallback}</> : <></>;
  }

  // Iné role môžu vidieť všetko (ak majú permission)
  const canAccess = canUpdate('vehicles');
  return canAccess ? <>{children}</> : fallback ? <>{fallback}</> : <></>;
}

// 💰 AMOUNT LIMIT GUARD
interface AmountLimitProps {
  amount: number;
  children: React.ReactNode;
  onApprovalRequired?: () => void;
}

export function AmountLimitGuard({
  amount,
  children,
  onApprovalRequired,
}: AmountLimitProps) {
  const permissions = usePermissions();
  const permissionResult = permissions.hasPermission('pricing', 'update', {
    amount,
  });

  if (!permissionResult.hasAccess) {
    return (
      <Alert variant="destructive" className="my-2">
        <AlertDescription>
          <Typography variant="body2">🚫 {permissionResult.reason}</Typography>
        </AlertDescription>
      </Alert>
    );
  }

  if (permissionResult.requiresApproval) {
    return (
      <div>
        <Alert
          variant="default"
          className={`mb-2 ${onApprovalRequired ? 'cursor-pointer' : 'cursor-default'}`}
          onClick={onApprovalRequired}
        >
          <AlertDescription>
            <Typography variant="body2">
              ⚠️ {permissionResult.reason} - Kliknite pre vyžiadanie schválenia
            </Typography>
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
