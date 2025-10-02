import { z } from 'zod';
// Vehicle types
export const VehicleTypeSchema = z.enum([
    'economy',
    'compact',
    'intermediate',
    'standard',
    'full_size',
    'premium',
    'luxury',
    'suv',
    'minivan',
    'convertible',
    'pickup',
    'electric',
]);
export const FuelTypeSchema = z.enum([
    'gasoline',
    'diesel',
    'hybrid',
    'electric',
    'lpg',
]);
export const TransmissionSchema = z.enum(['manual', 'automatic', 'cvt']);
export const VehicleSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    type: VehicleTypeSchema,
    brand: z.string(),
    model: z.string(),
    year: z
        .number()
        .min(2000)
        .max(new Date().getFullYear() + 1),
    fuelType: FuelTypeSchema,
    transmission: TransmissionSchema,
    seats: z.number().min(1).max(9),
    doors: z.number().min(2).max(5),
    engineSize: z.string().optional(),
    power: z.number().optional(), // HP
    consumption: z.number().optional(), // L/100km
    features: z.array(z.string()),
    images: z.array(z.string().url()),
    pricePerDay: z.number().positive(),
    pricePerKm: z.number().positive().optional(),
    deposit: z.number().positive(),
    available: z.boolean(),
    location: z.object({
        city: z.string(),
        address: z.string(),
        coordinates: z.object({
            lat: z.number(),
            lng: z.number(),
        }),
    }),
    company: z.object({
        id: z.string().uuid(),
        name: z.string(),
        rating: z.number().min(0).max(5),
        reviewsCount: z.number().min(0),
    }),
    rating: z.number().min(0).max(5).optional(),
    reviewsCount: z.number().min(0).optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
// Note: VehicleFilters type is defined in common.ts
