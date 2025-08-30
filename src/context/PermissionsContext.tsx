import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

import { apiService } from '../services/api';
import {
  UserCompanyAccess,
  CompanyPermissions,
  ResourcePermission,
} from '../types';

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

  const fetchUserPermissions = async () => {
    if (!user || user.role === 'admin') {
      setUserCompanyAccess([]);
      return;
    }

    try {
      setPermissionsLoading(true);
      setPermissionsError(null);
      const accessData = await apiService.getUserCompanyAccess(user.id);
      setUserCompanyAccess(accessData);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      setPermissionsError('Chyba pri načítavaní oprávnení');
      setUserCompanyAccess([]);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const refreshPermissions = async () => {
    await fetchUserPermissions();
  };

  // Načítaj permissions len raz pri zmene používateľa
  useEffect(() => {
    fetchUserPermissions();
  }, [user?.id, user?.role]);

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
