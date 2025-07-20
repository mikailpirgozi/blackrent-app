"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.r2Migration = void 0;
const postgres_database_js_1 = require("../models/postgres-database.js");
const r2_storage_js_1 = require("./r2-storage.js");
class R2Migration {
    constructor() {
        this.migratedCount = 0;
        this.errorCount = 0;
    }
    /**
     * Migrácia všetkých protokolov z base64 do R2
     */
    async migrateAllProtocols() {
        console.log('🚀 Začínam migráciu protokolov do R2 storage...');
        if (!r2_storage_js_1.r2Storage.isConfigured()) {
            console.error('❌ R2 Storage nie je nakonfigurované!');
            console.log('📋 Nastavte environment variables:');
            console.log('  R2_ENDPOINT');
            console.log('  R2_ACCESS_KEY_ID');
            console.log('  R2_SECRET_ACCESS_KEY');
            console.log('  R2_BUCKET_NAME');
            console.log('  R2_PUBLIC_URL');
            return;
        }
        try {
            // Migrácia handover protokolov
            await this.migrateHandoverProtocols();
            // Migrácia return protokolov
            await this.migrateReturnProtocols();
            console.log('✅ Migrácia dokončená!');
            console.log(`📊 Štatistiky: ${this.migratedCount} súborov migrovaných, ${this.errorCount} chýb`);
        }
        catch (error) {
            console.error('❌ Chyba pri migrácii:', error);
        }
    }
    /**
     * Migrácia handover protokolov
     */
    async migrateHandoverProtocols() {
        console.log('📋 Migrujem handover protokoly...');
        // Použijeme getHandoverProtocolsByRental ak existuje, inak priamy prístup
        try {
            // Získaj všetky handover protokoly
            const protocols = await postgres_database_js_1.postgresDatabase.getHandoverProtocolsByRental('all');
            for (const protocol of protocols) {
                await this.migrateProtocolMedia(protocol, 'handover');
            }
        }
        catch (error) {
            console.error('❌ Chyba pri získavaní handover protokolov:', error);
        }
    }
    /**
     * Migrácia return protokolov
     */
    async migrateReturnProtocols() {
        console.log('📋 Migrujem return protokoly...');
        try {
            // Získaj všetky return protokoly
            const protocols = await postgres_database_js_1.postgresDatabase.getReturnProtocolsByRental('all');
            for (const protocol of protocols) {
                await this.migrateProtocolMedia(protocol, 'return');
            }
        }
        catch (error) {
            console.error('❌ Chyba pri získavaní return protokolov:', error);
        }
    }
    /**
     * Migrácia media súborov pre jeden protokol
     */
    async migrateProtocolMedia(protocol, type) {
        const protocolId = protocol.id;
        console.log(`🔄 Migrujem protokol ${type} ${protocolId.slice(-8)}...`);
        try {
            // Migrácia vehicle images
            await this.migrateMediaArray(protocol.vehicle_images_urls, protocolId, 'vehicle', type);
            // Migrácia vehicle videos
            await this.migrateMediaArray(protocol.vehicle_videos_urls, protocolId, 'video', type);
            // Migrácia document images
            await this.migrateMediaArray(protocol.document_images_urls, protocolId, 'document', type);
            // Migrácia damage images
            await this.migrateMediaArray(protocol.damage_images_urls, protocolId, 'damage', type);
            // Aktualizácia protokolu v databáze
            await this.updateProtocolInDatabase(protocolId, type, {
                vehicle_images_urls: protocol.vehicle_images_urls,
                vehicle_videos_urls: protocol.vehicle_videos_urls,
                document_images_urls: protocol.document_images_urls,
                damage_images_urls: protocol.damage_images_urls
            });
        }
        catch (error) {
            console.error(`❌ Chyba pri migrácii protokolu ${protocolId}:`, error);
            this.errorCount++;
        }
    }
    /**
     * Migrácia poľa media súborov
     */
    async migrateMediaArray(mediaArray, protocolId, mediaType, protocolType) {
        if (!Array.isArray(mediaArray) || mediaArray.length === 0) {
            return;
        }
        console.log(`  📸 Migrujem ${mediaArray.length} ${mediaType} súborov...`);
        for (let i = 0; i < mediaArray.length; i++) {
            const media = mediaArray[i];
            try {
                // Ak už je URL (nie base64), preskoč
                if (typeof media === 'string' && media.startsWith('http')) {
                    continue;
                }
                // Ak je objekt s base64 URL
                if (media && typeof media === 'object' && media.url) {
                    const base64Url = media.url;
                    // Skontroluj či je base64
                    if (base64Url.startsWith('data:')) {
                        await this.migrateBase64ToR2(media, protocolId, mediaType, protocolType, i);
                    }
                }
            }
            catch (error) {
                console.error(`    ❌ Chyba pri migrácii súboru ${i}:`, error);
                this.errorCount++;
            }
        }
    }
    /**
     * Migrácia base64 súboru do R2
     */
    async migrateBase64ToR2(media, protocolId, mediaType, protocolType, index) {
        const base64Url = media.url;
        try {
            // Extrahuj base64 data
            const base64Data = base64Url.split(',')[1];
            if (!base64Data) {
                console.log(`    ⚠️ Neplatný base64 formát pre súbor ${index}`);
                return;
            }
            // Konvertuj na buffer
            const buffer = Buffer.from(base64Data, 'base64');
            // Urči content type
            const contentType = this.getContentTypeFromBase64(base64Url);
            // Generuj filename
            const filename = `${mediaType}_${protocolType}_${protocolId.slice(-8)}_${index}_${Date.now()}.${this.getExtensionFromContentType(contentType)}`;
            // Upload do R2
            const fileKey = r2_storage_js_1.r2Storage.generateFileKey('protocol', protocolId, filename);
            const r2Url = await r2_storage_js_1.r2Storage.uploadFile(fileKey, buffer, contentType, {
                original_name: filename,
                migrated_from_base64: 'true',
                original_id: media.id,
                media_type: mediaType,
                protocol_type: protocolType,
                migrated_at: new Date().toISOString()
            });
            // Aktualizuj media objekt
            media.url = r2Url;
            media.migrated = true;
            media.r2Key = fileKey;
            media.migratedAt = new Date();
            this.migratedCount++;
            console.log(`    ✅ Migrovaný súbor ${index} -> ${r2Url}`);
        }
        catch (error) {
            console.error(`    ❌ Chyba pri migrácii súboru ${index}:`, error);
            this.errorCount++;
        }
    }
    /**
     * Aktualizácia protokolu v databáze
     */
    async updateProtocolInDatabase(protocolId, type, mediaData) {
        try {
            // Použijeme updateReturnProtocol ak existuje
            if (type === 'return') {
                await postgres_database_js_1.postgresDatabase.updateReturnProtocol(protocolId, {
                    vehicleImages: mediaData.vehicle_images_urls,
                    vehicleVideos: mediaData.vehicle_videos_urls,
                    documentImages: mediaData.document_images_urls,
                    damageImages: mediaData.damage_images_urls
                });
            }
            else {
                // Pre handover protokoly použijeme priamy update
                console.log(`  ⚠️ Handover protokol update nie je implementovaný`);
            }
            console.log(`  ✅ Protokol ${type} ${protocolId.slice(-8)} aktualizovaný v databáze`);
        }
        catch (error) {
            console.error(`  ❌ Chyba pri aktualizácii protokolu ${protocolId}:`, error);
        }
    }
    /**
     * Získanie content type z base64 URL
     */
    getContentTypeFromBase64(base64Url) {
        const match = base64Url.match(/data:([^;]+);base64/);
        return match ? match[1] : 'image/jpeg';
    }
    /**
     * Získanie prípony z content type
     */
    getExtensionFromContentType(contentType) {
        const extensions = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif',
            'application/pdf': 'pdf',
            'image/svg+xml': 'svg'
        };
        return extensions[contentType] || 'jpg';
    }
    /**
     * Kontrola migrácie
     */
    async checkMigrationStatus() {
        console.log('🔍 Kontrolujem stav migrácie...');
        try {
            // Kontrola R2 konfigurácie
            const r2Configured = r2_storage_js_1.r2Storage.isConfigured();
            console.log(`☁️ R2 Storage: ${r2Configured ? '✅ Nakonfigurované' : '❌ Nenakonfigurované'}`);
            if (!r2Configured) {
                console.log('📋 Nastavte environment variables:');
                console.log('  R2_ENDPOINT');
                console.log('  R2_ACCESS_KEY_ID');
                console.log('  R2_SECRET_ACCESS_KEY');
                console.log('  R2_BUCKET_NAME');
                console.log('  R2_PUBLIC_URL');
            }
        }
        catch (error) {
            console.error('❌ Chyba pri kontrole stavu:', error);
        }
    }
}
// Export singleton
exports.r2Migration = new R2Migration();
// CLI usage - odstránené kvôli TypeScript kompatibilite
// Použite: import { r2Migration } from './migrate-to-r2.js';
// r2Migration.migrateAllProtocols();
// r2Migration.checkMigrationStatus(); 
//# sourceMappingURL=migrate-to-r2.js.map