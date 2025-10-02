import { API_BASE_URL } from '@blackrent/shared';
import axios from 'axios';
// Create axios instance
export const apiClient = axios.create({
    baseURL: API_BASE_URL || 'http://localhost:3001/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});
// Function to set auth store (will be called from mobile app)
let getAuthTokens = null;
let refreshAuthTokens = null;
let clearAuthTokens = null;
export const setAuthHandlers = (handlers) => {
    getAuthTokens = handlers.getTokens;
    refreshAuthTokens = handlers.refreshTokens;
    clearAuthTokens = handlers.clearTokens;
};
// Request interceptor
apiClient.interceptors.request.use(async (config) => {
    // Add auth token if available
    if (getAuthTokens) {
        const { accessToken } = getAuthTokens();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
    }
    return config;
}, error => {
    return Promise.reject(error);
});
// Response interceptor
apiClient.interceptors.response.use((response) => {
    return response;
}, async (error) => {
    const originalRequest = error.config;
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
            // Try to refresh tokens
            if (refreshAuthTokens) {
                await refreshAuthTokens();
                // Retry the original request with new token
                if (getAuthTokens) {
                    const { accessToken } = getAuthTokens();
                    if (accessToken) {
                        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                        return apiClient(originalRequest);
                    }
                }
            }
        }
        catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            if (clearAuthTokens) {
                await clearAuthTokens();
            }
        }
    }
    return Promise.reject(error);
});
export default apiClient;
