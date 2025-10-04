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
    cache: 'no-store', // 🔥 CRITICAL: No browser cache
  });

  logger.debug('📡 LEASINGS Response:', {
    ok: response.ok,
    status: response.status,
    url,
  });

  if (!response.ok) throw new Error('Failed to fetch leasings');
  const data = await response.json();

  logger.debug('📊 LEASINGS Data FRESH:', {
    count: data.data?.length,
    sample: data.data?.[0],
    sampleFields: data.data?.[0]
      ? {
          id: data.data[0].id,
          company: data.data[0].leasingCompany,
          amount: data.data[0].initialLoanAmount,
          balance: data.data[0].currentBalance,
          monthlyPayment: data.data[0].totalMonthlyPayment,
          updated: data.data[0].updatedAt,
          vehicle: data.data[0].vehicle,
        }
      : null,
  });

  return data.data;
}

async function fetchLeasing(id: string): Promise<LeasingDetailResponse> {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
  };

  const apiBase = getApiBase();

  try {
    const [leasing, schedule, documents] = await Promise.all([
      fetch(`${apiBase}/${id}`, {
        headers,
        cache: 'no-store', // 🔥 CRITICAL: No browser cache
      })
        .then(r => {
          if (!r.ok) throw new Error(`Failed to fetch leasing: ${r.status}`);
          return r.json();
        })
        .then(d => d.data),
      fetch(`${apiBase}/${id}/schedule`, {
        headers,
        cache: 'no-store', // 🔥 CRITICAL: No browser cache for payment schedule
      })
        .then(r => {
          if (!r.ok) {
            logger.debug(`⚠️ Failed to fetch schedule: ${r.status}`);
            return null;
          }
          return r.json();
        })
        .then(d => d?.data || [])
        .catch(err => {
          logger.debug('⚠️ Schedule fetch error:', err);
          return [];
        }),
      fetch(`${apiBase}/${id}/documents`, {
        headers,
        cache: 'no-store', // 🔥 CRITICAL: No browser cache
      })
        .then(r => {
          if (!r.ok) {
            logger.debug(`⚠️ Failed to fetch documents: ${r.status}`);
            return null;
          }
          return r.json();
        })
        .then(d => d?.data || [])
        .catch(err => {
          logger.debug('⚠️ Documents fetch error:', err);
          return [];
        }),
    ]);

    if (!leasing) {
      throw new Error('Leasing not found');
    }

    return {
      leasing,
      paymentSchedule: schedule || [],
      documents: documents || [],
    };
  } catch (error) {
    logger.debug('❌ fetchLeasing error:', error);
    throw error;
  }
}

async function fetchPaymentSchedule(
  leasingId: string
): Promise<PaymentScheduleItem[]> {
  const response = await fetch(`${getApiBase()}/${leasingId}/schedule`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
    },
    cache: 'no-store', // 🔥 CRITICAL: No browser cache
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
    cache: 'no-store', // 🔥 CRITICAL: No browser cache
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
    cache: 'no-store', // 🔥 CRITICAL: No browser cache for mutations
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
    cache: 'no-store', // 🔥 CRITICAL: No browser cache for mutations
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
    cache: 'no-store', // 🔥 CRITICAL: No browser cache for mutations
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
      cache: 'no-store', // 🔥 CRITICAL: No browser cache for mutations
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
      cache: 'no-store', // 🔥 CRITICAL: No browser cache for mutations
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
      cache: 'no-store', // 🔥 CRITICAL: No browser cache for mutations
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

      // Create temporary leasing with optimistic data
      const tempLeasing = {
        ...newLeasing,
        id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Leasing;

      // Optimistically update - add new leasing to the start of list
      queryClient.setQueryData(
        queryKeys.leasings.lists(),
        (old: Leasing[] = []) => [tempLeasing, ...old]
      );

      // ⚡ DISPATCH optimistic update event for useInfiniteLeasings
      window.dispatchEvent(
        new CustomEvent('leasing-optimistic-update', {
          detail: { leasing: tempLeasing, action: 'create' },
        })
      );

      return { previousLeasings, tempLeasing };
    },
    onError: (_err, _newLeasing, context) => {
      // ↩️ ROLLBACK: Restore previous data on error
      if (context?.previousLeasings) {
        queryClient.setQueryData(
          queryKeys.leasings.lists(),
          context.previousLeasings
        );

        // Dispatch rollback event
        if (context.tempLeasing) {
          window.dispatchEvent(
            new CustomEvent('leasing-optimistic-update', {
              detail: { leasing: context.tempLeasing, action: 'rollback' },
            })
          );
        }
      }
    },
    onSuccess: (data, _variables, context) => {
      logger.debug('✅ Leasing created:', data);

      // ✅ OPTIMIZED: Update cache directly with real data instead of invalidating
      queryClient.setQueryData(
        queryKeys.leasings.lists(),
        (old: Leasing[] = []) => {
          // Replace temp leasing with real data
          return old.map(l =>
            l.id === context?.tempLeasing?.id ? data : l
          );
        }
      );

      // ⚡ DISPATCH success event with real data
      window.dispatchEvent(
        new CustomEvent('leasing-optimistic-update', {
          detail: { leasing: data, action: 'update' },
        })
      );

      // Trigger smart refresh for specific leasing
      window.dispatchEvent(
        new CustomEvent('leasing-list-refresh', {
          detail: { leasingId: data.id },
        })
      );
    },
    onSettled: () => {
      // ✅ OPTIMIZED: Background invalidation only (no blocking refetch)
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.leasings.dashboard(),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
      }, 100);
      // Don't invalidate leasings.all - we updated it directly
    },
  });
}

export function useUpdateLeasing(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateLeasingInput) => updateLeasing({ ...input, id }),
    onMutate: async updatedData => {
      // ⚡ OPTIMISTIC UPDATE: Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.leasings.detail(id),
      });
      await queryClient.cancelQueries({ queryKey: queryKeys.leasings.all });

      // Snapshot previous values
      const previousDetail = queryClient.getQueryData(
        queryKeys.leasings.detail(id)
      );
      const previousList = queryClient.getQueryData(queryKeys.leasings.all);

      // Get current leasing data from list to merge with updates
      const currentLeasing = ((previousList as Leasing[]) || []).find(
        l => l.id === id
      );

      // Optimistically update detail
      queryClient.setQueryData(
        queryKeys.leasings.detail(id),
        (oldData: LeasingDetailResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            leasing: { ...oldData.leasing, ...updatedData },
          };
        }
      );

      // Optimistically update list with merged data
      queryClient.setQueryData(
        queryKeys.leasings.all,
        (oldData: Leasing[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(l => (l.id === id ? { ...l, ...updatedData } : l));
        }
      );

      // ⚡ DISPATCH optimistic update event with MERGED data
      const tempLeasing = currentLeasing
        ? ({ ...currentLeasing, ...updatedData, id } as Leasing)
        : ({ ...updatedData, id } as Leasing);

      window.dispatchEvent(
        new CustomEvent('leasing-optimistic-update', {
          detail: { leasing: tempLeasing, action: 'update' },
        })
      );

      return { previousDetail, previousList, tempLeasing };
    },
    onError: (_err, _updatedData, context) => {
      // ↩️ ROLLBACK: Restore previous data on error
      if (context?.previousDetail) {
        queryClient.setQueryData(
          queryKeys.leasings.detail(id),
          context.previousDetail
        );
      }
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.leasings.all, context.previousList);
      }

      // Dispatch rollback event
      if (context?.tempLeasing) {
        window.dispatchEvent(
          new CustomEvent('leasing-optimistic-update', {
            detail: { leasing: context.tempLeasing, action: 'rollback' },
          })
        );
      }
    },
    onSuccess: updatedLeasing => {
      logger.debug('✅ Leasing updated:', updatedLeasing);

      // ✅ OPTIMIZED: Update cache directly with real data
      queryClient.setQueryData(
        queryKeys.leasings.detail(id),
        (old: LeasingDetailResponse | undefined) => {
          if (!old) return old;
          return { ...old, leasing: updatedLeasing };
        }
      );
      queryClient.setQueryData(
        queryKeys.leasings.all,
        (old: Leasing[] = []) => {
          return old.map(l => (l.id === id ? updatedLeasing : l));
        }
      );

      // ⚡ DISPATCH success event with real data
      window.dispatchEvent(
        new CustomEvent('leasing-optimistic-update', {
          detail: { leasing: updatedLeasing, action: 'update' },
        })
      );

      // Trigger smart refresh for specific leasing
      window.dispatchEvent(
        new CustomEvent('leasing-list-refresh', {
          detail: { leasingId: updatedLeasing.id },
        })
      );

      // ✅ OPTIMIZED: Background invalidation only
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.leasings.dashboard(),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
      }, 100);
      // Don't invalidate detail and list - we updated them directly
    },
  });
}

export function useDeleteLeasing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLeasing,
    onMutate: async deletedId => {
      // ⚡ OPTIMISTIC UPDATE: Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.leasings.all });

      // Snapshot previous value
      const previousLeasings = queryClient.getQueryData(
        queryKeys.leasings.lists()
      );

      // Get the leasing being deleted (for event dispatch)
      const deletedLeasing = ((previousLeasings as Leasing[]) || []).find(
        l => l.id === deletedId
      );

      // Optimistically remove from cache IMMEDIATELY
      queryClient.setQueryData(
        queryKeys.leasings.lists(),
        (old: Leasing[] = []) => old.filter(l => l.id !== deletedId)
      );

      // ⚡ DISPATCH optimistic delete event
      if (deletedLeasing) {
        window.dispatchEvent(
          new CustomEvent('leasing-optimistic-update', {
            detail: { leasing: deletedLeasing, action: 'delete' },
          })
        );
      }

      return { previousLeasings, deletedLeasing };
    },
    onError: (_err, _deletedId, context) => {
      // ↩️ ROLLBACK: Restore previous data on error
      if (context?.previousLeasings) {
        queryClient.setQueryData(
          queryKeys.leasings.lists(),
          context.previousLeasings
        );

        // Dispatch rollback event
        if (context.deletedLeasing) {
          window.dispatchEvent(
            new CustomEvent('leasing-optimistic-update', {
              detail: { leasing: context.deletedLeasing, action: 'rollback' },
            })
          );
        }
      }
    },
    onSuccess: (_data, deletedId) => {
      logger.debug('✅ Leasing deleted:', deletedId);

      // Trigger list refresh (without specific leasingId since it's deleted)
      window.dispatchEvent(
        new CustomEvent('leasing-list-refresh', { detail: {} })
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
