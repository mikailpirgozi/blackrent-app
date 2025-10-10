/**
 * Custom hook pre Pending Rentals operácie
 * ✅ MIGRATED: Refaktorované na React Query mutations pre real-time cache updates
 */

import { useCallback, useState } from 'react';
import {
  usePendingAutomaticRentals,
  useApproveAutomaticRental,
  useRejectAutomaticRental,
} from '@/lib/react-query/hooks/useEmailManagement';

export const usePendingRentals = () => {
  // React Query hooks
  const {
    data: pendingRentals = [],
    isLoading: pendingLoading,
    refetch: fetchPendingRentals,
  } = usePendingAutomaticRentals();
  const approveMutation = useApproveAutomaticRental();
  const rejectMutation = useRejectAutomaticRental();

  // Local UI state
  const [expandedRentals, setExpandedRentals] = useState<Set<string>>(
    new Set()
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Action loading - track which rental is being processed
  const actionLoading =
    approveMutation.isPending || rejectMutation.isPending
      ? (approveMutation.variables ||
          (rejectMutation.variables as { rentalId: string } | undefined)
            ?.rentalId ||
          null)
      : null;

  const handleApproveRental = useCallback(
    async (rentalId: string): Promise<boolean> => {
      try {
        await approveMutation.mutateAsync(rentalId);
        setSuccess('Prenájom bol úspešne schválený');
        setError(null);
        return true;
      } catch (error: unknown) {
        console.error('Error approving rental:', error);
        setError('Nepodarilo sa schváliť prenájom');
        setSuccess(null);
        return false;
      }
    },
    [approveMutation]
  );

  const handleRejectRental = useCallback(
    async (rentalId: string, reason: string): Promise<boolean> => {
      try {
        await rejectMutation.mutateAsync({ rentalId, reason });
        setSuccess('Prenájom bol zamietnutý');
        setError(null);
        return true;
      } catch (error: unknown) {
        console.error('Error rejecting rental:', error);
        setError('Nepodarilo sa zamietnuť prenájom');
        setSuccess(null);
        return false;
      }
    },
    [rejectMutation]
  );

  const toggleRentalExpansion = useCallback((rentalId: string) => {
    setExpandedRentals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rentalId)) {
        newSet.delete(rentalId);
      } else {
        newSet.add(rentalId);
      }
      return newSet;
    });
  }, []);

  return {
    // State
    pendingRentals,
    pendingLoading,
    expandedRentals,
    actionLoading: typeof actionLoading === 'string' ? actionLoading : null,
    error,
    success,
    setError,
    setSuccess,

    // Operations
    fetchPendingRentals,
    handleApproveRental,
    handleRejectRental,
    toggleRentalExpansion,
  };
};
