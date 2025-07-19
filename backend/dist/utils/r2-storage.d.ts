declare class R2Storage {
    private client;
    private config;
    constructor();
    /**
     * Upload súboru do R2 storage
     */
    uploadFile(key: string, buffer: Buffer, contentType: string, metadata?: Record<string, string>): Promise<string>;
    /**
     * Vytvorenie presigned URL pre direct upload z frontendu
     */
    createPresignedUploadUrl(key: string, contentType: string, expiresIn?: number): Promise<string>;
    /**
     * Získanie presigned URL pre download
     */
    createPresignedDownloadUrl(key: string, expiresIn?: number): Promise<string>;
    /**
     * Zmazanie súboru z R2
     */
    deleteFile(key: string): Promise<void>;
    /**
     * Generovanie štruktúrovaného key pre súbor
     */
    generateFileKey(type: 'vehicle' | 'protocol' | 'document', entityId: string, filename: string): string;
    /**
     * Validácia typu súboru
     */
    validateFileType(mimetype: string): boolean;
    /**
     * Validácia veľkosti súboru
     */
    validateFileSize(size: number, type: 'image' | 'document'): boolean;
    /**
     * Získanie public URL pre súbor
     */
    getPublicUrl(key: string): string;
    /**
     * Kontrola či je R2 správne nakonfigurované
     */
    isConfigured(): boolean;
}
export declare const r2Storage: R2Storage;
export default r2Storage;
//# sourceMappingURL=r2-storage.d.ts.map