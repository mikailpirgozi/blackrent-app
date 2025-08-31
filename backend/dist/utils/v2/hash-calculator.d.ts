/**
 * SHA-256 Hash Calculator pre Protocol V2
 * Zabezpečuje integrity checking a deduplication
 */
export interface HashResult {
    sha256: string;
    md5: string;
    size: number;
    timestamp: Date;
}
export interface FileManifest {
    photoId: string;
    originalHash: string;
    derivativeHashes: {
        thumb: string;
        gallery: string;
        pdf: string;
    };
    sizes: {
        original: number;
        thumb: number;
        gallery: number;
        pdf: number;
    };
    createdAt: Date;
    metadata?: Record<string, unknown>;
}
export declare class HashCalculator {
    /**
     * Vypočíta SHA-256 hash pre buffer
     */
    static calculateSHA256(buffer: Buffer): string;
    /**
     * Vypočíta MD5 hash pre backward compatibility
     */
    static calculateMD5(buffer: Buffer): string;
    /**
     * Vypočíta všetky hash hodnoty pre súbor
     */
    static calculateHashes(buffer: Buffer): HashResult;
    /**
     * Vytvorí manifest pre photo a všetky jeho derivatívy
     */
    static createPhotoManifest(photoId: string, original: Buffer, derivatives: {
        thumb: Buffer;
        gallery: Buffer;
        pdf: Buffer;
    }, metadata?: Record<string, unknown>): FileManifest;
    /**
     * Verifikuje integrity súboru pomocou hash
     */
    static verifyIntegrity(buffer: Buffer, expectedHash: string): boolean;
    /**
     * Detekuje duplicitné súbory na základe hash
     */
    static isDuplicate(hash1: string, hash2: string): boolean;
    /**
     * Generuje unique identifier na základe hash a timestamp
     */
    static generateUniqueId(buffer: Buffer): string;
}
//# sourceMappingURL=hash-calculator.d.ts.map