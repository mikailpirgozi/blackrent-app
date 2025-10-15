/**
 * Vehicle API Service
 * Handles all vehicle-related API calls with mock fallback
 */

import { get } from '../../config/api';
import type {
  Vehicle,
  VehicleSearchParams,
  VehicleListResponse,
} from '../../types/vehicle';
import { getMockVehicles, getMockVehicleById, getMockBrands } from '../mock-data';

// Feature flag for using mock data (enable in development if backend unavailable)
const USE_MOCK_DATA = process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true' || __DEV__;

/**
 * Get list of vehicles with pagination and filters
 */
export async function getVehicles(params?: VehicleSearchParams): Promise<VehicleListResponse> {
  try {
    const queryParams: Record<string, unknown> = {
      page: params?.page || 1,
      limit: params?.limit || 20,
    };

    if (params?.search) {
      queryParams.search = params.search;
    }

    if (params?.sort) {
      queryParams.sort = params.sort;
    }

    if (params?.filters) {
      const { filters } = params;
      
      if (filters.category && filters.category.length > 0) {
        queryParams.category = filters.category.join(',');
      }
      
      if (filters.brand && filters.brand.length > 0) {
        queryParams.brand = filters.brand.join(',');
      }
      
      if (filters.transmission && filters.transmission.length > 0) {
        queryParams.transmission = filters.transmission.join(',');
      }
      
      if (filters.fuelType && filters.fuelType.length > 0) {
        queryParams.fuelType = filters.fuelType.join(',');
      }
      
      if (filters.priceMin !== undefined) {
        queryParams.priceMin = filters.priceMin;
      }
      
      if (filters.priceMax !== undefined) {
        queryParams.priceMax = filters.priceMax;
      }
      
      if (filters.seats) {
        queryParams.seats = filters.seats;
      }
      
      if (filters.location) {
        queryParams.location = filters.location;
      }
    }

    const response = await get<{ vehicles: Vehicle[]; pagination: VehicleListResponse['pagination'] }>(
      '/public/vehicles',
      queryParams
    );

    return {
      vehicles: response.vehicles,
      pagination: response.pagination,
    };
  } catch (error) {
    // Fallback to mock data if API fails
    if (USE_MOCK_DATA) {
      console.log('📦 Using mock data (API unavailable)');
      
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const offset = (page - 1) * limit;
      
      const mockVehicles = getMockVehicles({
        category: params?.filters?.category?.[0],
        brand: params?.filters?.brand?.[0],
        search: params?.search,
        limit,
        offset,
      });
      
      return {
        vehicles: mockVehicles,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(8 / limit), // 8 mock vehicles total
          totalItems: 8,
          hasMore: offset + limit < 8,
          itemsPerPage: limit,
        },
      };
    }
    
    throw error;
  }
}

/**
 * Get single vehicle by ID
 */
export async function getVehicleById(id: string): Promise<Vehicle> {
  try {
    return await get<Vehicle>(`/public/vehicles/${id}`);
  } catch (error) {
    // Fallback to mock data
    if (USE_MOCK_DATA) {
      console.log('📦 Using mock vehicle data (API unavailable)');
      const mockVehicle = getMockVehicleById(id);
      if (mockVehicle) {
        return mockVehicle;
      }
    }
    throw error;
  }
}

/**
 * Get featured/recommended vehicles
 */
export async function getFeaturedVehicles(limit = 5): Promise<Vehicle[]> {
  try {
    const response = await get<{ vehicles: Vehicle[] }>('/public/vehicles/featured', {
      limit,
    });
    
    return response.vehicles;
  } catch (error) {
    // Fallback to mock data
    if (USE_MOCK_DATA) {
      console.log('📦 Using mock featured vehicles (API unavailable)');
      return getMockVehicles({ limit });
    }
    throw error;
  }
}

/**
 * Get available vehicle brands (for filters)
 */
export async function getVehicleBrands(): Promise<string[]> {
  try {
    return await get<string[]>('/public/vehicles/brands');
  } catch (error) {
    // Fallback to mock data
    if (USE_MOCK_DATA) {
      console.log('📦 Using mock brands (API unavailable)');
      return getMockBrands();
    }
    throw error;
  }
}

/**
 * Get available vehicle features (for filters)
 */
export async function getVehicleFeatures(): Promise<string[]> {
  return await get<string[]>('/public/vehicles/features');
}

/**
 * Check vehicle availability for date range
 */
export async function checkVehicleAvailability(
  vehicleId: string,
  startDate: string,
  endDate: string
): Promise<{
  available: boolean;
  conflicts?: Array<{ startDate: string; endDate: string; reason: string }>;
}> {
  return await get<{
    available: boolean;
    conflicts?: Array<{ startDate: string; endDate: string; reason: string }>;
  }>(`/public/vehicles/${vehicleId}/availability`, {
    startDate,
    endDate,
  });
}

/**
 * Get vehicle reviews
 */
export async function getVehicleReviews(
  vehicleId: string,
  page = 1,
  limit = 10
): Promise<{
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    userName: string;
    createdAt: string;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}> {
  return await get<{
    reviews: Array<{
      id: string;
      rating: number;
      comment: string;
      userName: string;
      createdAt: string;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  }>(`/public/vehicles/${vehicleId}/reviews`, {
    page,
    limit,
  });
}



