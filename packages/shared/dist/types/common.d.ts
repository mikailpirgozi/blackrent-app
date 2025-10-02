import { z } from 'zod';
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    total: z.ZodNumber;
    totalPages: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}, {
    total: number;
    totalPages: number;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export declare const ApiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodOptional<z.ZodString>;
    data: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    message?: string | undefined;
    data?: any;
    error?: string | undefined;
}, {
    success: boolean;
    message?: string | undefined;
    data?: any;
    error?: string | undefined;
}>;
export declare const ApiErrorSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    message: z.ZodString;
    error: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
    details: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: false;
    error: string;
    code?: string | undefined;
    details?: any;
}, {
    message: string;
    success: false;
    error: string;
    code?: string | undefined;
    details?: any;
}>;
export declare const LocationSchema: z.ZodObject<{
    address: z.ZodString;
    city: z.ZodString;
    country: z.ZodDefault<z.ZodString>;
    coordinates: z.ZodObject<{
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lng: number;
    }, {
        lat: number;
        lng: number;
    }>;
    postalCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    address: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    city: string;
    country: string;
    postalCode?: string | undefined;
}, {
    address: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    city: string;
    country?: string | undefined;
    postalCode?: string | undefined;
}>;
export declare const VehicleFiltersSchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    fuelType: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    transmission: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    seats: z.ZodOptional<z.ZodNumber>;
    priceRange: z.ZodOptional<z.ZodObject<{
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        min?: number | undefined;
        max?: number | undefined;
    }, {
        min?: number | undefined;
        max?: number | undefined;
    }>>;
    location: z.ZodOptional<z.ZodString>;
    available: z.ZodOptional<z.ZodBoolean>;
    features: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type?: string[] | undefined;
    fuelType?: string[] | undefined;
    transmission?: string[] | undefined;
    seats?: number | undefined;
    priceRange?: {
        min?: number | undefined;
        max?: number | undefined;
    } | undefined;
    location?: string | undefined;
    available?: boolean | undefined;
    features?: string[] | undefined;
}, {
    type?: string[] | undefined;
    fuelType?: string[] | undefined;
    transmission?: string[] | undefined;
    seats?: number | undefined;
    priceRange?: {
        min?: number | undefined;
        max?: number | undefined;
    } | undefined;
    location?: string | undefined;
    available?: boolean | undefined;
    features?: string[] | undefined;
}>;
export declare const SortOptionSchema: z.ZodObject<{
    field: z.ZodString;
    direction: z.ZodEnum<["asc", "desc"]>;
}, "strip", z.ZodTypeAny, {
    field: string;
    direction: "asc" | "desc";
}, {
    field: string;
    direction: "asc" | "desc";
}>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ApiResponse<T = any> = z.infer<typeof ApiResponseSchema> & {
    data?: T;
};
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type VehicleFilters = z.infer<typeof VehicleFiltersSchema>;
export type SortOption = z.infer<typeof SortOptionSchema>;
export interface PaginatedResponse<T> {
    data: T[];
    pagination: Pagination;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
}
