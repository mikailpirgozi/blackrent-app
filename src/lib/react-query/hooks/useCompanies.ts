import { apiService } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

// GET companies
export function useCompanies() {
  return useQuery({
    queryKey: queryKeys.companies.list(),
    queryFn: () => apiService.getCompanies(),
    staleTime: 10 * 60 * 1000, // 10 minút - companies sa nemenia často
  });
}
