import { useCallback, useEffect, useRef, useState } from 'react';

import { apiService } from '../services/api';
import type { Company } from '../types';
import { logger } from '../utils/smartLogger';

interface CompanyFilters {
  search?: string;
  city?: string;
  country?: string;
  status?: string;
}

interface UseInfiniteCompaniesReturn {
  companies: Company[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  currentPage: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  loadMore: () => void;
  refresh: () => void;
  updateFilters: (filters: CompanyFilters) => void;
}

const ITEMS_PER_PAGE = 50;

export function useInfiniteCompanies(
  initialFilters: CompanyFilters = {}
): UseInfiniteCompaniesReturn {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<CompanyFilters>(initialFilters);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Prevent duplicate requests
  const loadingRef = useRef(false);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const loadCompanies = useCallback(
    async (page: number, isNewSearch: boolean = false) => {
      if (loadingRef.current) {
        logger.debug('⏸️ Load already in progress, skipping...');
        return;
      }

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        logger.info(`🔄 Loading companies - Page ${page}`, {
          filters: filtersRef.current,
        });

        const result = await apiService.getCompaniesPaginated({
          page,
          limit: ITEMS_PER_PAGE,
          search: searchTerm,
          ...filtersRef.current,
        });

        const newCompanies = result.data;

        // Validate response
        if (!result || !Array.isArray(newCompanies)) {
          throw new Error('Invalid response format');
        }

        setCompanies(prev => {
          // If new search, replace all. Otherwise append.
          const updatedCompanies = isNewSearch
            ? newCompanies
            : [...prev, ...newCompanies];

          // Remove duplicates based on company ID
          const uniqueCompanies = Array.from(
            new Map(
              updatedCompanies.map(company => [company.id, company])
            ).values()
          );

          return uniqueCompanies;
        });

        setTotalCount(result.total);
        setHasMore(result.page * result.limit < result.total);
        setCurrentPage(result.page);

        logger.info(
          `✅ Loaded ${newCompanies.length} companies (${result.total} total)`
        );
      } catch (error: unknown) {
        const errorMessage =
          (error as Error).message || 'Chyba pri načítavaní firiem';
        setError(errorMessage);
        logger.error('❌ Failed to load companies', error);
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
      logger.debug(
        `📚 Load more triggered - Page ${currentPage + 1}, hasMore: ${hasMore}, loading: ${loading}`
      );
      loadCompanies(currentPage + 1, false);
    } else {
      logger.debug(
        `⏸️ Load more skipped - loading: ${loading}, hasMore: ${hasMore}, initialLoad: ${initialLoad}`
      );
    }
  }, [loading, hasMore, currentPage, loadCompanies, initialLoad]);

  const refresh = useCallback(() => {
    setCompanies([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    loadCompanies(1, true);
  }, [loadCompanies]);

  const updateFilters = useCallback((newFilters: CompanyFilters) => {
    logger.info('🔍 Updating company filters', { newFilters });
    setFilters(newFilters);
    setCompanies([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    // Load will be triggered by useEffect
  }, []);

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false);
      loadCompanies(1, true);
    }
  }, [initialLoad, loadCompanies]);

  // Filter changes
  useEffect(() => {
    if (!initialLoad) {
      // Debounce filter changes to avoid rapid re-fetching
      const timer = setTimeout(() => {
        loadCompanies(1, true);
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [filters, initialLoad, loadCompanies]);

  // Search term changes - trigger new search
  useEffect(() => {
    if (!initialLoad) {
      // Reset pagination and load new results
      setCurrentPage(1);
      setCompanies([]);
      setHasMore(true);
      // Debounce search to avoid rapid API calls
      const timer = setTimeout(() => {
        loadCompanies(1, true);
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [searchTerm, initialLoad, loadCompanies]);

  // Debug logging
  useEffect(() => {
    logger.debug('📊 Infinite companies state', {
      companiesCount: companies.length,
      totalCount,
      currentPage,
      hasMore,
      loading,
      error,
    });
  }, [companies.length, totalCount, currentPage, hasMore, loading, error]);

  return {
    companies,
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
