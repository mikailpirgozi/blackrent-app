import { Booking, BookingQuoteRequest, LoginRequest, AuthResponse, PaginatedResponse, RegisterRequest, Vehicle } from '@blackrent/shared';
import { UseInfiniteQueryOptions, UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
import { BookingListParams } from './endpoints/booking';
import { VehicleAvailabilityParams, VehicleListParams } from './endpoints/vehicles';
export declare const queryKeys: {
    vehicles: readonly ["vehicles"];
    vehiclesList: (params: VehicleListParams) => readonly ["vehicles", "list", VehicleListParams];
    vehicleDetail: (id: string) => readonly ["vehicles", "detail", string];
    vehicleAvailability: (params: VehicleAvailabilityParams) => readonly ["vehicles", "availability", VehicleAvailabilityParams];
    vehicleReviews: (id: string, page: number) => readonly ["vehicles", "reviews", string, number];
    featuredVehicles: (limit: number) => readonly ["vehicles", "featured", number];
    auth: readonly ["auth"];
    profile: () => readonly ["auth", "profile"];
    bookings: readonly ["bookings"];
    userBookings: (params: BookingListParams) => readonly ["bookings", "user", BookingListParams];
    bookingDetail: (id: string) => readonly ["bookings", "detail", string];
};
/**
 * Hook to get paginated list of vehicles
 */
export declare const useVehicles: (params?: VehicleListParams, options?: UseQueryOptions<PaginatedResponse<Vehicle>>) => import("@tanstack/react-query").UseQueryResult<PaginatedResponse<{
    id: string;
    type: "economy" | "compact" | "intermediate" | "standard" | "full_size" | "premium" | "luxury" | "suv" | "minivan" | "convertible" | "pickup" | "electric";
    createdAt: string;
    updatedAt: string;
    name: string;
    fuelType: "electric" | "gasoline" | "diesel" | "hybrid" | "lpg";
    transmission: "manual" | "automatic" | "cvt";
    seats: number;
    location: {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
        city: string;
    };
    available: boolean;
    features: string[];
    brand: string;
    model: string;
    year: number;
    doors: number;
    images: string[];
    pricePerDay: number;
    deposit: number;
    company: {
        id: string;
        name: string;
        rating: number;
        reviewsCount: number;
    };
    engineSize?: string | undefined;
    power?: number | undefined;
    consumption?: number | undefined;
    pricePerKm?: number | undefined;
    rating?: number | undefined;
    reviewsCount?: number | undefined;
}>, Error>;
/**
 * Hook to get infinite list of vehicles (for infinite scrolling)
 */
export declare const useInfiniteVehicles: (params?: Omit<VehicleListParams, "page">, options?: UseInfiniteQueryOptions<PaginatedResponse<Vehicle>>) => import("@tanstack/react-query").UseInfiniteQueryResult<PaginatedResponse<{
    id: string;
    type: "economy" | "compact" | "intermediate" | "standard" | "full_size" | "premium" | "luxury" | "suv" | "minivan" | "convertible" | "pickup" | "electric";
    createdAt: string;
    updatedAt: string;
    name: string;
    fuelType: "electric" | "gasoline" | "diesel" | "hybrid" | "lpg";
    transmission: "manual" | "automatic" | "cvt";
    seats: number;
    location: {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
        city: string;
    };
    available: boolean;
    features: string[];
    brand: string;
    model: string;
    year: number;
    doors: number;
    images: string[];
    pricePerDay: number;
    deposit: number;
    company: {
        id: string;
        name: string;
        rating: number;
        reviewsCount: number;
    };
    engineSize?: string | undefined;
    power?: number | undefined;
    consumption?: number | undefined;
    pricePerKm?: number | undefined;
    rating?: number | undefined;
    reviewsCount?: number | undefined;
}>, Error>;
/**
 * Hook to get vehicle by ID
 */
export declare const useVehicle: (id: string, options?: UseQueryOptions<Vehicle>) => import("@tanstack/react-query").UseQueryResult<{
    id: string;
    type: "economy" | "compact" | "intermediate" | "standard" | "full_size" | "premium" | "luxury" | "suv" | "minivan" | "convertible" | "pickup" | "electric";
    createdAt: string;
    updatedAt: string;
    name: string;
    fuelType: "electric" | "gasoline" | "diesel" | "hybrid" | "lpg";
    transmission: "manual" | "automatic" | "cvt";
    seats: number;
    location: {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
        city: string;
    };
    available: boolean;
    features: string[];
    brand: string;
    model: string;
    year: number;
    doors: number;
    images: string[];
    pricePerDay: number;
    deposit: number;
    company: {
        id: string;
        name: string;
        rating: number;
        reviewsCount: number;
    };
    engineSize?: string | undefined;
    power?: number | undefined;
    consumption?: number | undefined;
    pricePerKm?: number | undefined;
    rating?: number | undefined;
    reviewsCount?: number | undefined;
}, Error>;
/**
 * Alias for useVehicle for consistency
 */
export declare const useVehicleById: (id: string, options?: UseQueryOptions<Vehicle>) => import("@tanstack/react-query").UseQueryResult<{
    id: string;
    type: "economy" | "compact" | "intermediate" | "standard" | "full_size" | "premium" | "luxury" | "suv" | "minivan" | "convertible" | "pickup" | "electric";
    createdAt: string;
    updatedAt: string;
    name: string;
    fuelType: "electric" | "gasoline" | "diesel" | "hybrid" | "lpg";
    transmission: "manual" | "automatic" | "cvt";
    seats: number;
    location: {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
        city: string;
    };
    available: boolean;
    features: string[];
    brand: string;
    model: string;
    year: number;
    doors: number;
    images: string[];
    pricePerDay: number;
    deposit: number;
    company: {
        id: string;
        name: string;
        rating: number;
        reviewsCount: number;
    };
    engineSize?: string | undefined;
    power?: number | undefined;
    consumption?: number | undefined;
    pricePerKm?: number | undefined;
    rating?: number | undefined;
    reviewsCount?: number | undefined;
}, Error>;
/**
 * Hook to check vehicle availability
 */
export declare const useVehicleAvailability: (params: VehicleAvailabilityParams, options?: UseQueryOptions<any>) => import("@tanstack/react-query").UseQueryResult<any, Error>;
/**
 * Hook to get vehicle reviews
 */
export declare const useVehicleReviews: (vehicleId: string, page?: number, limit?: number, options?: UseQueryOptions<any>) => import("@tanstack/react-query").UseQueryResult<any, Error>;
/**
 * Hook to get featured vehicles
 */
export declare const useFeaturedVehicles: (limit?: number, options?: UseQueryOptions<Vehicle[]>) => import("@tanstack/react-query").UseQueryResult<{
    id: string;
    type: "economy" | "compact" | "intermediate" | "standard" | "full_size" | "premium" | "luxury" | "suv" | "minivan" | "convertible" | "pickup" | "electric";
    createdAt: string;
    updatedAt: string;
    name: string;
    fuelType: "electric" | "gasoline" | "diesel" | "hybrid" | "lpg";
    transmission: "manual" | "automatic" | "cvt";
    seats: number;
    location: {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
        city: string;
    };
    available: boolean;
    features: string[];
    brand: string;
    model: string;
    year: number;
    doors: number;
    images: string[];
    pricePerDay: number;
    deposit: number;
    company: {
        id: string;
        name: string;
        rating: number;
        reviewsCount: number;
    };
    engineSize?: string | undefined;
    power?: number | undefined;
    consumption?: number | undefined;
    pricePerKm?: number | undefined;
    rating?: number | undefined;
    reviewsCount?: number | undefined;
}[], Error>;
/**
 * Hook for user login
 */
export declare const useLogin: (options?: UseMutationOptions<AuthResponse, Error, LoginRequest>) => import("@tanstack/react-query").UseMutationResult<{
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
}, Error, {
    email: string;
    password: string;
}, unknown>;
/**
 * Hook for user registration
 */
export declare const useRegister: (options?: UseMutationOptions<AuthResponse, Error, RegisterRequest>) => import("@tanstack/react-query").UseMutationResult<{
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
}, Error, {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    acceptTerms: boolean;
    phone?: string | undefined;
}, unknown>;
/**
 * Hook for user logout
 */
export declare const useLogout: (options?: UseMutationOptions<void, Error, void>) => import("@tanstack/react-query").UseMutationResult<void, Error, void, unknown>;
/**
 * Hook to get user profile
 */
export declare const useProfile: (options?: UseQueryOptions<any>) => import("@tanstack/react-query").UseQueryResult<any, Error>;
/**
 * Hook to get booking quote
 */
export declare const useBookingQuote: (options?: UseMutationOptions<any, Error, BookingQuoteRequest>) => import("@tanstack/react-query").UseMutationResult<any, Error, {
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
}, unknown>;
/**
 * Hook to create booking
 */
export declare const useCreateBooking: (options?: UseMutationOptions<Booking, Error, any>) => import("@tanstack/react-query").UseMutationResult<{
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
}, Error, any, unknown>;
/**
 * Hook to get user bookings
 */
export declare const useUserBookings: (params?: BookingListParams, options?: UseQueryOptions<Booking[]>) => import("@tanstack/react-query").UseQueryResult<{
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
}[], Error>;
/**
 * Hook to get booking by ID
 */
export declare const useBooking: (id: string, options?: UseQueryOptions<Booking>) => import("@tanstack/react-query").UseQueryResult<{
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
}, Error>;
/**
 * Hook to cancel booking
 */
export declare const useCancelBooking: (options?: UseMutationOptions<void, Error, {
    id: string;
    reason?: string;
}>) => import("@tanstack/react-query").UseMutationResult<void, Error, {
    id: string;
    reason?: string;
}, unknown>;
export declare const useBookings: (params?: BookingListParams, options?: UseQueryOptions<Booking[]>) => import("@tanstack/react-query").UseQueryResult<{
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
}[], Error>;
//# sourceMappingURL=hooks.d.ts.map