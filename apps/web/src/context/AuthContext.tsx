import type { ReactNode } from 'react';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';

import { apiService, getAPI_BASE_URL } from '../services/api';
import type {
  AuthState,
  LoginCredentials,
  User,
  UserCompanyAccess,
} from '../types';
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

  const getAuthData = (): {
    token: string | null;
    user: Record<string, unknown> | null;
  } => {
    return StorageManager.getAuthData();
  };

  const clearAuthData = () => {
    StorageManager.clearAuthData();
  };

  // const validateToken = async (token: string): Promise<boolean> => {
  //   try {
  //     logger.debug('🔍 Validating token...');
  //     const response = await fetch(`${getAPI_BASE_URL()}/auth/me`, {
  //       method: 'GET',
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         'Content-Type': 'application/json',
  //       },
  //     });

  //     if (response.ok) {
  //       logger.debug('✅ Token is valid');
  //       return true;
  //     } else {
  //       console.warn('❌ Token validation failed:', response.status);
  //       return false;
  //     }
  //   } catch (error) {
  //     console.warn('❌ Token validation error:', error);
  //     return false;
  //   }
  // };

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
        dispatch({
          type: 'RESTORE_SESSION',
          payload: {
            user: user as unknown as User,
            token: String(token),
          },
        });

        // SKIPPED ASYNC VALIDÁCIA - môže spôsobovať auto-logout
        logger.warn(
          '⚠️ SKIPPING background token validation to prevent auto-logout'
        );
        logger.debug('🔧 Token validation disabled temporarily for debugging');

        // ORIGINAL VALIDATION CODE (DISABLED):
        // validateToken(token).then((isValid) => {
        //   if (isValid) {
        //     logger.debug('✅ Background validation: Token is valid');
        //   } else {
        //     logger.debug('❌ Background validation: Token is invalid, clearing auth data');
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
        logger.debug('❌ No auth data found');
        logger.debug('🔍 Storage debug:', {
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
        logger.debug('🆘 Emergency restore attempt...');
        const { token, user } = getAuthData();
        if (token && user) {
          logger.debug('🔄 Emergency restore successful');
          dispatch({
            type: 'RESTORE_SESSION',
            payload: {
              user: user as unknown as User,
              token: String(token),
            },
          });
        } else {
          logger.debug('❌ Emergency restore failed - no data');
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
    logger.debug('🏁 AuthProvider mounted, starting session restore...');
    restoreSession();
  }, [restoreSession]);

  // Separate useEffect pre handling page visibility a periodicke obnovenie
  useEffect(() => {
    logger.debug('🔧 Setting up session management...');

    // Handling pre page visibility - overí token keď sa používateľ vráti k aplikácii
    const handleVisibilityChange = async () => {
      if (!document.hidden && state.isAuthenticated && state.token) {
        logger.debug('👁️ App became visible, refreshing session...');

        // Skús obnoviť session dáta z storage (môžu sa zmeniť v inom tabe)
        const { token: storedToken, user: storedUser } = getAuthData();

        if (storedToken && storedUser) {
          if (storedToken !== state.token) {
            logger.debug(
              '🔄 Session change detected in another tab, updating...'
            );
            dispatch({
              type: 'RESTORE_SESSION',
              payload: {
                user: storedUser as unknown as User,
                token: String(storedToken),
              },
            });
          } else {
            logger.debug('✅ Session unchanged, refreshing storage...');
            StorageManager.setAuthData(
              state.token,
              state.user as unknown as Record<string, unknown>,
              true
            );
          }
        } else {
          logger.debug(
            '⚠️ No session data found on visibility change, but keeping active session'
          );
          // Neprerušuj session, len obnov storage
          StorageManager.setAuthData(
            state.token,
            state.user as unknown as Record<string, unknown>,
            true
          );
        }
      }
    };

    // Periodické obnovenie session dát (každých 30 sekúnd)
    const sessionRefreshInterval = setInterval(() => {
      if (state.isAuthenticated && state.token && state.user) {
        logger.debug('🔄 Periodic session refresh...');
        // VŽDY nastav remember me na true pre perzistentné prihlásenie
        StorageManager.setAuthData(
          state.token,
          state.user as unknown as Record<string, unknown>,
          true
        );
      }
    }, 30000); // 30 sekúnd

    // Handling pre storage changes (cross-tab synchronization)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'blackrent_token' || e.key === 'blackrent_user') {
        logger.debug('🔄 Storage change detected:', e.key);
        if (e.newValue) {
          logger.debug('✅ New session data available');
          // Obnov session z aktualizovaných dát
          restoreSession();
        } else {
          logger.debug('⚠️ Session data removed');
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
  const loadUserCompanyAccess = useCallback(async () => {
    if (!state.user || state.user.role === 'admin') {
      setUserCompanyAccess([]);
      return;
    }

    try {
      const access = await apiService.getUserCompanyAccess(state.user.id);
      setUserCompanyAccess(access as unknown as UserCompanyAccess[]);
      logger.debug('🔐 Loaded user company access:', access);
    } catch (error) {
      console.error('❌ Error loading user company access:', error);
      setUserCompanyAccess([]);
    }
  }, [state.user]);

  // Load permissions when user changes
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      loadUserCompanyAccess();
    } else {
      setUserCompanyAccess([]);
    }
  }, [state.user, state.isAuthenticated, loadUserCompanyAccess]);

  const login = async (
    credentials: LoginCredentials,
    rememberMe: boolean = true
  ): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      logger.debug('🔐 Starting login process...');
      logger.debug('👤 Username:', credentials.username);
      logger.debug('💾 Remember me:', rememberMe);
      logger.debug('🌐 Location:', window.location.href);
      logger.debug('🔗 API Base URL:', getAPI_BASE_URL());

      logger.debug('📡 Making login request to apiService.login...');
      const result = await apiService.login(
        credentials.username,
        credentials.password
      );

      logger.debug('✅ Login API successful!');
      logger.debug('👤 User:', result.user.username);
      logger.debug('🔑 Token received:', !!result.token);
      // logger.debug('🔑 Token preview:', result.token ? result.token.substring(0, 20) + '...' : 'NO TOKEN'); // SECURITY: Disabled

      // VŽDY nastav remember me na true pre perzistentné prihlásenie
      const persistentRememberMe = true;
      StorageManager.setAuthData(
        result.token,
        result.user as unknown as Record<string, unknown>,
        persistentRememberMe
      );

      // Overenie uloženia
      const verification = getAuthData();
      logger.debug('🔍 Storage verification:', {
        tokenSaved: !!verification.token,
        userSaved: !!verification.user,
        tokensMatch: verification.token === result.token,
        usersMatch: verification.user?.username === result.user.username,
      });

      dispatch({ type: 'LOGIN_SUCCESS', payload: result });

      logger.debug('🎉 Login process completed successfully!');
      logger.debug('🔍 Auth state after login:', {
        isAuthenticated: true,
        token: !!result.token,
        user: result.user.username,
        isLoading: false,
      });

      // 🔍 Extra debug - wait a moment and check final state
      setTimeout(() => {
        logger.debug('🔍 Auth state after dispatch (delayed check):', {
          isAuthenticated: true,
          isLoading: false,
          hasToken: !!result.token,
          hasUser: !!result.user,
        });
      }, 50);

      return true;
    } catch (error: unknown) {
      console.error('❌ Login error:', error);
      console.error('❌ Error type:', error?.constructor?.name || 'Unknown');
      console.error(
        '❌ Error message:',
        (error as Error)?.message || 'No message'
      );
      console.error('❌ Error stack:', (error as Error)?.stack || 'No stack');
      console.error('🌐 Network debug:', {
        online: navigator.onLine,
        userAgent: navigator.userAgent,
        connectionType:
          (navigator as Navigator & { connection?: { effectiveType?: string } })
            .connection?.effectiveType || 'unknown',
      });
      dispatch({ type: 'LOGIN_FAILURE' });
      return false;
    }
  };

  const logout = async () => {
    try {
      logger.debug('🚪 Starting logout process...');
      await apiService.logout();
    } catch (error) {
      console.error('⚠️ Logout API error:', error);
    } finally {
      logger.debug('🧹 Clearing auth data...');
      dispatch({ type: 'LOGOUT' });
      clearAuthData();
      logger.debug('✅ Logout completed');
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    // Admin má všetky práva
    if (state.user?.role === 'admin') {
      return true;
    }

    // Pre ostatných používateľov skontroluj permissions v aspoň jednej firme
    return userCompanyAccess.some(access => {
      const resourcePermissions = (
        access.permissions as unknown as Record<string, unknown>
      )[resource] as Record<string, unknown> | undefined;
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
