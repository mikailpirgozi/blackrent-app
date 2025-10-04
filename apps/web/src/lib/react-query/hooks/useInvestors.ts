import { apiService } from '@/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

// Types
interface Investor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  personalId?: string;
  address?: string;
  isActive: boolean;
  notes: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface InvestorShare {
  id: string;
  companyId: string;
  investorId: string;
  ownershipPercentage: number;
  investmentAmount?: number;
  investmentDate: Date;
  isPrimaryContact: boolean;
  profitSharePercentage?: number;
  notes?: string;
  investor?: Investor;
}

// GET all investors
export function useInvestors() {
  return useQuery({
    queryKey: queryKeys.investors.list(),
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/company-investors`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
          },
        }
      );
      const result = await response.json();
      return result.success ? result.data : [];
    },
    // ⚡ OPTIMIZED: Smart caching
    staleTime: 10 * 60 * 1000, // 10 minút
    gcTime: 15 * 60 * 1000, // 15 minút
    refetchOnMount: false,
    refetchOnWindowFocus: true,
  });
}

// GET shares for a specific company
export function useCompanyShares(companyId?: string) {
  return useQuery({
    queryKey: queryKeys.investors.shares(companyId || 'all'),
    queryFn: async () => {
      if (!companyId) return [];

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/company-investors/${companyId}/shares`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
          },
        }
      );
      const result = await response.json();
      return result.success ? result.data : [];
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: true,
  });
}

// GET all shares (across all companies) - OPTIMIZED
export function useAllShares(companyIds: string[] = []) {
  return useQuery({
    queryKey: queryKeys.investors.allShares(companyIds),
    queryFn: async () => {
      if (companyIds.length === 0) return [];

      // ⚡ PARALLEL requests instead of serial
      const requests = companyIds.map(companyId =>
        fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/company-investors/${companyId}/shares`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
            },
          }
        ).then(res => res.json())
      );

      const results = await Promise.all(requests);
      const allShares = results
        .filter(result => result.success)
        .flatMap(result => result.data);

      return allShares;
    },
    enabled: companyIds.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: true,
  });
}

// CREATE investor
export function useCreateInvestor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (investorData: {
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      notes?: string;
      isActive?: boolean;
    }) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/company-investors`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
          },
          body: JSON.stringify(investorData),
        }
      );
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create investor');
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate investors list
      queryClient.invalidateQueries({
        queryKey: queryKeys.investors.all,
      });
    },
  });
}

// CREATE share
export function useCreateShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shareData: {
      companyId: string;
      investorId: string;
      ownershipPercentage: number;
      investmentAmount?: number;
      isPrimaryContact: boolean;
      profitSharePercentage?: number;
    }) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/company-investors/shares`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
          },
          body: JSON.stringify(shareData),
        }
      );
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create share');
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate shares queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.investors.all,
      });
    },
  });
}

export type { Investor, InvestorShare };
