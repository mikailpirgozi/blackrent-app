import type { LoginRequest, RegisterRequest, User } from '@blackrent/shared';
export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface RefreshTokenRequest {
    refreshToken: string;
}
export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}
export interface ForgotPasswordRequest {
    email: string;
}
export interface ResetPasswordRequest {
    token: string;
    password: string;
}
/**
 * Authentication API endpoints
 */
export declare const authApi: {
    /**
     * Login user with email and password
     */
    login: (credentials: LoginRequest) => Promise<AuthResponse>;
    /**
     * Register new user
     */
    register: (userData: RegisterRequest) => Promise<AuthResponse>;
    /**
     * Refresh access token
     */
    refreshToken: (refreshToken: string) => Promise<RefreshTokenResponse>;
    /**
     * Logout user
     */
    logout: () => Promise<void>;
    /**
     * Get current user profile
     */
    getProfile: () => Promise<User>;
    /**
     * Update user profile
     */
    updateProfile: (userData: Partial<User>) => Promise<User>;
    /**
     * Request password reset
     */
    forgotPassword: (email: string) => Promise<void>;
    /**
     * Reset password with token
     */
    resetPassword: (token: string, password: string) => Promise<void>;
};
//# sourceMappingURL=auth.d.ts.map