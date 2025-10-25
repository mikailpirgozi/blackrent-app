import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { Fine } from '../types';
import { formatDateToString } from '@/utils/dateUtils'; // 🕐 TIMEZONE FIX

// 🕐 TIMEZONE FIX: Format dates before sending to API
function formatFineDates(
  fine: Fine | Omit<Fine, 'id' | 'createdAt' | 'updatedAt'>
): Fine | Omit<Fine, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    ...fine,
    fineDate:
      fine.fineDate instanceof Date
        ? (formatDateToString(fine.fineDate) as unknown as Date)
        : fine.fineDate,
    ownerPaidDate:
      fine.ownerPaidDate instanceof Date
        ? (formatDateToString(fine.ownerPaidDate) as unknown as Date)
        : fine.ownerPaidDate,
    customerPaidDate:
      fine.customerPaidDate instanceof Date
        ? (formatDateToString(fine.customerPaidDate) as unknown as Date)
        : fine.customerPaidDate,
  };
}

export const useFines = (vehicleId?: string) => {
  const queryClient = useQueryClient();

  const {
    data: fines,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['fines', vehicleId],
    queryFn: () => apiService.getFines(vehicleId),
  });

  const createMutation = useMutation({
    mutationFn: (fine: Omit<Fine, 'id' | 'createdAt' | 'updatedAt'>) => {
      // 🕐 TIMEZONE FIX: Format dates before sending
      const formattedFine = formatFineDates(fine);
      return apiService.createFine(formattedFine);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (fine: Fine) => {
      // 🕐 TIMEZONE FIX: Format dates before sending
      const formattedFine = formatFineDates(fine) as Fine;
      return apiService.updateFine(formattedFine);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteFine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] });
    },
  });

  return {
    fines,
    isLoading,
    error,
    createFine: createMutation.mutate,
    updateFine: updateMutation.mutate,
    deleteFine: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
