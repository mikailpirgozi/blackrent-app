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
    // ✅ FÁZA 2 FIX: Optimálny balance medzi freshness a performance
    staleTime: 30000, // 30s - dáta sú fresh 30 sekúnd (rozumný balance)
    gcTime: 300000, // 5 min - garbage collection po 5 minútach nepoužívania
    refetchOnMount: true, // Refetch len ak sú dáta stale (nie vždy!)
    refetchOnWindowFocus: false, // Nerefetchuj pri každom focus okna
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
