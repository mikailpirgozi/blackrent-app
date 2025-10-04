import { apiService } from '@/services/api';
import type { ExpenseCategory } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

// ✅ FÁZA 2.2: Shared hook pre expense categories
// Namiesto duplicitného loadCategories() v každom komponente

// GET expense categories
export function useExpenseCategories() {
  return useQuery({
    queryKey: queryKeys.expenses.categories,
    queryFn: () => apiService.getExpenseCategories(),
    // Kategórie sa zriedka menia - môžeme cachovať dlhšie
    staleTime: 300000, // 5 min
    gcTime: 600000, // 10 min
  });
}

// CREATE expense category
export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: Omit<ExpenseCategory, 'id'>) =>
      apiService.createExpenseCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.categories,
      });
    },
  });
}

// UPDATE expense category
export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: ExpenseCategory) =>
      apiService.updateExpenseCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.categories,
      });
    },
  });
}

// DELETE expense category
export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteExpenseCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.categories,
      });
    },
  });
}
