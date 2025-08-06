/**
 * 🪝 OPTIMIZED FILTERS HOOK
 * 
 * Hook pre optimalizované filtrovanie s memoization a debouncing
 */

import { useMemo, useCallback } from 'react';
import { 
  FilterCriteria, 
  VehicleLookup, 
  ProtocolLookup,
  applyAllFilters,
  createVehicleLookup,
  getUniqueFilterValues
} from '../utils/rentalFilters';
import { Rental } from '../types';
import { debounce } from '../utils/debounce';

interface UseOptimizedFiltersProps {
  rentals: Rental[];
  vehicles: any[];
  protocols: ProtocolLookup;
  filterCriteria: FilterCriteria;
}

export const useOptimizedFilters = ({
  rentals,
  vehicles,
  protocols,
  filterCriteria
}: UseOptimizedFiltersProps) => {
  
  // Memoized vehicle lookup pre rýchly prístup
  const vehicleLookup: VehicleLookup = useMemo(() => {
    return createVehicleLookup(vehicles);
  }, [vehicles]);
  
  // Memoized unique values pre filter options
  const filterOptions = useMemo(() => {
    return getUniqueFilterValues(rentals, vehicleLookup);
  }, [rentals, vehicleLookup]);
  
  // Memoized filtered rentals
  const filteredRentals = useMemo(() => {
    if (!rentals || rentals.length === 0) return [];
    
    console.time('🔍 Filter rentals');
    const result = applyAllFilters(rentals, filterCriteria, vehicleLookup, protocols);
    console.timeEnd('🔍 Filter rentals');
    
    return result;
  }, [rentals, filterCriteria, vehicleLookup, protocols]);
  
  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchQuery: string, callback: (query: string) => void) => {
      callback(searchQuery);
    }, 300),
    []
  );
  
  // Helper function pre count stats
  const getFilterStats = useCallback(() => {
    return {
      total: rentals.length,
      filtered: filteredRentals.length,
      hasFilters: Object.values(filterCriteria).some(value => 
        value !== 'all' && value !== '' && value !== null
      )
    };
  }, [rentals.length, filteredRentals.length, filterCriteria]);
  
  // Optimalizované sorting
  const sortedAndFilteredRentals = useMemo(() => {
    // Môžme pridať default sorting ak potrebujeme
    return filteredRentals.sort((a, b) => {
      // Sort by creation date (newest first)
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [filteredRentals]);
  
  // Performance measurement
  const measureFilterPerformance = useCallback(() => {
    const start = performance.now();
    const result = applyAllFilters(rentals, filterCriteria, vehicleLookup, protocols);
    const end = performance.now();
    
    console.log(`🏃‍♂️ Filter performance: ${end - start}ms for ${rentals.length} rentals → ${result.length} results`);
    
    return {
      duration: end - start,
      inputCount: rentals.length,
      outputCount: result.length,
      efficiency: ((rentals.length - result.length) / rentals.length * 100).toFixed(1) + '%'
    };
  }, [rentals, filterCriteria, vehicleLookup, protocols]);
  
  return {
    // Filtered data
    filteredRentals: sortedAndFilteredRentals,
    vehicleLookup,
    
    // Filter options
    filterOptions,
    
    // Stats
    stats: getFilterStats(),
    
    // Utilities
    debouncedSearch,
    measureFilterPerformance,
  };
};