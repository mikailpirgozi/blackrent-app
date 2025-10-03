/**
 * ===================================================================
 * LEASING REACT QUERY HOOKS
 * ===================================================================
 * Created: 2025-10-02
 * Description: React Query hooks pre API komunikáciu s leasing endpoints
 * ===================================================================
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BulkPaymentMarkInput,
  CreateLeasingInput,
  Leasing,
  LeasingDashboard,
  LeasingDetailResponse,
  LeasingFilters,
  PaymentScheduleItem,
  UpdateLeasingInput,
} from '@/types/leasing-types';
import { getApiBaseUrl } from '@/utils/apiUrl';
import { queryKeys } from '../queryKeys';
import { logger } from '@/utils/smartLogger';

// ===================================================================
// API BASE URL
// ===================================================================

const getApiBase = () => `${getApiBaseUrl()}/leasings`;

// ===================================================================
// API FUNCTIONS
// ===================================================================

async function fetchLeasings(filters?: LeasingFilters): Promise<Leasing[]> {
  const params = new URLSearchParams();
  if (filters?.vehicleId) params.append('vehicleId', filters.vehicleId);
  if (filters?.leasingCompany)
    params.append('leasingCompany', filters.leasingCompany);
  if (filters?.loanCategory)
    params.append('loanCategory', filters.loanCategory);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.searchQuery) params.append('searchQuery', filters.searchQuery);

  const url = `${getApiBase()}?${params.toString()}`;
  logger.debug('🔍 FETCHING LEASINGS:', url);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
    },
  });

  logger.debug('📡 LEASINGS Response:', {
    ok: response.ok,
    status: response.status,
    url,
  });

  if (!response.ok) throw new Error('Failed to fetch leasings');
  const data = await response.json();

  logger.debug('📊 LEASINGS Data:', {
    count: data.data?.length,
    sample: data.data?.[0],
    fullResponse: data,
  });

  return data.data;
}

async function fetchLeasing(id: string): Promise<LeasingDetailResponse> {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
  };

  const apiBase = getApiBase();
  const [leasing, schedule, documents] = await Promise.all([
    fetch(`${apiBase}/${id}`, { headers })
      .then(r => r.json())
      .then(d => d.data),
    fetch(`${apiBase}/${id}/schedule`, { headers })
      .then(r => r.json())
      .then(d => d.data),
    fetch(`${apiBase}/${id}/documents`, { headers })
      .then(r => r.json())
      .then(d => d.data),
  ]);

  return { leasing, paymentSchedule: schedule, documents };
}

async function fetchPaymentSchedule(
  leasingId: string
): Promise<PaymentScheduleItem[]> {
  const response = await fetch(`${getApiBase()}/${leasingId}/schedule`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch payment schedule');
  const data = await response.json();
  return data.data;
}

async function fetchDashboard(): Promise<LeasingDashboard> {
  const response = await fetch(`${getApiBase()}/dashboard`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch dashboard');
  const data = await response.json();
  return data.data;
}

async function createLeasing(input: CreateLeasingInput): Promise<Leasing> {
  const apiBase = getApiBase();
  logger.debug('📤 API Request:', { apiBase, input });

  const response = await fetch(apiBase, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
    },
    body: JSON.stringify(input),
  });

  logger.debug('📥 API Response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ API Error:', errorData);
    throw new Error(
      errorData.error || `Failed to create leasing (${response.status})`
    );
  }

  const data = await response.json();
  logger.debug('✅ API Success:', data);
  return data.data;
}

async function updateLeasing(input: UpdateLeasingInput): Promise<Leasing> {
  const { id, ...dataWithoutId } = input;
  const apiUrl = `${getApiBase()}/${id}`;
  logger.debug('📤 UPDATE LEASING Request:', {
    apiUrl,
    id,
    input: dataWithoutId,
  });

  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
    },
    body: JSON.stringify(dataWithoutId),
  });

  logger.debug('📥 UPDATE LEASING Response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ UPDATE LEASING Error:', {
      status: response.status,
      statusText: response.statusText,
      errorData,
      url: apiUrl,
    });
    throw new Error(
      errorData.error || `Failed to update leasing (${response.status})`
    );
  }

  const data = await response.json();
  logger.debug('✅ UPDATE LEASING Success:', data);
  return data.data;
}

async function deleteLeasing(id: string): Promise<void> {
  const response = await fetch(`${getApiBase()}/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
    },
  });
  if (!response.ok) throw new Error('Failed to delete leasing');
}

async function markPaymentAsPaid(
  leasingId: string,
  installmentNumber: number,
  paidDate?: Date
): Promise<PaymentScheduleItem> {
  const response = await fetch(
    `${getApiBase()}/${leasingId}/schedule/${installmentNumber}/pay`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
      },
      body: JSON.stringify({ paidDate }),
    }
  );
  if (!response.ok) throw new Error('Failed to mark payment');
  const data = await response.json();
  return data.data;
}

async function unmarkPayment(
  leasingId: string,
  installmentNumber: number
): Promise<PaymentScheduleItem> {
  const response = await fetch(
    `${getApiBase()}/${leasingId}/schedule/${installmentNumber}/pay`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
      },
    }
  );
  if (!response.ok) throw new Error('Failed to unmark payment');
  const data = await response.json();
  return data.data;
}

async function bulkMarkPayments(
  leasingId: string,
  input: BulkPaymentMarkInput
): Promise<PaymentScheduleItem[]> {
  const response = await fetch(
    `${getApiBase()}/${leasingId}/schedule/bulk-pay`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
      },
      body: JSON.stringify(input),
    }
  );
  if (!response.ok) throw new Error('Failed to bulk mark payments');
  const data = await response.json();
  return data.data;
}

// ===================================================================
// QUERY HOOKS
// ===================================================================

export function useLeasings(filters?: LeasingFilters) {
  return useQuery({
    queryKey: queryKeys.leasings.list(filters),
    queryFn: () => fetchLeasings(filters),
    staleTime: 0, // ✅ FIX: 0s pre okamžité real-time updates (+ NO_CACHE v SW)
    gcTime: 0, // ✅ CRITICAL FIX: No GC cache
    refetchOnMount: 'always', // ✅ FIX: Vždy refetch pri mounte
  });
}

export function useLeasing(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.leasings.detail(id) : ['leasing', 'undefined'],
    queryFn: () => fetchLeasing(id!),
    enabled: !!id,
    staleTime: 0, // ✅ FIX: 0s pre okamžité real-time updates
    gcTime: 0,
    refetchOnMount: 'always',
  });
}

export function usePaymentSchedule(leasingId: string | undefined) {
  return useQuery({
    queryKey: leasingId
      ? queryKeys.leasings.schedule(leasingId)
      : ['payment-schedule', 'undefined'],
    queryFn: () => fetchPaymentSchedule(leasingId!),
    enabled: !!leasingId,
    staleTime: 0, // ✅ FIX: 0s pre okamžité real-time updates
    gcTime: 0,
    refetchOnMount: 'always',
  });
}

export function useLeasingDashboard() {
  return useQuery({
    queryKey: queryKeys.leasings.dashboard(),
    queryFn: fetchDashboard,
    staleTime: 0, // ✅ FIX: 0s pre okamžité real-time updates
    gcTime: 0,
    refetchOnMount: 'always',
  });
}

// ===================================================================
// MUTATION HOOKS
// ===================================================================

export function useCreateLeasing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLeasing,
    onMutate: async newLeasing => {
      // ⚡ OPTIMISTIC UPDATE: Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.leasings.all });

      // Snapshot previous value
      const previousLeasings = queryClient.getQueryData(
        queryKeys.leasings.lists()
      );

      // Optimistically update - add new leasing to the start of list
      queryClient.setQueryData(
        queryKeys.leasings.lists(),
        (old: Leasing[] = []) => [
          { ...newLeasing, id: `temp-${Date.now()}` } as Leasing,
          ...old,
        ]
      );

      return { previousLeasings };
    },
    onError: (_err, _newLeasing, context) => {
      // ↩️ ROLLBACK: Restore previous data on error
      if (context?.previousLeasings) {
        queryClient.setQueryData(
          queryKeys.leasings.lists(),
          context.previousLeasings
        );
      }
    },
    onSuccess: data => {
      logger.debug('✅ Leasing created:', data);

      // Trigger WebSocket notification (if needed)
      window.dispatchEvent(
        new CustomEvent('leasing-created', { detail: data })
      );
    },
    onSettled: () => {
      // 🔄 INVALIDATE: Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.leasings.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.dashboard(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
    },
  });
}

export function useUpdateLeasing(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateLeasingInput) => updateLeasing({ ...input, id }),
    onSuccess: updatedLeasing => {
      // 🔥 OPTIMISTIC UPDATE: Set updated data immediately
      queryClient.setQueryData(queryKeys.leasings.detail(id), updatedLeasing);

      // Update in list cache
      queryClient.setQueryData(
        queryKeys.leasings.all,
        (oldData: Leasing[] | undefined) => {
          if (!oldData) return [updatedLeasing];
          return oldData.map(l => (l.id === id ? updatedLeasing : l));
        }
      );

      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.leasings.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.dashboard(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
    },
  });
}

export function useDeleteLeasing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLeasing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leasings.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.dashboard(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
    },
  });
}

export function useMarkPayment(leasingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      installmentNumber,
      paidDate,
    }: {
      installmentNumber: number;
      paidDate?: Date;
    }) => markPaymentAsPaid(leasingId, installmentNumber, paidDate),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.schedule(leasingId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.detail(leasingId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.leasings.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.dashboard(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
    },
  });
}

export function useUnmarkPayment(leasingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (installmentNumber: number) =>
      unmarkPayment(leasingId, installmentNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.schedule(leasingId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.detail(leasingId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.leasings.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.dashboard(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
    },
  });
}

export function useBulkMarkPayments(leasingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkPaymentMarkInput) =>
      bulkMarkPayments(leasingId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.schedule(leasingId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.detail(leasingId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.leasings.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.dashboard(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
    },
  });
}
