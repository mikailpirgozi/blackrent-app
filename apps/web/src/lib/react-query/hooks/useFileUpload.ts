import { apiService } from '@/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

// File Upload interfaces
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadFileData {
  file: File;
  protocolId?: string;
  category?: string;
  mediaType?: string;
  metadata?: Record<string, unknown>;
}

export interface PresignedUploadData {
  file: File;
  protocolId: string;
  category: string;
  mediaType: string;
  metadata?: Record<string, unknown>;
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  url?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  protocolId?: string;
  category?: string;
  mediaType?: string;
  uploadedAt: string;
  metadata?: Record<string, unknown>;
}

// UPLOAD file with progress tracking
export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uploadData: UploadFileData) =>
      apiService.uploadFile(uploadData),
    onSuccess: (data, variables) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('file-uploaded', { detail: { data, variables } })
      );

      // Invalidate related queries
      if (variables.protocolId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.protocols.detail(variables.protocolId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.protocols.all,
        });
      }
    },
    onError: (error, variables) => {
      // Trigger error notification
      window.dispatchEvent(
        new CustomEvent('file-upload-error', { detail: { error, variables } })
      );
    },
  });
}

// UPLOAD file with presigned URL (for large files)
export function usePresignedUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uploadData: PresignedUploadData) =>
      apiService.presignedUpload(uploadData),
    onSuccess: (data, variables) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('file-presigned-uploaded', {
          detail: { data, variables },
        })
      );

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocols.detail(variables.protocolId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocols.all,
      });
    },
    onError: (error, variables) => {
      // Trigger error notification
      window.dispatchEvent(
        new CustomEvent('file-presigned-upload-error', {
          detail: { error, variables },
        })
      );
    },
  });
}

// GET upload progress (for tracking large uploads)
export function useUploadProgress(uploadId: string) {
  return useQuery({
    queryKey: queryKeys.fileUpload.progress(uploadId),
    queryFn: () => apiService.getUploadProgress(uploadId),
    enabled: !!uploadId,
    refetchInterval: 1000, // Check every second
    staleTime: 0, // Always fresh
  });
}

// DELETE file
export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: string) => apiService.deleteFile(fileId),
    onMutate: async fileId => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.fileUpload.all,
      });

      // Optimistically remove file from any cached lists
      queryClient.setQueryData(
        queryKeys.fileUpload.lists(),
        (old: FileMetadata[] = []) => old.filter(f => f.id !== fileId)
      );

      return { fileId };
    },
    onError: (error, fileId) => {
      // Trigger error notification
      window.dispatchEvent(
        new CustomEvent('file-delete-error', { detail: { error, fileId } })
      );
    },
    onSuccess: (_, fileId) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('file-deleted', { detail: { id: fileId } })
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.fileUpload.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocols.all,
      });
    },
  });
}

// GET files by protocol
export function useFilesByProtocol(protocolId: string) {
  return useQuery({
    queryKey: queryKeys.fileUpload.byProtocol(protocolId),
    queryFn: () => apiService.getFilesByProtocol(protocolId),
    enabled: !!protocolId,
    staleTime: 2 * 60 * 1000, // 2 minúty
  });
}

// GET files by category
export function useFilesByCategory(category: string) {
  return useQuery({
    queryKey: queryKeys.fileUpload.byCategory(category),
    queryFn: () => apiService.getFilesByCategory(category),
    enabled: !!category,
    staleTime: 5 * 60 * 1000, // 5 minút
  });
}

// BULK upload files
export function useBulkUploadFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (files: UploadFileData[]) => apiService.bulkUploadFiles(files),
    onSuccess: (data, variables) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('files-bulk-uploaded', { detail: { data, variables } })
      );

      // Invalidate related queries
      const protocolIds = variables
        .map(f => f.protocolId)
        .filter(Boolean) as string[];

      protocolIds.forEach(protocolId => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.protocols.detail(protocolId),
        });
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.protocols.all,
      });
    },
    onError: (error, variables) => {
      // Trigger error notification
      window.dispatchEvent(
        new CustomEvent('files-bulk-upload-error', {
          detail: { error, variables },
        })
      );
    },
  });
}

// BULK delete files
export function useBulkDeleteFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileIds: string[]) => apiService.bulkDeleteFiles(fileIds),
    onSuccess: (_, fileIds) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('files-bulk-deleted', {
          detail: { ids: fileIds },
        })
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.fileUpload.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocols.all,
      });
    },
  });
}

// GET file metadata
export function useFileMetadata(fileId: string) {
  return useQuery({
    queryKey: queryKeys.fileUpload.detail(fileId),
    queryFn: () => apiService.getFileMetadata(fileId),
    enabled: !!fileId,
    staleTime: 5 * 60 * 1000, // 5 minút
  });
}

// VALIDATE file before upload
export function useValidateFile() {
  return useMutation({
    mutationFn: (file: File) => apiService.validateFile(file),
  });
}
