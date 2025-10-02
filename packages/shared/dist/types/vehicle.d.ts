import { z } from 'zod';
export declare const VehicleTypeSchema: z.ZodEnum<["economy", "compact", "intermediate", "standard", "full_size", "premium", "luxury", "suv", "minivan", "convertible", "pickup", "electric"]>;
export declare const FuelTypeSchema: z.ZodEnum<["gasoline", "diesel", "hybrid", "electric", "lpg"]>;
export declare const TransmissionSchema: z.ZodEnum<["manual", "automatic", "cvt"]>;
export declare const VehicleSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["economy", "compact", "intermediate", "standard", "full_size", "premium", "luxury", "suv", "minivan", "convertible", "pickup", "electric"]>;
    brand: z.ZodString;
    model: z.ZodString;
    year: z.ZodNumber;
    fuelType: z.ZodEnum<["gasoline", "diesel", "hybrid", "electric", "lpg"]>;
    transmission: z.ZodEnum<["manual", "automatic", "cvt"]>;
    seats: z.ZodNumber;
    doors: z.ZodNumber;
    engineSize: z.ZodOptional<z.ZodString>;
    power: z.ZodOptional<z.ZodNumber>;
    consumption: z.ZodOptional<z.ZodNumber>;
    features: z.ZodArray<z.ZodString, "many">;
    images: z.ZodArray<z.ZodString, "many">;
    pricePerDay: z.ZodNumber;
    pricePerKm: z.ZodOptional<z.ZodNumber>;
    deposit: z.ZodNumber;
    available: z.ZodBoolean;
    location: z.ZodObject<{
        city: z.ZodString;
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
        city: string;
    }, {
        address: string;
        coordinates: {
            lat: number;
            lng: number;
        };
        city: string;
    }>;
    company: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        rating: z.ZodNumber;
        reviewsCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        rating: number;
        reviewsCount: number;
    }, {
        id: string;
        name: string;
        rating: number;
        reviewsCount: number;
    }>;
    rating: z.ZodOptional<z.ZodNumber>;
    reviewsCount: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
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
}, {
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
}>;
export type VehicleType = z.infer<typeof VehicleTypeSchema>;
export type FuelType = z.infer<typeof FuelTypeSchema>;
export type Transmission = z.infer<typeof TransmissionSchema>;
export type Vehicle = z.infer<typeof VehicleSchema>;
