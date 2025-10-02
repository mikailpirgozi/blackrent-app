import { apiService } from '@/services/api';
import type { Expense } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { swCacheInvalidators } from '../invalidateServiceWorkerCache';

// GET expenses
export function useExpenses() {
  return useQuery({
    queryKey: queryKeys.expenses.all,
    queryFn: () => apiService.getExpenses(),
    staleTime: 0, // ✅ FIX: Vždy fresh data po invalidácii (bolo 2 min)
    gcTime: 0, // ✅ CRITICAL FIX: No GC cache
    refetchOnMount: 'always', // ✅ Vždy refetch pri mount
  });
}

// CREATE expense
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expense: Expense) => apiService.createExpense(expense),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      // ✅ Invaliduj Service Worker cache
      swCacheInvalidators.expenses();
    },
  });
}

// UPDATE expense
export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expense: Expense) => apiService.updateExpense(expense),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      // ✅ Invaliduj Service Worker cache
      swCacheInvalidators.expenses();
    },
  });
}

// DELETE expense
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteExpense(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      // ✅ Invaliduj Service Worker cache
      swCacheInvalidators.expenses();
    },
  });
}
