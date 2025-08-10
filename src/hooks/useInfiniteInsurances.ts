import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { Insurance } from '../types';
import { logger } from '../utils/smartLogger';

interface InsuranceFilters {
  search?: string;
  type?: string;
  insurerId?: string;
  vehicleId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface UseInfiniteInsurancesReturn {
  insurances: Insurance[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  currentPage: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  loadMore: () => void;
  refresh: () => void;
  updateFilters: (filters: InsuranceFilters) => void;
}

const ITEMS_PER_PAGE = 50;

export function useInfiniteInsurances(initialFilters: InsuranceFilters = {}): UseInfiniteInsurancesReturn {
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<InsuranceFilters>(initialFilters);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Prevent duplicate requests
  const loadingRef = useRef(false);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const loadInsurances = useCallback(async (page: number, isNewSearch: boolean = false) => {
    if (loadingRef.current) {
      console.log('⏸️ Load already in progress, skipping...');
      return;
    }
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      logger.info(`🔄 Loading insurances - Page ${page}`, { filters: filtersRef.current });
      
      // 🚀 Server-side search with pagination
      const result = await apiService.getInsurancesPaginated({
        page,
        limit: ITEMS_PER_PAGE,
        search: searchTerm,
        ...filtersRef.current
      });

      const newInsurances = result.insurances;
      
      // Validate response
      if (!result || !Array.isArray(newInsurances)) {
        throw new Error('Invalid response format');
      }
      
      setInsurances(prev => {
        // If new search, replace all. Otherwise append.
        const updatedInsurances = isNewSearch ? newInsurances : [...prev, ...newInsurances];
        
        // Remove duplicates based on insurance ID
        const uniqueInsurances = Array.from(
          new Map(updatedInsurances.map(insurance => [insurance.id, insurance])).values()
        );
        
        return uniqueInsurances;
      });
      
      setTotalCount(result.pagination.totalItems);
      setHasMore(result.pagination.hasMore);
      setCurrentPage(result.pagination.currentPage);
      
      logger.info(`✅ Loaded ${newInsurances.length} insurances (${result.pagination.totalItems} total)`);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Chyba pri načítavaní poistení';
      setError(errorMessage);
      logger.error('❌ Failed to load insurances', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
      if (initialLoad) {
        setInitialLoad(false);
      }
    }
  }, [initialLoad, searchTerm]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && !initialLoad) {
      console.log(`📚 Load more triggered - Page ${currentPage + 1}, hasMore: ${hasMore}, loading: ${loading}`);
      loadInsurances(currentPage + 1, false);
    } else {
      console.log(`⏸️ Load more skipped - loading: ${loading}, hasMore: ${hasMore}, initialLoad: ${initialLoad}`);
    }
  }, [loading, hasMore, currentPage, loadInsurances, initialLoad]);

  const refresh = useCallback(() => {
    setInsurances([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    loadInsurances(1, true);
  }, [loadInsurances]);

  const updateFilters = useCallback((newFilters: InsuranceFilters) => {
    logger.info('🔍 Updating filters', { newFilters });
    setFilters(newFilters);
    setInsurances([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    // Load will be triggered by useEffect
  }, []);

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false);
      loadInsurances(1, true);
    }
  }, []);

  // Filter changes
  useEffect(() => {
    if (!initialLoad) {
      // Debounce filter changes to avoid rapid re-fetching
      const timer = setTimeout(() => {
        loadInsurances(1, true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [filters]);

  // Search term changes - trigger new search
  useEffect(() => {
    if (!initialLoad) {
      // Reset pagination and load new results
      setCurrentPage(1);
      setInsurances([]);
      setHasMore(true);
      // Debounce search to avoid rapid API calls
      const timer = setTimeout(() => {
        loadInsurances(1, true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  // Debug logging
  useEffect(() => {
    logger.debug('📊 Infinite insurances state', {
      insurancesCount: insurances.length,
      totalCount,
      currentPage,
      hasMore,
      loading,
      error
    });
  }, [insurances.length, totalCount, currentPage, hasMore, loading, error]);

  return {
    insurances,
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