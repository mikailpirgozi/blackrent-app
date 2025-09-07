import { apiService } from '@/services/api';
import type { Expense } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

// GET expenses
export function useExpenses() {
  return useQuery({
    queryKey: queryKeys.expenses.all,
    queryFn: () => apiService.getExpenses(),
    staleTime: 2 * 60 * 1000, // 2 minúty
  });
}

// CREATE expense
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expense: Expense) => apiService.createExpense(expense),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    },
  });
}
