import React from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../types';

// 🛡️ PERMISSION GUARD COMPONENT
interface PermissionGuardProps {
  resource: Permission['resource'];
  action: Permission['actions'][0];
  context?: {
    resourceOwnerId?: string;
    resourceCompanyId?: string;
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
  showAccessDeniedMessage = false
}: PermissionGuardProps) {
  const permissions = usePermissions();
  const permissionResult = permissions.hasPermission(resource, action, context);

  // Ak nemá prístup, zobraz fallback alebo nothing
  if (!permissionResult.hasAccess) {
    if (showAccessDeniedMessage) {
      return (
        <Alert severity="warning" sx={{ my: 2 }}>
          <Typography variant="body2">
            🚫 {permissionResult.reason || 'Nemáte oprávnenie pre túto akciu'}
          </Typography>
        </Alert>
      );
    }
    return fallback ? <>{fallback}</> : null;
  }

  // Ak vyžaduje schválenie, zobraz warning
  if (permissionResult.requiresApproval) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            ⚠️ {permissionResult.reason || 'Táto akcia vyžaduje schválenie'}
          </Typography>
        </Alert>
        {children}
      </Box>
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
  showAccessDeniedMessage = false
}: RoleGuardProps) {
  const { currentUser } = usePermissions();

  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    if (showAccessDeniedMessage) {
      return (
        <Alert severity="warning" sx={{ my: 2 }}>
          <Typography variant="body2">
            🚫 Túto sekciu môžu vidieť len: {allowedRoles.join(', ')}
          </Typography>
        </Alert>
      );
    }
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// 🔍 SIMPLE PERMISSION CHECKS
interface CanProps {
  read?: Permission['resource'];
  create?: Permission['resource'];
  update?: Permission['resource'];
  delete?: Permission['resource'];
  context?: any;
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
  fallback
}: CanProps) {
  const permissions = usePermissions();

  let hasAccess = false;

  if (read && permissions.canRead(read, context)) hasAccess = true;
  if (create && permissions.canCreate(create, context)) hasAccess = true;
  if (update && permissions.canUpdate(update, context)) hasAccess = true;
  if (deleteResource && permissions.canDelete(deleteResource, context)) hasAccess = true;

  return hasAccess ? <>{children}</> : (fallback ? <>{fallback}</> : null);
}

// 🏢 COMPANY OWNER GUARD
interface CompanyOnlyProps {
  resource: Permission['resource'];
  resourceCompanyId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function CompanyOnly({
  resource,
  resourceCompanyId,
  children,
  fallback
}: CompanyOnlyProps) {
  const { currentUser, canRead } = usePermissions();

  // Company owner môže vidieť len svoje company resources
  if (currentUser?.role === 'company_owner') {
    const canAccess = canRead(resource, { resourceCompanyId });
    return canAccess ? <>{children}</> : (fallback ? <>{fallback}</> : null);
  }

  // Iné role môžu vidieť všetko (ak majú permission)
  const canAccess = canRead(resource);
  return canAccess ? <>{children}</> : (fallback ? <>{fallback}</> : null);
}

// 🔨 MECHANIC ONLY GUARD
interface MechanicOnlyProps {
  resourceOwnerId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function MechanicOnly({
  resourceOwnerId,
  children,
  fallback
}: MechanicOnlyProps) {
  const { currentUser, canUpdate } = usePermissions();

  // Mechanic môže vidieť len svoje priradené vozidlá
  if (currentUser?.role === 'mechanic') {
    const canAccess = canUpdate('vehicles', { resourceOwnerId });
    return canAccess ? <>{children}</> : (fallback ? <>{fallback}</> : null);
  }

  // Iné role môžu vidieť všetko (ak majú permission)
  const canAccess = canUpdate('vehicles');
  return canAccess ? <>{children}</> : (fallback ? <>{fallback}</> : null);
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
  onApprovalRequired
}: AmountLimitProps) {
  const permissions = usePermissions();
  const permissionResult = permissions.hasPermission('pricing', 'update', { amount });

  if (!permissionResult.hasAccess) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        <Typography variant="body2">
          🚫 {permissionResult.reason}
        </Typography>
      </Alert>
    );
  }

  if (permissionResult.requiresApproval) {
    return (
      <Box>
        <Alert 
          severity="warning" 
          sx={{ mb: 2, cursor: onApprovalRequired ? 'pointer' : 'default' }}
          onClick={onApprovalRequired}
        >
          <Typography variant="body2">
            ⚠️ {permissionResult.reason} - Kliknite pre vyžiadanie schválenia
          </Typography>
        </Alert>
        {children}
      </Box>
    );
  }

  return <>{children}</>;
} 