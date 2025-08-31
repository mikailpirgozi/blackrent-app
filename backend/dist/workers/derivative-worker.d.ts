/**
 * Derivative Worker pre Protocol V2
 * Spracováva obrázky na pozadí a generuje derivatívy
 */
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
//# sourceMappingURL=derivative-worker.d.ts.map