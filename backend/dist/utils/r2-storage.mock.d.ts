/**
 * Mock R2 Storage pre testy
 * Simuluje R2/S3 funkcionalitu v pamäti
 */
declare class MockR2Storage {
    private storage;
    private bucketName;
    constructor();
    /**
     * Upload file to mock storage
     */
    uploadFile(key: string, buffer: Buffer, contentType?: string): Promise<string>;
    /**
     * Get file from mock storage
     */
    getFile(key: string): Promise<Buffer | null>;
    /**
     * Delete file from mock storage
     */
    deleteFile(key: string): Promise<boolean>;
    /**
     * List files in mock storage
     */
    listFiles(prefix?: string): Promise<string[]>;
    /**
     * Get file metadata
     */
    getFileMetadata(key: string): Promise<{
        size: number;
        contentType: string;
        lastModified: Date;
    } | null>;
    /**
     * Check if file exists
     */
    fileExists(key: string): Promise<boolean>;
    /**
     * Get storage stats
     */
    getStats(): {
        fileCount: number;
        totalSize: number;
        totalSizeMB: string;
    };
    /**
     * Clear all storage (for tests)
     */
    clear(): void;
}
export declare const r2Storage: MockR2Storage;
export {};
//# sourceMappingURL=r2-storage.mock.d.ts.map