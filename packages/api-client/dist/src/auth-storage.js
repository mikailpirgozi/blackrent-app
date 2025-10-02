import * as SecureStore from 'expo-secure-store';
// Keys for secure storage
const ACCESS_TOKEN_KEY = 'blackrent_access_token';
const REFRESH_TOKEN_KEY = 'blackrent_refresh_token';
/**
 * Helper functions for managing auth tokens securely
 */
export const authStorage = {
    /**
     * Save access token to secure storage
     */
    async setAccessToken(token) {
        try {
            await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
        }
        catch (error) {
            console.error('Error saving access token:', error);
        }
    },
    /**
     * Get access token from secure storage
     */
    async getAccessToken() {
        try {
            return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        }
        catch (error) {
            console.error('Error getting access token:', error);
            return null;
        }
    },
    /**
     * Save refresh token to secure storage
     */
    async setRefreshToken(token) {
        try {
            await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
        }
        catch (error) {
            console.error('Error saving refresh token:', error);
        }
    },
    /**
     * Get refresh token from secure storage
     */
    async getRefreshToken() {
        try {
            return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        }
        catch (error) {
            console.error('Error getting refresh token:', error);
            return null;
        }
    },
    /**
     * Remove all auth tokens from secure storage
     */
    async clearTokens() {
        try {
            await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        }
        catch (error) {
            console.error('Error clearing tokens:', error);
        }
    },
    /**
     * Save both tokens at once
     */
    async setTokens(accessToken, refreshToken) {
        try {
            await Promise.all([
                this.setAccessToken(accessToken),
                this.setRefreshToken(refreshToken),
            ]);
        }
        catch (error) {
            console.error('Error saving tokens:', error);
        }
    },
};
