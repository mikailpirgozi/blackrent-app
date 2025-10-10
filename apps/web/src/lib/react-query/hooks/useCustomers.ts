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
    onMutate: async newCustomer => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.customers.all,
      });

      const previousCustomers = queryClient.getQueryData(
        queryKeys.customers.lists()
      );

      const optimisticCustomer = {
        ...newCustomer,
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
      };

      queryClient.setQueryData(
        queryKeys.customers.lists(),
        (old: Customer[] = []) => [optimisticCustomer as Customer, ...old]
      );

      return { previousCustomers };
    },
    onError: (_err, _newCustomer, context) => {
      if (context?.previousCustomers) {
        queryClient.setQueryData(
          queryKeys.customers.lists(),
          context.previousCustomers
        );
      }
    },
    onSuccess: data => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('customer-created', { detail: data })
      );
    },
    onSettled: () => {
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
    onMutate: async updatedCustomer => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.customers.detail(updatedCustomer.id),
      });

      const previousCustomer = queryClient.getQueryData(
        queryKeys.customers.detail(updatedCustomer.id)
      );

      // Update detail
      queryClient.setQueryData(
        queryKeys.customers.detail(updatedCustomer.id),
        updatedCustomer
      );

      // Update list
      queryClient.setQueryData(
        queryKeys.customers.lists(),
        (old: Customer[] = []) =>
          old.map(c => (c.id === updatedCustomer.id ? updatedCustomer : c))
      );

      return { previousCustomer };
    },
    onError: (_err, _updatedCustomer, context) => {
      if (context?.previousCustomer) {
        queryClient.setQueryData(
          queryKeys.customers.detail(_updatedCustomer.id),
          context.previousCustomer
        );
      }
    },
    onSuccess: data => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('customer-updated', { detail: data })
      );
    },
    onSettled: () => {
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
    onMutate: async deletedId => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.customers.all,
      });

      const previousCustomers = queryClient.getQueryData(
        queryKeys.customers.lists()
      );

      queryClient.setQueryData(
        queryKeys.customers.lists(),
        (old: Customer[] = []) => old.filter(c => c.id !== deletedId)
      );

      return { previousCustomers };
    },
    onError: (_err, _deletedId, context) => {
      if (context?.previousCustomers) {
        queryClient.setQueryData(
          queryKeys.customers.lists(),
          context.previousCustomers
        );
      }
    },
    onSuccess: (_data, deletedId) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('customer-deleted', { detail: { id: deletedId } })
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      // ✅ Invaliduj Service Worker cache
      swCacheInvalidators.customers();
    },
  });
}
