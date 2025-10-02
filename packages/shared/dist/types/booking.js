import { z } from 'zod';
// Booking status
export const BookingStatusSchema = z.enum([
    'pending_payment',
    'confirmed',
    'active',
    'completed',
    'cancelled',
    'failed',
]);
// Booking types
export const BookingSchema = z.object({
    id: z.string().uuid(),
    vehicleId: z.string().uuid(),
    userId: z.string().uuid(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    pickupLocation: z.object({
        address: z.string(),
        coordinates: z.object({
            lat: z.number(),
            lng: z.number(),
        }),
    }),
    dropoffLocation: z.object({
        address: z.string(),
        coordinates: z.object({
            lat: z.number(),
            lng: z.number(),
        }),
    }),
    status: BookingStatusSchema,
    totalPrice: z.number().positive(),
    priceBreakdown: z.object({
        basePrice: z.number().positive(),
        deliveryFee: z.number().min(0),
        extras: z.number().min(0),
        taxes: z.number().min(0),
        discount: z.number().min(0),
    }),
    extras: z.array(z.object({
        id: z.string(),
        name: z.string(),
        price: z.number().positive(),
        quantity: z.number().min(1),
    })),
    notes: z.string().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
// Booking quote request
export const BookingQuoteRequestSchema = z.object({
    vehicleId: z.string().uuid(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    pickupLocation: z.object({
        address: z.string(),
        coordinates: z.object({
            lat: z.number(),
            lng: z.number(),
        }),
    }),
    dropoffLocation: z.object({
        address: z.string(),
        coordinates: z.object({
            lat: z.number(),
            lng: z.number(),
        }),
    }),
    extras: z.array(z.string()).optional(),
});
// Booking quote response
export const BookingQuoteResponseSchema = z.object({
    quoteId: z.string().uuid(),
    totalPrice: z.number().positive(),
    priceBreakdown: z.object({
        basePrice: z.number().positive(),
        deliveryFee: z.number().min(0),
        extras: z.number().min(0),
        taxes: z.number().min(0),
        discount: z.number().min(0),
    }),
    validUntil: z.string().datetime(),
});
