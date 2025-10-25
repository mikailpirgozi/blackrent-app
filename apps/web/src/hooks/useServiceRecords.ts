import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { ServiceRecord } from '../types';
import { formatDateToString } from '@/utils/dateUtils'; // 🕐 TIMEZONE FIX

// 🕐 TIMEZONE FIX: Format dates before sending to API
function formatServiceRecordDates(
  record: ServiceRecord | Omit<ServiceRecord, 'id' | 'createdAt' | 'updatedAt'>
): ServiceRecord | Omit<ServiceRecord, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    ...record,
    serviceDate:
      record.serviceDate instanceof Date
        ? (formatDateToString(record.serviceDate) as unknown as Date)
        : record.serviceDate,
  };
}

export const useServiceRecords = (vehicleId?: string) => {
  const queryClient = useQueryClient();

  const {
    data: serviceRecords,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['serviceRecords', vehicleId],
    queryFn: () => apiService.getServiceRecords(vehicleId),
  });

  const createMutation = useMutation({
    mutationFn: (
      record: Omit<ServiceRecord, 'id' | 'createdAt' | 'updatedAt'>
    ) => {
      // 🕐 TIMEZONE FIX: Format dates before sending
      const formattedRecord = formatServiceRecordDates(record);
      return apiService.createServiceRecord(formattedRecord);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceRecords'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (record: ServiceRecord) => {
      // 🕐 TIMEZONE FIX: Format dates before sending
      const formattedRecord = formatServiceRecordDates(record) as ServiceRecord;
      return apiService.updateServiceRecord(formattedRecord);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceRecords'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteServiceRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceRecords'] });
    },
  });

  return {
    serviceRecords,
    isLoading,
    error,
    createServiceRecord: createMutation.mutate,
    updateServiceRecord: updateMutation.mutate,
    deleteServiceRecord: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
