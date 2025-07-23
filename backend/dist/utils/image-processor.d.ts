export interface ProcessedImage {
    original: string;
    thumbnail: string;
    filename: string;
    size: number;
}
export declare class ImageProcessor {
    private apiBaseUrl;
    constructor();
    /**
     * Spracovanie obrázkov - originál + 800px thumbnail
     */
    processImages(files: File[], protocolId: string): Promise<ProcessedImage[]>;
    /**
     * Upload originálneho obrázka cez API
     */
    private uploadOriginal;
    /**
     * Upload thumbnailu cez API
     */
    private uploadThumbnail;
    /**
     * Vytvorenie thumbnailu 800px
     */
    private createThumbnail;
    /**
     * Načítanie originálnych obrázkov pre protokol
     */
    loadOriginalImages(protocolId: string): Promise<ProcessedImage[]>;
}
export default ImageProcessor;
//# sourceMappingURL=image-processor.d.ts.map