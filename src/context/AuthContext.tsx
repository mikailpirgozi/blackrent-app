import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from 'react';

import { apiService, getAPI_BASE_URL } from '../services/api';
import { User, AuthState, LoginCredentials, UserCompanyAccess } from '../types';
import logger from '../utils/logger';
import { StorageManager } from '../utils/storage';

interface AuthContextType {
  state: AuthState;
  login: (
    credentials: LoginCredentials,
    rememberMe?: boolean
  ) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  hasPermission: (resource: string, action: string) => boolean;
  canAccessCompanyData: (companyId: string) => boolean;
  isAdmin: () => boolean;
  isEmployee: () => boolean;
  isCompanyUser: () => boolean;
  userCompanyAccess: UserCompanyAccess[]; // Add this to expose user company access
  refreshUserPermissions: () => Promise<void>; // Add method to refresh permissions
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_SESSION'; payload: { user: User; token: string } }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

// Počiatočný stav
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Začíname s loading true kvôli kontrole localStorage
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    case 'RESTORE_SESSION':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [userCompanyAccess, setUserCompanyAccess] = React.useState<
    UserCompanyAccess[]
  >([]);

  const getAuthData = (): { token: string | null; user: any | null } => {
    return StorageManager.getAuthData();
  };

  const clearAuthData = () => {
    StorageManager.clearAuthData();
  };

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      console.log('🔍 Validating token...');
      const response = await fetch(`${getAPI_BASE_URL()}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('✅ Token is valid');
        return true;
      } else {
        console.warn('❌ Token validation failed:', response.status);
        return false;
      }
    } catch (error) {
      console.warn('❌ Token validation error:', error);
      return false;
    }
  };

  const restoreSession = React.useCallback(async () => {
    try {
      logger.auth('🔄 Spúšťam session restore...');
      logger.info('📍 Location:', window.location.href);
      logger.info('🔗 API Base URL:', getAPI_BASE_URL());

      // Otestuj storage schopnosti
      StorageManager.testStorage();

      const { token, user } = getAuthData();

      logger.auth('🔍 Auth data check:', {
        hasToken: !!token,
        hasUser: !!user,
        userRole: user?.role || 'undefined',
        username: user?.username || 'undefined',
        tokenLength: token?.length || 0,
      });

      if (token && user) {
        logger.auth('✅ Session data found for user:', user.username);
        // logger.debug('🔐 Token preview:', token.substring(0, 20) + '...'); // SECURITY: Disabled token logging

        // OPTIMISTIC RESTORE - obnoviť session OKAMŽITE bez čakania na validáciu
        logger.auth('🚀 Optimistic session restore - obnovujem okamžite');
        dispatch({ type: 'RESTORE_SESSION', payload: { user, token } });

        // SKIPPED ASYNC VALIDÁCIA - môže spôsobovať auto-logout
        logger.warn(
          '⚠️ SKIPPING background token validation to prevent auto-logout'
        );
        logger.debug('🔧 Token validation disabled temporarily for debugging');

        // ORIGINAL VALIDATION CODE (DISABLED):
        // validateToken(token).then((isValid) => {
        //   if (isValid) {
        //     console.log('✅ Background validation: Token is valid');
        //   } else {
        //     console.log('❌ Background validation: Token is invalid, clearing auth data');
        //     clearAuthData();
        //     dispatch({ type: 'LOGOUT' });
        //     if (!window.location.pathname.includes('/login')) {
        //       window.location.href = '/login';
        //     }
        //   }
        // }).catch((error) => {
        //   console.warn('⚠️ Background validation error:', error);
        // });
      } else {
        console.log('❌ No auth data found');
        console.log('🔍 Storage debug:', {
          localStorage: {
            token: !!localStorage.getItem('blackrent_token'),
            user: !!localStorage.getItem('blackrent_user'),
            rememberMe: localStorage.getItem('blackrent_remember_me'),
          },
          sessionStorage: {
            token: !!sessionStorage.getItem('blackrent_token'),
            user: !!sessionStorage.getItem('blackrent_user'),
          },
        });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('❌ Session restore error:', error);

      // Pokus o emergency restore
      try {
        console.log('🆘 Emergency restore attempt...');
        const { token, user } = getAuthData();
        if (token && user) {
          console.log('🔄 Emergency restore successful');
          dispatch({ type: 'RESTORE_SESSION', payload: { user, token } });
        } else {
          console.log('❌ Emergency restore failed - no data');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (emergencyError) {
        console.error('💥 Emergency restore failed:', emergencyError);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }, []);

  // Počiatočná inicializácia - načítanie z storage (len raz)
  useEffect(() => {
    console.log('🏁 AuthProvider mounted, starting session restore...');
    restoreSession();
  }, [restoreSession]);

  // Separate useEffect pre handling page visibility a periodicke obnovenie
  useEffect(() => {
    console.log('🔧 Setting up session management...');

    // Handling pre page visibility - overí token keď sa používateľ vráti k aplikácii
    const handleVisibilityChange = async () => {
      if (!document.hidden && state.isAuthenticated && state.token) {
        console.log('👁️ App became visible, refreshing session...');

        // Skús obnoviť session dáta z storage (môžu sa zmeniť v inom tabe)
        const { token: storedToken, user: storedUser } = getAuthData();

        if (storedToken && storedUser) {
          if (storedToken !== state.token) {
            console.log(
              '🔄 Session change detected in another tab, updating...'
            );
            dispatch({
              type: 'RESTORE_SESSION',
              payload: { user: storedUser, token: storedToken },
            });
          } else {
            console.log('✅ Session unchanged, refreshing storage...');
            StorageManager.setAuthData(state.token, state.user, true);
          }
        } else {
          console.log(
            '⚠️ No session data found on visibility change, but keeping active session'
          );
          // Neprerušuj session, len obnov storage
          StorageManager.setAuthData(state.token, state.user, true);
        }
      }
    };

    // Periodické obnovenie session dát (každých 30 sekúnd)
    const sessionRefreshInterval = setInterval(() => {
      if (state.isAuthenticated && state.token && state.user) {
        console.log('🔄 Periodic session refresh...');
        // VŽDY nastav remember me na true pre perzistentné prihlásenie
        StorageManager.setAuthData(state.token, state.user, true);
      }
    }, 30000); // 30 sekúnd

    // Handling pre storage changes (cross-tab synchronization)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'blackrent_token' || e.key === 'blackrent_user') {
        console.log('🔄 Storage change detected:', e.key);
        if (e.newValue) {
          console.log('✅ New session data available');
          // Obnov session z aktualizovaných dát
          restoreSession();
        } else {
          console.log('⚠️ Session data removed');
          // Neodhlasuj automaticky, používateľ môže mať viacero tabov
        }
      }
    };

    // Pridaj event listenery
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(sessionRefreshInterval);
    };
  }, [state.isAuthenticated, state.token, state.user, restoreSession]);

  // Function to load user company access
  const loadUserCompanyAccess = async () => {
    if (!state.user || state.user.role === 'admin') {
      setUserCompanyAccess([]);
      return;
    }

    try {
      const access = await apiService.getUserCompanyAccess(state.user.id);
      setUserCompanyAccess(access);
      console.log('🔐 Loaded user company access:', access);
    } catch (error) {
      console.error('❌ Error loading user company access:', error);
      setUserCompanyAccess([]);
    }
  };

  // Load permissions when user changes
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      loadUserCompanyAccess();
    } else {
      setUserCompanyAccess([]);
    }
  }, [state.user, state.isAuthenticated]);

  const login = async (
    credentials: LoginCredentials,
    rememberMe: boolean = true
  ): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      console.log('🔐 Starting login process...');
      console.log('👤 Username:', credentials.username);
      console.log('💾 Remember me:', rememberMe);
      console.log('🌐 Location:', window.location.href);
      console.log('🔗 API Base URL:', getAPI_BASE_URL());

      console.log('📡 Making login request to apiService.login...');
      const result = await apiService.login(
        credentials.username,
        credentials.password
      );

      console.log('✅ Login API successful!');
      console.log('👤 User:', result.user.username);
      console.log('🔑 Token received:', !!result.token);
      // console.log('🔑 Token preview:', result.token ? result.token.substring(0, 20) + '...' : 'NO TOKEN'); // SECURITY: Disabled

      // VŽDY nastav remember me na true pre perzistentné prihlásenie
      const persistentRememberMe = true;
      StorageManager.setAuthData(
        result.token,
        result.user,
        persistentRememberMe
      );

      // Overenie uloženia
      const verification = getAuthData();
      console.log('🔍 Storage verification:', {
        tokenSaved: !!verification.token,
        userSaved: !!verification.user,
        tokensMatch: verification.token === result.token,
        usersMatch: verification.user?.username === result.user.username,
      });

      dispatch({ type: 'LOGIN_SUCCESS', payload: result });

      console.log('🎉 Login process completed successfully!');
      console.log('🔍 Auth state after login:', {
        isAuthenticated: true,
        token: !!result.token,
        user: result.user.username,
        isLoading: false,
      });

      // 🔍 Extra debug - wait a moment and check final state
      setTimeout(() => {
        console.log('🔍 Auth state after dispatch (delayed check):', {
          isAuthenticated: true,
          isLoading: false,
          hasToken: !!result.token,
          hasUser: !!result.user,
        });
      }, 50);

      return true;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      console.error('❌ Error type:', error?.constructor?.name || 'Unknown');
      console.error('❌ Error message:', error?.message || 'No message');
      console.error('❌ Error stack:', error?.stack || 'No stack');
      console.error('🌐 Network debug:', {
        online: navigator.onLine,
        userAgent: navigator.userAgent,
        connectionType:
          (navigator as any).connection?.effectiveType || 'unknown',
      });
      dispatch({ type: 'LOGIN_FAILURE' });
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Starting logout process...');
      await apiService.logout();
    } catch (error) {
      console.error('⚠️ Logout API error:', error);
    } finally {
      console.log('🧹 Clearing auth data...');
      dispatch({ type: 'LOGOUT' });
      clearAuthData();
      console.log('✅ Logout completed');
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    // Admin má všetky práva
    if (state.user?.role === 'admin') {
      return true;
    }

    // Pre ostatných používateľov skontroluj permissions v aspoň jednej firme
    return userCompanyAccess.some(access => {
      const resourcePermissions = (access.permissions as any)[resource];
      if (!resourcePermissions) return false;

      // Convert action to permission key (read -> read, create/update/delete -> write)
      const permissionKey = action === 'read' ? 'read' : 'write';
      return resourcePermissions[permissionKey] === true;
    });
  };

  const canAccessCompanyData = (companyId: string): boolean => {
    // Admin má prístup ku všetkým firmám
    if (state.user?.role === 'admin') {
      return true;
    }

    // Pre ostatných používateľov skontroluj či majú prístup k danej firme
    return userCompanyAccess.some(access => access.companyId === companyId);
  };

  const isAdmin = (): boolean => {
    return state.user?.role === 'admin';
  };

  const isEmployee = (): boolean => {
    return state.user?.role === 'employee';
  };

  const isCompanyUser = (): boolean => {
    return state.user?.role === 'company_owner';
  };

  const updateUser = (userData: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });

    // Aktualizuj aj localStorage
    if (state.user && state.token) {
      const updatedUser = { ...state.user, ...userData };
      StorageManager.setAuthData(state.token, updatedUser, true);
    }
  };

  const refreshUserPermissions = async () => {
    await loadUserCompanyAccess();
  };

  return (
    <AuthContext.Provider
      value={{
        state,
        login,
        logout,
        updateUser,
        hasPermission,
        canAccessCompanyData,
        isAdmin,
        isEmployee,
        isCompanyUser,
        userCompanyAccess,
        refreshUserPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
