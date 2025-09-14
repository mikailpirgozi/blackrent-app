/**
 * Manifest Worker pre Protocol V2
 * Spravuje manifesty súborov a integrity checking
 */
export interface ManifestJob {
    protocolId: string;
    photoIds: string[];
    userId?: string;
    metadata?: Record<string, unknown>;
}
export interface ManifestResult {
    success: boolean;
    protocolId: string;
    manifestUrl?: string;
    photoCount: number;
    totalSize: number;
    error?: string;
    processingTime?: number;
}
//# sourceMappingURL=manifest-worker.d.ts.map