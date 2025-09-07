import { Box, CircularProgress, Typography } from '@mui/material';
import React from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import logger from '../../utils/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: {
    resource: string;
    action: string;
  };
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  requiredPermission,
  allowedRoles,
}: ProtectedRouteProps) {
  const { state, hasPermission } = useAuth();

  // 🔍 OPTIMALIZOVANÉ LOGGING - len pri problémoch alebo v development
  React.useEffect(() => {
    // V development - vždy loguj pre debugging
    if (process.env.NODE_ENV === 'development') {
      logger.debug('🛡️ ProtectedRoute check:', {
        isLoading: state.isLoading,
        isAuthenticated: state.isAuthenticated,
        hasToken: !!state.token,
        hasUser: !!state.user,
      });
    }

    // V production - loguj len authentication failures
    if (!state.isLoading && !state.isAuthenticated) {
      logger.auth('🛡️ ProtectedRoute: Authentication failed', {
        hasToken: !!state.token,
        hasUser: !!state.user,
        currentPath: window.location.pathname,
      });
    }
  }, [state.isLoading, state.isAuthenticated, state.token, state.user]);

  // NAJPRV: Ak je loading (session restore prebieha), zobraz loading
  if (state.isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Overujem prihlásenie...
        </Typography>
      </Box>
    );
  }

  // POTOM: Ak nie je prihlásený (po dokončení loading), presmeruj na login
  if (!state.isAuthenticated) {
    // Optimalized: Mobile debug logs only in development, minimal alert in production
    if (process.env.NODE_ENV === 'development') {
      console.log('🚨 MOBILE DEBUG: ProtectedRoute - NOT AUTHENTICATED!');
      console.log('🚨 MOBILE DEBUG: Redirecting to /login');
      console.log('🚨 MOBILE DEBUG: Current path:', window.location.pathname);
      console.log('🚨 MOBILE DEBUG: Auth state:', state);
      alert(
        `🚨 AUTH REDIRECT: Not authenticated! Redirecting to /login from ${window.location.pathname}`
      );
    } else {
      // Production: Silent redirect with minimal logging
      console.warn('🛡️ Authentication failed, redirecting to login');
    }
    return <Navigate to="/login" replace />;
  }

  // Kontrola oprávnení
  if (
    requiredPermission &&
    !hasPermission(requiredPermission.resource, requiredPermission.action)
  ) {
    logger.warn('🛡️ ProtectedRoute: Permission denied', {
      user: state.user?.username,
      requiredPermission,
      userRole: state.user?.role,
    });

    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Typography variant="h6" color="error">
          Nemáte oprávnение pristupovať k tejto stránke
        </Typography>
      </Box>
    );
  }

  // Kontrola rolí
  if (allowedRoles && state.user && !allowedRoles.includes(state.user.role)) {
    logger.warn('🛡️ ProtectedRoute: Role access denied', {
      user: state.user?.username,
      userRole: state.user?.role,
      allowedRoles,
    });

    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Typography variant="h6" color="error">
          Nemáte oprávnenie pristupovať k tejto stránke
        </Typography>
      </Box>
    );
  }

  // Ak všetky kontroly prešli, zobraz obsah
  return <>{children}</>;
}
