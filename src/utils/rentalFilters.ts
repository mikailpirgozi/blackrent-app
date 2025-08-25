/**
 * 🔍 RENTAL FILTERS UTILITIES
 * 
 * Optimalizované filter funkcie s memoization
 */

import { Rental } from '../types';
import { searchInTexts } from './textNormalization';

export interface FilterCriteria {
  searchQuery: string;
  status: string;
  paymentMethod: string;
  company: string;
  dateFrom: string;
  dateTo: string;
  priceMin: string;
  priceMax: string;
  protocolStatus: string;
  vehicleBrand: string;
  insuranceCompany: string;
  insuranceType: string;
  customerType: string;
  rentalLocation: string;
  vehicleCategory: string;
}

export interface VehicleLookup {
  [vehicleId: string]: {
    brand?: string;
    model?: string;
    licensePlate?: string;
    vin?: string; // 🆔 VIN číslo pre search
    company?: string;
    category?: string;
  };
}

export interface ProtocolLookup {
  [rentalId: string]: {
    handover?: any;
    return?: any;
  };
}

/**
 * 🚀 Optimalizovaná search filter funkcia
 */
export const applySearchFilter = (
  rentals: Rental[],
  query: string,
  vehicleLookup: VehicleLookup
): Rental[] => {
  if (!query.trim()) return rentals;
  
  return rentals.filter(rental => {
    const vehicle = vehicleLookup[rental.vehicleId || ''];
    
    // 🔤 DIACRITICS NORMALIZATION: Vyhľadávanie bez ohľadu na diakritiku
    return searchInTexts([
      rental.customerName,
      rental.customerPhone,
      rental.customerEmail,
      rental.vehicleVin,
      rental.notes,
      vehicle?.brand,
      vehicle?.model,
      vehicle?.licensePlate,
      vehicle?.vin,
      vehicle?.company
    ], query);
  });
};

/**
 * ⚡ Optimalizované status filter
 */
export const applyStatusFilter = (
  rentals: Rental[],
  status: string
): Rental[] => {
  if (status === 'all') return rentals;
  return rentals.filter(rental => rental.status === status);
};

/**
 * 💳 Payment method filter
 */
export const applyPaymentMethodFilter = (
  rentals: Rental[],
  paymentMethod: string
): Rental[] => {
  if (paymentMethod === 'all') return rentals;
  return rentals.filter(rental => rental.paymentMethod === paymentMethod);
};

/**
 * 🏢 Company filter
 */
export const applyCompanyFilter = (
  rentals: Rental[],
  company: string,
  vehicleLookup: VehicleLookup
): Rental[] => {
  if (company === 'all') return rentals;
  return rentals.filter(rental => {
    const vehicle = vehicleLookup[rental.vehicleId || ''];
    return vehicle?.company === company;
  });
};

/**
 * 📅 Date range filter
 */
export const applyDateRangeFilter = (
  rentals: Rental[],
  dateFrom: string,
  dateTo: string
): Rental[] => {
  let filtered = rentals;
  
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    filtered = filtered.filter(rental => new Date(rental.startDate) >= fromDate);
  }
  
  if (dateTo) {
    const toDate = new Date(dateTo);
    filtered = filtered.filter(rental => new Date(rental.endDate) <= toDate);
  }
  
  return filtered;
};

/**
 * 💰 Price range filter
 */
export const applyPriceRangeFilter = (
  rentals: Rental[],
  priceMin: string,
  priceMax: string
): Rental[] => {
  let filtered = rentals;
  
  if (priceMin) {
    const minPrice = parseFloat(priceMin);
    if (!isNaN(minPrice)) {
      filtered = filtered.filter(rental => rental.totalPrice >= minPrice);
    }
  }
  
  if (priceMax) {
    const maxPrice = parseFloat(priceMax);
    if (!isNaN(maxPrice)) {
      filtered = filtered.filter(rental => rental.totalPrice <= maxPrice);
    }
  }
  
  return filtered;
};

/**
 * 📄 Protocol status filter
 */
export const applyProtocolStatusFilter = (
  rentals: Rental[],
  protocolStatus: string,
  protocolLookup: ProtocolLookup
): Rental[] => {
  if (protocolStatus === 'all') return rentals;
  
  return rentals.filter(rental => {
    const rentalProtocols = protocolLookup[rental.id];
    if (!rentalProtocols) return protocolStatus === 'none';
    
    const hasHandover = !!rentalProtocols.handover;
    const hasReturn = !!rentalProtocols.return;
    
    switch (protocolStatus) {
      case 'none': 
        return !hasHandover && !hasReturn;
      case 'handover': 
        return hasHandover && !hasReturn;
      case 'return': 
        return !hasHandover && hasReturn;
      case 'both': 
        return hasHandover && hasReturn;
      case 'partial': 
        return hasHandover || hasReturn;
      default: 
        return true;
    }
  });
};

/**
 * 🚗 Vehicle brand filter
 */
export const applyVehicleBrandFilter = (
  rentals: Rental[],
  vehicleBrand: string,
  vehicleLookup: VehicleLookup
): Rental[] => {
  if (vehicleBrand === 'all') return rentals;
  return rentals.filter(rental => {
    const vehicle = vehicleLookup[rental.vehicleId || ''];
    return vehicle?.brand === vehicleBrand;
  });
};

/**
 * 🔗 Composite filter function - aplikuje všetky filtre naraz
 */
export const applyAllFilters = (
  rentals: Rental[],
  criteria: FilterCriteria,
  vehicleLookup: VehicleLookup,
  protocolLookup: ProtocolLookup
): Rental[] => {
  let filtered = rentals;
  
  // Aplikuj filtre v poradí podľa očakávanej selektivity (najselektívnejšie prvé)
  filtered = applySearchFilter(filtered, criteria.searchQuery, vehicleLookup);
  filtered = applyStatusFilter(filtered, criteria.status);
  filtered = applyCompanyFilter(filtered, criteria.company, vehicleLookup);
  filtered = applyDateRangeFilter(filtered, criteria.dateFrom, criteria.dateTo);
  filtered = applyPaymentMethodFilter(filtered, criteria.paymentMethod);
  filtered = applyPriceRangeFilter(filtered, criteria.priceMin, criteria.priceMax);
  filtered = applyProtocolStatusFilter(filtered, criteria.protocolStatus, protocolLookup);
  filtered = applyVehicleBrandFilter(filtered, criteria.vehicleBrand, vehicleLookup);
  
  return filtered;
};

/**
 * 📊 Get unique values for filter options
 */
export const getUniqueFilterValues = (rentals: Rental[], vehicleLookup: VehicleLookup) => {
  const statuses = new Set<string>();
  const companies = new Set<string>();
  const paymentMethods = new Set<string>();
  const vehicleBrands = new Set<string>();
  
  rentals.forEach(rental => {
    if (rental.status) statuses.add(rental.status);
    if (rental.paymentMethod) paymentMethods.add(rental.paymentMethod);
    
    const vehicle = vehicleLookup[rental.vehicleId || ''];
    if (vehicle?.company) companies.add(vehicle.company);
    if (vehicle?.brand) vehicleBrands.add(vehicle.brand);
  });
  
  return {
    statuses: Array.from(statuses).sort(),
    companies: Array.from(companies).sort(),
    paymentMethods: Array.from(paymentMethods).sort(),
    vehicleBrands: Array.from(vehicleBrands).sort(),
  };
};

/**
 * 🔍 Create vehicle lookup map for fast access
 */
export const createVehicleLookup = (vehicles: any[]): VehicleLookup => {
  const lookup: VehicleLookup = {};
  
  vehicles.forEach(vehicle => {
    if (vehicle.id) {
      lookup[vehicle.id] = {
        brand: vehicle.brand,
        model: vehicle.model,
        licensePlate: vehicle.licensePlate,
        company: vehicle.company,
        category: vehicle.category
      };
    }
  });
  
  return lookup;
};