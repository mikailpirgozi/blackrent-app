/**
 * Photo Service V2 pre Protocol System
 * Koordinuje upload, processing a storage obrázkov
 */
export interface PhotoUploadRequest {
    file: Buffer;
    filename: string;
    mimeType: string;
    protocolId: string;
    userId?: string;
    metadata?: Record<string, unknown>;
}
export interface PhotoUploadResponse {
    success: boolean;
    photoId: string;
    originalUrl: string;
    jobId?: string;
    error?: string;
}
export declare class PhotoServiceV2 {
    /**
     * Upload obrázka s queue processing
     */
    uploadPhoto(request: PhotoUploadRequest): Promise<PhotoUploadResponse>;
    /**
     * Získanie statusu photo processing
     */
    getProcessingStatus(): Promise<{
        status: 'uploaded' | 'processing' | 'completed' | 'failed';
        progress?: number;
        urls?: {
            original: string;
            thumb?: string;
            gallery?: string;
            pdf?: string;
        };
        error?: string;
    }>;
    /**
     * Bulk upload pre multiple photos
     */
    uploadMultiplePhotos(photos: PhotoUploadRequest[]): Promise<PhotoUploadResponse[]>;
    /**
     * Helper methods
     */
    private getFileExtension;
    private savePhotoRecord;
}
export declare const photoServiceV2: PhotoServiceV2;
//# sourceMappingURL=photo-service-v2.d.ts.map