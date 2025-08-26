/**
 * Custom hook pre Pending Rentals operácie
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

import { useState, useCallback } from 'react';
import { apiService } from '../../../services/api';
import { Rental } from '../../../types';

export const usePendingRentals = () => {
  const [pendingRentals, setPendingRentals] = useState<Rental[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [expandedRentals, setExpandedRentals] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchPendingRentals = useCallback(async (): Promise<Rental[]> => {
    try {
      setPendingLoading(true);
      setError(null);
      const rentals = await apiService.getPendingAutomaticRentals();
      console.log('✅ Loaded pending rentals:', rentals?.length || 0);
      setPendingRentals(rentals || []);
      return rentals || [];
    } catch (err: any) {
      console.error('❌ Error fetching pending rentals:', err);
      setError('Nepodarilo sa načítať čakajúce prenájmy');
      setPendingRentals([]);
      return [];
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const handleApproveRental = useCallback(async (rentalId: string): Promise<boolean> => {
    try {
      setActionLoading(rentalId);
      await apiService.approveAutomaticRental(rentalId);
      // Remove from pending list
      setPendingRentals(prev => prev.filter(r => r.id !== rentalId));
      setSuccess('Prenájom bol úspešne schválený');
      return true;
    } catch (err: any) {
      console.error('Error approving rental:', err);
      setError('Nepodarilo sa schváliť prenájom');
      return false;
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleRejectRental = useCallback(async (rentalId: string, reason: string): Promise<boolean> => {
    try {
      setActionLoading(rentalId);
      await apiService.rejectAutomaticRental(rentalId, reason);
      // Remove from pending list
      setPendingRentals(prev => prev.filter(r => r.id !== rentalId));
      setSuccess('Prenájom bol zamietnutý');
      return true;
    } catch (err: any) {
      console.error('Error rejecting rental:', err);
      setError('Nepodarilo sa zamietnuť prenájom');
      return false;
    } finally {
      setActionLoading(null);
    }
  }, []);

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
    actionLoading,
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
