/**
 * Protocol Photo Workflow - Complete integration helper
 *
 * Zabaluje celý workflow pre fotografie v protokoloch:
 * 1. Image processing (Web Worker)
 * 2. R2 upload (parallel)
 * 3. SessionStorage PDF data
 * 4. PDF generation
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
  sessionStorageTime: number;
  totalTime: number;
}

/**
 * Process and upload photos for protocol
 *
 * Kompletný workflow:
 * - Web Worker processing
 * - Parallel R2 upload
 * - SessionStorage management
 */
export async function processAndUploadPhotos(
  files: File[],
  options: PhotoWorkflowOptions
): Promise<PhotoWorkflowResult> {
  const totalStart = performance.now();

  logger.info('Starting photo processing', {
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

    // Phase 2: R2 Upload - 🎯 NEW: Upload both WebP (gallery) + JPEG (PDF)
    const uploadStart = performance.now();
    const uploadManager = new UploadManager();

    // 🎯 Create upload tasks for BOTH versions
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

      // 2. 🎯 NEW: JPEG version (PDF-optimized)
      uploadTasks.push({
        id: `${imageId}_pdf`, // Different ID for PDF version
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

    logger.info('Upload complete', {
      count: uploadResults.length,
      webpCount: processedImages.length,
      jpegCount: processedImages.length,
      time: uploadTime,
      avgPerImage: uploadTime / uploadResults.length,
      totalSize: uploadResults.reduce((sum, r) => sum + r.size, 0),
    });

    // Phase 3: Ensure all images have consistent IDs BEFORE saving
    // 🎯 FIX: Generate IDs once and reuse everywhere
    const storageStart = performance.now();

    processedImages.forEach((img, idx) => {
      // Generate unique ID if missing - DO THIS ONCE!
      if (!img.id) {
        const newId = uuidv4();
        processedImages[idx] = { ...img, id: newId };
        logger.debug('🆔 Generated new ID for image', {
          index: idx,
          newId,
        });
      }
    });

    // 🎯 NEW: Save to IndexedDB instead of SessionStorage (2GB+ vs 10MB limit)
    // Store blob directly (no base64 conversion = 33% less memory!)
    await Promise.all(
      processedImages.map(img => 
        indexedDBManager.savePDFImage(img.id, img.pdf.blob)
      )
    );

    const storageTime = performance.now() - storageStart;

    logger.info('✅ PDF images saved to IndexedDB', {
      count: processedImages.length,
      time: storageTime,
      imageIds: processedImages.map(img => img.id),
      avgTimePerImage: storageTime / processedImages.length,
    });

    // Phase 4: Create ProtocolImage objects
    // 🎯 NEW: uploadResults now contains 2x items (WebP + JPEG), extract both URLs
    const protocolImages: ProtocolImage[] = processedImages.map(
      (processedImg, idx) => {
        // uploadResults: [webp0, jpeg0, webp1, jpeg1, ...]
        const webpResultIdx = idx * 2; // WebP result
        const jpegResultIdx = idx * 2 + 1; // JPEG result

        const webpResult = uploadResults[webpResultIdx];
        const jpegResult = uploadResults[jpegResultIdx];

        if (!webpResult || !jpegResult) {
          throw new Error(`Missing upload result for image at index ${idx}`);
        }

        const metadata = processedImg.metadata;
        const imageId = processedImg.id;

        logger.debug('📦 Creating ProtocolImage', {
          imageId,
          webpUrl: webpResult.url,
          jpegUrl: jpegResult.url,
          index: idx,
          hasPdfData: !!processedImg?.pdf?.base64,
        });

        return {
          id: imageId,
          url: webpResult.url, // WebP for gallery
          originalUrl: webpResult.url, // WebP high-quality
          pdfUrl: jpegResult.url, // 🎯 JPEG R2 URL for PDF
          // ❌ REMOVED: pdfData base64 (now in IndexedDB as blob)
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
      }
    );

    // Cleanup
    processor.destroy();

    const totalTime = performance.now() - totalStart;

    logger.info('Photo workflow complete', {
      imageCount: protocolImages.length,
      processingTime,
      uploadTime,
      storageTime,
      totalTime,
      avgTimePerImage: totalTime / protocolImages.length,
      // 🔍 DEBUG: Log IDs for verification
      indexedDBIds: processedImages.map(img => img.id),
      protocolImageIds: protocolImages.map(img => img.id),
      idsMatch:
        JSON.stringify(processedImages.map(img => img.id)) ===
        JSON.stringify(protocolImages.map(img => img.id)),
    });

    return {
      images: protocolImages,
      processingTime,
      uploadTime,
      sessionStorageTime: storageTime, // Renamed but keeping interface compatibility
      totalTime,
    };
  } catch (error) {
    logger.error('Photo workflow failed', { error });
    throw error;
  }
}

/**
 * Generate PDF with IndexedDB data
 *
 * Ultra-rýchle PDF generovanie bez sťahovania z R2
 * 🎯 NOW USES IndexedDB (2GB+) instead of SessionStorage (10MB limit)
 */
export async function generateProtocolPDFQuick(
  protocol: HandoverProtocol | ReturnProtocol
): Promise<{ pdfBlob: Blob; pdfUrl: string; generationTime: number }> {
  const startTime = performance.now();

  try {
    logger.info('Starting PDF generation', {
      protocolId: protocol.id,
      type: protocol.type,
      imageCount:
        (protocol.vehicleImages?.length || 0) +
        (protocol.documentImages?.length || 0) +
        (protocol.damageImages?.length || 0),
    });

    // 🎯 NEW: Check IndexedDB has images (instead of SessionStorage)
    const indexedDBImages = await indexedDBManager.getAllPDFImages();
    logger.info('✅ Retrieved PDF images from IndexedDB', {
      count: indexedDBImages.size,
    });

    // Generate PDF using IndexedDB data
    const pdfGenerator = new EnhancedPDFGenerator();
    const pdfBlob = await pdfGenerator.generateProtocolPDF(protocol);

    const generationTime = performance.now() - startTime;
    perfMonitor.startTimer('pdf-generation')(); // Log to perfMonitor

    logger.info('PDF generation complete', {
      protocolId: protocol.id,
      generationTime,
      pdfSize: pdfBlob.size,
      pages: pdfBlob.size > 0 ? 1 : 0,
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
    URL.revokeObjectURL(downloadUrl);

    logger.info('PDF downloaded automatically');

    // 🎯 NEW: Clear IndexedDB after successful PDF generation (instead of SessionStorage)
    await indexedDBManager.clearPDFImages();
    logger.info('🧹 IndexedDB PDF images cleared after successful generation');

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
 *
 * Kombinuje photo processing, upload a PDF generation
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
