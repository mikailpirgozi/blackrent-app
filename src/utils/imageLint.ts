/**
 * Image linting utility for validating and optimizing uploaded images
 * Handles size validation, format conversion, EXIF rotation, and resizing
 */

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const MAX_WIDTH = 1920;
const WEBP_QUALITY = 0.85;

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
 * @returns Promise<File> - Optimized WebP file
 * @throws Error if file is invalid (too large, unsupported type)
 */
export async function lintImage(file: File): Promise<File> {
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
    const newDimensions = calculateNewDimensions(originalDimensions);

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

    // Convert to WebP
    const webpFile = await canvasToWebPFile(canvas, file.name);

    // Clean up
    imageBitmap.close();

    return webpFile;
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
function calculateNewDimensions(original: ImageDimensions): ImageDimensions {
  if (original.width <= MAX_WIDTH) {
    return original;
  }

  const ratio = MAX_WIDTH / original.width;
  return {
    width: MAX_WIDTH,
    height: Math.round(original.height * ratio),
  };
}

/**
 * Converts canvas to WebP File
 */
async function canvasToWebPFile(
  canvas: HTMLCanvasElement,
  originalFileName: string
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(new Error('Nepodarilo sa vytvoriť WebP blob'));
          return;
        }

        // Create new filename with .webp extension
        const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '');
        const webpFileName = `${nameWithoutExt}.webp`;

        const webpFile = new File([blob], webpFileName, {
          type: 'image/webp',
          lastModified: Date.now(),
        });

        resolve(webpFile);
      },
      'image/webp',
      WEBP_QUALITY
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
