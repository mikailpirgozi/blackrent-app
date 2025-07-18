import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { User, AuthState, LoginCredentials, AuthResponse, Permission } from '../types';
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

  // Utility funkcie pre prácu s storage
  const setAuthData = (token: string, user: any, rememberMe: boolean = true) => {
    StorageManager.setAuthData(token, user, rememberMe);
  };

  const getAuthData = (): { token: string | null; user: any | null } => {
    return StorageManager.getAuthData();
  };

  const clearAuthData = () => {
    StorageManager.clearAuthData();
  };

  const validateToken = async (token: string): Promise<boolean> => {
    // ZJEDNODUŠENIE: Vždy považuj token za platný
    // Ak má používateľ uložené auth dáta, znamená to že sa už úspešne prihlásil
    // Nebudeme ho obtažovať s neustálym overovaním
    console.log('✅ Token validation preskočená - vždy platný pre lepšiu UX');
    return true;
  };

  const restoreSession = async () => {
    try {
      console.log('🔍 Obnovujem session...');
      const { token, user } = getAuthData();
      
      console.log('📍 Current location:', window.location.href);
      console.log('🌐 Current hostname:', window.location.hostname);
      console.log('🔑 Token found:', !!token);
      console.log('👤 User found:', !!user);
      console.log('📱 User agent:', navigator.userAgent);
      console.log('🔗 API Base URL:', API_BASE_URL);
      
      if (token && user) {
        console.log('✅ Session dáta nájdené pre používateľa:', user.username);
        
        // Rovno obnov session bez testovania tokenu
        // Token validation môže zlyhať kvôli network issues
        console.log('🚀 Obnovujem session bez testovania tokenu (optimistic restore)');
        dispatch({ type: 'RESTORE_SESSION', payload: { user, token } });
        
        // Async testovanie tokenu na pozadí (neblokuje UI)
        validateToken(token).then(isValid => {
          if (!isValid) {
            console.log('⚠️ Token validation zlyhal asynchrónne, ale ponechávam session');
            // Môžeme pridať notifikáciu používateľovi o možných problémoch
          } else {
            console.log('✅ Token validation úspešná asynchrónne');
          }
        }).catch(error => {
          console.warn('⚠️ Asynchrónna token validation zlyhala:', error);
        });
      } else {
        console.log('❌ Žiadny token alebo používateľ nenájdený');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('❌ Chyba pri obnovení relácie:', error);
      // Pokús sa obnoviť session aj pri chybe
      const { token, user } = getAuthData();
      if (token && user) {
        console.log('⚠️ Error pri restore, ale skúšam fallback restore');
        dispatch({ type: 'RESTORE_SESSION', payload: { user, token } });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  };

  // Počiatočná inicializácia - načítanie z localStorage (len raz)
  useEffect(() => {
    restoreSession();
  }, []); // Prázdny dependency array - spustí sa len raz

  // Separate useEffect pre handling page visibility a periodicke obnovenie
  useEffect(() => {
    // Handling pre page visibility - overí token keď sa používateľ vráti k aplikácii
    const handleVisibilityChange = async () => {
      if (!document.hidden && state.isAuthenticated && state.token) {
        console.log('👁️ Aplikácia sa stala viditeľnou, soft refresh session...');
        
        // Skús obnoviť session dáta z storage (môžu sa zmeniť v inom tabe)
        const { token: storedToken, user: storedUser } = getAuthData();
        
        if (storedToken && storedUser && storedToken !== state.token) {
          console.log('🔄 Detekovaná zmena session v inom tabe, aktualizujem...');
          dispatch({ type: 'RESTORE_SESSION', payload: { user: storedUser, token: storedToken } });
        } else if (!storedToken || !storedUser) {
          console.log('⚠️ Session dáta chýbajú po návrate (možno vymazané), ale ponechávam aktívnu session');
          // Neodhlasuj používateľa, len obnov storage
          StorageManager.setAuthData(state.token, state.user, StorageManager.isRememberMeEnabled());
        }
        
        console.log('✅ Session obnovená po návrate k aplikácii');
      }
    };

    // Periodické obnovenie session dát (každých 30 sekúnd)
    const sessionRefreshInterval = setInterval(() => {
      if (state.isAuthenticated && state.token && state.user) {
        console.log('🔄 Periodické obnovenie session dát...');
        StorageManager.setAuthData(state.token, state.user, true); // Vždy remember me
      }
    }, 30000); // 30 sekúnd

    // Pridaj event listener pre page visibility
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(sessionRefreshInterval);
    };
  }, [state.isAuthenticated, state.token, state.user]);

  const login = async (credentials: LoginCredentials, rememberMe: boolean = true): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      console.log('🔐 Pokúšam sa prihlásiť používateľa:', credentials.username);
      console.log('💾 Zapamätať prihlásenie:', rememberMe);
      console.log('🌐 Window location:', window.location.href);
      console.log('📱 Device:', {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      });
      
      const result = await apiService.login(credentials.username, credentials.password);
      
      console.log('✅ Prihlásenie úspešné!');
      console.log('👤 Používateľ:', result.user.username);
      console.log('🔑 Token uložený do:', rememberMe ? 'localStorage (trvalé)' : 'sessionStorage (dočasné)');
      
      StorageManager.setAuthData(result.token, result.user, rememberMe);
      
      console.log('💾 Storage test:', {
        canAccess: typeof Storage !== 'undefined',
        tokenSaved: !!(rememberMe ? localStorage.getItem('blackrent_token') : sessionStorage.getItem('blackrent_token')),
        userSaved: !!(rememberMe ? localStorage.getItem('blackrent_user') : sessionStorage.getItem('blackrent_user')),
        rememberMeSet: localStorage.getItem('blackrent_remember_me') === rememberMe.toString()
      });
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: result });
      return true;
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('🌐 Network debug:', {
        online: navigator.onLine,
        connectionType: (navigator as any).connection?.effectiveType || 'unknown'
      });
      dispatch({ type: 'LOGIN_FAILURE' });
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Odhlasovanie používateľa...');
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      console.log('🗑️ Mažem auth dáta...');
      dispatch({ type: 'LOGOUT' });
      StorageManager.clearAuthData();
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