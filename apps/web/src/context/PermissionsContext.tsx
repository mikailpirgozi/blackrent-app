import type { ReactNode } from 'react';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { apiService } from '../services/api';
import type { UserCompanyAccess } from '../types';
// import { CompanyPermissions, ResourcePermission } from '../types'; // Nepoužívané

import { useAuth } from './AuthContext';

interface PermissionsContextType {
  userCompanyAccess: UserCompanyAccess[];
  permissionsLoading: boolean;
  permissionsError: string | null;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(
  undefined
);

export const usePermissionsContext = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error(
      'usePermissionsContext must be used within a PermissionsProvider'
    );
  }
  return context;
};

interface PermissionsProviderProps {
  children: ReactNode;
}

export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({
  children,
}) => {
  const { state } = useAuth();
  const user = state.user;
  const [userCompanyAccess, setUserCompanyAccess] = useState<
    UserCompanyAccess[]
  >([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  const fetchUserPermissions = useCallback(async () => {
    // Skip loading permissions for super_admin and company_admin - they have full access
    if (!user || user.role === 'super_admin' || user.role === 'company_admin' || user.role === 'admin') {
      setUserCompanyAccess([]);
      return;
    }

    try {
      setPermissionsLoading(true);
      setPermissionsError(null);
      const accessData = await apiService.getUserCompanyAccess(user.id);
      setUserCompanyAccess(accessData as unknown as UserCompanyAccess[]);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      setPermissionsError('Chyba pri načítavaní oprávnení');
      setUserCompanyAccess([]);
    } finally {
      setPermissionsLoading(false);
    }
  }, [user]);

  const refreshPermissions = async () => {
    await fetchUserPermissions();
  };

  // Načítaj permissions len raz pri zmene používateľa
  useEffect(() => {
    fetchUserPermissions();
  }, [user?.id, user?.role, fetchUserPermissions]);

  const value: PermissionsContextType = {
    userCompanyAccess,
    permissionsLoading,
    permissionsError,
    refreshPermissions,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};
