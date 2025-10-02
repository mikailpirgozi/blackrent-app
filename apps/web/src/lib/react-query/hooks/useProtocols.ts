import { apiService } from '@/services/api';
import type { HandoverProtocol, ReturnProtocol } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

// GET all protocols (for statistics)
export function useAllProtocols() {
  return useQuery({
    queryKey: queryKeys.protocols.list(),
    queryFn: () => apiService.getAllProtocolsForStats(),
    staleTime: 1 * 60 * 1000, // 1 minúta
    refetchInterval: 60000, // Auto-refresh každú minútu
  });
}

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

// GET bulk protocol status for all rentals
export function useBulkProtocolStatus() {
  return useQuery({
    queryKey: queryKeys.protocols.bulkStatus(),
    queryFn: () => apiService.getBulkProtocolStatus(),
    staleTime: 60000, // 1 minúta
    gcTime: 5 * 60000, // 5 minút (predtým cacheTime)
  });
}

// GET all protocols for statistics
export function useAllProtocolsForStats() {
  return useQuery({
    queryKey: queryKeys.protocols.allForStats,
    queryFn: () => apiService.getAllProtocolsForStats(),
    staleTime: 60000, // 1 minúta
    gcTime: 5 * 60000, // 5 minút (predtým cacheTime)
  });
}

// CREATE handover protocol
export function useCreateHandoverProtocol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (protocol: HandoverProtocol) => {
      const result = await apiService.createHandoverProtocol(protocol);
      console.log('🔍 useCreateHandoverProtocol result:', result);

      // Backend vracia { success, protocol, email, pdfProxyUrl }
      type ProtocolResponse = {
        success: boolean;
        protocol: HandoverProtocol;
        email?: { sent: boolean; recipient?: string; error?: string };
        pdfProxyUrl?: string;
      };

      const response = result as
        | ProtocolResponse
        | HandoverProtocol
        | { success: boolean };

      if (
        response &&
        'success' in response &&
        response.success &&
        'protocol' in response
      ) {
        console.log('🔍 Full protocol response received:', {
          hasEmail: !!('email' in response && response.email),
          hasPdfUrl: !!('pdfProxyUrl' in response && response.pdfProxyUrl),
        });
        // Vrátime celý response objekt
        return response as ProtocolResponse;
      }

      // Fallback pre starý formát alebo prázdnu response
      if (
        result &&
        (result as { success?: boolean; id?: string }).success === true &&
        !result.id
      ) {
        console.log('🔍 Backend returned success only, using optimistic data');
        return { success: true, protocol }; // Vrátime objekt s protokolom
      }

      // Ak dostaneme priamo protokol, zabalíme ho
      if (result && 'id' in result) {
        return { success: true, protocol: result as HandoverProtocol };
      }

      return { success: true, protocol }; // Fallback na pôvodný protokol
    },
    onMutate: async _____newProtocol => {
      // Optimistická aktualizácia
      await queryClient.cancelQueries({
        queryKey: queryKeys.protocols.byRental(_____newProtocol.rentalId),
      });

      const previousProtocols = queryClient.getQueryData(
        queryKeys.protocols.byRental(_____newProtocol.rentalId)
      );

      queryClient.setQueryData(
        queryKeys.protocols.byRental(_____newProtocol.rentalId),
        (old: Record<string, unknown> = {}) => ({
          ...old,
          handoverProtocols: [
            ...((old.handoverProtocols as unknown[]) || []),
            _____newProtocol,
          ],
        })
      );

      return { previousProtocols };
    },
    onError: (_err, ______newProtocol, context) => {
      if (context?.previousProtocols) {
        queryClient.setQueryData(
          queryKeys.protocols.byRental(______newProtocol.rentalId),
          context.previousProtocols
        );
      }
    },
    onSuccess: (data, variables) => {
      console.log('🔍 onSuccess data:', data);

      // Extrahuj protokol z response
      const protocol =
        (data as { protocol?: HandoverProtocol }).protocol || data;

      // Update rental status
      queryClient.setQueryData(
        queryKeys.rentals.detail(variables.rentalId),
        (old: Record<string, unknown> | undefined) =>
          old ? { ...old, status: 'active' } : old
      );

      // Trigger WebSocket
      window.dispatchEvent(
        new (window as any).CustomEvent('protocol-created', {
          detail: { type: 'handover', data: protocol },
        })
      );
    },
    onSettled: (_data, _error, variables) => {
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
    onMutate: async _____newProtocol => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.protocols.byRental(_____newProtocol.rentalId),
      });

      const previousProtocols = queryClient.getQueryData(
        queryKeys.protocols.byRental(_____newProtocol.rentalId)
      );

      queryClient.setQueryData(
        queryKeys.protocols.byRental(_____newProtocol.rentalId),
        (old: Record<string, unknown> = {}) => ({
          ...old,
          returnProtocols: [
            ...((old.returnProtocols as unknown[]) || []),
            _____newProtocol,
          ],
        })
      );

      return { previousProtocols };
    },
    onError: (_err, ______newProtocol, context) => {
      if (context?.previousProtocols) {
        queryClient.setQueryData(
          queryKeys.protocols.byRental(______newProtocol.rentalId),
          context.previousProtocols
        );
      }
    },
    onSuccess: (_data, variables) => {
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
        new (window as any).CustomEvent('protocol-created', {
          detail: { type: 'return', data: _data },
        })
      );
    },
    onSettled: (_data, _error, variables) => {
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
    onSettled: (_data, _error, variables) => {
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
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocols.byRental(variables.rentalId),
      });
    },
  });
}
