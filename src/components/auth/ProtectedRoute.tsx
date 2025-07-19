import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Box, Typography, CircularProgress } from '@mui/material';

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
  allowedRoles 
}: ProtectedRouteProps) {
  const { state, hasPermission } = useAuth();

  // NAJPRV: Ak je loading (session restore prebieha), zobraz loading
  if (state.isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Overujem prihlásenie...
        </Typography>
      </Box>
    );
  }

  // POTOM: Ak nie je prihlásený (po dokončení loading), presmeruj na login
  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Kontrola oprávnení
  if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography variant="h6" color="error">
          Nemáte oprávnenie pristupovať k tejto stránke
        </Typography>
      </Box>
    );
  }

  // Kontrola rolí
  if (allowedRoles && state.user && !allowedRoles.includes(state.user.role)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography variant="h6" color="error">
          Nemáte oprávnenie pristupovať k tejto stránke
        </Typography>
      </Box>
    );
  }

  // Ak všetky kontroly prešli, zobraz obsah
  return <>{children}</>;
} 