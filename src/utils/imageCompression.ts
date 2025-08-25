export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSize?: number; // max size in KB
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface CompressionResult {
  compressedBlob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  const {
    maxWidth = 2560,    // ✅ Zvýšené z 1920 na 2560px
    maxHeight = 1920,   // ✅ Zvýšené z 1080 na 1920px  
    quality = 0.92,     // ✅ Zvýšené z 0.8 na 0.92 (92%)
    maxSize = 1500,     // ✅ Zvýšené z 500KB na 1.5MB
    format = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      let currentQuality = quality;
      
      const tryCompression = (q: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            const compressedSizeKB = blob.size / 1024;
            
            // If still too large and quality can be reduced, try again
            if (compressedSizeKB > maxSize && q > 0.1) {
              tryCompression(q - 0.1);
              return;
            }

            resolve({
              compressedBlob: blob,
              originalSize: file.size,
              compressedSize: blob.size,
              compressionRatio: ((file.size - blob.size) / file.size) * 100,
              width,
              height
            });
          },
          format,
          q
        );
      };

      tryCompression(currentQuality);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

export const compressMultipleImages = async (
  files: File[],
  options: CompressionOptions = {}
): Promise<CompressionResult[]> => {
  const results: CompressionResult[] = [];
  
  for (const file of files) {
    try {
      const result = await compressImage(file, options);
      results.push(result);
    } catch (error) {
      console.error('Error compressing image:', error);
      // Continue with other images even if one fails
    }
  }
  
  return results;
};

export const createImageDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const blobToFile = (blob: Blob, filename: string): File => {
  return new File([blob], filename, { type: blob.type });
};

// 🎯 NOVÉ: Prednastavené profily kvality
export const QUALITY_PRESETS = {
  // 📱 Pre mobilné zariadenia - rýchle nahrávanie
  mobile: {
    maxWidth: 1920,
    maxHeight: 1080, 
    quality: 0.85,
    maxSize: 800, // 800KB
    format: 'image/jpeg' as const
  },
  
  // 🏢 Pre protokoly - vyvážená kvalita/veľkosť
  protocol: {
    maxWidth: 2560,
    maxHeight: 1920,
    quality: 0.92,
    maxSize: 1500, // 1.5MB
    format: 'image/jpeg' as const
  },
  
  // 🔍 Pre detailné fotky - vysoká kvalita
  highQuality: {
    maxWidth: 3840,
    maxHeight: 2160,
    quality: 0.95,
    maxSize: 3000, // 3MB
    format: 'image/jpeg' as const
  },
  
  // 💾 Pre archiváciu - maximálna kvalita
  archive: {
    maxWidth: 4096,
    maxHeight: 3072,
    quality: 0.98,
    maxSize: 5000, // 5MB
    format: 'image/jpeg' as const
  },
  
  // 🌟 NOVÉ: WebP profily - lepší pomer kvalita/veľkosť
  webpMobile: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.80, // WebP má lepšiu kompresiu, môžeme znížiť kvalitu
    maxSize: 500, // 500KB (37% úspora oproti JPEG)
    format: 'image/webp' as const
  },
  
  webpProtocol: {
    maxWidth: 2560,
    maxHeight: 1920,
    quality: 0.85, // Vyššia kvalita pri menšej veľkosti
    maxSize: 1000, // 1MB (33% úspora oproti JPEG)
    format: 'image/webp' as const
  },
  
  webpHighQuality: {
    maxWidth: 3840,
    maxHeight: 2160,
    quality: 0.90,
    maxSize: 2000, // 2MB (33% úspora oproti JPEG)
    format: 'image/webp' as const
  },
  
  webpArchive: {
    maxWidth: 4096,
    maxHeight: 3072,
    quality: 0.95,
    maxSize: 3500, // 3.5MB (30% úspora oproti JPEG)
    format: 'image/webp' as const
  }
} as const;

// 🎯 Helper funkcie pre rôzne scenáre
export const compressForProtocol = (file: File) => 
  compressImage(file, QUALITY_PRESETS.protocol);

export const compressForMobile = (file: File) => 
  compressImage(file, QUALITY_PRESETS.mobile);

export const compressHighQuality = (file: File) => 
  compressImage(file, QUALITY_PRESETS.highQuality);

export const compressForArchive = (file: File) => 
  compressImage(file, QUALITY_PRESETS.archive);

// 🌟 NOVÉ: WebP helper funkcie
export const compressWebPForProtocol = (file: File) => 
  compressImage(file, QUALITY_PRESETS.webpProtocol);

export const compressWebPForMobile = (file: File) => 
  compressImage(file, QUALITY_PRESETS.webpMobile);

export const compressWebPHighQuality = (file: File) => 
  compressImage(file, QUALITY_PRESETS.webpHighQuality);

export const compressWebPForArchive = (file: File) => 
  compressImage(file, QUALITY_PRESETS.webpArchive);

// 🔍 NOVÉ: WebP podpora detekcia
export const isWebPSupported = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// 🎯 NOVÉ: Inteligentná kompresná s WebP fallback
export const compressImageSmart = async (
  file: File,
  preferWebP: boolean = true,
  qualityLevel: 'mobile' | 'protocol' | 'highQuality' | 'archive' = 'protocol'
): Promise<CompressionResult> => {
  const webPSupported = await isWebPSupported();
  
  if (preferWebP && webPSupported) {
    // Použiť WebP ak je podporovaný
    const webPPreset = `webp${qualityLevel.charAt(0).toUpperCase() + qualityLevel.slice(1)}` as keyof typeof QUALITY_PRESETS;
    return compressImage(file, QUALITY_PRESETS[webPPreset]);
  } else {
    // Fallback na JPEG
    return compressImage(file, QUALITY_PRESETS[qualityLevel]);
  }
}; 