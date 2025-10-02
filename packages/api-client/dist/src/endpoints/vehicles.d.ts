import type { VehicleFilters } from '@blackrent/shared';
import { PaginatedResponse, Vehicle } from '@blackrent/shared';
export interface VehicleListParams {
    page?: number;
    limit?: number;
    search?: string;
    filters?: VehicleFilters;
    sortBy?: 'price' | 'rating' | 'name' | 'newest';
    sortOrder?: 'asc' | 'desc';
}
export interface VehicleAvailabilityParams {
    vehicleId: string;
    startDate: string;
    endDate: string;
}
export interface VehicleAvailabilityResponse {
    available: boolean;
    price?: number;
    restrictions?: string[];
}
/**
 * Vehicle API endpoints
 */
export declare const vehiclesApi: {
    /**
     * Get list of vehicles with pagination and filters
     */
    getVehicles: (params?: VehicleListParams) => Promise<PaginatedResponse<Vehicle>>;
    /**
     * Get vehicle by ID
     */
    getVehicleById: (id: string) => Promise<Vehicle>;
    /**
     * Check vehicle availability for specific dates
     */
    checkAvailability: (params: VehicleAvailabilityParams) => Promise<VehicleAvailabilityResponse>;
    /**
     * Get vehicle reviews
     */
    getVehicleReviews: (vehicleId: string, page?: number, limit?: number) => Promise<any>;
    /**
     * Get featured vehicles
     */
    getFeaturedVehicles: (limit?: number) => Promise<Vehicle[]>;
    /**
     * Search vehicles by location
     */
    searchByLocation: (location: string, params?: VehicleListParams) => Promise<PaginatedResponse<Vehicle>>;
};
//# sourceMappingURL=vehicles.d.ts.map