"use strict";
/**
 * Derivative Worker pre Protocol V2
 * Spracováva obrázky na pozadí a generuje derivatívy
 */
Object.defineProperty(exports, "__esModule", { value: true });
const setup_1 = require("../queues/setup");
const r2_storage_1 = require("../utils/r2-storage");
const sharp_processor_1 = require("../utils/v2/sharp-processor");
const processor = new sharp_processor_1.ImageProcessor();
/**
 * Hlavný worker pre generovanie derivatívov
 */
setup_1.photoQueue.process('generate-derivatives', async (job) => {
    const startTime = Date.now();
    const { originalKey, protocolId, photoId, userId, metadata } = job.data;
    try {
        // Update progress
        await job.progress(10);
        // Download original z R2
        const originalBuffer = await r2_storage_1.r2Storage.getFile(originalKey);
        if (!originalBuffer) {
            throw new Error(`Original file not found: ${originalKey}`);
        }
        await job.progress(30);
        // Validácia obrázka
        const validation = await processor.validateImage(originalBuffer);
        if (!validation.valid) {
            throw new Error(`Image validation failed: ${validation.error}`);
        }
        await job.progress(50);
        // Generovanie derivatívov
        const derivatives = await processor.generateDerivatives(originalBuffer);
        await job.progress(70);
        // Vytvorenie paths pre upload
        const basePath = originalKey.replace(/\/[^/]+$/, '');
        const timestamp = Date.now();
        // Upload derivatívov na R2
        const uploadPromises = [
            r2_storage_1.r2Storage.uploadFile(`${basePath}/thumb/${photoId}_${timestamp}.webp`, derivatives.thumb, 'image/webp'),
            r2_storage_1.r2Storage.uploadFile(`${basePath}/gallery/${photoId}_${timestamp}.jpg`, derivatives.gallery, 'image/jpeg'),
            r2_storage_1.r2Storage.uploadFile(`${basePath}/pdf/${photoId}_${timestamp}.jpg`, derivatives.pdf, 'image/jpeg')
        ];
        const [thumbUrl, galleryUrl, pdfUrl] = await Promise.all(uploadPromises);
        await job.progress(90);
        // Update databázy
        // await updatePhotoRecord(photoId, {
        //   thumbUrl,
        //   galleryUrl,
        //   pdfUrl,
        //   hash: derivatives.hash,
        //   metadata: {
        //     ...validation.metadata,
        //     ...metadata,
        //     processedAt: new Date(),
        //     processingTime: Date.now() - startTime,
        //     savings: processor.calculateSavings(derivatives.sizes)
        //   }
        // });
        console.log('Photo record updated:', { photoId, thumbUrl, galleryUrl, pdfUrl });
        await job.progress(100);
        const processingTime = Date.now() - startTime;
        return {
            success: true,
            photoId,
            urls: {
                thumb: thumbUrl,
                gallery: galleryUrl,
                pdf: pdfUrl
            },
            processingTime
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to process photo ${photoId}:`, error);
        // Log error pre monitoring
        // await logProcessingError({
        //   photoId,
        //   protocolId,
        //   originalKey,
        //   error: errorMessage,
        //   userId,
        //   processingTime: Date.now() - startTime
        // });
        console.error('Processing error logged:', { photoId, error: errorMessage });
        throw new Error(`Photo processing failed: ${errorMessage}`);
    }
});
/**
 * Helper funkcia pre update photo recordu
 */
async function updatePhotoRecord(
/* _photoId: string,
_updates: {
  thumbUrl: string;
  galleryUrl: string;
  pdfUrl: string;
  hash: string;
  metadata: Record<string, unknown>;
} */
) {
    // TODO: Implementovať databázový update
    // Zatiaľ placeholder - implementuje sa v ďalšom kroku
    // console.log(`Updating photo record ${photoId}:`, updates);
}
/**
 * Error logging pre monitoring
 */
async function logProcessingError( /* _error: {
  photoId: string;
  protocolId: string;
  originalKey: string;
  error: string;
  userId?: string;
  processingTime: number;
} */) {
    // TODO: Implementovať error logging do databázy
    // console.error('Photo processing error:', error);
}
/**
 * Queue event handlers pre monitoring
 */
setup_1.photoQueue.on('completed', ( /* job, result: PhotoProcessingResult */) => {
    // console.log(`Photo processing completed: ${job.id}`, {
    //   photoId: result.photoId,
    //   processingTime: result.processingTime
    // });
});
setup_1.photoQueue.on('failed', (job, err) => {
    console.error(`Photo processing failed: ${job.id}`, err.message);
});
setup_1.photoQueue.on('stalled', (job) => {
    console.warn(`Photo processing stalled: ${job.id}`);
});
//# sourceMappingURL=derivative-worker.js.map