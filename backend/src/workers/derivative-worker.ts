/**
 * Derivative Worker pre Protocol V2
 * Spracováva obrázky na pozadí a generuje derivatívy
 */

import { photoQueue } from '../queues/setup';
import { ImageProcessor } from '../utils/v2/sharp-processor';
import { r2Storage } from '../utils/r2-storage';

const processor = new ImageProcessor();

export interface PhotoProcessingJob {
  originalKey: string;
  protocolId: string;
  photoId: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface PhotoProcessingResult {
  success: boolean;
  photoId: string;
  urls?: {
    thumb: string;
    gallery: string;
    pdf: string;
  };
  error?: string;
  processingTime?: number;
}

/**
 * Hlavný worker pre generovanie derivatívov
 */
photoQueue.process('generate-derivatives', async (job): Promise<PhotoProcessingResult> => {
  const startTime = Date.now();
  const { originalKey, protocolId, photoId, userId, metadata } = job.data as PhotoProcessingJob;
  
  try {
    // Update progress
    await job.progress(10);
    
    // Download original z R2
    const originalBuffer = await r2Storage.getFile(originalKey);
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
      r2Storage.uploadFile(
        `${basePath}/thumb/${photoId}_${timestamp}.webp`,
        derivatives.thumb,
        'image/webp'
      ),
      r2Storage.uploadFile(
        `${basePath}/gallery/${photoId}_${timestamp}.jpg`,
        derivatives.gallery,
        'image/jpeg'
      ),
      r2Storage.uploadFile(
        `${basePath}/pdf/${photoId}_${timestamp}.jpg`,
        derivatives.pdf,
        'image/jpeg'
      )
    ];
    
    const [thumbUrl, galleryUrl, pdfUrl] = await Promise.all(uploadPromises);
    
    await job.progress(90);
    
    // Update databázy
    await updatePhotoRecord(photoId, {
      thumbUrl,
      galleryUrl,
      pdfUrl,
      hash: derivatives.hash,
      metadata: {
        ...validation.metadata,
        ...metadata,
        processedAt: new Date(),
        processingTime: Date.now() - startTime,
        savings: processor.calculateSavings(derivatives.sizes)
      }
    });
    
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
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to process photo ${photoId}:`, error);
    
    // Log error pre monitoring
    await logProcessingError({
      photoId,
      protocolId,
      originalKey,
      error: errorMessage,
      userId,
      processingTime: Date.now() - startTime
    });
    
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
): Promise<void> {
  // TODO: Implementovať databázový update
  // Zatiaľ placeholder - implementuje sa v ďalšom kroku
  // console.log(`Updating photo record ${photoId}:`, updates);
}

/**
 * Error logging pre monitoring
 */
async function logProcessingError(/* _error: {
  photoId: string;
  protocolId: string;
  originalKey: string;
  error: string;
  userId?: string;
  processingTime: number;
} */): Promise<void> {
  // TODO: Implementovať error logging do databázy
  // console.error('Photo processing error:', error);
}

/**
 * Queue event handlers pre monitoring
 */
photoQueue.on('completed', (/* job, result: PhotoProcessingResult */) => {
  // console.log(`Photo processing completed: ${job.id}`, {
  //   photoId: result.photoId,
  //   processingTime: result.processingTime
  // });
});

photoQueue.on('failed', (job, err) => {
  console.error(`Photo processing failed: ${job.id}`, err.message);
});

photoQueue.on('stalled', (job) => {
  console.warn(`Photo processing stalled: ${job.id}`);
});
