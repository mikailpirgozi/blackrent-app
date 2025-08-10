import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { InsuranceClaim } from '../types';
import { logger } from '../utils/smartLogger';

interface InsuranceClaimFilters {
  search?: string;
  status?: string;
  insuranceId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

interface UseInfiniteInsuranceClaimsReturn {
  claims: InsuranceClaim[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  currentPage: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  loadMore: () => void;
  refresh: () => void;
  updateFilters: (filters: InsuranceClaimFilters) => void;
}

const ITEMS_PER_PAGE = 50;

export function useInfiniteInsuranceClaims(initialFilters: InsuranceClaimFilters = {}): UseInfiniteInsuranceClaimsReturn {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<InsuranceClaimFilters>(initialFilters);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Prevent duplicate requests
  const loadingRef = useRef(false);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const loadClaims = useCallback(async (page: number, isNewSearch: boolean = false) => {
    if (loadingRef.current) {
      console.log('⏸️ Load already in progress, skipping...');
      return;
    }
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      logger.info(`🔄 Loading insurance claims - Page ${page}`, { filters: filtersRef.current });
      
      // 🚀 Server-side search with pagination
      const result = await apiService.getInsuranceClaimsPaginated({
        page,
        limit: ITEMS_PER_PAGE,
        search: searchTerm,
        ...filtersRef.current
      });

      const newClaims = result.claims;
      
      // Validate response
      if (!result || !Array.isArray(newClaims)) {
        throw new Error('Invalid response format');
      }
      
      setClaims(prev => {
        // If new search, replace all. Otherwise append.
        const updatedClaims = isNewSearch ? newClaims : [...prev, ...newClaims];
        
        // Remove duplicates based on claim ID
        const uniqueClaims = Array.from(
          new Map(updatedClaims.map(claim => [claim.id, claim])).values()
        );
        
        return uniqueClaims;
      });
      
      setTotalCount(result.pagination.totalItems);
      setHasMore(result.pagination.hasMore);
      setCurrentPage(result.pagination.currentPage);
      
      logger.info(`✅ Loaded ${newClaims.length} claims (${result.pagination.totalItems} total)`);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Chyba pri načítavaní poistných udalostí';
      setError(errorMessage);
      logger.error('❌ Failed to load insurance claims', err);
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
      loadClaims(currentPage + 1, false);
    } else {
      console.log(`⏸️ Load more skipped - loading: ${loading}, hasMore: ${hasMore}, initialLoad: ${initialLoad}`);
    }
  }, [loading, hasMore, currentPage, loadClaims, initialLoad]);

  const refresh = useCallback(() => {
    setClaims([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    loadClaims(1, true);
  }, [loadClaims]);

  const updateFilters = useCallback((newFilters: InsuranceClaimFilters) => {
    logger.info('🔍 Updating filters', { newFilters });
    setFilters(newFilters);
    setClaims([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    // Load will be triggered by useEffect
  }, []);

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false);
      loadClaims(1, true);
    }
  }, []);

  // Filter changes
  useEffect(() => {
    if (!initialLoad) {
      // Debounce filter changes to avoid rapid re-fetching
      const timer = setTimeout(() => {
        loadClaims(1, true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [filters]);

  // Search term changes - trigger new search
  useEffect(() => {
    if (!initialLoad) {
      // Reset pagination and load new results
      setCurrentPage(1);
      setClaims([]);
      setHasMore(true);
      // Debounce search to avoid rapid API calls
      const timer = setTimeout(() => {
        loadClaims(1, true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  // Debug logging
  useEffect(() => {
    logger.debug('📊 Infinite insurance claims state', {
      claimsCount: claims.length,
      totalCount,
      currentPage,
      hasMore,
      loading,
      error
    });
  }, [claims.length, totalCount, currentPage, hasMore, loading, error]);

  return {
    claims,
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