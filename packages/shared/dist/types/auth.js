import { z } from 'zod';
// User types
export const UserRoleSchema = z.enum([
    'customer',
    'admin',
    'owner',
    'employee',
]);
export const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string().optional(),
    role: UserRoleSchema,
    avatar: z.string().url().optional(),
    isEmailVerified: z.boolean(),
    isPhoneVerified: z.boolean(),
    preferences: z.object({
        language: z.string().default('sk'),
        currency: z.string().default('EUR'),
        notifications: z.object({
            email: z.boolean().default(true),
            push: z.boolean().default(true),
            sms: z.boolean().default(false),
        }),
    }),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
// Auth types
export const LoginRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
export const RegisterRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),
    acceptTerms: z.boolean().refine(val => val === true, {
        message: 'You must accept the terms and conditions',
    }),
});
export const AuthResponseSchema = z.object({
    user: UserSchema,
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number(),
});
export const RefreshTokenRequestSchema = z.object({
    refreshToken: z.string(),
});
