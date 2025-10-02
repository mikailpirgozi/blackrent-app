import { z } from 'zod';
export declare const BookingStatusSchema: z.ZodEnum<["pending_payment", "confirmed", "active", "completed", "cancelled", "failed"]>;
export declare const BookingSchema: z.ZodObject<{
    id: z.ZodString;
    vehicleId: z.ZodString;
    userId: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
    pickupLocation: z.ZodObject<{
        address: z.ZodString;
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
    }, "strip", z.ZodTypeAny, {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    }, {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    }>;
    dropoffLocation: z.ZodObject<{
        address: z.ZodString;
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
    }, "strip", z.ZodTypeAny, {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    }, {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    }>;
    status: z.ZodEnum<["pending_payment", "confirmed", "active", "completed", "cancelled", "failed"]>;
    totalPrice: z.ZodNumber;
    priceBreakdown: z.ZodObject<{
        basePrice: z.ZodNumber;
        deliveryFee: z.ZodNumber;
        extras: z.ZodNumber;
        taxes: z.ZodNumber;
        discount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        basePrice: number;
        deliveryFee: number;
        extras: number;
        taxes: number;
        discount: number;
    }, {
        basePrice: number;
        deliveryFee: number;
        extras: number;
        taxes: number;
        discount: number;
    }>;
    extras: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        price: z.ZodNumber;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        price: number;
        quantity: number;
    }, {
        id: string;
        name: string;
        price: number;
        quantity: number;
    }>, "many">;
    notes: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "pending_payment" | "confirmed" | "active" | "completed" | "cancelled" | "failed";
    createdAt: string;
    updatedAt: string;
    vehicleId: string;
    userId: string;
    startDate: string;
    endDate: string;
    pickupLocation: {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    dropoffLocation: {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    totalPrice: number;
    priceBreakdown: {
        basePrice: number;
        deliveryFee: number;
        extras: number;
        taxes: number;
        discount: number;
    };
    extras: {
        id: string;
        name: string;
        price: number;
        quantity: number;
    }[];
    notes?: string | undefined;
}, {
    id: string;
    status: "pending_payment" | "confirmed" | "active" | "completed" | "cancelled" | "failed";
    createdAt: string;
    updatedAt: string;
    vehicleId: string;
    userId: string;
    startDate: string;
    endDate: string;
    pickupLocation: {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    dropoffLocation: {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    totalPrice: number;
    priceBreakdown: {
        basePrice: number;
        deliveryFee: number;
        extras: number;
        taxes: number;
        discount: number;
    };
    extras: {
        id: string;
        name: string;
        price: number;
        quantity: number;
    }[];
    notes?: string | undefined;
}>;
export declare const BookingQuoteRequestSchema: z.ZodObject<{
    vehicleId: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
    pickupLocation: z.ZodObject<{
        address: z.ZodString;
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
    }, "strip", z.ZodTypeAny, {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    }, {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    }>;
    dropoffLocation: z.ZodObject<{
        address: z.ZodString;
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
    }, "strip", z.ZodTypeAny, {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    }, {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    }>;
    extras: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    vehicleId: string;
    startDate: string;
    endDate: string;
    pickupLocation: {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    dropoffLocation: {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    extras?: string[] | undefined;
}, {
    vehicleId: string;
    startDate: string;
    endDate: string;
    pickupLocation: {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    dropoffLocation: {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    extras?: string[] | undefined;
}>;
export declare const BookingQuoteResponseSchema: z.ZodObject<{
    quoteId: z.ZodString;
    totalPrice: z.ZodNumber;
    priceBreakdown: z.ZodObject<{
        basePrice: z.ZodNumber;
        deliveryFee: z.ZodNumber;
        extras: z.ZodNumber;
        taxes: z.ZodNumber;
        discount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        basePrice: number;
        deliveryFee: number;
        extras: number;
        taxes: number;
        discount: number;
    }, {
        basePrice: number;
        deliveryFee: number;
        extras: number;
        taxes: number;
        discount: number;
    }>;
    validUntil: z.ZodString;
}, "strip", z.ZodTypeAny, {
    totalPrice: number;
    priceBreakdown: {
        basePrice: number;
        deliveryFee: number;
        extras: number;
        taxes: number;
        discount: number;
    };
    quoteId: string;
    validUntil: string;
}, {
    totalPrice: number;
    priceBreakdown: {
        basePrice: number;
        deliveryFee: number;
        extras: number;
        taxes: number;
        discount: number;
    };
    quoteId: string;
    validUntil: string;
}>;
export type BookingStatus = z.infer<typeof BookingStatusSchema>;
export type Booking = z.infer<typeof BookingSchema>;
export type BookingQuoteRequest = z.infer<typeof BookingQuoteRequestSchema>;
export type BookingQuoteResponse = z.infer<typeof BookingQuoteResponseSchema>;
