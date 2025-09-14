declare class R2Storage {
    private client;
    private config;
    constructor();
    /**
     * Upload súboru do R2 storage (s lokálnym fallbackom pre development)
     */
    uploadFile(key: string, buffer: Buffer, contentType: string, metadata?: Record<string, string>): Promise<string>;
    /**
     * Lokálne file storage pre development
     */
    private uploadFileLocally;
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
     * 🌟 NOVÉ: Generovanie lepšie organizovaných kľúčov pre súbory s WebP podporou
     */
    generateFileKey(type: 'vehicle' | 'protocol' | 'document' | 'company-document', entityId: string, filename: string, mediaType?: 'vehicle-images' | 'document-images' | 'damage-images' | 'vehicle-videos' | 'pdf' | 'contract' | 'invoice' | 'technical-certificate', preserveExtension?: boolean): string;
    /**
     * Generovanie kľúča pre protokol PDF
     */
    generateProtocolPDFKey(protocolId: string, protocolType: 'handover' | 'return'): string;
    /**
     * Generovanie kľúča pre médiá protokolu
     */
    generateProtocolMediaKey(protocolId: string, mediaType: 'vehicle-images' | 'document-images' | 'damage-images' | 'vehicle-videos', filename: string): string;
    /**
     * Mazanie všetkých súborov protokolu (nová aj stará štruktúra)
     */
    deleteProtocolFiles(protocolId: string): Promise<void>;
    /**
     * Získanie zoznamu všetkých súborov protokolu
     */
    listProtocolFiles(protocolId: string): Promise<string[]>;
    /**
     * Získanie zoznamu súborov podľa pattern
     */
    listFiles(prefix: string): Promise<string[]>;
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
    /**
     * Načítanie súboru z R2 ako Buffer
     */
    getFile(key: string): Promise<Buffer | null>;
    /**
     * Zistenie MIME typu z file key
     */
    getMimeTypeFromKey(key: string): string;
    /**
     * Kontrola či súbor existuje
     */
    fileExists(key: string): Promise<boolean>;
    /**
     * Generovanie signed URL pre download
     */
    getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}
export declare const r2Storage: R2Storage;
export default r2Storage;
//# sourceMappingURL=r2-storage.d.ts.map