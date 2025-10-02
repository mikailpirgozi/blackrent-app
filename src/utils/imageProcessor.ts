export interface ProcessedImage {
  original: string;
  thumbnail: string;
  filename: string;
  size: number;
}

export class ImageProcessor {
  private apiBaseUrl: string;

  constructor() {
    // Použi Railway backend URL
    this.apiBaseUrl =
      import.meta.env.VITE_API_URL ||
      'https://blackrent-app-production-4d6f.up.railway.app/api';
  }

  /**
   * Spracovanie obrázkov - originál + 800px thumbnail
   */
  async processImages(
    files: File[],
    protocolId: string
  ): Promise<ProcessedImage[]> {
    const processedImages: ProcessedImage[] = [];

    for (const file of files) {
      try {
        // 1. Upload originálu cez API
        const originalUrl = await this.uploadOriginal(file, protocolId);

        // 2. Vytvorenie 800px thumbnailu
        const thumbnailBlob = await this.createThumbnail(file, 800);
        const thumbnailUrl = await this.uploadThumbnail(
          thumbnailBlob,
          protocolId,
          file.name
        );

        processedImages.push({
          original: originalUrl,
          thumbnail: thumbnailUrl,
          filename: file.name,
          size: file.size,
        });

        console.log(`✅ Spracovaný obrázok: ${file.name}`);
      } catch (error) {
        console.error(`❌ Chyba pri spracovaní obrázka ${file.name}:`, error);
      }
    }

    return processedImages;
  }

  /**
   * Upload originálneho obrázka cez API
   */
  private async uploadOriginal(
    file: File,
    protocolId: string
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('protocolId', protocolId);
    formData.append('type', 'original');

    const response = await fetch(`${this.apiBaseUrl}/files/protocol-upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload original image');
    }

    const result = await response.json();
    return result.url;
  }

  /**
   * Upload thumbnailu cez API
   */
  private async uploadThumbnail(
    blob: Blob,
    protocolId: string,
    originalFilename: string
  ): Promise<string> {
    const file = new File([blob], originalFilename, { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('protocolId', protocolId);
    formData.append('type', 'thumbnail');

    const response = await fetch(`${this.apiBaseUrl}/files/protocol-upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload thumbnail');
    }

    const result = await response.json();
    return result.url;
  }

  /**
   * Vytvorenie thumbnailu 800px
   */
  private async createThumbnail(file: File, maxSize: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Výpočet rozmerov pre 800px
          const ratio = Math.min(maxSize / img.width, maxSize / img.height);
          const width = img.width * ratio;
          const height = img.height * ratio;

          canvas.width = width;
          canvas.height = height;

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              blob => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Failed to create thumbnail blob'));
                }
              },
              'image/jpeg',
              0.8
            );
          } else {
            reject(new Error('Failed to get canvas context'));
          }
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Načítanie originálnych obrázkov pre protokol
   */
  async loadOriginalImages(protocolId: string): Promise<ProcessedImage[]> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/files/protocol/${protocolId}/images`
      );
      if (!response.ok) {
        throw new Error('Failed to load images');
      }
      const result = await response.json();
      return result.images || [];
    } catch (error) {
      console.error('❌ Chyba pri načítaní obrázkov:', error);
      return [];
    }
  }
}

export default ImageProcessor;
