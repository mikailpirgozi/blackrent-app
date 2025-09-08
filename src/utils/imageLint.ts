/**
 * Image linting utility for validating and optimizing uploaded images
 * Handles size validation, format conversion, EXIF rotation, and resizing
 */

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const MAX_WIDTH = 1920;
const WEBP_QUALITY = 0.95; // ✅ ZVÝŠENÉ: 95% kvalita pre originál
const PDF_QUALITY = 0.8; // ✅ NOVÉ: 80% kvalita pre PDF

const SUPPORTED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
] as const;

type SupportedImageType = (typeof SUPPORTED_TYPES)[number];

interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Validates and optimizes an uploaded image file
 * @param file - The image file to lint
 * @param options - Processing options
 * @returns Promise<File> - Optimized WebP file
 * @throws Error if file is invalid (too large, unsupported type)
 */
export async function lintImage(
  file: File,
  options?: {
    preserveQuality?: boolean;
    targetFormat?: 'webp' | 'jpeg';
    quality?: number;
    maxWidth?: number;
  }
): Promise<File> {
  // Validate file size
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(
      `Súbor je príliš veľký. Maximálna veľkosť je ${MAX_SIZE_MB} MB, váš súbor má ${(file.size / 1024 / 1024).toFixed(2)} MB.`
    );
  }

  // Validate file type
  if (!SUPPORTED_TYPES.includes(file.type as SupportedImageType)) {
    throw new Error(
      `Nepodporovaný typ súboru: ${file.type}. Podporované typy: ${SUPPORTED_TYPES.join(', ')}`
    );
  }

  try {
    // Load image and get dimensions
    const { imageBitmap, originalDimensions } = await loadImage(file);

    // Calculate new dimensions if resizing is needed
    const maxWidth = options?.maxWidth ?? MAX_WIDTH;
    const newDimensions = calculateNewDimensions(originalDimensions, maxWidth);

    // Create canvas and draw image with proper orientation and size
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Nepodarilo sa vytvoriť canvas kontext');
    }

    canvas.width = newDimensions.width;
    canvas.height = newDimensions.height;

    // Draw the image (browser handles EXIF rotation automatically with createImageBitmap)
    ctx.drawImage(imageBitmap, 0, 0, newDimensions.width, newDimensions.height);

    // Convert to target format with specified quality
    const targetFormat = options?.targetFormat ?? 'webp';
    const quality =
      options?.quality ??
      (targetFormat === 'webp' ? WEBP_QUALITY : PDF_QUALITY);
    const processedFile = await canvasToFile(
      canvas,
      file.name,
      targetFormat,
      quality
    );

    // Clean up
    imageBitmap.close();

    return processedFile;
  } catch (error) {
    throw new Error(
      `Chyba pri spracovaní obrázka: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
    );
  }
}

/**
 * Loads image file and returns ImageBitmap with dimensions
 */
async function loadImage(
  file: File
): Promise<{ imageBitmap: ImageBitmap; originalDimensions: ImageDimensions }> {
  try {
    // Use createImageBitmap which automatically handles EXIF orientation
    const imageBitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image' as ImageOrientation, // This applies EXIF orientation
    });

    return {
      imageBitmap,
      originalDimensions: {
        width: imageBitmap.width,
        height: imageBitmap.height,
      },
    };
  } catch (error) {
    throw new Error(
      `Nepodarilo sa načítať obrázok: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
    );
  }
}

/**
 * Calculates new dimensions if resizing is needed
 */
function calculateNewDimensions(
  original: ImageDimensions,
  maxWidth: number = MAX_WIDTH
): ImageDimensions {
  if (original.width <= maxWidth) {
    return original;
  }

  const ratio = maxWidth / original.width;
  return {
    width: maxWidth,
    height: Math.round(original.height * ratio),
  };
}

/**
 * Converts canvas to File with specified format and quality
 */
async function canvasToFile(
  canvas: HTMLCanvasElement,
  originalFileName: string,
  format: 'webp' | 'jpeg',
  quality: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';

    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(new Error(`Nepodarilo sa vytvoriť ${format} blob`));
          return;
        }

        // Create new filename with correct extension
        const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '');
        const extension = format === 'webp' ? 'webp' : 'jpg';
        const newFileName = `${nameWithoutExt}.${extension}`;

        const file = new File([blob], newFileName, {
          type: mimeType,
          lastModified: Date.now(),
        });

        resolve(file);
      },
      mimeType,
      quality
    );
  });
}

/**
 * Helper function to check if a file type is supported
 */
export function isSupportedImageType(type: string): type is SupportedImageType {
  return SUPPORTED_TYPES.includes(type as SupportedImageType);
}

/**
 * Helper function to format file size for error messages
 */
export function formatFileSize(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
}

/**
 * 🌟 NOVÉ: Vytvorenie komprimovanej verzie pre PDF
 */
export async function compressForPDF(file: File): Promise<File> {
  return await lintImage(file, {
    preserveQuality: false,
    targetFormat: 'jpeg',
    quality: PDF_QUALITY,
    maxWidth: 1200, // Menšie rozlíšenie pre PDF
  });
}

/**
 * 🌟 NOVÉ: Zachovanie plnej kvality pre galériu
 */
export async function preserveQualityForGallery(file: File): Promise<File> {
  return await lintImage(file, {
    preserveQuality: true,
    targetFormat: 'webp',
    quality: WEBP_QUALITY,
    maxWidth: MAX_WIDTH, // Zachovaj pôvodné rozlíšenie
  });
}

/**
 * 🌟 NOVÉ: Inteligentná kompresia s WebP fallback
 */
export async function compressImageSmart(
  file: File,
  preferWebP: boolean = true,
  qualityLevel: 'mobile' | 'protocol' | 'highQuality' | 'archive' = 'protocol'
): Promise<File> {
  // Detekcia WebP podpory
  const webPSupported = await isWebPSupported();

  if (preferWebP && webPSupported) {
    // WebP profily
    const webPProfiles = {
      mobile: { quality: 0.8, maxWidth: 1920 },
      protocol: { quality: 0.85, maxWidth: 2560 },
      highQuality: { quality: 0.9, maxWidth: 3840 },
      archive: { quality: 0.95, maxWidth: 4096 },
    };

    const profile = webPProfiles[qualityLevel];
    return await lintImage(file, {
      targetFormat: 'webp',
      quality: profile.quality,
      maxWidth: profile.maxWidth,
    });
  } else {
    // JPEG fallback
    const jpegProfiles = {
      mobile: { quality: 0.85, maxWidth: 1920 },
      protocol: { quality: 0.92, maxWidth: 2560 },
      highQuality: { quality: 0.95, maxWidth: 3840 },
      archive: { quality: 0.98, maxWidth: 4096 },
    };

    const profile = jpegProfiles[qualityLevel];
    return await lintImage(file, {
      targetFormat: 'jpeg',
      quality: profile.quality,
      maxWidth: profile.maxWidth,
    });
  }
}

/**
 * 🌟 NOVÉ: WebP podpora detekcia
 */
export const isWebPSupported = (): Promise<boolean> => {
  return new Promise(resolve => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};
