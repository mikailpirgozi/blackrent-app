/**
 * Photo Service V2 pre Protocol System
 * Koordinuje upload, processing a storage obrázkov
 */

// Mock uuid for testing - in production use import { v4 as uuidv4 } from 'uuid';
const uuidv4 = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
// import { featureFlags } from '../../src/config/featureFlags'; // TODO: Add feature flags
import { photoQueue } from '../queues/setup';
import { r2Storage } from '../utils/r2-storage';

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

export class PhotoServiceV2 {
  /**
   * Upload obrázka s queue processing
   */
  async uploadPhoto(request: PhotoUploadRequest): Promise<PhotoUploadResponse> {
    try {
      // Check feature flag
      // if (!featureFlags.isPhotoProcessingV2Enabled(request.userId)) {
      //   throw new Error('Photo processing V2 not enabled for user');
      // }
      // TODO: Add feature flags check
      
      // Generovanie unique ID
      const photoId = uuidv4();
      const timestamp = Date.now();
      const extension = this.getFileExtension(request.filename);
      
      // Upload original na R2
      const originalKey = `protocols/${request.protocolId}/photos/original/${photoId}_${timestamp}.${extension}`;
      const originalUrl = await r2Storage.uploadFile(
        originalKey,
        request.file,
        request.mimeType
      );
      
      // Queue job pre derivative generation
      const job = await photoQueue.add('generate-derivatives', {
        originalKey,
        protocolId: request.protocolId,
        photoId,
        userId: request.userId,
        metadata: request.metadata
      }, {
        priority: 1, // Normal priority
        delay: 0,    // Process immediately
      });
      
      const jobId = job?.id?.toString() || 'no-job-id';
      
      // Save photo record do databázy
      // await this.savePhotoRecord({
      //   photoId,
      //   protocolId: request.protocolId,
      //   originalUrl,
      //   originalKey,
      //   filename: request.filename,
      //   mimeType: request.mimeType,
      //   userId: request.userId,
      //   jobId,
      //   metadata: request.metadata,
      //   status: 'uploaded',
      //   createdAt: new Date()
      // });
      // Photo record saved successfully
      
      return {
        success: true,
        photoId,
        originalUrl,
        jobId
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('Photo upload failed:', error);
      
      return {
        success: false,
        photoId: '',
        originalUrl: '',
        error: errorMessage
      };
    }
  }
  
  /**
   * Získanie statusu photo processing
   */
  async getProcessingStatus(/* _photoId: string */): Promise<{
    status: 'uploaded' | 'processing' | 'completed' | 'failed';
    progress?: number;
    urls?: {
      original: string;
      thumb?: string;
      gallery?: string;
      pdf?: string;
    };
    error?: string;
  }> {
    try {
      // TODO: Implementovať databázový query
      // Zatiaľ placeholder
      return {
        status: 'uploaded',
        progress: 0
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Status check failed'
      };
    }
  }
  
  /**
   * Bulk upload pre multiple photos
   */
  async uploadMultiplePhotos(
    photos: PhotoUploadRequest[]
  ): Promise<PhotoUploadResponse[]> {
    const results: PhotoUploadResponse[] = [];
    
    // Paralelný upload (max 5 súčasne)
    const concurrency = 5;
    for (let i = 0; i < photos.length; i += concurrency) {
      const batch = photos.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(photo => this.uploadPhoto(photo))
      );
      results.push(...batchResults);
    }
    
    return results;
  }
  
  /**
   * Helper methods
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'jpg';
  }
  
  private async savePhotoRecord(/* _record: {
    photoId: string;
    protocolId: string;
    originalUrl: string;
    originalKey: string;
    filename: string;
    mimeType: string;
    userId?: string;
    jobId?: string;
    metadata?: Record<string, unknown>;
    status: string;
    createdAt: Date;
  } */): Promise<void> {
    // TODO: Implementovať databázový insert
    // Zatiaľ placeholder - implementuje sa v DB migration kroku
    // console.log('Saving photo record:', record);
  }
}

// Export singleton instance
export const photoServiceV2 = new PhotoServiceV2();
