import { z } from 'zod';
// Common types
export const PaginationSchema = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
    total: z.number().min(0),
    totalPages: z.number().min(0),
});
export const ApiResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: z.any().optional(),
    error: z.string().optional(),
});
export const ApiErrorSchema = z.object({
    success: z.literal(false),
    message: z.string(),
    error: z.string(),
    code: z.string().optional(),
    details: z.any().optional(),
});
// Location types
export const LocationSchema = z.object({
    address: z.string(),
    city: z.string(),
    country: z.string().default('Slovakia'),
    coordinates: z.object({
        lat: z.number(),
        lng: z.number(),
    }),
    postalCode: z.string().optional(),
});
// Filter types
export const VehicleFiltersSchema = z.object({
    type: z.array(z.string()).optional(),
    fuelType: z.array(z.string()).optional(),
    transmission: z.array(z.string()).optional(),
    seats: z.number().min(1).max(9).optional(),
    priceRange: z
        .object({
        min: z.number().min(0).optional(),
        max: z.number().min(0).optional(),
    })
        .optional(),
    location: z.string().optional(),
    available: z.boolean().optional(),
    features: z.array(z.string()).optional(),
});
// Sort types
export const SortOptionSchema = z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']),
});
