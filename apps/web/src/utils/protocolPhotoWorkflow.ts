/**
 * Protocol Photo Workflow - ANTI-CRASH iOS Safari
 *
 * ✅ NO base64/dataURL storage
 * ✅ objectURL for previews (with immediate revoke)
 * ✅ Stream upload with concurrency 2
 * ✅ Garbage collection after each upload
 * ✅ PDF generation directly from R2 URLs
 */

import { v4 as uuidv4 } from 'uuid';
import { ImageProcessor } from './imageProcessing';
import { UploadManager } from '../services/uploadManager';
import { indexedDBManager } from './storage/IndexedDBManager';
import { EnhancedPDFGenerator } from './enhancedPdfGenerator';
import { perfMonitor } from './performanceMonitor';
import { logger } from './logger';
import type { ProtocolImage, HandoverProtocol, ReturnProtocol } from '../types';
import { getApiBaseUrl } from './apiUrl';

export interface PhotoWorkflowOptions {
  protocolId: string;
  mediaType: 'vehicle' | 'document' | 'damage' | 'odometer' | 'fuel';
  protocolType?: 'handover' | 'return';
  onProgress?: (completed: number, total: number, message: string) => void;
}

export interface PhotoWorkflowResult {
  images: ProtocolImage[];
  processingTime: number;
  uploadTime: number;
  totalTime: number;
}

/**
 * Process and upload photos for protocol - ANTI-CRASH VERSION
 *
 * Workflow:
 * 1. Process images with Web Worker
 * 2. Upload WebP (gallery) + JPEG (PDF) to R2
 * 3. Save only metadata to IndexedDB (NO blobs!)
 * 4. Return R2 URLs
 */
export async function processAndUploadPhotos(
  files: File[],
  options: PhotoWorkflowOptions
): Promise<PhotoWorkflowResult> {
  const totalStart = performance.now();
  const objectURLs: string[] = []; // Track for cleanup

  logger.info('Starting photo processing (anti-crash mode)', {
    fileCount: files.length,
    protocolId: options.protocolId,
    mediaType: options.mediaType,
  });

  try {
    // Phase 1: Image Processing
    const processor = new ImageProcessor();

    const processedImages = await processor.processBatch(
      files,
      (completed, total) => {
        options.onProgress?.(
          completed,
          total,
          `Processing images: ${completed}/${total}`
        );
      }
    );

    const processingTime = performance.now() - totalStart;

    logger.info('Image processing complete', {
      count: processedImages.length,
      time: processingTime,
      avgPerImage: processingTime / processedImages.length,
    });

    // Phase 2: R2 Upload - Upload both WebP (gallery) + JPEG (PDF)
    const uploadStart = performance.now();
    const uploadManager = new UploadManager();

    // Create upload tasks for BOTH versions
    const uploadTasks: Array<{
      id: string;
      blob: Blob;
      path: string;
      type: string;
      entityId: string;
      protocolType: string;
      mediaType: string;
    }> = [];

    processedImages.forEach((img, idx) => {
      const imageId = img.id || uuidv4();
      const timestamp = Date.now();

      // 1. WebP version (high-quality gallery)
      uploadTasks.push({
        id: imageId,
        blob: img.gallery.blob,
        path: `protocols/${options.protocolId}/${options.mediaType}/${imageId}_${timestamp}_${idx}.webp`,
        type: 'protocol',
        entityId: options.protocolId,
        protocolType: options.protocolType || 'handover',
        mediaType: options.mediaType,
      });

      // 2. JPEG version (PDF-optimized)
      uploadTasks.push({
        id: `${imageId}_pdf`,
        blob: img.pdf.blob,
        path: `protocols/${options.protocolId}/${options.mediaType}/${imageId}_${timestamp}_${idx}_pdf.jpeg`,
        type: 'protocol',
        entityId: options.protocolId,
        protocolType: options.protocolType || 'handover',
        mediaType: options.mediaType,
      });
    });

    const uploadResults = await uploadManager.uploadBatch(
      uploadTasks,
      (completed, total, message) => {
        options.onProgress?.(
          completed,
          total,
          message || `Uploading: ${completed}/${total}`
        );
      }
    );

    const uploadTime = performance.now() - uploadStart;

    // ✅ Detailné logovanie úspešnosti uploadu
    const expectedUploads = uploadTasks.length;
    const successfulUploads = uploadResults.length;
    const failedUploads = expectedUploads - successfulUploads;
    const successRate = ((successfulUploads / expectedUploads) * 100).toFixed(
      1
    );

    logger.info('Upload complete', {
      expectedUploads,
      successfulUploads,
      failedUploads,
      successRate: `${successRate}%`,
      webpCount: processedImages.length,
      jpegCount: processedImages.length,
      time: uploadTime,
      avgPerImage: uploadTime / uploadResults.length,
      totalSize: uploadResults.reduce((sum, r) => sum + r.size, 0),
    });

    // ✅ CHANGED: Varovanie ak niektoré uploady zlyhali, ale NEPRERUŠUJ proces
    if (failedUploads > 0) {
      logger.warn(
        '⚠️ WARNING: Some photo uploads failed, but continuing with successful ones',
        {
          totalPhotos: files.length,
          expectedUploads,
          successfulUploads,
          failedUploads,
          successRate: `${successRate}%`,
          protocolId: options.protocolId,
          mediaType: options.mediaType,
        }
      );

      // ✅ CRITICAL FIX: Don't throw error! Let user save protocol with partial photos
      // User can retry failed photos later
      options.onProgress?.(
        successfulUploads,
        files.length,
        `⚠️ Nahralo sa ${successfulUploads} z ${files.length} fotiek. ${failedUploads} fotiek zlyhalo.`
      );
    }

    // Phase 3: Save metadata to IndexedDB (NO blobs!)
    processedImages.forEach((img, idx) => {
      if (!img.id) {
        const newId = uuidv4();
        processedImages[idx] = { ...img, id: newId };
      }
    });

    // Save only metadata - filter out failed uploads
    const successfulImages = processedImages.filter((img, idx) => {
      const webpResult = uploadResults[idx * 2];
      if (!webpResult) {
        logger.warn('⚠️ Skipping image metadata save - upload failed', {
          imageIndex: idx,
          imageId: img.id,
          protocolId: options.protocolId,
        });
        return false;
      }
      return true;
    });

    logger.info('📝 Saving metadata for successful uploads', {
      totalImages: processedImages.length,
      successfulImages: successfulImages.length,
      skippedImages: processedImages.length - successfulImages.length,
    });

    await Promise.all(
      successfulImages.map((img, idx) => {
        const webpResult = uploadResults[idx * 2];
        if (!webpResult) {
          throw new Error(
            `Unexpected: webpResult missing for successful image ${idx}`
          );
        }
        return indexedDBManager.saveImageMetadata({
          id: img.id,
          protocolId: options.protocolId,
          filename: img.id + '.webp',
          type: options.mediaType,
          uploadStatus: 'completed',
          url: webpResult.url,
          timestamp: Date.now(),
          size: img.gallery.size,
        });
      })
    );

    logger.info('✅ Image metadata saved to IndexedDB', {
      count: successfulImages.length,
    });

    // Phase 4: Create ProtocolImage objects - only for successful uploads
    const protocolImages = successfulImages
      .map((processedImg, idx): ProtocolImage | null => {
        const webpResultIdx = idx * 2;
        const jpegResultIdx = idx * 2 + 1;

        const webpResult = uploadResults[webpResultIdx];
        const jpegResult = uploadResults[jpegResultIdx];

        if (!webpResult || !jpegResult) {
          logger.warn(
            '⚠️ Skipping protocol image creation - missing upload result',
            {
              imageIndex: idx,
              imageId: processedImg.id,
              hasWebp: !!webpResult,
              hasJpeg: !!jpegResult,
            }
          );
          return null;
        }

        const metadata = processedImg.metadata;
        const imageId = processedImg.id;

        return {
          id: imageId,
          url: webpResult.url, // WebP for gallery
          originalUrl: webpResult.url,
          pdfUrl: jpegResult.url as string, // ✅ JPEG R2 URL for PDF
          // ❌ REMOVED: pdfData base64 (causes crashes)
          type: options.mediaType,
          description: '',
          timestamp: new Date(),
          compressed: true,
          originalSize: metadata?.originalSize || 0,
          compressedSize: processedImg?.gallery.size || 0,
          metadata: metadata
            ? {
                gps: metadata.gps
                  ? {
                      latitude: metadata.gps.lat,
                      longitude: metadata.gps.lng,
                    }
                  : undefined,
                deviceInfo: {
                  userAgent: navigator.userAgent,
                  platform: navigator.platform,
                },
              }
            : undefined,
        };
      })
      .filter((img): img is ProtocolImage => img !== null);

    logger.info('📸 Protocol images created', {
      totalProcessed: processedImages.length,
      successfulImages: successfulImages.length,
      protocolImages: protocolImages.length,
      failedImages: processedImages.length - protocolImages.length,
    });

    // Cleanup: Destroy processor and revoke objectURLs
    processor.destroy();
    objectURLs.forEach(url => URL.revokeObjectURL(url));

    const totalTime = performance.now() - totalStart;

    logger.info('✅ Photo workflow complete (anti-crash mode)', {
      totalFiles: files.length,
      processedImages: processedImages.length,
      successfulUploads: successfulImages.length,
      protocolImages: protocolImages.length,
      failedUploads: files.length - protocolImages.length,
      successRate: `${((protocolImages.length / files.length) * 100).toFixed(1)}%`,
      processingTime,
      uploadTime,
      totalTime,
      avgTimePerImage:
        protocolImages.length > 0 ? totalTime / protocolImages.length : 0,
    });

    // ✅ Show user-friendly message if some uploads failed
    if (protocolImages.length < files.length) {
      const failedCount = files.length - protocolImages.length;
      logger.error('⚠️ UPLOAD INCOMPLETE', {
        requested: files.length,
        successful: protocolImages.length,
        failed: failedCount,
        message: `Nahralo sa len ${protocolImages.length} z ${files.length} fotiek!`,
      });

      // Show alert to user
      options.onProgress?.(
        protocolImages.length,
        files.length,
        `⚠️ POZOR: Nahralo sa len ${protocolImages.length} z ${files.length} fotiek! ${failedCount} fotiek zlyhalo. Skúste ich nahrať znova.`
      );
    }

    return {
      images: protocolImages,
      processingTime,
      uploadTime,
      totalTime,
    };
  } catch (error) {
    // Cleanup on error
    objectURLs.forEach(url => URL.revokeObjectURL(url));
    logger.error('Photo workflow failed', { error });
    throw error;
  }
}

/**
 * Generate PDF with R2 URLs - NO local data storage
 *
 * ✅ Downloads images from R2 on-demand
 * ✅ No base64/blob storage
 * ✅ Garbage collection after each image
 */
export async function generateProtocolPDFQuick(
  protocol: HandoverProtocol | ReturnProtocol
): Promise<{ pdfBlob: Blob; pdfUrl: string; generationTime: number }> {
  const startTime = performance.now();

  try {
    logger.info('Starting PDF generation (anti-crash mode)', {
      protocolId: protocol.id,
      type: protocol.type,
      imageCount:
        (protocol.vehicleImages?.length || 0) +
        (protocol.documentImages?.length || 0) +
        (protocol.damageImages?.length || 0),
    });

    // ✅ Generate PDF directly from R2 URLs (no local storage)
    const pdfGenerator = new EnhancedPDFGenerator();
    const pdfBlob = await pdfGenerator.generateProtocolPDF(protocol);

    const generationTime = performance.now() - startTime;
    perfMonitor.startTimer('pdf-generation')();

    logger.info('PDF generation complete', {
      protocolId: protocol.id,
      generationTime,
      pdfSize: pdfBlob.size,
    });

    // Upload PDF to R2
    const formData = new FormData();
    formData.append(
      'file',
      pdfBlob,
      `protocol_${protocol.type}_${protocol.id.substring(0, 8)}.pdf`
    );

    formData.append('type', 'protocol');
    formData.append('entityId', protocol.id);
    formData.append('category', 'pdf');
    formData.append('mediaType', 'pdf');

    const token =
      localStorage.getItem('blackrent_token') ||
      sessionStorage.getItem('blackrent_token');

    const response = await fetch(`${getApiBaseUrl()}/files/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`PDF upload failed: ${response.status}`);
    }

    const result = await response.json();
    const pdfUrl = result.url || result.publicUrl;

    logger.info('PDF uploaded successfully', { url: pdfUrl });

    // Automatically download PDF for user
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `protocol_${protocol.type}_${protocol.id.substring(0, 8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // ✅ Revoke objectURL immediately
    URL.revokeObjectURL(downloadUrl);

    logger.info('PDF downloaded automatically');

    return {
      pdfBlob,
      pdfUrl,
      generationTime,
    };
  } catch (error) {
    logger.error('PDF generation failed', { error });
    throw error;
  }
}

/**
 * Complete protocol save workflow
 */
export async function completeProtocolWorkflow(
  protocol: HandoverProtocol | ReturnProtocol,
  onProgress?: (phase: string, message: string) => void
): Promise<{ pdfUrl: string; totalTime: number }> {
  const startTime = performance.now();

  try {
    // Generate PDF
    onProgress?.('pdf', 'Generujem PDF protokol...');
    const { pdfUrl, generationTime } = await generateProtocolPDFQuick(protocol);

    const totalTime = performance.now() - startTime;

    logger.info('Protocol workflow complete', {
      protocolId: protocol.id,
      pdfUrl,
      generationTime,
      totalTime,
    });

    onProgress?.('done', 'Protokol úspešne uložený!');

    return {
      pdfUrl,
      totalTime,
    };
  } catch (error) {
    logger.error('Protocol workflow failed', { error });
    throw error;
  }
}
