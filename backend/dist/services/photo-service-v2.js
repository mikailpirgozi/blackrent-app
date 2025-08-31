"use strict";
/**
 * Photo Service V2 pre Protocol System
 * Koordinuje upload, processing a storage obrázkov
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.photoServiceV2 = exports.PhotoServiceV2 = void 0;
const uuid_1 = require("uuid");
// import { featureFlags } from '../../src/config/featureFlags'; // TODO: Add feature flags
const setup_1 = require("../queues/setup");
const r2_storage_1 = require("../utils/r2-storage");
class PhotoServiceV2 {
    /**
     * Upload obrázka s queue processing
     */
    async uploadPhoto(request) {
        try {
            // Check feature flag
            // if (!featureFlags.isPhotoProcessingV2Enabled(request.userId)) {
            //   throw new Error('Photo processing V2 not enabled for user');
            // }
            // TODO: Add feature flags check
            // Generovanie unique ID
            const photoId = (0, uuid_1.v4)();
            const timestamp = Date.now();
            const extension = this.getFileExtension(request.filename);
            // Upload original na R2
            const originalKey = `protocols/${request.protocolId}/photos/original/${photoId}_${timestamp}.${extension}`;
            const originalUrl = await r2_storage_1.r2Storage.uploadFile(originalKey, request.file, request.mimeType);
            // Queue job pre derivative generation
            let jobId;
            // if (featureFlags.isQueueSystemEnabled(request.userId)) {
            if (true) { // TODO: Add feature flags check
                const job = await setup_1.photoQueue.add('generate-derivatives', {
                    originalKey,
                    protocolId: request.protocolId,
                    photoId,
                    userId: request.userId,
                    metadata: request.metadata
                }, {
                    priority: 1, // Normal priority
                    delay: 0, // Process immediately
                });
                jobId = job.id?.toString();
            }
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
            console.log('Photo record saved:', { photoId, protocolId: request.protocolId });
            return {
                success: true,
                photoId,
                originalUrl,
                jobId
            };
        }
        catch (error) {
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
    async getProcessingStatus( /* _photoId: string */) {
        try {
            // TODO: Implementovať databázový query
            // Zatiaľ placeholder
            return {
                status: 'uploaded',
                progress: 0
            };
        }
        catch (error) {
            return {
                status: 'failed',
                error: error instanceof Error ? error.message : 'Status check failed'
            };
        }
    }
    /**
     * Bulk upload pre multiple photos
     */
    async uploadMultiplePhotos(photos) {
        const results = [];
        // Paralelný upload (max 5 súčasne)
        const concurrency = 5;
        for (let i = 0; i < photos.length; i += concurrency) {
            const batch = photos.slice(i, i + concurrency);
            const batchResults = await Promise.all(batch.map(photo => this.uploadPhoto(photo)));
            results.push(...batchResults);
        }
        return results;
    }
    /**
     * Helper methods
     */
    getFileExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'jpg';
    }
    async savePhotoRecord( /* _record: {
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
    } */) {
        // TODO: Implementovať databázový insert
        // Zatiaľ placeholder - implementuje sa v DB migration kroku
        // console.log('Saving photo record:', record);
    }
}
exports.PhotoServiceV2 = PhotoServiceV2;
// Export singleton instance
exports.photoServiceV2 = new PhotoServiceV2();
//# sourceMappingURL=photo-service-v2.js.map