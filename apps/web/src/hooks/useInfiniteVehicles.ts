import { useCallback, useEffect, useRef, useState } from 'react';

import { apiService } from '../services/api';
import type { Vehicle } from '../types';
import { logger } from '../utils/smartLogger';

interface VehicleFilters {
  search?: string;
  company?: string;
  brand?: string;
  category?: string;
  status?: string;
  yearMin?: string;
  yearMax?: string;
  priceMin?: string;
  priceMax?: string;
}

interface UseInfiniteVehiclesReturn {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  currentPage: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  loadMore: () => void;
  refresh: () => void;
  updateFilters: (filters: VehicleFilters) => void;
}

const ITEMS_PER_PAGE = 50;

export function useInfiniteVehicles(
  initialFilters: VehicleFilters = {}
): UseInfiniteVehiclesReturn {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<VehicleFilters>(initialFilters);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Prevent duplicate requests
  const loadingRef = useRef(false);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const loadVehicles = useCallback(
    async (page: number, isNewSearch: boolean = false) => {
      if (loadingRef.current) {
        console.log('⏸️ Load already in progress, skipping...');
        return;
      }

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        logger.info(`🔄 Loading vehicles - Page ${page}`, {
          filters: filtersRef.current,
        });

        const result = await apiService.getVehiclesPaginated({
          page,
          limit: ITEMS_PER_PAGE,
          search: searchTerm,
          ...filtersRef.current,
        });

        const newVehicles = result.data;

        // Validate response
        if (!result || !Array.isArray(newVehicles)) {
          throw new Error('Invalid response format');
        }

        setVehicles(prev => {
          // If new search, replace all. Otherwise append.
          const updatedVehicles = isNewSearch
            ? newVehicles
            : [...prev, ...newVehicles];

          // Remove duplicates based on vehicle ID
          const uniqueVehicles = Array.from(
            new Map(
              updatedVehicles.map(vehicle => [vehicle.id, vehicle])
            ).values()
          );

          return uniqueVehicles;
        });

        setTotalCount(result.total);
        setHasMore(result.page * result.limit < result.total);
        setCurrentPage(result.page);

        logger.info(
          `✅ Loaded ${newVehicles.length} vehicles (${result.total} total)`
        );
      } catch (error: unknown) {
        const errorMessage =
          (error as Error).message || 'Chyba pri načítavaní vozidiel';
        setError(errorMessage);
        logger.error('❌ Failed to load vehicles', error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
        if (initialLoad) {
          setInitialLoad(false);
        }
      }
    },
    [initialLoad, searchTerm]
  );

  const loadMore = useCallback(() => {
    if (!loading && hasMore && !initialLoad) {
      console.log(
        `📚 Load more triggered - Page ${currentPage + 1}, hasMore: ${hasMore}, loading: ${loading}`
      );
      loadVehicles(currentPage + 1, false);
    } else {
      console.log(
        `⏸️ Load more skipped - loading: ${loading}, hasMore: ${hasMore}, initialLoad: ${initialLoad}`
      );
    }
  }, [loading, hasMore, currentPage, loadVehicles, initialLoad]);

  const refresh = useCallback(() => {
    setVehicles([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    loadVehicles(1, true);
  }, [loadVehicles]);

  const updateFilters = useCallback((newFilters: VehicleFilters) => {
    logger.info('🔍 Updating vehicle filters', { newFilters });
    setFilters(newFilters);
    setVehicles([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    // Load will be triggered by useEffect
  }, []);

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false);
      loadVehicles(1, true);
    }
  }, [initialLoad, loadVehicles]);

  // Filter changes
  useEffect(() => {
    if (!initialLoad) {
      // Debounce filter changes to avoid rapid re-fetching
      const timer = setTimeout(() => {
        loadVehicles(1, true);
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [filters, initialLoad, loadVehicles]);

  // Search term changes - trigger new search
  useEffect(() => {
    if (!initialLoad) {
      // Reset pagination and load new results
      setCurrentPage(1);
      setVehicles([]);
      setHasMore(true);
      // Debounce search to avoid rapid API calls
      const timer = setTimeout(() => {
        loadVehicles(1, true);
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [searchTerm, initialLoad, loadVehicles]);

  // Debug logging
  useEffect(() => {
    logger.debug('📊 Infinite vehicles state', {
      vehiclesCount: vehicles.length,
      totalCount,
      currentPage,
      hasMore,
      loading,
      error,
    });
  }, [vehicles.length, totalCount, currentPage, hasMore, loading, error]);

  return {
    vehicles,
    loading,
    error,
    hasMore,
    totalCount,
    currentPage,
    searchTerm,
    setSearchTerm,
    loadMore,
    refresh,
    updateFilters,
  };
}
