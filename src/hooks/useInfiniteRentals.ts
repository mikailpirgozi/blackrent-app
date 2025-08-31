import { useState, useEffect, useCallback, useRef } from 'react';

import { apiService } from '../services/api';
import type { Rental } from '../types';
import { logger } from '../utils/smartLogger';
import { normalizeText } from '../utils/textNormalization';

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
  updateRentalInList: (updatedRental: Rental) => void;
  handleOptimisticDelete: (rentalId: string) => void;
}

const ITEMS_PER_PAGE = 50;

export function useInfiniteRentals(
  initialFilters: RentalFilters = {}
): UseInfiniteRentalsReturn {
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

  const loadRentals = useCallback(
    async (page: number, isNewSearch: boolean = false) => {
      if (loadingRef.current) {
        return;
      }

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        console.log(`🔄 INFINITE RENTALS: Loading rentals - Page ${page}`, {
          filters: filtersRef.current,
        });
        logger.info(`🔄 Loading rentals - Page ${page}`, {
          filters: filtersRef.current,
        });
        // 🚀 GMAIL APPROACH: Server-side search with pagination

        // 🔤 NORMALIZÁCIA: Normalizuj search term pred odoslaním na server
        const normalizedSearchTerm = searchTerm
          ? normalizeText(searchTerm)
          : '';

        const result = await apiService.getRentalsPaginated({
          page,
          limit: ITEMS_PER_PAGE,
          search: normalizedSearchTerm, // 🔤 NORMALIZED: Server-side search s normalizáciou
          ...filtersRef.current,
        });

        const newRentals = result.rentals;

        // Validate response
        if (!result || !Array.isArray(newRentals)) {
          throw new Error('Invalid response format');
        }

        setRentals(prev => {
          // If new search, replace all. Otherwise append.
          const updatedRentals = isNewSearch
            ? newRentals
            : [...prev, ...newRentals];

          // Remove duplicates based on rental ID
          const uniqueRentals = Array.from(
            new Map(updatedRentals.map(rental => [rental.id, rental])).values()
          );

          return uniqueRentals;
        });

        setTotalCount(result.pagination.totalItems);
        setHasMore(result.pagination.hasMore);
        setCurrentPage(result.pagination.currentPage);

        logger.info(
          `✅ Loaded ${newRentals.length} rentals (${result.pagination.totalItems} total)`
        );
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
    },
    [initialLoad, searchTerm]
  ); // 🚀 GMAIL APPROACH: Include searchTerm in dependencies

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadRentals(currentPage + 1, false);
    }
  }, [loading, hasMore, currentPage, loadRentals]);

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

  const updateRentalInList = useCallback((updatedRental: Rental) => {
    setRentals(prev => {
      const index = prev.findIndex(r => r.id === updatedRental.id);
      if (index !== -1) {
        const newRentals = [...prev];
        newRentals[index] = updatedRental;
        logger.debug('⚡ Rental updated in paginated list:', updatedRental.id);
        return newRentals;
      }
      return prev;
    });
  }, []);

  // ⚡ SMART UPDATE: Načítaj len konkrétny rental namiesto full refresh
  const handleSmartRentalUpdate = useCallback(
    async (rentalId: string) => {
      try {
        logger.info('🎯 Smart update: Loading specific rental:', rentalId);

        // Načítaj aktualizovaný rental z API
        const updatedRental = await apiService.getRental(rentalId);

        if (updatedRental) {
          // Aktualizuj rental v zozname
          updateRentalInList(updatedRental);
          logger.info('✅ Smart update: Rental successfully updated in list');
        } else {
          logger.warn(
            '⚠️ Smart update: Rental not found, falling back to full refresh'
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
    [updateRentalInList, refresh]
  );

  // ⚡ OPTIMISTIC DELETE: Odstráň rental zo zoznamu okamžite
  const handleOptimisticDelete = useCallback((rentalId: string) => {
    logger.info('🗑️ Optimistic delete: Removing rental from list:', rentalId);

    setRentals(prev => {
      const filtered = prev.filter(r => r.id !== rentalId);
      logger.info(
        `✅ Optimistic delete: Rental removed (${prev.length} → ${filtered.length})`
      );
      return filtered;
    });

    // Aktualizuj totalCount
    setTotalCount(prev => Math.max(0, prev - 1));
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

  // 🔴 ENHANCED: Listen for WebSocket refresh events s smart updates
  useEffect(() => {
    const handleRefresh = (event?: CustomEvent) => {
      const eventData = event?.detail;

      if (eventData?.rentalId) {
        logger.info(
          '🎯 Smart refresh for specific rental:',
          eventData.rentalId
        );
        // ⚡ OPTIMISTIC: Načítaj len konkrétny rental namiesto celého zoznamu
        handleSmartRentalUpdate(eventData.rentalId);
      } else {
        logger.info('🔄 Full rental list refresh triggered');
        refresh();
      }
    };

    const handleOptimisticUpdate = (event: CustomEvent) => {
      const { rental, action } = event.detail;

      if (action === 'update' || action === 'rollback') {
        logger.info('⚡ Optimistic update received for rental:', rental.id);
        updateRentalInList(rental);
      } else if (action === 'create') {
        logger.info('⚡ Optimistic create received for rental:', rental.id);
        setRentals(prev => [rental, ...prev]); // Pridaj na začiatok zoznamu
      } else if (action === 'delete') {
        logger.info('⚡ Optimistic delete received for rental:', rental.id);
        setRentals(prev => prev.filter(r => r.id !== rental.id));
      }
    };

    // Listen for both refresh and optimistic update events
    window.addEventListener(
      'rental-list-refresh',
      handleRefresh as EventListener
    );
    window.addEventListener(
      'rental-optimistic-update',
      handleOptimisticUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        'rental-list-refresh',
        handleRefresh as EventListener
      );
      window.removeEventListener(
        'rental-optimistic-update',
        handleOptimisticUpdate as EventListener
      );
    };
  }, [refresh, updateRentalInList]);

  // Debug logging
  useEffect(() => {
    logger.debug('📊 Infinite rentals state', {
      rentalsCount: rentals.length,
      totalCount,
      currentPage,
      hasMore,
      loading,
      error,
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
    updateFilters,
    updateRentalInList,
    handleOptimisticDelete,
  };
}
