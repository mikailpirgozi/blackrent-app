import { z } from 'zod';
export declare const UserRoleSchema: z.ZodEnum<["customer", "admin", "owner", "employee"]>;
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    role: z.ZodEnum<["customer", "admin", "owner", "employee"]>;
    avatar: z.ZodOptional<z.ZodString>;
    isEmailVerified: z.ZodBoolean;
    isPhoneVerified: z.ZodBoolean;
    preferences: z.ZodObject<{
        language: z.ZodDefault<z.ZodString>;
        currency: z.ZodDefault<z.ZodString>;
        notifications: z.ZodObject<{
            email: z.ZodDefault<z.ZodBoolean>;
            push: z.ZodDefault<z.ZodBoolean>;
            sms: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            email: boolean;
            push: boolean;
            sms: boolean;
        }, {
            email?: boolean | undefined;
            push?: boolean | undefined;
            sms?: boolean | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        language: string;
        currency: string;
        notifications: {
            email: boolean;
            push: boolean;
            sms: boolean;
        };
    }, {
        notifications: {
            email?: boolean | undefined;
            push?: boolean | undefined;
            sms?: boolean | undefined;
        };
        language?: string | undefined;
        currency?: string | undefined;
    }>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "customer" | "admin" | "owner" | "employee";
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    preferences: {
        language: string;
        currency: string;
        notifications: {
            email: boolean;
            push: boolean;
            sms: boolean;
        };
    };
    createdAt: string;
    updatedAt: string;
    phone?: string | undefined;
    avatar?: string | undefined;
}, {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "customer" | "admin" | "owner" | "employee";
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    preferences: {
        notifications: {
            email?: boolean | undefined;
            push?: boolean | undefined;
            sms?: boolean | undefined;
        };
        language?: string | undefined;
        currency?: string | undefined;
    };
    createdAt: string;
    updatedAt: string;
    phone?: string | undefined;
    avatar?: string | undefined;
}>;
export declare const LoginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const RegisterRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    acceptTerms: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
}, "strip", z.ZodTypeAny, {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    acceptTerms: boolean;
    phone?: string | undefined;
}, {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    acceptTerms: boolean;
    phone?: string | undefined;
}>;
export declare const AuthResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        role: z.ZodEnum<["customer", "admin", "owner", "employee"]>;
        avatar: z.ZodOptional<z.ZodString>;
        isEmailVerified: z.ZodBoolean;
        isPhoneVerified: z.ZodBoolean;
        preferences: z.ZodObject<{
            language: z.ZodDefault<z.ZodString>;
            currency: z.ZodDefault<z.ZodString>;
            notifications: z.ZodObject<{
                email: z.ZodDefault<z.ZodBoolean>;
                push: z.ZodDefault<z.ZodBoolean>;
                sms: z.ZodDefault<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                email: boolean;
                push: boolean;
                sms: boolean;
            }, {
                email?: boolean | undefined;
                push?: boolean | undefined;
                sms?: boolean | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            language: string;
            currency: string;
            notifications: {
                email: boolean;
                push: boolean;
                sms: boolean;
            };
        }, {
            notifications: {
                email?: boolean | undefined;
                push?: boolean | undefined;
                sms?: boolean | undefined;
            };
            language?: string | undefined;
            currency?: string | undefined;
        }>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: "customer" | "admin" | "owner" | "employee";
        isEmailVerified: boolean;
        isPhoneVerified: boolean;
        preferences: {
            language: string;
            currency: string;
            notifications: {
                email: boolean;
                push: boolean;
                sms: boolean;
            };
        };
        createdAt: string;
        updatedAt: string;
        phone?: string | undefined;
        avatar?: string | undefined;
    }, {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: "customer" | "admin" | "owner" | "employee";
        isEmailVerified: boolean;
        isPhoneVerified: boolean;
        preferences: {
            notifications: {
                email?: boolean | undefined;
                push?: boolean | undefined;
                sms?: boolean | undefined;
            };
            language?: string | undefined;
            currency?: string | undefined;
        };
        createdAt: string;
        updatedAt: string;
        phone?: string | undefined;
        avatar?: string | undefined;
    }>;
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
    expiresIn: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: "customer" | "admin" | "owner" | "employee";
        isEmailVerified: boolean;
        isPhoneVerified: boolean;
        preferences: {
            language: string;
            currency: string;
            notifications: {
                email: boolean;
                push: boolean;
                sms: boolean;
            };
        };
        createdAt: string;
        updatedAt: string;
        phone?: string | undefined;
        avatar?: string | undefined;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}, {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: "customer" | "admin" | "owner" | "employee";
        isEmailVerified: boolean;
        isPhoneVerified: boolean;
        preferences: {
            notifications: {
                email?: boolean | undefined;
                push?: boolean | undefined;
                sms?: boolean | undefined;
            };
            language?: string | undefined;
            currency?: string | undefined;
        };
        createdAt: string;
        updatedAt: string;
        phone?: string | undefined;
        avatar?: string | undefined;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}>;
export declare const RefreshTokenRequestSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type User = z.infer<typeof UserSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
