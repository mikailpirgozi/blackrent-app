import { apiService } from '@/services/api';
import type { Customer } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { swCacheInvalidators } from '../invalidateServiceWorkerCache';
import { CACHE_TIMES } from '../queryClient';

// GET customers
export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers.lists(),
    queryFn: () => apiService.getCustomers(),
    // ⚡ PERFORMANCE: Use STANDARD cache tier (WebSocket handles real-time updates)
    staleTime: CACHE_TIMES.STANDARD.staleTime, // 2 min
    gcTime: CACHE_TIMES.STANDARD.gcTime, // 5 min
    refetchOnMount: false, // Don't refetch if data is fresh
  });
}

// CREATE customer
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customer: Customer) => apiService.createCustomer(customer),
    onSuccess: data => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('customer-created', { detail: data })
      );
    },
    onSettled: () => {
      // ✅ CRITICAL FIX: Invalidate all customer queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      // ✅ Invaliduj Service Worker cache
      swCacheInvalidators.customers();
    },
  });
}

// UPDATE customer
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customer: Customer) => apiService.updateCustomer(customer),
    onSuccess: data => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('customer-updated', { detail: data })
      );
    },
    onSettled: () => {
      // ✅ CRITICAL FIX: Invalidate all customer queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      // ✅ Invaliduj Service Worker cache
      swCacheInvalidators.customers();
    },
  });
}

// DELETE customer
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteCustomer(id),
    onSuccess: (_data, deletedId) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('customer-deleted', { detail: { id: deletedId } })
      );
    },
    onSettled: () => {
      // ✅ CRITICAL FIX: Invalidate all customer queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      // ✅ Invaliduj Service Worker cache
      swCacheInvalidators.customers();
    },
  });
}
