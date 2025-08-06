declare class R2Migration {
    private migratedCount;
    private errorCount;
    /**
     * Migrácia všetkých protokolov z base64 do R2
     */
    migrateAllProtocols(): Promise<void>;
    /**
     * Migrácia handover protokolov
     */
    private migrateHandoverProtocols;
    /**
     * Migrácia return protokolov
     */
    private migrateReturnProtocols;
    /**
     * Migrácia media súborov pre jeden protokol
     */
    private migrateProtocolMedia;
    /**
     * Migrácia poľa media súborov
     */
    private migrateMediaArray;
    /**
     * Migrácia base64 súboru do R2
     */
    private migrateBase64ToR2;
    /**
     * Aktualizácia protokolu v databáze
     */
    private updateProtocolInDatabase;
    /**
     * Získanie content type z base64 URL
     */
    private getContentTypeFromBase64;
    /**
     * Získanie prípony z content type
     */
    private getExtensionFromContentType;
    /**
     * Kontrola migrácie
     */
    checkMigrationStatus(): Promise<void>;
}
export declare const r2Migration: R2Migration;
export {};
//# sourceMappingURL=migrate-to-r2.d.ts.map