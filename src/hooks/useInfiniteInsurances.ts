import { useCallback, useEffect, useMemo, useState } from 'react';

import { apiService } from '../services/api';
import type { Insurance } from '../types';

export interface InsuranceFilters {
  search?: string;
  type?: string;
  company?: string;
  status?: 'valid' | 'expiring' | 'expired' | 'all';
  vehicleId?: string;
}

interface UseInfiniteInsurancesReturn {
  insurances: Insurance[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  totalCount: number;
  currentPage: number;
  filters: InsuranceFilters;
  setFilters: (filters: InsuranceFilters) => void;
  setSearchTerm: (term: string) => void;
}

const ITEMS_PER_PAGE = 20;

export function useInfiniteInsurances(
  initialFilters: InsuranceFilters = {}
): UseInfiniteInsurancesReturn {
  console.log(
    '🚀 useInfiniteInsurances: Hook initialized with filters:',
    initialFilters
  );
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<InsuranceFilters>(initialFilters);

  // 🔍 Load insurances with pagination and filtering
  const loadInsurances = useCallback(
    async (page: number = 1, reset: boolean = false) => {
      if (loading) return;

      setLoading(true);
      setError(null);

      try {
        console.log(`📄 Loading insurances page ${page}...`);

        // Build query parameters
        const params = {
          page,
          limit: ITEMS_PER_PAGE,
          ...(filters.search && { search: filters.search }),
          ...(filters.type && { type: filters.type }),
          ...(filters.company && { company: filters.company }),
          ...(filters.status &&
            filters.status !== 'all' && { status: filters.status }),
          ...(filters.vehicleId && { vehicleId: filters.vehicleId }),
        };

        console.log(
          '🔗 Making API call to:',
          `/insurances/paginated with params:`,
          params
        );
        const response = await apiService.getInsurancesPaginated(params);
        console.log('📡 API Response:', response);

        // API service už rozbalí response a vracia priamo {insurances: [...], pagination: {...}}
        if (response && response.insurances && response.pagination) {
          const { insurances: newInsurances, pagination } = response;

          console.log(
            `✅ Loaded ${newInsurances.length} insurances (page ${page})`
          );

          setInsurances(prev =>
            reset ? newInsurances : [...prev, ...newInsurances]
          );
          setCurrentPage(page);
          setTotalCount(pagination.totalItems);
          setHasMore(page < pagination.totalPages);
        } else {
          console.error('❌ Unexpected response format:', response);
          setError('Neočakávaný formát odpovede zo servera');
        }
      } catch (err) {
        console.error('❌ Error loading insurances:', err);
        console.error('❌ Error details:', {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        });
        setError('Chyba pri načítavaní poistiek');
      } finally {
        setLoading(false);
      }
    },
    [filters, loading]
  );

  // 📄 Load more insurances (next page)
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadInsurances(currentPage + 1, false);
    }
  }, [hasMore, loading, currentPage, loadInsurances]);

  // 🔄 Refresh insurances (reset to page 1)
  const refresh = useCallback(() => {
    setInsurances([]);
    setCurrentPage(1);
    setHasMore(true);
    loadInsurances(1, true);
  }, [loadInsurances]);

  // 🔍 Set search term with debounce
  const setSearchTerm = useCallback((term: string) => {
    setFilters(prev => ({ ...prev, search: term }));
  }, []);

  // 🎯 Initial load and filter changes
  useEffect(() => {
    console.log(
      '🎯 useInfiniteInsurances: Filters changed, refreshing...',
      filters
    );
    // Priame volanie refresh logiky namiesto funkcie aby sme predišli infinite loop
    setInsurances([]);
    setCurrentPage(1);
    setHasMore(true);
    loadInsurances(1, true);
  }, [filters, loadInsurances]);

  // 📊 Memoized return value for performance
  return useMemo(
    () => ({
      insurances,
      loading,
      error,
      hasMore,
      loadMore,
      refresh,
      totalCount,
      currentPage,
      filters,
      setFilters,
      setSearchTerm,
    }),
    [
      insurances,
      loading,
      error,
      hasMore,
      loadMore,
      refresh,
      totalCount,
      currentPage,
      filters,
      setSearchTerm,
    ]
  );
}
