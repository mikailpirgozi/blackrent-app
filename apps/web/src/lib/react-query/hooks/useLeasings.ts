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

// ===================================================================
// API BASE URL
// ===================================================================

const API_BASE = '/api/leasings';

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

  const response = await fetch(`${API_BASE}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch leasings');
  const data = await response.json();
  return data.data;
}

async function fetchLeasing(id: string): Promise<LeasingDetailResponse> {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
  };

  const [leasing, schedule, documents] = await Promise.all([
    fetch(`${API_BASE}/${id}`, { headers })
      .then(r => r.json())
      .then(d => d.data),
    fetch(`${API_BASE}/${id}/schedule`, { headers })
      .then(r => r.json())
      .then(d => d.data),
    fetch(`${API_BASE}/${id}/documents`, { headers })
      .then(r => r.json())
      .then(d => d.data),
  ]);

  return { leasing, paymentSchedule: schedule, documents };
}

async function fetchPaymentSchedule(
  leasingId: string
): Promise<PaymentScheduleItem[]> {
  const response = await fetch(`${API_BASE}/${leasingId}/schedule`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch payment schedule');
  const data = await response.json();
  return data.data;
}

async function fetchDashboard(): Promise<LeasingDashboard> {
  const response = await fetch(`${API_BASE}/dashboard`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch dashboard');
  const data = await response.json();
  return data.data;
}

async function createLeasing(input: CreateLeasingInput): Promise<Leasing> {
  console.log('📤 API Request:', API_BASE, input);

  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
    },
    body: JSON.stringify(input),
  });

  console.log('📥 API Response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ API Error:', errorData);
    throw new Error(
      errorData.error || `Failed to create leasing (${response.status})`
    );
  }

  const data = await response.json();
  console.log('✅ API Success:', data);
  return data.data;
}

async function updateLeasing(
  id: string,
  input: UpdateLeasingInput
): Promise<Leasing> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Failed to update leasing');
  const data = await response.json();
  return data.data;
}

async function deleteLeasing(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
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
    `${API_BASE}/${leasingId}/schedule/${installmentNumber}/pay`,
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
    `${API_BASE}/${leasingId}/schedule/${installmentNumber}/pay`,
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
  const response = await fetch(`${API_BASE}/${leasingId}/schedule/bulk-pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Failed to bulk mark payments');
  const data = await response.json();
  return data.data;
}

// ===================================================================
// QUERY HOOKS
// ===================================================================

export function useLeasings(filters?: LeasingFilters) {
  return useQuery({
    queryKey: ['leasings', filters],
    queryFn: () => fetchLeasings(filters),
    staleTime: 5 * 60 * 1000, // 5 minút
  });
}

export function useLeasing(id: string | undefined) {
  return useQuery({
    queryKey: ['leasing', id],
    queryFn: () => fetchLeasing(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePaymentSchedule(leasingId: string | undefined) {
  return useQuery({
    queryKey: ['payment-schedule', leasingId],
    queryFn: () => fetchPaymentSchedule(leasingId!),
    enabled: !!leasingId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLeasingDashboard() {
  return useQuery({
    queryKey: ['leasing-dashboard'],
    queryFn: fetchDashboard,
    staleTime: 2 * 60 * 1000, // 2 minúty
  });
}

// ===================================================================
// MUTATION HOOKS
// ===================================================================

export function useCreateLeasing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLeasing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leasings'] });
      queryClient.invalidateQueries({ queryKey: ['leasing-dashboard'] });
    },
  });
}

export function useUpdateLeasing(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateLeasingInput) => updateLeasing(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leasing', id] });
      queryClient.invalidateQueries({ queryKey: ['leasings'] });
      queryClient.invalidateQueries({ queryKey: ['leasing-dashboard'] });
    },
  });
}

export function useDeleteLeasing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLeasing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leasings'] });
      queryClient.invalidateQueries({ queryKey: ['leasing-dashboard'] });
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
        queryKey: ['payment-schedule', leasingId],
      });
      queryClient.invalidateQueries({ queryKey: ['leasing', leasingId] });
      queryClient.invalidateQueries({ queryKey: ['leasings'] });
      queryClient.invalidateQueries({ queryKey: ['leasing-dashboard'] });
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
        queryKey: ['payment-schedule', leasingId],
      });
      queryClient.invalidateQueries({ queryKey: ['leasing', leasingId] });
      queryClient.invalidateQueries({ queryKey: ['leasings'] });
      queryClient.invalidateQueries({ queryKey: ['leasing-dashboard'] });
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
        queryKey: ['payment-schedule', leasingId],
      });
      queryClient.invalidateQueries({ queryKey: ['leasing', leasingId] });
      queryClient.invalidateQueries({ queryKey: ['leasings'] });
      queryClient.invalidateQueries({ queryKey: ['leasing-dashboard'] });
    },
  });
}
