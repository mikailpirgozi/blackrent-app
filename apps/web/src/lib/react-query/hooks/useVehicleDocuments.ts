import { apiService } from '@/services/api';
import type { VehicleDocument } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Declare browser APIs
declare const CustomEvent: any;

// GET vehicle documents
export function useVehicleDocuments(vehicleId?: string) {
  return useQuery({
    queryKey: ['vehicleDocuments', vehicleId],
    queryFn: () => {
      console.log('🔍 FETCHING VehicleDocuments from API...');
      return apiService.getVehicleDocuments(vehicleId);
    },
    enabled: true, // Always enabled, vehicleId is optional
    staleTime: 0, // Vždy fresh data po invalidácii
    gcTime: 0, // ✅ CRITICAL FIX: Okamžite vymaž staré data z cache (no GC cache!)
    refetchOnMount: 'always', // ✅ Vždy refetch pri mount
  });
}

// CREATE vehicle document
export function useCreateVehicleDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (document: VehicleDocument) =>
      apiService.createVehicleDocument(document),
    onMutate: async _newDocument => {
      await queryClient.cancelQueries({
        queryKey: ['vehicleDocuments'],
      });

      const previousDocuments = queryClient.getQueryData([
        'vehicleDocuments',
        _newDocument.vehicleId,
      ]);

      const optimisticDocument = {
        ..._newDocument,
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
      };

      queryClient.setQueryData(
        ['vehicleDocuments', _newDocument.vehicleId],
        (old: VehicleDocument[] = []) => [
          ...old,
          optimisticDocument as VehicleDocument,
        ]
      );

      // Also update the general vehicle documents query
      queryClient.setQueryData(
        ['vehicleDocuments'],
        (old: VehicleDocument[] = []) => [
          ...old,
          optimisticDocument as VehicleDocument,
        ]
      );

      return { previousDocuments };
    },
    onError: (_err, __newDocument, context) => {
      if (context?.previousDocuments) {
        queryClient.setQueryData(
          ['vehicleDocuments', __newDocument.vehicleId],
          context.previousDocuments
        );
      }
    },
    onSuccess: (_data, variables) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('vehicle-document-created', { detail: variables })
      );
    },
    onSettled: async () => {
      // ✅ FIX: Invalidate ALL vehicleDocuments queries + immediate refetch
      await queryClient.invalidateQueries({
        predicate: query => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && queryKey[0] === 'vehicleDocuments';
        },
        refetchType: 'active',
      });
    },
  });
}

// UPDATE vehicle document
export function useUpdateVehicleDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (document: VehicleDocument) => {
      console.log('🚀 UPDATE VEHICLE DOCUMENT: Sending to server:', document);
      return apiService.updateVehicleDocument(document);
    },
    // ❌ DISABLED: Optimistic updates removed - they conflict with staleTime=0
    // Optimistic updates cause: Update sets cache → invalidation refetches → but cache is "fresh" → no refetch!
    // Google/Facebook approach: NO optimistic updates, just wait for server response
    onSuccess: (_data, variables) => {
      console.log('✅ UPDATE VEHICLE DOCUMENT SUCCESS:', _data);
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('vehicle-document-updated', { detail: variables })
      );
    },
    onError: error => {
      console.error('❌ UPDATE VEHICLE DOCUMENT ERROR:', error);
    },
    onSettled: async () => {
      console.log('🔄 UPDATE VEHICLE DOCUMENT: Invalidating cache...');
      // ✅ FIX: Invalidate AND refetch immediately
      // React Query v5: invalidate alone doesn't refetch if component isn't active
      await queryClient.invalidateQueries({
        predicate: query => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && queryKey[0] === 'vehicleDocuments';
        },
        refetchType: 'active', // Refetch active queries immediately
      });
      console.log('✅ All vehicleDocuments queries invalidated + refetched');
    },
  });
}

// DELETE vehicle document
export function useDeleteVehicleDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteVehicleDocument(id),
    onMutate: async deletedId => {
      await queryClient.cancelQueries({
        queryKey: ['vehicleDocuments'],
      });

      // Find document to get vehicleId for cache update
      const allDocuments = queryClient.getQueriesData({
        queryKey: ['vehicleDocuments'],
      });

      let vehicleId: string | null = null;
      for (const [, data] of allDocuments) {
        if (Array.isArray(data)) {
          const document = data.find(
            (d: VehicleDocument) => d.id === deletedId
          );
          if (document) {
            vehicleId = document.vehicleId;
            break;
          }
        }
      }

      const previousDocuments = queryClient.getQueryData([
        'vehicleDocuments',
        vehicleId,
      ]);

      queryClient.setQueryData(
        ['vehicleDocuments', vehicleId],
        (old: VehicleDocument[] = []) => old.filter(d => d.id !== deletedId)
      );

      // Also update the general vehicle documents query
      queryClient.setQueryData(
        ['vehicleDocuments'],
        (old: VehicleDocument[] = []) => old.filter(d => d.id !== deletedId)
      );

      return { previousDocuments, vehicleId };
    },
    onError: (_err, _deletedId, context) => {
      if (context?.previousDocuments && context?.vehicleId) {
        queryClient.setQueryData(
          ['vehicleDocuments', context.vehicleId],
          context.previousDocuments
        );
      }
    },
    onSuccess: (_data, variables) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('vehicle-document-deleted', {
          detail: { id: variables },
        })
      );
    },
    onSettled: async () => {
      // ✅ FIX: Invalidate ALL vehicleDocuments queries + immediate refetch
      await queryClient.invalidateQueries({
        predicate: query => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && queryKey[0] === 'vehicleDocuments';
        },
        refetchType: 'active',
      });
    },
  });
}
