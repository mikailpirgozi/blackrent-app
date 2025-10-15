/**
 * useVehicles Hook
 * React Query hook for fetching vehicles with real API
 */

import { useQuery, useInfiniteQuery, type UseQueryResult, type UseInfiniteQueryResult, type InfiniteData } from '@tanstack/react-query';
import { getVehicles, getVehicleById, getFeaturedVehicles } from '../../services/api/vehicle-service';
import type { Vehicle, VehicleSearchParams, VehicleListResponse } from '../../types/vehicle';
import { CACHE } from '../../config/constants';

/**
 * Query keys for vehicles
 */
export const vehicleKeys = {
  all: ['vehicles'] as const,
  lists: () => [...vehicleKeys.all, 'list'] as const,
  list: (params?: VehicleSearchParams) => [...vehicleKeys.lists(), params] as const,
  details: () => [...vehicleKeys.all, 'detail'] as const,
  detail: (id: string) => [...vehicleKeys.details(), id] as const,
  featured: () => [...vehicleKeys.all, 'featured'] as const,
};

/**
 * Hook to fetch vehicles with pagination
 */
export function useVehicles(params?: VehicleSearchParams): UseQueryResult<VehicleListResponse> {
  return useQuery({
    queryKey: vehicleKeys.list(params),
    queryFn: () => getVehicles(params),
    staleTime: CACHE.STALE_TIME,
    gcTime: CACHE.CACHE_TIME,
    retry: CACHE.MAX_RETRIES,
    retryDelay: CACHE.RETRY_DELAY,
  });
}

/**
 * Hook to fetch vehicles with infinite scroll
 */
export function useInfiniteVehicles(
  params?: Omit<VehicleSearchParams, 'page'>
): UseInfiniteQueryResult<InfiniteData<VehicleListResponse>, Error> {
  return useInfiniteQuery({
    queryKey: vehicleKeys.list(params),
    queryFn: ({ pageParam = 1 }) =>
      getVehicles({
        ...params,
        page: pageParam as number,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: VehicleListResponse) => {
      const { currentPage, totalPages, hasMore } = lastPage.pagination;
      return hasMore && currentPage < totalPages ? currentPage + 1 : undefined;
    },
    staleTime: CACHE.STALE_TIME,
    gcTime: CACHE.CACHE_TIME,
    retry: CACHE.MAX_RETRIES,
    retryDelay: CACHE.RETRY_DELAY,
  });
}

/**
 * Hook to fetch single vehicle by ID
 */
export function useVehicleById(id: string): UseQueryResult<Vehicle> {
  return useQuery({
    queryKey: vehicleKeys.detail(id),
    queryFn: () => getVehicleById(id),
    staleTime: CACHE.STALE_TIME,
    gcTime: CACHE.CACHE_TIME,
    retry: CACHE.MAX_RETRIES,
    retryDelay: CACHE.RETRY_DELAY,
    enabled: !!id, // Only fetch if ID is provided
  });
}

/**
 * Hook to fetch featured vehicles
 */
export function useFeaturedVehicles(limit = 5): UseQueryResult<Vehicle[]> {
  return useQuery({
    queryKey: [...vehicleKeys.featured(), limit],
    queryFn: () => getFeaturedVehicles(limit),
    staleTime: CACHE.STALE_TIME,
    gcTime: CACHE.CACHE_TIME,
    retry: CACHE.MAX_RETRIES,
    retryDelay: CACHE.RETRY_DELAY,
  });
}



