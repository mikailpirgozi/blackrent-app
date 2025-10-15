/**
 * Authentication Context
 * Manages customer authentication state with SecureStore persistence
 * Enhanced with automatic token refresh and session management
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AppState, type AppStateStatus } from 'react-native';
import { post, get } from '../config/api';
import { STORAGE_KEYS } from '../config/constants';
import { logger } from '../utils/logger';

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  customer: Customer | null;
  token: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<void>;
  loginWithGoogle: (googleToken: string) => Promise<void>;
  loginWithApple: (appleToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (firstName: string, lastName: string, phone?: string) => Promise<void>;
  restoreSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Token refresh timing constants
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry
const TOKEN_REFRESH_CHECK_INTERVAL_MS = 60 * 1000; // Check every minute
const TOKEN_DEFAULT_EXPIRY_MS = 60 * 60 * 1000; // 1 hour default

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    customer: null,
    token: null,
    refreshToken: null,
    tokenExpiresAt: null,
    isAuthenticated: false,
    isLoading: true,
    isRefreshing: false,
  });

  // Refs for timers
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  /**
   * Calculate token expiry time from JWT or use default
   */
  const calculateTokenExpiry = (token: string): number => {
    try {
      // Decode JWT payload (base64)
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      
      if (decoded.exp) {
        return decoded.exp * 1000; // Convert to milliseconds
      }
    } catch (error) {
      logger.warn('⚠️ Could not decode token expiry, using default');
    }
    
    // Default: 1 hour from now
    return Date.now() + TOKEN_DEFAULT_EXPIRY_MS;
  };

  /**
   * Save auth data to SecureStore
   */
  const saveAuthData = async (token: string, refreshToken: string, customer: Customer) => {
    try {
      const tokenExpiresAt = calculateTokenExpiry(token);
      
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(customer));
      await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN_EXPIRY, tokenExpiresAt.toString());

      setState({
        customer,
        token,
        refreshToken,
        tokenExpiresAt,
        isAuthenticated: true,
        isLoading: false,
        isRefreshing: false,
      });

      // Setup automatic token refresh
      setupTokenRefreshTimer(tokenExpiresAt);

      logger.info('✅ Auth data saved to SecureStore', {
        expiresAt: new Date(tokenExpiresAt).toISOString(),
      });
    } catch (error) {
      logger.error('❌ Failed to save auth data:', error);
      throw error;
    }
  };

  /**
   * Setup automatic token refresh timer
   */
  const setupTokenRefreshTimer = useCallback((expiresAt: number) => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    const timeUntilRefresh = expiresAt - Date.now() - TOKEN_REFRESH_BUFFER_MS;

    if (timeUntilRefresh > 0) {
      logger.info('🔄 Setting up token refresh timer', {
        refreshIn: `${Math.floor(timeUntilRefresh / 1000 / 60)} minutes`,
      });

      refreshTimerRef.current = setInterval(() => {
        const now = Date.now();
        const shouldRefresh = expiresAt - now <= TOKEN_REFRESH_BUFFER_MS;

        if (shouldRefresh && !state.isRefreshing) {
          logger.info('⏰ Auto-refreshing token...');
          refreshSession().catch((error) => {
            logger.error('❌ Auto-refresh failed:', error);
          });
        }
      }, TOKEN_REFRESH_CHECK_INTERVAL_MS);
    } else {
      // Token already expired or will expire soon, refresh immediately
      logger.warn('⚠️ Token expired or expiring soon, refreshing immediately...');
      refreshSession().catch((error) => {
        logger.error('❌ Immediate refresh failed:', error);
      });
    }
  }, [state.isRefreshing]);

  /**
   * Clear auth data from SecureStore
   */
  const clearAuthData = async () => {
    try {
      // Clear refresh timer
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN_EXPIRY);

      setState({
        customer: null,
        token: null,
        refreshToken: null,
        tokenExpiresAt: null,
        isAuthenticated: false,
        isLoading: false,
        isRefreshing: false,
      });

      logger.info('✅ Auth data cleared from SecureStore');
    } catch (error) {
      logger.error('❌ Failed to clear auth data:', error);
    }
  };

  /**
   * Restore session from SecureStore
   */
  const restoreSession = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
      const expiryStr = await SecureStore.getItemAsync(STORAGE_KEYS.TOKEN_EXPIRY);

      if (token && refreshToken && userData) {
        const customer = JSON.parse(userData) as Customer;
        const tokenExpiresAt = expiryStr ? parseInt(expiryStr, 10) : calculateTokenExpiry(token);

        // Check if token is expired or will expire soon
        const now = Date.now();
        const isExpired = tokenExpiresAt <= now;
        const needsRefresh = tokenExpiresAt - now <= TOKEN_REFRESH_BUFFER_MS;

        if (isExpired || needsRefresh) {
          logger.warn('⚠️ Token expired or expiring soon, refreshing...');
          await refreshSession();
        } else {
          // Token is still valid, verify with backend
          try {
            const profile = await get<Customer>('/customer/profile');
            
            setState({
              customer: profile,
              token,
              refreshToken,
              tokenExpiresAt,
              isAuthenticated: true,
              isLoading: false,
              isRefreshing: false,
            });

            // Setup automatic refresh
            setupTokenRefreshTimer(tokenExpiresAt);

            logger.info('✅ Session restored successfully', {
              expiresIn: `${Math.floor((tokenExpiresAt - now) / 1000 / 60)} minutes`,
            });
          } catch (error) {
            // Token invalid, try to refresh
            logger.warn('⚠️ Token invalid, attempting refresh...');
            await refreshSession();
          }
        }
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
        logger.info('ℹ️ No saved session found');
      }
    } catch (error) {
      logger.error('❌ Failed to restore session:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  /**
   * Refresh access token
   */
  const refreshSession = useCallback(async () => {
    // Prevent multiple simultaneous refresh attempts
    if (state.isRefreshing) {
      logger.info('⏸️ Refresh already in progress, skipping...');
      return;
    }

    try {
      setState((prev) => ({ ...prev, isRefreshing: true }));

      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        throw new Error('No refresh token found');
      }

      const response = await post<{ 
        accessToken: string; 
        refreshToken: string;
        customer?: Customer;
      }>('/customer/refresh', { refreshToken });

      const newTokenExpiresAt = calculateTokenExpiry(response.accessToken);

      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, response.accessToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN_EXPIRY, newTokenExpiresAt.toString());

      // Update customer data if provided
      if (response.customer) {
        await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(response.customer));
      }

      setState((prev) => ({
        ...prev,
        customer: response.customer || prev.customer,
        token: response.accessToken,
        refreshToken: response.refreshToken,
        tokenExpiresAt: newTokenExpiresAt,
        isAuthenticated: true,
        isLoading: false,
        isRefreshing: false,
      }));

      // Setup next refresh
      setupTokenRefreshTimer(newTokenExpiresAt);

      logger.info('✅ Session refreshed successfully', {
        expiresIn: `${Math.floor((newTokenExpiresAt - Date.now()) / 1000 / 60)} minutes`,
      });
    } catch (error) {
      logger.error('❌ Failed to refresh session:', error);
      setState((prev) => ({ ...prev, isRefreshing: false }));
      await clearAuthData();
      throw error;
    }
  }, [state.isRefreshing]);

  /**
   * Login with email and password
   */
  const login = useCallback(async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const response = await post<{
        token: string;
        refreshToken: string;
        customer: Customer;
      }>('/customer/login', { email, password });

      await saveAuthData(response.token, response.refreshToken, response.customer);

      logger.info('✅ Login successful:', { email });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      logger.error('❌ Login failed:', error);
      throw error;
    }
  }, []);

  /**
   * Register new customer
   */
  const register = useCallback(
    async (email: string, password: string, firstName: string, lastName: string, phone?: string) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        const response = await post<{
          token: string;
          refreshToken: string;
          customer: Customer;
        }>('/customer/register', { email, password, firstName, lastName, phone });

        await saveAuthData(response.token, response.refreshToken, response.customer);

        logger.info('✅ Registration successful:', { email });
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        logger.error('❌ Registration failed:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Login with Google OAuth
   */
  const loginWithGoogle = useCallback(async (googleToken: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const response = await post<{
        token: string;
        refreshToken: string;
        customer: Customer;
      }>('/customer/oauth/google', { token: googleToken });

      await saveAuthData(response.token, response.refreshToken, response.customer);

      logger.info('✅ Google login successful');
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      logger.error('❌ Google login failed:', error);
      throw error;
    }
  }, []);

  /**
   * Login with Apple OAuth
   */
  const loginWithApple = useCallback(async (appleToken: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const response = await post<{
        token: string;
        refreshToken: string;
        customer: Customer;
      }>('/customer/oauth/apple', { token: appleToken });

      await saveAuthData(response.token, response.refreshToken, response.customer);

      logger.info('✅ Apple login successful');
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      logger.error('❌ Apple login failed:', error);
      throw error;
    }
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      await clearAuthData();
      logger.info('✅ Logout successful');
    } catch (error) {
      logger.error('❌ Logout failed:', error);
      throw error;
    }
  }, []);

  /**
   * Update customer profile
   */
  const updateProfile = useCallback(
    async (firstName: string, lastName: string, phone?: string) => {
      try {
        await post('/customer/profile', { firstName, lastName, phone });

        // Update local state
        if (state.customer) {
          const updatedCustomer = {
            ...state.customer,
            firstName,
            lastName,
            phone,
          };

          await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedCustomer));

          setState((prev) => ({
            ...prev,
            customer: updatedCustomer,
          }));
        }

        logger.info('✅ Profile updated successfully');
      } catch (error) {
        logger.error('❌ Profile update failed:', error);
        throw error;
      }
    },
    [state.customer]
  );

  // Restore session on mount
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  /**
   * Handle app state changes (background/foreground)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        state.isAuthenticated &&
        state.tokenExpiresAt
      ) {
        // App came to foreground, check if token needs refresh
        const now = Date.now();
        const needsRefresh = state.tokenExpiresAt - now <= TOKEN_REFRESH_BUFFER_MS;

        if (needsRefresh) {
          logger.info('🔄 App resumed, checking token validity...');
          refreshSession().catch((error) => {
            logger.error('❌ Failed to refresh on app resume:', error);
          });
        }
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [state.isAuthenticated, state.tokenExpiresAt, refreshSession]);

  /**
   * Cleanup timers on unmount
   */
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    loginWithGoogle,
    loginWithApple,
    logout,
    refreshSession,
    updateProfile,
    restoreSession,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

export default AuthProvider;



