import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import type { Platform } from '@/types';

// ============================================================================
// 🌐 PLATFORM MANAGEMENT HOOKS
// ============================================================================

/**
 * Get all platforms (super_admin only)
 */
export function usePlatforms() {
  return useQuery({
    queryKey: ['platforms'],
    queryFn: async () => {
      const response = await apiService.get<Platform[]>('/platforms');
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get platform by ID
 */
export function usePlatform(id: string) {
  return useQuery({
    queryKey: ['platforms', id],
    queryFn: async () => {
      const response = await apiService.get<Platform>(`/platforms/${id}`);
      return response;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get platform statistics
 */
export function usePlatformStats(id: string) {
  return useQuery({
    queryKey: ['platforms', id, 'stats'],
    queryFn: async () => {
      const response = await apiService.get<{
        totalCompanies: number;
        totalUsers: number;
        totalVehicles: number;
        totalRentals: number;
      }>(`/platforms/${id}/stats`);
      return response;
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Create platform mutation
 */
export function useCreatePlatform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      displayName?: string;
      subdomain?: string;
      logoUrl?: string;
      settings?: Record<string, unknown>;
    }) => {
      const response = await apiService.post<Platform>('/platforms', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
    },
  });
}

/**
 * Update platform mutation
 */
export function useUpdatePlatform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        name: string;
        displayName: string;
        subdomain: string;
        logoUrl: string;
        settings: Record<string, unknown>;
        isActive: boolean;
      }>;
    }) => {
      const response = await apiService.put<Platform>(`/platforms/${id}`, data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
      queryClient.invalidateQueries({ queryKey: ['platforms', variables.id] });
    },
  });
}

/**
 * Delete platform mutation
 */
export function useDeletePlatform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiService.delete(`/platforms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
    },
  });
}

/**
 * Assign company to platform mutation
 */
export function useAssignCompanyToPlatform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      platformId,
      companyId,
    }: {
      platformId: string;
      companyId: string;
    }) => {
      await apiService.post(
        `/platforms/${platformId}/assign-company/${companyId}`,
        {}
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
      queryClient.invalidateQueries({
        queryKey: ['platforms', variables.platformId, 'stats'],
      });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}
