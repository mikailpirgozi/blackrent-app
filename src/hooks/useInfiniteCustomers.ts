import { useState, useEffect, useCallback, useRef } from 'react';

import { apiService } from '../services/api';
import type { Customer } from '../types';
import { logger } from '../utils/smartLogger';

interface CustomerFilters {
  search?: string;
  city?: string;
  country?: string;
  hasRentals?: string;
}

interface UseInfiniteCustomersReturn {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  currentPage: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  loadMore: () => void;
  refresh: () => void;
  updateFilters: (filters: CustomerFilters) => void;
}

const ITEMS_PER_PAGE = 50;

export function useInfiniteCustomers(
  initialFilters: CustomerFilters = {}
): UseInfiniteCustomersReturn {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<CustomerFilters>(initialFilters);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Prevent duplicate requests
  const loadingRef = useRef(false);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const loadCustomers = useCallback(
    async (page: number, isNewSearch: boolean = false) => {
      if (loadingRef.current) {
        console.log('⏸️ Load already in progress, skipping...');
        return;
      }

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        logger.info(`🔄 Loading customers - Page ${page}`, {
          filters: filtersRef.current,
        });

        const result = await apiService.getCustomersPaginated({
          page,
          limit: ITEMS_PER_PAGE,
          search: searchTerm,
          ...filtersRef.current,
        });

        const newCustomers = result.customers;

        // Validate response
        if (!result || !Array.isArray(newCustomers)) {
          throw new Error('Invalid response format');
        }

        setCustomers(prev => {
          // If new search, replace all. Otherwise append.
          const updatedCustomers = isNewSearch
            ? newCustomers
            : [...prev, ...newCustomers];

          // Remove duplicates based on customer ID
          const uniqueCustomers = Array.from(
            new Map(
              updatedCustomers.map(customer => [customer.id, customer])
            ).values()
          );

          return uniqueCustomers;
        });

        setTotalCount(result.pagination.totalItems);
        setHasMore(result.pagination.hasMore);
        setCurrentPage(result.pagination.currentPage);

        logger.info(
          `✅ Loaded ${newCustomers.length} customers (${result.pagination.totalItems} total)`
        );
      } catch (error: unknown) {
        const errorMessage = err.message || 'Chyba pri načítavaní zákazníkov';
        setError(errorMessage);
        logger.error('❌ Failed to load customers', err);
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
      loadCustomers(currentPage + 1, false);
    } else {
      console.log(
        `⏸️ Load more skipped - loading: ${loading}, hasMore: ${hasMore}, initialLoad: ${initialLoad}`
      );
    }
  }, [loading, hasMore, currentPage, loadCustomers, initialLoad]);

  const refresh = useCallback(() => {
    setCustomers([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    loadCustomers(1, true);
  }, [loadCustomers]);

  const updateFilters = useCallback((newFilters: CustomerFilters) => {
    logger.info('🔍 Updating customer filters', { newFilters });
    setFilters(newFilters);
    setCustomers([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    // Load will be triggered by useEffect
  }, []);

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false);
      loadCustomers(1, true);
    }
  }, []);

  // Filter changes
  useEffect(() => {
    if (!initialLoad) {
      // Debounce filter changes to avoid rapid re-fetching
      const timer = setTimeout(() => {
        loadCustomers(1, true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [filters]);

  // Search term changes - trigger new search
  useEffect(() => {
    if (!initialLoad) {
      // Reset pagination and load new results
      setCurrentPage(1);
      setCustomers([]);
      setHasMore(true);
      // Debounce search to avoid rapid API calls
      const timer = setTimeout(() => {
        loadCustomers(1, true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  // Debug logging
  useEffect(() => {
    logger.debug('📊 Infinite customers state', {
      customersCount: customers.length,
      totalCount,
      currentPage,
      hasMore,
      loading,
      error,
    });
  }, [customers.length, totalCount, currentPage, hasMore, loading, error]);

  return {
    customers,
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
