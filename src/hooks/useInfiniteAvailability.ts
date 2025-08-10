import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { apiService } from '../services/api';
import { Vehicle } from '../types';
import { logger } from '../utils/smartLogger';
import { format, addDays } from 'date-fns';

interface AvailabilityFilters {
  dateFrom?: string;
  dateTo?: string;
  categories?: string[];
  brands?: string[];
  companies?: string[];
  locations?: string[];
  availableOnly?: boolean;
  minAvailabilityPercent?: number;
}

interface VehicleAvailability {
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  brand: string;
  model: string;
  category: string;
  company: string;
  location?: string;
  dailyStatus: Array<{
    date: string;
    status: 'available' | 'rented' | 'maintenance' | 'service' | 'blocked';
    reason?: string;
    customerName?: string;
    rentalId?: string;
  }>;
  availableDays: number;
  totalDays: number;
  availabilityPercent: number;
}

interface UseInfiniteAvailabilityReturn {
  vehicles: VehicleAvailability[];
  loading: boolean;
  error: string | null;
  hasMoreVehicles: boolean;
  hasMoreDays: boolean;
  totalVehicles: number;
  currentVehiclePage: number;
  dateRange: { from: string; to: string };
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  loadMoreVehicles: () => void;
  loadMoreDays: () => void;
  refresh: () => void;
  updateFilters: (filters: AvailabilityFilters) => void;
}

const VEHICLES_PER_PAGE = 20;
const DAYS_PER_LOAD = 14; // Load 2 weeks at a time
const MAX_DAYS = 90; // Maximum 3 months

export function useInfiniteAvailability(initialFilters: AvailabilityFilters = {}): UseInfiniteAvailabilityReturn {
  // State for vehicles and availability data
  const [vehicles, setVehicles] = useState<VehicleAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreVehicles, setHasMoreVehicles] = useState(true);
  const [hasMoreDays, setHasMoreDays] = useState(true);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [currentVehiclePage, setCurrentVehiclePage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date range state
  const today = format(new Date(), 'yyyy-MM-dd');
  const initialDateTo = format(addDays(new Date(), DAYS_PER_LOAD), 'yyyy-MM-dd');
  const [dateRange, setDateRange] = useState({
    from: initialFilters.dateFrom || today,
    to: initialFilters.dateTo || initialDateTo
  });
  
  // Filters state
  const [filters, setFilters] = useState<AvailabilityFilters>(initialFilters);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Prevent duplicate requests
  const loadingRef = useRef(false);
  const vehicleIdsRef = useRef(new Set<string>());

  /**
   * Load availability data from the server
   */
  const loadAvailability = useCallback(async (
    vehiclePage: number, 
    appendVehicles: boolean = false,
    extendDays: boolean = false
  ) => {
    if (loadingRef.current) {
      console.log('⏸️ Load already in progress, skipping...');
      return;
    }
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      logger.info(`🔄 Loading availability - Page ${vehiclePage}`, { 
        dateRange, 
        filters,
        appendVehicles,
        extendDays 
      });
      
      // Calculate date range for request
      let requestDateRange = { ...dateRange };
      if (extendDays) {
        const currentDays = Math.ceil(
          (new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (currentDays < MAX_DAYS) {
          const newEndDate = format(
            addDays(new Date(dateRange.to), DAYS_PER_LOAD), 
            'yyyy-MM-dd'
          );
          requestDateRange.to = newEndDate;
          setDateRange(prev => ({ ...prev, to: newEndDate }));
        } else {
          setHasMoreDays(false);
        }
      }
      
      // 🚀 Server-side paginated availability request
      const result = await apiService.getAvailabilityPaginated({
        vehiclePage,
        vehicleLimit: VEHICLES_PER_PAGE,
        dateFrom: requestDateRange.from,
        dateTo: requestDateRange.to,
        search: searchTerm,
        ...filters
      });

      const newVehicles = result.vehicles;
      
      // Process and merge vehicle availability data
      setVehicles(prev => {
        if (appendVehicles) {
          // Append new vehicles, avoiding duplicates
          const merged = [...prev];
          newVehicles.forEach(newVehicle => {
            if (!vehicleIdsRef.current.has(newVehicle.vehicleId)) {
              vehicleIdsRef.current.add(newVehicle.vehicleId);
              merged.push(newVehicle);
            }
          });
          return merged;
        } else if (extendDays && prev.length > 0) {
          // Extend days for existing vehicles
          return prev.map(existingVehicle => {
            const updatedVehicle = newVehicles.find(
              v => v.vehicleId === existingVehicle.vehicleId
            );
            
            if (updatedVehicle) {
              // Merge daily status, avoiding duplicates
              const existingDates = new Set(
                existingVehicle.dailyStatus.map((d: any) => d.date)
              );
              
              const newDays = updatedVehicle.dailyStatus.filter(
                (d: any) => !existingDates.has(d.date)
              );
              
              return {
                ...existingVehicle,
                dailyStatus: [...existingVehicle.dailyStatus, ...newDays],
                totalDays: existingVehicle.dailyStatus.length + newDays.length,
                availableDays: existingVehicle.availableDays + 
                  newDays.filter((d: any) => d.status === 'available').length,
                availabilityPercent: Math.round(
                  ((existingVehicle.availableDays + 
                    newDays.filter((d: any) => d.status === 'available').length) / 
                   (existingVehicle.dailyStatus.length + newDays.length)) * 100
                )
              };
            }
            
            return existingVehicle;
          });
        } else {
          // Replace all vehicles (new search)
          vehicleIdsRef.current.clear();
          newVehicles.forEach(v => vehicleIdsRef.current.add(v.vehicleId));
          return newVehicles;
        }
      });
      
      setTotalVehicles(result.pagination.totalVehicles);
      setHasMoreVehicles(result.pagination.hasMoreVehicles);
      setCurrentVehiclePage(result.pagination.currentVehiclePage);
      
      // Check if we can load more days
      const currentDays = Math.ceil(
        (new Date(requestDateRange.to).getTime() - new Date(requestDateRange.from).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      setHasMoreDays(currentDays < MAX_DAYS);
      
      logger.info(`✅ Loaded ${newVehicles.length} vehicles (${result.pagination.totalVehicles} total)`);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Chyba pri načítavaní dostupnosti';
      setError(errorMessage);
      logger.error('❌ Failed to load availability', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
      if (initialLoad) {
        setInitialLoad(false);
      }
    }
  }, [dateRange, filters, searchTerm, initialLoad]);

  /**
   * Load more vehicles (vertical pagination)
   */
  const loadMoreVehicles = useCallback(() => {
    if (!loading && hasMoreVehicles && !initialLoad) {
      console.log(`📚 Load more vehicles - Page ${currentVehiclePage + 1}`);
      loadAvailability(currentVehiclePage + 1, true, false);
    }
  }, [loading, hasMoreVehicles, currentVehiclePage, loadAvailability, initialLoad]);

  /**
   * Load more days (horizontal pagination)
   */
  const loadMoreDays = useCallback(() => {
    if (!loading && hasMoreDays && !initialLoad) {
      console.log(`📅 Load more days`);
      loadAvailability(currentVehiclePage, false, true);
    }
  }, [loading, hasMoreDays, currentVehiclePage, loadAvailability, initialLoad]);

  /**
   * Refresh all data
   */
  const refresh = useCallback(() => {
    vehicleIdsRef.current.clear();
    setVehicles([]);
    setCurrentVehiclePage(1);
    setHasMoreVehicles(true);
    setHasMoreDays(true);
    setError(null);
    
    // Reset date range to initial
    const newDateRange = {
      from: filters.dateFrom || today,
      to: filters.dateTo || format(addDays(new Date(), DAYS_PER_LOAD), 'yyyy-MM-dd')
    };
    setDateRange(newDateRange);
    
    loadAvailability(1, false, false);
  }, [loadAvailability, filters, today]);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters: AvailabilityFilters) => {
    logger.info('🔍 Updating availability filters', { newFilters });
    setFilters(newFilters);
    vehicleIdsRef.current.clear();
    setVehicles([]);
    setCurrentVehiclePage(1);
    setHasMoreVehicles(true);
    setHasMoreDays(true);
    setError(null);
    
    // Update date range if provided in filters
    if (newFilters.dateFrom || newFilters.dateTo) {
      setDateRange({
        from: newFilters.dateFrom || dateRange.from,
        to: newFilters.dateTo || dateRange.to
      });
    }
  }, [dateRange]);

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false);
      loadAvailability(1, false, false);
    }
  }, []);

  // Filter or search changes
  useEffect(() => {
    if (!initialLoad) {
      const timer = setTimeout(() => {
        vehicleIdsRef.current.clear();
        setVehicles([]);
        setCurrentVehiclePage(1);
        setHasMoreVehicles(true);
        loadAvailability(1, false, false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [filters, searchTerm]);

  // Debug logging
  useEffect(() => {
    logger.debug('📊 Infinite availability state', {
      vehiclesCount: vehicles.length,
      totalVehicles,
      currentVehiclePage,
      hasMoreVehicles,
      hasMoreDays,
      dateRange,
      loading,
      error
    });
  }, [vehicles.length, totalVehicles, currentVehiclePage, hasMoreVehicles, hasMoreDays, dateRange, loading, error]);

  return {
    vehicles,
    loading,
    error,
    hasMoreVehicles,
    hasMoreDays,
    totalVehicles,
    currentVehiclePage,
    dateRange,
    searchTerm,
    setSearchTerm,
    loadMoreVehicles,
    loadMoreDays,
    refresh,
    updateFilters
  };
}