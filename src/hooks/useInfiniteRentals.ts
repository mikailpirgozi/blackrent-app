import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { Rental } from '../types';
import { logger } from '../utils/smartLogger';

interface RentalFilters {
  search?: string;
  dateFilter?: string;
  dateFrom?: string;
  dateTo?: string;
  company?: string;
  status?: string;
  protocolStatus?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  vehicleBrand?: string;
  priceMin?: string;
  priceMax?: string;
}

interface UseInfiniteRentalsReturn {
  rentals: Rental[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  currentPage: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  loadMore: () => void;
  refresh: () => void;
  updateFilters: (filters: RentalFilters) => void;
}

const ITEMS_PER_PAGE = 50;

export function useInfiniteRentals(initialFilters: RentalFilters = {}): UseInfiniteRentalsReturn {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<RentalFilters>(initialFilters);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Prevent duplicate requests
  const loadingRef = useRef(false);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const loadRentals = useCallback(async (page: number, isNewSearch: boolean = false) => {
    if (loadingRef.current) {
      console.log('⏸️ Load already in progress, skipping...');
      return;
    }
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      logger.info(`🔄 Loading rentals - Page ${page}`, { filters: filtersRef.current });
      // 🚀 GMAIL APPROACH: Server-side search with pagination
      
      const result = await apiService.getRentalsPaginated({
        page,
        limit: ITEMS_PER_PAGE,
        search: searchTerm, // 🚀 GMAIL APPROACH: Server-side search
        ...filtersRef.current
      });

      const newRentals = result.rentals;
      
      // Validate response
      if (!result || !Array.isArray(newRentals)) {
        throw new Error('Invalid response format');
      }
      
      setRentals(prev => {
        // If new search, replace all. Otherwise append.
        const updatedRentals = isNewSearch ? newRentals : [...prev, ...newRentals];
        
        // Remove duplicates based on rental ID
        const uniqueRentals = Array.from(
          new Map(updatedRentals.map(rental => [rental.id, rental])).values()
        );
        
        return uniqueRentals;
      });
      
      setTotalCount(result.pagination.totalItems);
      setHasMore(result.pagination.hasMore);
      setCurrentPage(result.pagination.currentPage);
      
      logger.info(`✅ Loaded ${newRentals.length} rentals (${result.pagination.totalItems} total)`);
      // API response processed successfully
      
    } catch (err: any) {
      const errorMessage = err.message || 'Chyba pri načítavaní prenájmov';
      setError(errorMessage);
      logger.error('❌ Failed to load rentals', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
      if (initialLoad) {
        setInitialLoad(false);
      }
    }
  }, [initialLoad, searchTerm]); // 🚀 GMAIL APPROACH: Include searchTerm in dependencies

  const loadMore = useCallback(() => {
    if (!loading && hasMore && !initialLoad) {
      console.log(`📚 Load more triggered - Page ${currentPage + 1}, hasMore: ${hasMore}, loading: ${loading}`);
      loadRentals(currentPage + 1, false);
    } else {
      console.log(`⏸️ Load more skipped - loading: ${loading}, hasMore: ${hasMore}, initialLoad: ${initialLoad}`);
    }
  }, [loading, hasMore, currentPage, loadRentals, initialLoad]);

  const refresh = useCallback(() => {
    setRentals([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    loadRentals(1, true);
  }, [loadRentals]);

  const updateFilters = useCallback((newFilters: RentalFilters) => {
    logger.info('🔍 Updating filters', { newFilters });
    setFilters(newFilters);
    setRentals([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    // Load will be triggered by useEffect
  }, []);

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false);
      loadRentals(1, true);
    }
  }, []);

  // Filter changes
  useEffect(() => {
    if (!initialLoad) {
      // Debounce filter changes to avoid rapid re-fetching
      const timer = setTimeout(() => {
        loadRentals(1, true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [filters]); // Only depend on filters, not loadRentals to avoid infinite loop

  // Search term changes - trigger new search
  useEffect(() => {
    if (!initialLoad) {
      // Reset pagination and load new results
      setCurrentPage(1);
      setRentals([]);
      setHasMore(true);
      // Debounce search to avoid rapid API calls
      const timer = setTimeout(() => {
        loadRentals(1, true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]); // New search when search term changes

  // Debug logging
  useEffect(() => {
    logger.debug('📊 Infinite rentals state', {
      rentalsCount: rentals.length,
      totalCount,
      currentPage,
      hasMore,
      loading,
      error
    });
  }, [rentals.length, totalCount, currentPage, hasMore, loading, error]);

  return {
    rentals,
    loading,
    error,
    hasMore,
    totalCount,
    currentPage,
    searchTerm,
    setSearchTerm,
    loadMore,
    refresh,
    updateFilters
  };
}