/**
 * Sharp Image Processor pre Protocol V2
 * Generuje optimalizované derivatívy obrázkov pre rôzne účely
 */

import crypto from 'crypto';
import sharp from 'sharp';

export interface DerivativeConfig {
  thumb: { 
    width: 150; 
    height: 150; 
    quality: 60; 
    format: 'webp';
  };
  gallery: { 
    width: 1280; 
    quality: 80; 
    format: 'jpeg';
  };
  pdf: { 
    width: 960; 
    quality: 75; 
    format: 'jpeg';
  };
}

export const DEFAULT_DERIVATIVE_CONFIG: DerivativeConfig = {
  thumb: { width: 150, height: 150, quality: 60, format: 'webp' },
  gallery: { width: 1280, quality: 80, format: 'jpeg' },
  pdf: { width: 960, quality: 75, format: 'jpeg' }
};

export interface ProcessedImage {
  thumb: Buffer;
  gallery: Buffer;
  pdf: Buffer;
  hash: string;
  metadata: sharp.Metadata;
  sizes: {
    original: number;
    thumb: number;
    gallery: number;
    pdf: number;
  };
}

export class ImageProcessor {
  private config: DerivativeConfig;
  
  constructor(config: DerivativeConfig = DEFAULT_DERIVATIVE_CONFIG) {
    this.config = config;
  }
  
  /**
   * Získa aktuálnu konfiguráciu
   */
  getConfig(): DerivativeConfig {
    return this.config;
  }
  
  /**
   * Hlavná funkcia pre generovanie derivatívov
   */
  async generateDerivatives(inputBuffer: Buffer): Promise<ProcessedImage> {
    // Validácia vstupu
    if (!inputBuffer || inputBuffer.length === 0) {
      throw new Error('Invalid input buffer');
    }
    
    // Získanie metadát
    const metadata = await sharp(inputBuffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image metadata');
    }
    
    // Generovanie SHA-256 hash
    const hash = crypto.createHash('sha256')
      .update(inputBuffer)
      .digest('hex');
    
    // Paralelné generovanie všetkých derivatívov
    const [thumb, gallery, pdf] = await Promise.all([
      this.generateThumbnail(inputBuffer),
      this.generateGalleryVersion(inputBuffer),
      this.generatePdfVersion(inputBuffer)
    ]);
    
    return {
      thumb,
      gallery,
      pdf,
      hash,
      metadata,
      sizes: {
        original: inputBuffer.length,
        thumb: thumb.length,
        gallery: gallery.length,
        pdf: pdf.length
      }
    };
  }
  
  /**
   * Generuje thumbnail pre UI preview
   */
  private async generateThumbnail(inputBuffer: Buffer): Promise<Buffer> {
    return sharp(inputBuffer)
      .resize(this.config.thumb.width, this.config.thumb.height, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ 
        quality: this.config.thumb.quality,
        effort: 6 // Vyšší effort pre lepšiu kompresiu
      })
      .toBuffer();
  }
  
  /**
   * Generuje gallery verziu pre zobrazenie
   */
  private async generateGalleryVersion(inputBuffer: Buffer): Promise<Buffer> {
    return sharp(inputBuffer)
      .resize(this.config.gallery.width, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ 
        quality: this.config.gallery.quality,
        progressive: true,
        mozjpeg: true
      })
      .toBuffer();
  }
  
  /**
   * Generuje PDF verziu pre protokoly
   */
  private async generatePdfVersion(inputBuffer: Buffer): Promise<Buffer> {
    return sharp(inputBuffer)
      .resize(this.config.pdf.width, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ 
        quality: this.config.pdf.quality,
        progressive: false, // PDF potrebuje baseline JPEG
        mozjpeg: false
      })
      .toBuffer();
  }
  
  /**
   * Validácia obrázka pred spracovaním
   */
  async validateImage(inputBuffer: Buffer): Promise<{
    valid: boolean;
    error?: string;
    metadata?: sharp.Metadata;
  }> {
    try {
      const metadata = await sharp(inputBuffer).metadata();
      
      // Základné validácie
      if (!metadata.width || !metadata.height) {
        return { valid: false, error: 'Invalid image dimensions' };
      }
      
      if (metadata.width < 100 || metadata.height < 100) {
        return { valid: false, error: 'Image too small (min 100x100px)' };
      }
      
      if (metadata.width > 8000 || metadata.height > 8000) {
        return { valid: false, error: 'Image too large (max 8000x8000px)' };
      }
      
      // Supported formats
      const supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'tiff'];
      if (!metadata.format || !supportedFormats.includes(metadata.format)) {
        return { valid: false, error: `Unsupported format: ${metadata.format}` };
      }
      
      return { valid: true, metadata };
    } catch (error) {
      return { 
        valid: false, 
        error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
  
  /**
   * Získanie info o úsporách miesta
   */
  calculateSavings(sizes: ProcessedImage['sizes']): {
    totalSavings: number;
    savingsPercentage: number;
    breakdown: Record<string, number>;
  } {
    const totalDerivatives = sizes.thumb + sizes.gallery + sizes.pdf;
    const totalSavings = (sizes.original * 3) - totalDerivatives;
    const savingsPercentage = (totalSavings / (sizes.original * 3)) * 100;
    
    return {
      totalSavings,
      savingsPercentage,
      breakdown: {
        thumb: ((sizes.original - sizes.thumb) / sizes.original) * 100,
        gallery: ((sizes.original - sizes.gallery) / sizes.original) * 100,
        pdf: ((sizes.original - sizes.pdf) / sizes.original) * 100
      }
    };
  }
}
