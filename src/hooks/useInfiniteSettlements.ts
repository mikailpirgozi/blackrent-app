import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { logger } from '../utils/smartLogger';

interface Settlement {
  id: string;
  companyId: string;
  companyName: string;
  period: string;
  totalRevenue: number;
  totalCommission: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: Date;
  paidAt?: Date;
  rentals: any[];
}

interface SettlementFilters {
  search?: string;
  company?: string;
  status?: string;
  periodFrom?: string;
  periodTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

interface UseInfiniteSettlementsReturn {
  settlements: Settlement[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  currentPage: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  loadMore: () => void;
  refresh: () => void;
  updateFilters: (filters: SettlementFilters) => void;
}

const ITEMS_PER_PAGE = 50;

export function useInfiniteSettlements(initialFilters: SettlementFilters = {}): UseInfiniteSettlementsReturn {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<SettlementFilters>(initialFilters);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Prevent duplicate requests
  const loadingRef = useRef(false);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const loadSettlements = useCallback(async (page: number, isNewSearch: boolean = false) => {
    if (loadingRef.current) {
      console.log('⏸️ Load already in progress, skipping...');
      return;
    }
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      logger.info(`🔄 Loading settlements - Page ${page}`, { filters: filtersRef.current });
      
      // 🚀 Server-side search with pagination
      const result = await apiService.getSettlementsPaginated({
        page,
        limit: ITEMS_PER_PAGE,
        search: searchTerm,
        ...filtersRef.current
      });

      const newSettlements = result.settlements;
      
      // Validate response
      if (!result || !Array.isArray(newSettlements)) {
        throw new Error('Invalid response format');
      }
      
      setSettlements(prev => {
        // If new search, replace all. Otherwise append.
        const updatedSettlements = isNewSearch ? newSettlements : [...prev, ...newSettlements];
        
        // Remove duplicates based on settlement ID
        const uniqueSettlements = Array.from(
          new Map(updatedSettlements.map(settlement => [settlement.id, settlement])).values()
        );
        
        return uniqueSettlements;
      });
      
      setTotalCount(result.pagination.totalItems);
      setHasMore(result.pagination.hasMore);
      setCurrentPage(result.pagination.currentPage);
      
      logger.info(`✅ Loaded ${newSettlements.length} settlements (${result.pagination.totalItems} total)`);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Chyba pri načítavaní vyrovnaní';
      setError(errorMessage);
      logger.error('❌ Failed to load settlements', err);
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
      loadSettlements(currentPage + 1, false);
    } else {
      console.log(`⏸️ Load more skipped - loading: ${loading}, hasMore: ${hasMore}, initialLoad: ${initialLoad}`);
    }
  }, [loading, hasMore, currentPage, loadSettlements, initialLoad]);

  const refresh = useCallback(() => {
    setSettlements([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    loadSettlements(1, true);
  }, [loadSettlements]);

  const updateFilters = useCallback((newFilters: SettlementFilters) => {
    logger.info('🔍 Updating filters', { newFilters });
    setFilters(newFilters);
    setSettlements([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    // Load will be triggered by useEffect
  }, []);

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false);
      loadSettlements(1, true);
    }
  }, []);

  // Filter changes
  useEffect(() => {
    if (!initialLoad) {
      // Debounce filter changes to avoid rapid re-fetching
      const timer = setTimeout(() => {
        loadSettlements(1, true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [filters]);

  // Search term changes - trigger new search
  useEffect(() => {
    if (!initialLoad) {
      // Reset pagination and load new results
      setCurrentPage(1);
      setSettlements([]);
      setHasMore(true);
      // Debounce search to avoid rapid API calls
      const timer = setTimeout(() => {
        loadSettlements(1, true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  // Debug logging
  useEffect(() => {
    logger.debug('📊 Infinite settlements state', {
      settlementsCount: settlements.length,
      totalCount,
      currentPage,
      hasMore,
      loading,
      error
    });
  }, [settlements.length, totalCount, currentPage, hasMore, loading, error]);

  return {
    settlements,
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