/**
 * Helper functions for managing auth tokens securely
 */
export declare const authStorage: {
    /**
     * Save access token to secure storage
     */
    setAccessToken(token: string): Promise<void>;
    /**
     * Get access token from secure storage
     */
    getAccessToken(): Promise<string | null>;
    /**
     * Save refresh token to secure storage
     */
    setRefreshToken(token: string): Promise<void>;
    /**
     * Get refresh token from secure storage
     */
    getRefreshToken(): Promise<string | null>;
    /**
     * Remove all auth tokens from secure storage
     */
    clearTokens(): Promise<void>;
    /**
     * Save both tokens at once
     */
    setTokens(accessToken: string, refreshToken: string): Promise<void>;
};
//# sourceMappingURL=auth-storage.d.ts.map