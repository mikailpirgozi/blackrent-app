import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { User, AuthState, LoginCredentials } from '../types';
import { apiService, API_BASE_URL } from '../services/api';
import { StorageManager } from '../utils/storage';

interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  hasPermission: (resource: string, action: string) => boolean;
  canAccessCompanyData: (companyId: string) => boolean;
  isAdmin: () => boolean;
  isEmployee: () => boolean;
  isCompanyUser: () => boolean;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_SESSION'; payload: { user: User; token: string } };

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
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const getAuthData = (): { token: string | null; user: any | null } => {
    return StorageManager.getAuthData();
  };

  const clearAuthData = () => {
    StorageManager.clearAuthData();
  };

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      console.log('🔍 Validating token...');
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
      console.log('🔄 Spúšťam session restore...');
      console.log('📍 Location:', window.location.href);
      console.log('🔗 API Base URL:', API_BASE_URL);
      
      // Otestuj storage schopnosti
      StorageManager.testStorage();
      
      const { token, user } = getAuthData();
      
      console.log('🔍 Auth data check:', {
        hasToken: !!token,
        hasUser: !!user,
        userRole: user?.role || 'undefined',
        username: user?.username || 'undefined',
        tokenLength: token?.length || 0
      });
      
      if (token && user) {
        console.log('✅ Session data found for user:', user.username);
        console.log('🔐 Token preview:', token.substring(0, 20) + '...');
        
        // OPTIMISTIC RESTORE - obnoviť session OKAMŽITE bez čakania na validáciu
        console.log('🚀 Optimistic session restore - obnovujem okamžite');
        dispatch({ type: 'RESTORE_SESSION', payload: { user, token } });
        
        // ASYNC VALIDÁCIA - validuj token na pozadí
        console.log('🔍 Background token validation...');
        validateToken(token).then((isValid) => {
          if (isValid) {
            console.log('✅ Background validation: Token is valid');
            // Session už je obnovená, nič ďalšie nerobiť
          } else {
            console.log('❌ Background validation: Token is invalid, clearing auth data');
            clearAuthData();
            dispatch({ type: 'LOGOUT' });
            // Optional: presmeruj na login len ak nie je už na login stránke
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
        }).catch((error) => {
          console.warn('⚠️ Background validation error:', error);
          // V prípade chyby validation, nech session zostane aktívna
          // (lepšie false positive ako false negative)
        });
      } else {
        console.log('❌ No auth data found');
        console.log('🔍 Storage debug:', {
          localStorage: {
            token: !!localStorage.getItem('blackrent_token'),
            user: !!localStorage.getItem('blackrent_user'),
            rememberMe: localStorage.getItem('blackrent_remember_me')
          },
          sessionStorage: {
            token: !!sessionStorage.getItem('blackrent_token'),
            user: !!sessionStorage.getItem('blackrent_user')
          }
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
            console.log('🔄 Session change detected in another tab, updating...');
            dispatch({ type: 'RESTORE_SESSION', payload: { user: storedUser, token: storedToken } });
          } else {
            console.log('✅ Session unchanged, refreshing storage...');
            StorageManager.setAuthData(state.token, state.user, true);
          }
        } else {
          console.log('⚠️ No session data found on visibility change, but keeping active session');
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

  const login = async (credentials: LoginCredentials, rememberMe: boolean = true): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      console.log('🔐 Starting login process...');
      console.log('👤 Username:', credentials.username);
      console.log('💾 Remember me:', rememberMe);
      console.log('🌐 Location:', window.location.href);
      
      const result = await apiService.login(credentials.username, credentials.password);
      
      console.log('✅ Login API successful!');
      console.log('👤 User:', result.user.username);
      console.log('🔑 Token received:', !!result.token);
      
      // VŽDY nastav remember me na true pre perzistentné prihlásenie
      const persistentRememberMe = true;
      StorageManager.setAuthData(result.token, result.user, persistentRememberMe);
      
      // Overenie uloženia
      const verification = getAuthData();
      console.log('🔍 Storage verification:', {
        tokenSaved: !!verification.token,
        userSaved: !!verification.user,
        tokensMatch: verification.token === result.token,
        usersMatch: verification.user?.username === result.user.username
      });
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: result });
      
      console.log('🎉 Login process completed successfully!');
      console.log('🔍 Auth state after login:', {
        isAuthenticated: true,
        token: !!result.token,
        user: result.user.username
      });
      return true;
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('🌐 Network debug:', {
        online: navigator.onLine,
        userAgent: navigator.userAgent,
        connectionType: (navigator as any).connection?.effectiveType || 'unknown'
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
    // Zjednodušené oprávnenia - admin má všetky práva
    if (state.user?.role === 'admin') {
      return true;
    }
    
    // Ostatní používatelia majú základné oprávnenia
    const basicPermissions = {
      'vehicles': ['read', 'create', 'update', 'delete'],
      'rentals': ['read', 'create', 'update', 'delete'],
      'customers': ['read', 'create', 'update', 'delete'],
      'expenses': ['read', 'create', 'update', 'delete'],
      'insurances': ['read', 'create', 'update', 'delete']
    };

    const allowedActions = basicPermissions[resource as keyof typeof basicPermissions] || [];
    return allowedActions.includes(action);
  };

  const canAccessCompanyData = (companyId: string): boolean => {
    // Admin má prístup ku všetkým firmám
    if (state.user?.role === 'admin') {
      return true;
    }
    
    // Ostatní používatelia majú prístup ku všetkým firmám (zjednodušené)
    return true;
  };

  const isAdmin = (): boolean => {
    return state.user?.role === 'admin';
  };

  const isEmployee = (): boolean => {
    return state.user?.role === 'employee';
  };

  const isCompanyUser = (): boolean => {
    return state.user?.role === 'company';
  };

  return (
    <AuthContext.Provider
      value={{
        state,
        login,
        logout,
        hasPermission,
        canAccessCompanyData,
        isAdmin,
        isEmployee,
        isCompanyUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 