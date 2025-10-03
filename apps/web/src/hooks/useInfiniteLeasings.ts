import { useCallback, useEffect, useRef, useState } from 'react';

import { apiService } from '../services/api';
import type { Leasing, LeasingFilters } from '../types/leasing-types';
import { logger } from '../utils/smartLogger';
import { normalizeText } from '../utils/textNormalization';

// DOM types for event listeners
interface LeasingRefreshEvent {
  detail?: { leasingId?: string };
}

interface LeasingOptimisticEvent {
  detail: { leasing: Leasing; action: string };
}

interface UseInfiniteLeasingsReturn {
  leasings: Leasing[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  currentPage: number;
  searchTerm: string;
  setSearchTerm: (_term: string) => void;
  loadMore: () => void;
  refresh: () => void;
  updateFilters: (_filters: LeasingFilters) => void;
  updateLeasingInList: (_updatedLeasing: Leasing) => void;
  handleOptimisticDelete: (_leasingId: string) => void;
}

const ITEMS_PER_PAGE = 50;

export function useInfiniteLeasings(
  initialFilters: LeasingFilters = {}
): UseInfiniteLeasingsReturn {
  const [leasings, setLeasings] = useState<Leasing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<LeasingFilters>(initialFilters);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Prevent duplicate requests
  const loadingRef = useRef(false);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const loadLeasings = useCallback(
    async (page: number, isNewSearch: boolean = false) => {
      if (loadingRef.current) {
        return;
      }

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        // FIXED: Reduced logging to prevent console spam - len pre prvú stránku
        if (process.env.NODE_ENV === 'development' && page === 1) {
          logger.debug(
            `🔄 INFINITE LEASINGS: Loading leasings - Page ${page}`,
            {
              filters: filtersRef.current,
            }
          );
        }
        logger.info(`🔄 Loading leasings - Page ${page}`, {
          filters: filtersRef.current,
        });

        // 🔤 NORMALIZÁCIA: Normalizuj search term pred odoslaním na server
        const normalizedSearchTerm = searchTerm
          ? normalizeText(searchTerm)
          : '';

        // 🚀 GMAIL APPROACH: Server-side search with pagination
        const result = await apiService.getLeasingsPaginated({
          page,
          limit: ITEMS_PER_PAGE,
          searchQuery: normalizedSearchTerm, // 🔤 NORMALIZED: Server-side search s normalizáciou
          ...filtersRef.current,
        });

        const newLeasings = result.leasings;

        // Validate response
        if (!result || !Array.isArray(newLeasings)) {
          throw new Error('Invalid response format');
        }

        setLeasings(prev => {
          // If new search, replace all. Otherwise append.
          const updatedLeasings = isNewSearch
            ? newLeasings
            : [...prev, ...newLeasings];

          // Remove duplicates based on leasing ID
          const uniqueLeasings = Array.from(
            new Map(
              updatedLeasings.map(leasing => [leasing.id, leasing])
            ).values()
          );

          return uniqueLeasings;
        });

        setTotalCount(result.pagination.totalItems);
        setHasMore(result.pagination.hasMore);
        setCurrentPage(result.pagination.currentPage);

        logger.info(
          `✅ Loaded ${newLeasings.length} leasings (${result.pagination.totalItems} total)`
        );
        // API response processed successfully
      } catch (error: unknown) {
        const errorMessage =
          (error as Error).message || 'Chyba pri načítavaní leasingov';
        setError(errorMessage);
        logger.error('❌ Failed to load leasings', error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
        if (initialLoad) {
          setInitialLoad(false);
        }
      }
    },
    [searchTerm, initialLoad]
  );

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadLeasings(currentPage + 1, false);
    }
  }, [loading, hasMore, currentPage, loadLeasings]);

  const refresh = useCallback(() => {
    setLeasings([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    loadLeasings(1, true);
  }, [loadLeasings]);

  const updateFilters = useCallback((newFilters: LeasingFilters) => {
    logger.info('🔍 Updating filters', { newFilters });
    setFilters(newFilters);
    setLeasings([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    // Load will be triggered by useEffect
  }, []);

  const updateLeasingInList = useCallback((updatedLeasing: Leasing) => {
    setLeasings(prev => {
      const index = prev.findIndex(l => l.id === updatedLeasing.id);
      if (index !== -1) {
        const newLeasings = [...prev];
        newLeasings[index] = updatedLeasing;
        logger.debug(
          '⚡ Leasing updated in paginated list:',
          updatedLeasing.id
        );
        return newLeasings;
      }
      return prev;
    });
  }, []);

  // ⚡ SMART UPDATE: Načítaj len konkrétny leasing namiesto full refresh
  const handleSmartLeasingUpdate = useCallback(
    async (leasingId: string) => {
      try {
        logger.info('🎯 Smart update: Loading specific leasing:', leasingId);

        // Načítaj aktualizovaný leasing z API
        const response = await apiService.getLeasing(leasingId);
        const updatedLeasing = response.leasing;

        if (updatedLeasing) {
          // Aktualizuj leasing v zozname
          updateLeasingInList(updatedLeasing);
          logger.info('✅ Smart update: Leasing successfully updated in list');
        } else {
          logger.warn(
            '⚠️ Smart update: Leasing not found, falling back to full refresh'
          );
          refresh();
        }
      } catch (error) {
        logger.error(
          '❌ Smart update failed, falling back to full refresh:',
          error
        );
        refresh();
      }
    },
    [updateLeasingInList, refresh]
  );

  // ⚡ OPTIMISTIC DELETE: Odstráň leasing zo zoznamu okamžite
  const handleOptimisticDelete = useCallback((leasingId: string) => {
    logger.info('🗑️ Optimistic delete: Removing leasing from list:', leasingId);

    setLeasings(prev => {
      const filtered = prev.filter(l => l.id !== leasingId);
      logger.info(
        `✅ Optimistic delete: Leasing removed (${prev.length} → ${filtered.length})`
      );
      return filtered;
    });

    // Aktualizuj totalCount
    setTotalCount(prev => Math.max(0, prev - 1));
  }, []);

  // Initial load - FIXED: Prevent duplicate loading
  useEffect(() => {
    if (initialLoad && loadLeasings) {
      setInitialLoad(false);
      loadLeasings(1, true);
    }
  }, [initialLoad]);

  // Filter changes - FIXED: Prevent duplicate loading
  useEffect(() => {
    if (!initialLoad && loadLeasings) {
      // Debounce filter changes to avoid rapid re-fetching
      const timer = window.setTimeout(() => {
        loadLeasings?.(1, true);
      }, 300);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [filters, initialLoad]);

  // Search term changes - trigger new search - FIXED: Prevent duplicate loading
  useEffect(() => {
    if (!initialLoad && loadLeasings) {
      // Reset pagination and load new results
      setCurrentPage(1);
      setLeasings([]);
      setHasMore(true);
      // Debounce search to avoid rapid API calls
      const timer = window.setTimeout(() => {
        loadLeasings?.(1, true);
      }, 300);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [searchTerm, initialLoad]);

  // 🔴 ENHANCED: Listen for WebSocket refresh events s smart updates
  useEffect(() => {
    const handleRefresh = (event?: LeasingRefreshEvent) => {
      const eventData = event?.detail;

      if (eventData?.leasingId) {
        logger.info(
          '🎯 Smart refresh for specific leasing:',
          eventData.leasingId
        );
        // ⚡ OPTIMISTIC: Načítaj len konkrétny leasing namiesto celého zoznamu
        handleSmartLeasingUpdate(eventData.leasingId);
      } else {
        logger.info('🔄 Full leasing list refresh triggered');
        refresh();
      }
    };

    const handleOptimisticUpdate = (event: LeasingOptimisticEvent) => {
      const { leasing, action } = event.detail;

      if (action === 'update' || action === 'rollback') {
        logger.info('⚡ Optimistic update received for leasing:', leasing.id);
        updateLeasingInList(leasing);
      } else if (action === 'create') {
        logger.info('⚡ Optimistic create received for leasing:', leasing.id);
        setLeasings(prev => [leasing, ...prev]); // Pridaj na začiatok zoznamu
      } else if (action === 'delete') {
        logger.info('⚡ Optimistic delete received for leasing:', leasing.id);
        setLeasings(prev => prev.filter(l => l.id !== leasing.id));
      }
    };

    // Listen for both refresh and optimistic update events
    window.addEventListener('leasing-list-refresh', handleRefresh as any);
    window.addEventListener(
      'leasing-optimistic-update',
      handleOptimisticUpdate as any
    );

    return () => {
      window.removeEventListener('leasing-list-refresh', handleRefresh as any);
      window.removeEventListener(
        'leasing-optimistic-update',
        handleOptimisticUpdate as any
      );
    };
  }, [refresh, updateLeasingInList, handleSmartLeasingUpdate]);

  // Debug logging
  useEffect(() => {
    logger.debug('📊 Infinite leasings state', {
      leasingsCount: leasings.length,
      totalCount,
      currentPage,
      hasMore,
      loading,
      error,
    });
  }, [leasings.length, totalCount, currentPage, hasMore, loading, error]);

  return {
    leasings,
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
    updateLeasingInList,
    handleOptimisticDelete,
  };
}
