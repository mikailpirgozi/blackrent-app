/**
 * Vehicle Types
 * Synchronized with backend types
 */

export type VehicleCategory = 
  | 'nizka-trieda'
  | 'stredna-trieda'
  | 'vyssia-stredna'
  | 'luxusne'
  | 'sportove'
  | 'suv'
  | 'viacmiestne'
  | 'dodavky';

export type VehicleStatus =
  | 'available'
  | 'rented'
  | 'maintenance'
  | 'temporarily_removed'
  | 'removed'
  | 'stolen'
  | 'private';

export type TransmissionType = 'automatic' | 'manual';
export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid';

export interface PricingTier {
  id: string;
  minDays: number;
  maxDays: number;
  pricePerDay: number;
}

export interface Commission {
  type: 'percentage' | 'fixed';
  value: number;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year?: number;
  licensePlate: string;
  vin?: string;
  company?: string;
  category?: VehicleCategory;
  pricing: PricingTier[];
  commission: Commission;
  status: VehicleStatus;
  ownerCompanyId?: string;
  platformId?: string;
  assignedMechanicId?: string;
  stk?: Date | string;
  extraKilometerRate?: number;
  createdAt?: Date | string;
  
  // Additional fields for mobile app
  images?: string[];
  description?: string;
  features?: string[];
  seats?: number;
  doors?: number;
  transmission?: TransmissionType;
  fuelType?: FuelType;
  rating?: {
    average: number;
    count: number;
  };
  location?: {
    city: string;
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  availability?: {
    isAvailable: boolean;
    availableFrom?: string;
    availableUntil?: string;
  };
}

export interface VehicleFilters {
  category?: VehicleCategory[];
  brand?: string[];
  transmission?: TransmissionType[];
  fuelType?: FuelType[];
  priceMin?: number;
  priceMax?: number;
  seats?: number;
  status?: VehicleStatus[];
  features?: string[];
  location?: string;
}

export interface VehicleSearchParams {
  search?: string;
  filters?: VehicleFilters;
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'name_asc' | 'name_desc' | 'newest';
  page?: number;
  limit?: number;
}

export interface VehicleListResponse {
  vehicles: Vehicle[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasMore: boolean;
    itemsPerPage: number;
  };
}

/**
 * Calculate price per day for given rental duration
 */
export function calculatePriceForDuration(vehicle: Vehicle, days: number): number {
  // Find applicable pricing tier
  const tier = vehicle.pricing.find(
    (p) => days >= p.minDays && days <= p.maxDays
  );

  return tier ? tier.pricePerDay : vehicle.pricing[0]?.pricePerDay || 0;
}

/**
 * Get lowest price from pricing tiers
 */
export function getLowestPrice(vehicle: Vehicle): number {
  if (!vehicle.pricing || vehicle.pricing.length === 0) return 0;
  
  const prices = vehicle.pricing.map(p => p.pricePerDay);
  return Math.min(...prices);
}

/**
 * Get highest price from pricing tiers
 */
export function getHighestPrice(vehicle: Vehicle): number {
  if (!vehicle.pricing || vehicle.pricing.length === 0) return 0;
  
  const prices = vehicle.pricing.map(p => p.pricePerDay);
  return Math.max(...prices);
}

/**
 * Check if vehicle is available
 */
export function isVehicleAvailable(vehicle: Vehicle): boolean {
  return vehicle.status === 'available' && 
         (vehicle.availability?.isAvailable !== false);
}

/**
 * Get vehicle display name
 */
export function getVehicleDisplayName(vehicle: Vehicle): string {
  const parts = [vehicle.brand, vehicle.model];
  if (vehicle.year) {
    parts.push(vehicle.year.toString());
  }
  return parts.join(' ');
}



