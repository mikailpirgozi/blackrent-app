import { apiService } from '@/services/api';
import type { HandoverProtocol, ReturnProtocol } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

// GET protocols by rental
export function useProtocolsByRental(rentalId: string) {
  return useQuery({
    queryKey: queryKeys.protocols.byRental(rentalId),
    queryFn: () => apiService.getProtocolsByRental(rentalId),
    enabled: !!rentalId,
    staleTime: 30000, // 30 sekúnd
  });
}

// GET handover protocols for rental
export function useHandoverProtocol(rentalId: string) {
  return useQuery({
    queryKey: queryKeys.protocols.handover(rentalId),
    queryFn: async () => {
      const protocols = await apiService.getProtocolsByRental(rentalId);
      return protocols.handoverProtocols[0] || null; // Vráti prvý handover protokol
    },
    enabled: !!rentalId,
  });
}

// GET return protocols for rental
export function useReturnProtocol(rentalId: string) {
  return useQuery({
    queryKey: queryKeys.protocols.return(rentalId),
    queryFn: async () => {
      const protocols = await apiService.getProtocolsByRental(rentalId);
      return protocols.returnProtocols[0] || null; // Vráti prvý return protokol
    },
    enabled: !!rentalId,
  });
}

// CREATE handover protocol
export function useCreateHandoverProtocol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (protocol: HandoverProtocol) =>
      apiService.createHandoverProtocol(protocol),
    onMutate: async newProtocol => {
      // Optimistická aktualizácia
      await queryClient.cancelQueries({
        queryKey: queryKeys.protocols.byRental(newProtocol.rentalId),
      });

      const previousProtocols = queryClient.getQueryData(
        queryKeys.protocols.byRental(newProtocol.rentalId)
      );

      queryClient.setQueryData(
        queryKeys.protocols.byRental(newProtocol.rentalId),
        (old: Record<string, unknown> = {}) => ({
          ...old,
          handoverProtocols: [...(old.handoverProtocols || []), newProtocol],
        })
      );

      return { previousProtocols };
    },
    onError: (err, newProtocol, context) => {
      if (context?.previousProtocols) {
        queryClient.setQueryData(
          queryKeys.protocols.byRental(newProtocol.rentalId),
          context.previousProtocols
        );
      }
    },
    onSuccess: (data, variables) => {
      // Update rental status
      queryClient.setQueryData(
        queryKeys.rentals.detail(variables.rentalId),
        (old: Record<string, unknown> | undefined) =>
          old ? { ...old, status: 'active' } : old
      );

      // Trigger WebSocket
      window.dispatchEvent(
        new CustomEvent('protocol-created', {
          detail: { type: 'handover', data },
        })
      );
    },
    onSettled: (data, error, variables) => {
      // Invaliduj všetky súvisiace queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocols.byRental(variables.rentalId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.rentals.detail(variables.rentalId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.rentals.lists(),
      });
    },
  });
}

// CREATE return protocol - najdôležitejšie pre váš ReturnProtocolForm
export function useCreateReturnProtocol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (protocol: ReturnProtocol) =>
      apiService.createReturnProtocol(protocol),
    onMutate: async newProtocol => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.protocols.byRental(newProtocol.rentalId),
      });

      const previousProtocols = queryClient.getQueryData(
        queryKeys.protocols.byRental(newProtocol.rentalId)
      );

      queryClient.setQueryData(
        queryKeys.protocols.byRental(newProtocol.rentalId),
        (old: Record<string, unknown> = {}) => ({
          ...old,
          returnProtocols: [...(old.returnProtocols || []), newProtocol],
        })
      );

      return { previousProtocols };
    },
    onError: (err, newProtocol, context) => {
      if (context?.previousProtocols) {
        queryClient.setQueryData(
          queryKeys.protocols.byRental(newProtocol.rentalId),
          context.previousProtocols
        );
      }
    },
    onSuccess: (data, variables) => {
      // Update rental status to completed
      queryClient.setQueryData(
        queryKeys.rentals.detail(variables.rentalId),
        (old: Record<string, unknown> | undefined) =>
          old ? { ...old, status: 'finished' } : old
      );

      // Update vehicle status to available
      if (variables.rental?.vehicleId) {
        queryClient.setQueryData(
          queryKeys.vehicles.detail(variables.rental.vehicleId),
          (old: Record<string, unknown> | undefined) =>
            old ? { ...old, status: 'available' } : old
        );
      }

      // Trigger WebSocket
      window.dispatchEvent(
        new CustomEvent('protocol-created', {
          detail: { type: 'return', data },
        })
      );
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocols.byRental(variables.rentalId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.rentals.detail(variables.rentalId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.rentals.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.all,
      });
    },
  });
}

// UPDATE handover protocol - using generic PUT method
export function useUpdateHandoverProtocol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (protocol: HandoverProtocol) =>
      apiService.put(
        `/protocols/handover/${protocol.id}`,
        protocol as unknown as Record<string, unknown>
      ),
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocols.byRental(variables.rentalId),
      });
    },
  });
}

// UPDATE return protocol - using generic PUT method
export function useUpdateReturnProtocol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (protocol: ReturnProtocol) =>
      apiService.put(
        `/protocols/return/${protocol.id}`,
        protocol as unknown as Record<string, unknown>
      ),
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocols.byRental(variables.rentalId),
      });
    },
  });
}
