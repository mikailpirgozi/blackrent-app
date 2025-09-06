/**
 * 🔄 INFINITE DATA HOOK
 *
 * Booking.com štýl infinite scrolling:
 * - Load data in chunks (10-20 items)
 * - Smooth loading experience
 * - Memory efficient
 * - Works with all data types
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Customer, Rental, Vehicle } from '../types';
import { debounce } from '../utils/debounce';

interface UseInfiniteDataOptions<T> {
  data: T[];
  pageSize?: number;
  searchQuery?: string;
  filters?: Record<string, unknown>;
  sortFn?: (a: T, b: T) => number;
  filterFn?: (
    item: T,
    query: string,
    filters: Record<string, unknown>
  ) => boolean;
}

interface UseInfiniteDataReturn<T> {
  // Data
  displayedItems: T[];
  hasMore: boolean;
  isLoading: boolean;

  // Actions
  loadMore: () => void;
  reset: () => void;

  // Stats
  totalItems: number;
  displayedCount: number;
  progress: number; // 0-100%
}

export function useInfiniteData<T>({
  data,
  pageSize = 15,
  searchQuery = '',
  filters = {},
  sortFn,
  filterFn,
}: UseInfiniteDataOptions<T>): UseInfiniteDataReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // 🔍 Filter and sort data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply custom filter function
    if (filterFn && (searchQuery || Object.keys(filters).length > 0)) {
      result = result.filter(item => filterFn(item, searchQuery, filters));
    }

    // Apply sort function
    if (sortFn) {
      result.sort(sortFn);
    }

    return result;
  }, [data, searchQuery, filters, filterFn, sortFn]);

  // 📊 Calculate displayed items
  const displayedItems = useMemo(() => {
    const endIndex = currentPage * pageSize;
    return processedData.slice(0, endIndex);
  }, [processedData, currentPage, pageSize]);

  // 🔄 Load more with loading state
  const loadMore = useCallback(async () => {
    if (isLoading || displayedItems.length >= processedData.length) return;

    setIsLoading(true);

    // Simulate loading delay for smooth UX
    await new Promise(resolve => setTimeout(resolve, 200));

    setCurrentPage(prev => prev + 1);
    setIsLoading(false);
  }, [isLoading, displayedItems.length, processedData.length]);

  // 🔄 Debounced load more to prevent spam
  const debouncedLoadMore = useMemo(() => debounce(loadMore, 300), [loadMore]);

  // 🔄 Reset when search/filters change
  const reset = useCallback(() => {
    setCurrentPage(1);
    setIsLoading(false);
  }, []);

  // Auto-reset when search or filters change
  useEffect(() => {
    reset();
  }, [searchQuery, filters, reset]);

  // 📊 Calculate stats
  const hasMore = displayedItems.length < processedData.length;
  const progress =
    processedData.length > 0
      ? Math.round((displayedItems.length / processedData.length) * 100)
      : 0;

  return {
    // Data
    displayedItems,
    hasMore,
    isLoading,

    // Actions
    loadMore: debouncedLoadMore,
    reset,

    // Stats
    totalItems: processedData.length,
    displayedCount: displayedItems.length,
    progress,
  };
}

// 🎯 Specialized hooks for different data types
export const useInfiniteRentals = (
  options: Omit<UseInfiniteDataOptions<Rental>, 'filterFn'>
) => {
  const filterFn = useCallback(
    (rental: Rental, query: string, filters: Record<string, unknown>) => {
      const searchMatch =
        !query ||
        rental.customerName?.toLowerCase().includes(query.toLowerCase()) ||
        rental.vehicle?.brand?.toLowerCase().includes(query.toLowerCase()) ||
        rental.vehicle?.model?.toLowerCase().includes(query.toLowerCase()) ||
        rental.vehicle?.licensePlate
          ?.toLowerCase()
          .includes(query.toLowerCase());

      const statusMatch =
        !filters.status ||
        filters.status === 'all' ||
        rental.status === filters.status;

      return !!(searchMatch && statusMatch);
    },
    []
  );

  return useInfiniteData({ ...options, filterFn });
};

export const useInfiniteVehicles = (
  options: Omit<UseInfiniteDataOptions<Vehicle>, 'filterFn'>
) => {
  const filterFn = useCallback(
    (vehicle: Vehicle, query: string, filters: Record<string, unknown>) => {
      const searchMatch =
        !query ||
        vehicle.brand?.toLowerCase().includes(query.toLowerCase()) ||
        vehicle.model?.toLowerCase().includes(query.toLowerCase()) ||
        vehicle.licensePlate?.toLowerCase().includes(query.toLowerCase()) ||
        vehicle.company?.toLowerCase().includes(query.toLowerCase());

      const brandMatch =
        !filters.brand ||
        filters.brand === 'all' ||
        vehicle.brand === filters.brand;

      const statusMatch =
        !filters.status ||
        filters.status === 'all' ||
        vehicle.status === filters.status;

      return !!(searchMatch && brandMatch && statusMatch);
    },
    []
  );

  return useInfiniteData({ ...options, filterFn });
};

export const useInfiniteCustomers = (
  options: Omit<UseInfiniteDataOptions<Customer>, 'filterFn'>
) => {
  const filterFn = useCallback(
    (customer: Customer, query: string, filters: Record<string, unknown>) => {
      const searchMatch =
        !query ||
        customer.name?.toLowerCase().includes(query.toLowerCase()) ||
        customer.email?.toLowerCase().includes(query.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(query.toLowerCase());

      const emailMatch =
        filters.showWithEmail === undefined ||
        (filters.showWithEmail && !!customer.email) ||
        (!filters.showWithEmail && !customer.email);

      return !!(searchMatch && emailMatch);
    },
    []
  );

  return useInfiniteData({ ...options, filterFn });
};
