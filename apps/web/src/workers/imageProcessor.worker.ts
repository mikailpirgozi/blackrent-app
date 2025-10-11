/**
 * Ultra-rýchly Image Processor Worker s GPU acceleration
 *
 * Paralelne spracováva fotky na:
 * - WebP high-quality (95%, 1920px) pre galériu
 * - JPEG professional-quality (90%, 800x600) pre PDF
 *
 * Použitie: OffscreenCanvas pre GPU acceleration
 */

interface ProcessImageTask {
  id: string;
  file: File;
  options: {
    gallery: { format: 'webp'; quality: 0.95; maxWidth: 1920 };
    pdf: { format: 'jpeg'; quality: 0.9; maxWidth: 800; maxHeight: 600 };
  };
}

interface ProcessImageResult {
  id: string;
  gallery: {
    blob: Blob;
    size: number;
    width: number;
    height: number;
  };
  pdf: {
    blob: Blob; // For R2 upload + IndexedDB
    size: number;
  };
  metadata: {
    originalSize: number;
    timestamp: number;
    gps?: { lat: number; lng: number };
  };
}

/**
 * Vytvorenie WebP/JPEG verzie s danou kvalitou a veľkosťou
 */
async function resizeImage(
  bitmap: ImageBitmap,
  maxWidth: number,
  maxHeight: number,
  format: 'image/webp' | 'image/jpeg',
  quality: number
): Promise<Blob> {
  // Calculate scaled dimensions
  let width = bitmap.width;
  let height = bitmap.height;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);
  }

  // Create OffscreenCanvas for GPU acceleration
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get 2d context from OffscreenCanvas');
  }

  // Draw resized image
  ctx.drawImage(bitmap, 0, 0, width, height);

  // Convert to blob with specified format and quality
  return await canvas.convertToBlob({ type: format, quality });
}

/**
 * Extract EXIF/GPS metadata from image file
 */
async function extractMetadata(file: File): Promise<{
  originalSize: number;
  timestamp: number;
  gps?: { lat: number; lng: number };
}> {
  // Basic metadata
  const metadata = {
    originalSize: file.size,
    timestamp: Date.now(),
  };

  // TODO: Implement EXIF parsing for GPS data
  // For now, return basic metadata
  return metadata;
}

// ❌ REMOVED: blobToBase64 function
// No longer needed - we store blobs directly in IndexedDB
// IndexedDB can handle Blob objects natively (2GB+ capacity)

// Signal ready immediately on worker startup
self.postMessage({ type: 'ready' });

/**
 * Main message handler
 */
self.onmessage = async (e: MessageEvent<ProcessImageTask>) => {
  const { id, file, options } = e.data;

  try {
    // 1. Create ImageBitmap from file (GPU-accelerated decode)
    const bitmap = await createImageBitmap(file);

    // 2. Paralelne vytvor gallery (WebP) a PDF (JPEG) verzie
    const [galleryBlob, pdfBlob] = await Promise.all([
      resizeImage(
        bitmap,
        options.gallery.maxWidth,
        bitmap.height, // Keep aspect ratio
        'image/webp',
        options.gallery.quality
      ),
      resizeImage(
        bitmap,
        options.pdf.maxWidth,
        options.pdf.maxHeight,
        'image/jpeg',
        options.pdf.quality
      ),
    ]);

    // 3. Extract metadata
    const metadata = await extractMetadata(file);

    // 4. Send result back (only 2 versions now!)
    const result: ProcessImageResult = {
      id,
      gallery: {
        blob: galleryBlob,
        size: galleryBlob.size,
        width: bitmap.width,
        height: bitmap.height,
      },
      pdf: {
        blob: pdfBlob, // For R2 upload + IndexedDB (can convert to base64 if needed)
        size: pdfBlob.size,
      },
      metadata,
    };

    self.postMessage(result);

    // Cleanup
    bitmap.close();
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
