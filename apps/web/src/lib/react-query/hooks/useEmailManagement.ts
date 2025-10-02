import { apiService } from '@/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

// Email Management interfaces
export interface EmailFilters {
  status?: string;
  sender?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface EmailData {
  id: string;
  email_id: string;
  subject: string;
  sender: string;
  received_at: string;
  processed_at?: string;
  status: string;
  action_taken?: string;
  confidence_score?: number;
  error_message?: string;
  parsed_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EmailStats {
  total: number;
  pending: number;
  processed: number;
  archived: number;
  rejected: number;
  error: number;
}

// GET emails with filters
export function useEmailManagement(filters?: EmailFilters) {
  return useQuery({
    queryKey: queryKeys.emailManagement.list(
      filters as Record<string, unknown>
    ),
    queryFn: () => apiService.getEmailManagement(filters),
    staleTime: 30 * 1000, // 30 sekúnd - emails sa menia často
    refetchInterval: 60000, // Auto-refresh každú minútu
  });
}

// GET email stats
export function useEmailStats() {
  return useQuery({
    queryKey: queryKeys.emailManagement.stats(),
    queryFn: () => apiService.getEmailStats(),
    staleTime: 1 * 60 * 1000, // 1 minúta
    refetchInterval: 120000, // Auto-refresh každé 2 minúty
  });
}

// GET single email
export function useEmail(id: string) {
  return useQuery({
    queryKey: queryKeys.emailManagement.detail(id),
    queryFn: () => apiService.getEmail(id),
    enabled: !!id,
  });
}

// ARCHIVE email
export function useArchiveEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.archiveEmail(id),
    onMutate: async emailId => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.emailManagement.all,
      });

      const previousEmails = queryClient.getQueryData(
        queryKeys.emailManagement.lists()
      );

      // Optimistically update email status
      queryClient.setQueryData(
        queryKeys.emailManagement.lists(),
        (old: EmailData[] = []) =>
          old.map(email =>
            email.id === emailId ? { ...email, status: 'archived' } : email
          )
      );

      return { previousEmails };
    },
    onError: (_err, _emailId, context) => {
      if (context?.previousEmails) {
        queryClient.setQueryData(
          queryKeys.emailManagement.lists(),
          context.previousEmails
        );
      }
    },
    onSuccess: (_data, emailId) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('email-archived', { detail: { id: emailId, data: _data } })
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.emailManagement.all,
      });
    },
  });
}

// REJECT email
export function useRejectEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.rejectEmail(id),
    onMutate: async emailId => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.emailManagement.all,
      });

      const previousEmails = queryClient.getQueryData(
        queryKeys.emailManagement.lists()
      );

      // Optimistically update email status
      queryClient.setQueryData(
        queryKeys.emailManagement.lists(),
        (old: EmailData[] = []) =>
          old.map(email =>
            email.id === emailId ? { ...email, status: 'rejected' } : email
          )
      );

      return { previousEmails };
    },
    onError: (_err, _emailId, context) => {
      if (context?.previousEmails) {
        queryClient.setQueryData(
          queryKeys.emailManagement.lists(),
          context.previousEmails
        );
      }
    },
    onSuccess: (_data, emailId) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('email-rejected', { detail: { id: emailId, data: _data } })
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.emailManagement.all,
      });
    },
  });
}

// PROCESS email
export function useProcessEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.processEmail(id),
    onMutate: async emailId => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.emailManagement.all,
      });

      const previousEmails = queryClient.getQueryData(
        queryKeys.emailManagement.lists()
      );

      // Optimistically update email status
      queryClient.setQueryData(
        queryKeys.emailManagement.lists(),
        (old: EmailData[] = []) =>
          old.map(email =>
            email.id === emailId ? { ...email, status: 'processing' } : email
          )
      );

      return { previousEmails };
    },
    onError: (_err, _emailId, context) => {
      if (context?.previousEmails) {
        queryClient.setQueryData(
          queryKeys.emailManagement.lists(),
          context.previousEmails
        );
      }
    },
    onSuccess: (_data, emailId) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('email-processed', { detail: { id: emailId, data: _data } })
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.emailManagement.all,
      });
      // Also invalidate rentals since processing might create new rentals
      queryClient.invalidateQueries({
        queryKey: queryKeys.rentals.all,
      });
    },
  });
}

// BULK operations
export function useBulkArchiveEmails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => apiService.bulkArchiveEmails(ids),
    onSuccess: (_data, emailIds) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('emails-bulk-archived', {
          detail: { ids: emailIds, data: _data },
        })
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.emailManagement.all,
      });
    },
  });
}

export function useBulkRejectEmails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => apiService.bulkRejectEmails(ids),
    onSuccess: (_data, emailIds) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('emails-bulk-rejected', {
          detail: { ids: emailIds, data: _data },
        })
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.emailManagement.all,
      });
    },
  });
}

export function useBulkProcessEmails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => apiService.bulkProcessEmails(ids),
    onSuccess: (_data, emailIds) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('emails-bulk-processed', {
          detail: { ids: emailIds, data: _data },
        })
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.emailManagement.all,
      });
      // Also invalidate rentals since processing might create new rentals
      queryClient.invalidateQueries({
        queryKey: queryKeys.rentals.all,
      });
    },
  });
}

// GET archived emails
export function useArchivedEmails(filters?: {
  limit?: number;
  offset?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: queryKeys.emailManagement.archived(filters),
    queryFn: () => apiService.getArchivedEmails(filters),
    staleTime: 1 * 60 * 1000, // 1 minúta
  });
}

// GET IMAP status
export function useImapStatus() {
  return useQuery({
    queryKey: queryKeys.emailManagement.imapStatus(),
    queryFn: () => apiService.getImapStatus(),
    staleTime: 30 * 1000, // 30 sekúnd
    refetchInterval: 30000, // Auto-refresh každých 30 sekúnd
  });
}

// GET pending automatic rentals
export function usePendingAutomaticRentals() {
  return useQuery({
    queryKey: queryKeys.emailManagement.pendingRentals(),
    queryFn: () => apiService.getPendingAutomaticRentals(),
    staleTime: 30 * 1000, // 30 sekúnd
    refetchInterval: 60000, // Auto-refresh každú minútu
  });
}
