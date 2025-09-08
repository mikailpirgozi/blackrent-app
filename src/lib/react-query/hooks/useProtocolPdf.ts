import { apiService } from '@/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

// Protocol PDF interfaces
export interface ProtocolPdfData {
  id: string;
  protocolId: string;
  type: 'handover' | 'return';
  url: string;
  generatedAt: string;
  size: number;
  status: 'generating' | 'ready' | 'error';
  error?: string;
}

export interface GeneratePdfData {
  protocolId: string;
  type: 'handover' | 'return';
  options?: {
    includePhotos?: boolean;
    includeSignatures?: boolean;
    watermark?: string;
    language?: string;
  };
}

export interface PdfGenerationStatus {
  status: 'generating' | 'ready' | 'error';
  progress?: number;
  error?: string;
  url?: string;
}

// GET protocol PDF
export function useProtocolPdf(
  protocolId: string,
  type: 'handover' | 'return'
) {
  return useQuery({
    queryKey: queryKeys.protocolPdf.detail(protocolId, type),
    queryFn: () => apiService.getProtocolPdf(protocolId, type),
    enabled: !!protocolId && !!type,
    staleTime: 10 * 60 * 1000, // 10 minút - PDF sa nemenia často
    retry: (failureCount, error) => {
      // Don't retry if PDF doesn't exist yet
      if (error && 'status' in error && error.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// GET protocol PDF URL (for direct download/display)
export function useProtocolPdfUrl(
  protocolId: string,
  type: 'handover' | 'return'
) {
  return useQuery({
    queryKey: queryKeys.protocolPdf.url(protocolId, type),
    queryFn: () => apiService.getProtocolPdfUrl(protocolId, type),
    enabled: !!protocolId && !!type,
    staleTime: 10 * 60 * 1000, // 10 minút
    retry: (failureCount, error) => {
      // Don't retry if PDF doesn't exist yet
      if (error && 'status' in error && error.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// GENERATE protocol PDF
export function useGenerateProtocolPdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GeneratePdfData) => apiService.generateProtocolPdf(data),
    onMutate: async variables => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.protocolPdf.detail(
          variables.protocolId,
          variables.type
        ),
      });

      // Optimistically set status to generating
      queryClient.setQueryData(
        queryKeys.protocolPdf.detail(variables.protocolId, variables.type),
        {
          id: `temp-${Date.now()}`,
          protocolId: variables.protocolId,
          type: variables.type,
          status: 'generating' as const,
          generatedAt: new Date().toISOString(),
          size: 0,
        } as ProtocolPdfData
      );

      return { variables };
    },
    onError: (error, variables) => {
      // Set error status
      queryClient.setQueryData(
        queryKeys.protocolPdf.detail(variables.protocolId, variables.type),
        {
          id: `temp-${Date.now()}`,
          protocolId: variables.protocolId,
          type: variables.type,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Unknown error',
          generatedAt: new Date().toISOString(),
          size: 0,
        } as ProtocolPdfData
      );

      // Trigger error notification
      window.dispatchEvent(
        new CustomEvent('pdf-generation-error', {
          detail: {
            error,
            protocolId: variables.protocolId,
            type: variables.type,
          },
        })
      );
    },
    onSuccess: (data, variables) => {
      // Update with actual PDF data
      queryClient.setQueryData(
        queryKeys.protocolPdf.detail(variables.protocolId, variables.type),
        data
      );

      // Trigger success notification
      window.dispatchEvent(
        new CustomEvent('pdf-generated', {
          detail: {
            data,
            protocolId: variables.protocolId,
            type: variables.type,
          },
        })
      );
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocolPdf.detail(
          variables.protocolId,
          variables.type
        ),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocolPdf.url(
          variables.protocolId,
          variables.type
        ),
      });
    },
  });
}

// GET PDF generation status
export function usePdfGenerationStatus(
  protocolId: string,
  type: 'handover' | 'return'
) {
  return useQuery({
    queryKey: queryKeys.protocolPdf.status(protocolId, type),
    queryFn: () => apiService.getPdfGenerationStatus(protocolId, type),
    enabled: !!protocolId && !!type,
    refetchInterval: data => {
      // Stop polling if PDF is ready or error
      if (data?.status === 'ready' || data?.status === 'error') {
        return false;
      }
      // Poll every 2 seconds while generating
      return 2000;
    },
    staleTime: 0, // Always fresh for status
  });
}

// DOWNLOAD protocol PDF
export function useDownloadProtocolPdf() {
  return useMutation({
    mutationFn: ({
      protocolId,
      type,
    }: {
      protocolId: string;
      type: 'handover' | 'return';
    }) => apiService.downloadProtocolPdf(protocolId, type),
    onSuccess: (data, variables) => {
      // Trigger download
      if (data.url) {
        const link = document.createElement('a');
        link.href = data.url;
        link.download = `protocol_${variables.type}_${variables.protocolId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Trigger notification
      window.dispatchEvent(
        new CustomEvent('pdf-downloaded', {
          detail: { protocolId: variables.protocolId, type: variables.type },
        })
      );
    },
    onError: (error, variables) => {
      // Trigger error notification
      window.dispatchEvent(
        new CustomEvent('pdf-download-error', {
          detail: {
            error,
            protocolId: variables.protocolId,
            type: variables.type,
          },
        })
      );
    },
  });
}

// BULK generate PDFs
export function useBulkGeneratePdfs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GeneratePdfData[]) => apiService.bulkGeneratePdfs(data),
    onSuccess: (data, variables) => {
      // Update all generated PDFs
      variables.forEach((variable, index) => {
        if (data[index]) {
          queryClient.setQueryData(
            queryKeys.protocolPdf.detail(variable.protocolId, variable.type),
            data[index]
          );
        }
      });

      // Trigger notification
      window.dispatchEvent(
        new CustomEvent('pdfs-bulk-generated', {
          detail: { data, variables },
        })
      );
    },
    onError: (error, variables) => {
      // Trigger error notification
      window.dispatchEvent(
        new CustomEvent('pdfs-bulk-generation-error', {
          detail: { error, variables },
        })
      );
    },
    onSettled: (data, error, variables) => {
      // Invalidate all affected queries
      variables.forEach(variable => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.protocolPdf.detail(
            variable.protocolId,
            variable.type
          ),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.protocolPdf.url(
            variable.protocolId,
            variable.type
          ),
        });
      });
    },
  });
}

// DELETE protocol PDF
export function useDeleteProtocolPdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      protocolId,
      type,
    }: {
      protocolId: string;
      type: 'handover' | 'return';
    }) => apiService.deleteProtocolPdf(protocolId, type),
    onSuccess: (data, variables) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.protocolPdf.detail(
          variables.protocolId,
          variables.type
        ),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.protocolPdf.url(
          variables.protocolId,
          variables.type
        ),
      });

      // Trigger notification
      window.dispatchEvent(
        new CustomEvent('pdf-deleted', {
          detail: { protocolId: variables.protocolId, type: variables.type },
        })
      );
    },
    onError: (error, variables) => {
      // Trigger error notification
      window.dispatchEvent(
        new CustomEvent('pdf-delete-error', {
          detail: {
            error,
            protocolId: variables.protocolId,
            type: variables.type,
          },
        })
      );
    },
  });
}

// GET all PDFs for a protocol
export function useProtocolPdfs(protocolId: string) {
  return useQuery({
    queryKey: queryKeys.protocolPdf.byProtocol(protocolId),
    queryFn: () => apiService.getProtocolPdfs(protocolId),
    enabled: !!protocolId,
    staleTime: 5 * 60 * 1000, // 5 minút
  });
}
