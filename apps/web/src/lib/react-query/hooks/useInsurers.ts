import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { apiService } from '@/services/api';
import type { Insurer } from '@/types';

// GET insurers
export function useInsurers() {
  return useQuery({
    queryKey: queryKeys.insurers.list(),
    queryFn: () => apiService.getInsurers(),
    staleTime: 0, // Vždy fresh data po invalidácii
  });
}

// CREATE insurer
export function useCreateInsurer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (insurer: Insurer) => apiService.createInsurer(insurer),
    onMutate: async newInsurer => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.insurers.all,
      });

      const previousInsurers = queryClient.getQueryData(
        queryKeys.insurers.list()
      );

      const optimisticInsurer = {
        ...newInsurer,
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
      };

      queryClient.setQueryData(
        queryKeys.insurers.list(),
        (old: Insurer[] = []) => [...old, optimisticInsurer as Insurer]
      );

      return { previousInsurers };
    },
    onError: (err, newInsurer, context) => {
      if (context?.previousInsurers) {
        queryClient.setQueryData(
          queryKeys.insurers.list(),
          context.previousInsurers
        );
      }
    },
    onSuccess: (data, variables) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('insurer-created', { detail: variables })
      );
    },
    onSettled: () => {
      // Always invalidate to get fresh data from server
      queryClient.invalidateQueries({
        queryKey: queryKeys.insurers.all,
      });
    },
  });
}

// UPDATE insurer - not implemented in API yet
// export function useUpdateInsurer() {
//   // TODO: Implement when API supports it
// }

// DELETE insurer
export function useDeleteInsurer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteInsurer(id),
    onMutate: async deletedId => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.insurers.all,
      });

      const previousInsurers = queryClient.getQueryData(
        queryKeys.insurers.list()
      );

      queryClient.setQueryData(
        queryKeys.insurers.list(),
        (old: Insurer[] = []) => old.filter(i => i.id !== deletedId)
      );

      return { previousInsurers };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousInsurers) {
        queryClient.setQueryData(
          queryKeys.insurers.list(),
          context.previousInsurers
        );
      }
    },
    onSuccess: (data, variables) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('insurer-deleted', { detail: { id: variables } })
      );
    },
    onSettled: () => {
      // Always invalidate to get fresh data from server
      queryClient.invalidateQueries({
        queryKey: queryKeys.insurers.all,
      });
    },
  });
}
