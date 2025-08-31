/**
 * Migration Script pre V1 → V2 Protocol System
 * Migruje existujúce protokoly na nový V2 systém
 */
export interface MigrationProgress {
    total: number;
    processed: number;
    successful: number;
    failed: number;
    errors: Array<{
        protocolId: string;
        error: string;
        timestamp: Date;
    }>;
    startTime: Date;
    estimatedCompletion?: Date;
}
export interface MigrationOptions {
    batchSize?: number;
    dryRun?: boolean;
    protocolIds?: string[];
    startDate?: Date;
    endDate?: Date;
    skipPhotos?: boolean;
    skipPdfs?: boolean;
}
export declare class ProtocolMigrationService {
    private progress;
    private imageProcessor;
    /**
     * Hlavná migračná funkcia
     */
    migrateProtocols(options?: MigrationOptions): Promise<MigrationProgress>;
    /**
     * Migrácia jednotlivého protokolu
     */
    private migrateProtocol;
    /**
     * Získanie protokolov na migráciu
     */
    private getProtocolsForMigration;
    /**
     * Migrácia základných dát protokolu
     */
    private migrateProtocolData;
    /**
     * Migrácia fotografií protokolu
     */
    private migrateProtocolPhotos;
    /**
     * Migrácia PDF protokolu
     */
    private migrateProtocolPDF;
    /**
     * Download foto z V1 systému
     */
    private downloadPhotoFromV1;
    /**
     * Download PDF z V1 systému
     */
    private downloadPDFFromV1;
    /**
     * Extract R2 key z URL
     */
    private extractR2KeyFromUrl;
    /**
     * Save V2 photo record
     */
    private saveV2PhotoRecord;
    /**
     * Označenie protokolu ako migrovaný
     */
    private markProtocolAsMigrated;
    /**
     * Rollback migrácie pre protokol
     */
    rollbackProtocol(protocolId: string): Promise<void>;
    /**
     * Získanie migration progress
     */
    getProgress(): MigrationProgress;
    /**
     * Validácia migrácie
     */
    validateMigration(protocolId: string): Promise<{
        valid: boolean;
        issues: string[];
    }>;
}
export declare const migrationService: ProtocolMigrationService;
//# sourceMappingURL=migration-script.d.ts.map