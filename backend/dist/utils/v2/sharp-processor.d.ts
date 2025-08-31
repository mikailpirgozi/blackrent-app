/**
 * Sharp Image Processor pre Protocol V2
 * Generuje optimalizované derivatívy obrázkov pre rôzne účely
 */
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
export declare const DEFAULT_DERIVATIVE_CONFIG: DerivativeConfig;
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
export declare class ImageProcessor {
    private config;
    constructor(config?: DerivativeConfig);
    /**
     * Získa aktuálnu konfiguráciu
     */
    getConfig(): DerivativeConfig;
    /**
     * Hlavná funkcia pre generovanie derivatívov
     */
    generateDerivatives(inputBuffer: Buffer): Promise<ProcessedImage>;
    /**
     * Generuje thumbnail pre UI preview
     */
    private generateThumbnail;
    /**
     * Generuje gallery verziu pre zobrazenie
     */
    private generateGalleryVersion;
    /**
     * Generuje PDF verziu pre protokoly
     */
    private generatePdfVersion;
    /**
     * Validácia obrázka pred spracovaním
     */
    validateImage(inputBuffer: Buffer): Promise<{
        valid: boolean;
        error?: string;
        metadata?: sharp.Metadata;
    }>;
    /**
     * Získanie info o úsporách miesta
     */
    calculateSavings(sizes: ProcessedImage['sizes']): {
        totalSavings: number;
        savingsPercentage: number;
        breakdown: Record<string, number>;
    };
}
//# sourceMappingURL=sharp-processor.d.ts.map