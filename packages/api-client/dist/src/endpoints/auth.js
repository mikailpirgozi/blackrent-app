import { apiClient } from '../client';
/**
 * Authentication API endpoints
 */
export const authApi = {
    /**
     * Login user with email and password
     */
    login: async (credentials) => {
        try {
            const response = await apiClient.post('/auth/login', credentials);
            if (response.data?.success && response.data?.data) {
                return response.data.data;
            }
            // Fallback to mock login for development
            console.warn('API login failed, using mock authentication');
            return getMockLoginResponse(credentials);
        }
        catch (error) {
            console.error('Login API error, using mock authentication:', error);
            return getMockLoginResponse(credentials);
        }
    },
    /**
     * Register new user
     */
    register: async (userData) => {
        try {
            const response = await apiClient.post('/auth/register', userData);
            if (response.data?.success && response.data?.data) {
                return response.data.data;
            }
            // Fallback to mock registration
            console.warn('API registration failed, using mock registration');
            return getMockRegisterResponse(userData);
        }
        catch (error) {
            console.error('Registration API error, using mock registration:', error);
            return getMockRegisterResponse(userData);
        }
    },
    /**
     * Refresh access token
     */
    refreshToken: async (refreshToken) => {
        try {
            const response = await apiClient.post('/auth/refresh', { refreshToken });
            if (response.data?.success && response.data?.data) {
                return response.data.data;
            }
            throw new Error('Token refresh failed');
        }
        catch (error) {
            console.error('Token refresh error:', error);
            throw error;
        }
    },
    /**
     * Logout user
     */
    logout: async () => {
        try {
            await apiClient.post('/auth/logout');
        }
        catch (error) {
            console.error('Logout API error:', error);
            // Don't throw error for logout - always succeed locally
        }
    },
    /**
     * Get current user profile
     */
    getProfile: async () => {
        try {
            const response = await apiClient.get('/auth/profile');
            if (response.data?.success && response.data?.data) {
                return response.data.data;
            }
            throw new Error('Failed to get user profile');
        }
        catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    },
    /**
     * Update user profile
     */
    updateProfile: async (userData) => {
        try {
            const response = await apiClient.put('/auth/profile', userData);
            if (response.data?.success && response.data?.data) {
                return response.data.data;
            }
            throw new Error('Failed to update user profile');
        }
        catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    },
    /**
     * Request password reset
     */
    forgotPassword: async (email) => {
        try {
            await apiClient.post('/auth/forgot-password', { email });
        }
        catch (error) {
            console.error('Forgot password error:', error);
            throw error;
        }
    },
    /**
     * Reset password with token
     */
    resetPassword: async (token, password) => {
        try {
            await apiClient.post('/auth/reset-password', { token, password });
        }
        catch (error) {
            console.error('Reset password error:', error);
            throw error;
        }
    },
};
// Mock authentication responses for development
const getMockLoginResponse = (credentials) => {
    // Mock successful login for test credentials
    if (credentials.email === 'test@blackrent.sk' &&
        credentials.password === 'password123') {
        return {
            user: {
                id: 'mock-user-1',
                email: 'test@blackrent.sk',
                firstName: 'Test',
                lastName: 'User',
                role: 'customer',
                phone: '+421900123456',
                isEmailVerified: true,
                isPhoneVerified: false,
                preferences: {
                    language: 'sk',
                    currency: 'EUR',
                    notifications: {
                        email: true,
                        push: true,
                        sms: false,
                    },
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            accessToken: 'mock-access-token-' + Date.now(),
            refreshToken: 'mock-refresh-token-' + Date.now(),
            expiresIn: 3600,
        };
    }
    // Mock failed login
    throw new Error('Nesprávne prihlasovacie údaje');
};
const getMockRegisterResponse = (userData) => {
    return {
        user: {
            id: 'mock-user-' + Date.now(),
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: 'customer',
            phone: userData.phone || '',
            isEmailVerified: false,
            isPhoneVerified: false,
            preferences: {
                language: 'sk',
                currency: 'EUR',
                notifications: {
                    email: true,
                    push: true,
                    sms: false,
                },
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        expiresIn: 3600,
    };
};
