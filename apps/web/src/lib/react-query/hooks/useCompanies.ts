import { apiService } from '@/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

// GET companies
export function useCompanies() {
  return useQuery({
    queryKey: queryKeys.companies.list(),
    queryFn: () => apiService.getCompanies(),
    staleTime: 10 * 60 * 1000, // 10 minút - companies sa nemenia často
    gcTime: 15 * 60 * 1000, // 15 minút - keep in memory
    refetchOnMount: false, // ⚡ Don't refetch if data is fresh
    refetchOnWindowFocus: true, // ✅ Refetch when user returns to tab
  });
}

// CREATE company
export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyData: {
      id: string;
      name: string;
      commissionRate: number;
      isActive: boolean;
      createdAt: Date;
    }) => apiService.createCompany(companyData),
    onSuccess: () => {
      // Invalidate companies list to refetch with new company
      queryClient.invalidateQueries({
        queryKey: queryKeys.companies.all,
      });
    },
  });
}
