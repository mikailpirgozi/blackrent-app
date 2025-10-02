import { apiService } from '@/services/api';
import type { VehicleDocument } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// GET vehicle documents
export function useVehicleDocuments(vehicleId?: string) {
  return useQuery({
    queryKey: ['vehicleDocuments', vehicleId],
    queryFn: () => apiService.getVehicleDocuments(vehicleId),
    enabled: true, // Always enabled, vehicleId is optional
    staleTime: 0, // Vždy fresh data po invalidácii
  });
}

// CREATE vehicle document
export function useCreateVehicleDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (document: VehicleDocument) =>
      apiService.createVehicleDocument(document),
    onMutate: async newDocument => {
      await queryClient.cancelQueries({
        queryKey: ['vehicleDocuments'],
      });

      const previousDocuments = queryClient.getQueryData([
        'vehicleDocuments',
        newDocument.vehicleId,
      ]);

      const optimisticDocument = {
        ...newDocument,
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
      };

      queryClient.setQueryData(
        ['vehicleDocuments', newDocument.vehicleId],
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
    onError: (err, newDocument, context) => {
      if (context?.previousDocuments) {
        queryClient.setQueryData(
          ['vehicleDocuments', newDocument.vehicleId],
          context.previousDocuments
        );
      }
    },
    onSuccess: (data, variables) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('vehicle-document-created', { detail: variables })
      );
    },
    onSettled: () => {
      // Always invalidate to get fresh data from server
      queryClient.invalidateQueries({
        queryKey: ['vehicleDocuments'],
      });
    },
  });
}

// UPDATE vehicle document
export function useUpdateVehicleDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (document: VehicleDocument) =>
      apiService.updateVehicleDocument(document),
    onMutate: async updatedDocument => {
      await queryClient.cancelQueries({
        queryKey: ['vehicleDocuments'],
      });

      const previousDocuments = queryClient.getQueryData([
        'vehicleDocuments',
        updatedDocument.vehicleId,
      ]);

      queryClient.setQueryData(
        ['vehicleDocuments', updatedDocument.vehicleId],
        (old: VehicleDocument[] = []) =>
          old.map(d => (d.id === updatedDocument.id ? updatedDocument : d))
      );

      // Also update the general vehicle documents query
      queryClient.setQueryData(
        ['vehicleDocuments'],
        (old: VehicleDocument[] = []) =>
          old.map(d => (d.id === updatedDocument.id ? updatedDocument : d))
      );

      return { previousDocuments };
    },
    onError: (err, updatedDocument, context) => {
      if (context?.previousDocuments) {
        queryClient.setQueryData(
          ['vehicleDocuments', updatedDocument.vehicleId],
          context.previousDocuments
        );
      }
    },
    onSuccess: (data, variables) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('vehicle-document-updated', { detail: variables })
      );
    },
    onSettled: () => {
      // Always invalidate to get fresh data from server
      queryClient.invalidateQueries({
        queryKey: ['vehicleDocuments'],
      });
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
    onError: (err, deletedId, context) => {
      if (context?.previousDocuments && context?.vehicleId) {
        queryClient.setQueryData(
          ['vehicleDocuments', context.vehicleId],
          context.previousDocuments
        );
      }
    },
    onSuccess: (data, variables) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('vehicle-document-deleted', {
          detail: { id: variables },
        })
      );
    },
    onSettled: () => {
      // Always invalidate to get fresh data from server
      queryClient.invalidateQueries({
        queryKey: ['vehicleDocuments'],
      });
    },
  });
}
