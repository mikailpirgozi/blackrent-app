"use strict";
/**
 * Migration Script pre V1 → V2 Protocol System
 * Migruje existujúce protokoly na nový V2 systém
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrationService = exports.ProtocolMigrationService = void 0;
const uuid = __importStar(require("uuid"));
const postgres_database_1 = require("../../models/postgres-database");
const r2_storage_1 = require("../r2-storage");
const hash_calculator_1 = require("./hash-calculator");
const sharp_processor_1 = require("./sharp-processor");
class ProtocolMigrationService {
    constructor() {
        this.progress = {
            total: 0,
            processed: 0,
            successful: 0,
            failed: 0,
            errors: [],
            startTime: new Date()
        };
        this.imageProcessor = new sharp_processor_1.ImageProcessor();
    }
    /**
     * Hlavná migračná funkcia
     */
    async migrateProtocols(options = {}) {
        const { batchSize = 10, dryRun = false, protocolIds, startDate, endDate, skipPhotos = false, skipPdfs = false } = options;
        console.log('🚀 Starting Protocol V1 → V2 migration', {
            dryRun,
            batchSize,
            skipPhotos,
            skipPdfs
        });
        try {
            // Reset progress
            this.progress = {
                total: 0,
                processed: 0,
                successful: 0,
                failed: 0,
                errors: [],
                startTime: new Date()
            };
            // Získanie zoznamu protokolov na migráciu
            const protocolsToMigrate = await this.getProtocolsForMigration({
                protocolIds,
                startDate,
                endDate
            });
            this.progress.total = protocolsToMigrate.length;
            console.log(`📊 Found ${this.progress.total} protocols to migrate`);
            if (dryRun) {
                console.log('🧪 DRY RUN - no actual migration will be performed');
                return this.progress;
            }
            // Migrácia po batch-och
            for (let i = 0; i < protocolsToMigrate.length; i += batchSize) {
                const batch = protocolsToMigrate.slice(i, i + batchSize);
                console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(protocolsToMigrate.length / batchSize)}`);
                await Promise.all(batch.map(protocol => this.migrateProtocol(protocol, { skipPhotos, skipPdfs })));
                // Update estimated completion
                const avgTimePerProtocol = (Date.now() - this.progress.startTime.getTime()) / this.progress.processed;
                const remainingProtocols = this.progress.total - this.progress.processed;
                this.progress.estimatedCompletion = new Date(Date.now() + (avgTimePerProtocol * remainingProtocols));
                console.log(`📈 Progress: ${this.progress.processed}/${this.progress.total} (${Math.round((this.progress.processed / this.progress.total) * 100)}%)`);
            }
            console.log('✅ Migration completed', {
                total: this.progress.total,
                successful: this.progress.successful,
                failed: this.progress.failed,
                duration: Date.now() - this.progress.startTime.getTime()
            });
            return this.progress;
        }
        catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        }
    }
    /**
     * Migrácia jednotlivého protokolu
     */
    async migrateProtocol(protocol, options) {
        try {
            const protocolId = protocol.id;
            console.log(`🔄 Migrating protocol ${protocolId}`);
            // 1. Migrácia základných dát protokolu
            await this.migrateProtocolData(protocol);
            // 2. Migrácia fotografií
            if (!options.skipPhotos && protocol.photos && Array.isArray(protocol.photos) && protocol.photos.length > 0) {
                const typedPhotos = protocol.photos;
                await this.migrateProtocolPhotos(protocolId, typedPhotos);
            }
            // 3. Migrácia PDF (ak existuje)
            if (!options.skipPdfs && protocol.pdfUrl) {
                await this.migrateProtocolPDF(protocolId, protocol.pdfUrl);
            }
            // 4. Označenie ako migrovaný
            await this.markProtocolAsMigrated(protocolId);
            this.progress.successful++;
            console.log(`✅ Protocol ${protocolId} migrated successfully`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`❌ Failed to migrate protocol ${protocol.id}:`, error);
            this.progress.errors.push({
                protocolId: protocol.id,
                error: errorMessage,
                timestamp: new Date()
            });
            this.progress.failed++;
        }
        finally {
            this.progress.processed++;
        }
    }
    /**
     * Získanie protokolov na migráciu
     */
    async getProtocolsForMigration(filters) {
        const client = await postgres_database_1.postgresDatabase.dbPool.connect();
        try {
            let query = `
        SELECT 
          p.id,
          p.vehicle_id,
          p.customer_id,
          p.rental_id,
          p.protocol_type,
          p.data,
          p.pdf_url,
          p.created_at,
          p.updated_at,
          array_agg(
            json_build_object(
              'id', pp.id,
              'url', pp.photo_url,
              'description', pp.description,
              'category', pp.category
            )
          ) FILTER (WHERE pp.id IS NOT NULL) as photos
        FROM protocols p
        LEFT JOIN protocol_photos pp ON p.id = pp.protocol_id
        WHERE p.migrated_to_v2 IS NOT TRUE
      `;
            const params = [];
            let paramIndex = 1;
            // Filter by protocol IDs
            if (filters.protocolIds && filters.protocolIds.length > 0) {
                query += ` AND p.id = ANY($${paramIndex})`;
                params.push(filters.protocolIds);
                paramIndex++;
            }
            // Filter by date range
            if (filters.startDate) {
                query += ` AND p.created_at >= $${paramIndex}`;
                params.push(filters.startDate);
                paramIndex++;
            }
            if (filters.endDate) {
                query += ` AND p.created_at <= $${paramIndex}`;
                params.push(filters.endDate);
                paramIndex++;
            }
            query += ` GROUP BY p.id ORDER BY p.created_at`;
            const result = await client.query(query, params);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
    /**
     * Migrácia základných dát protokolu
     */
    async migrateProtocolData(protocol) {
        const client = await postgres_database_1.postgresDatabase.dbPool.connect();
        try {
            // Insert do V2 tabuľky (ak neexistuje)
            await client.query(`
        INSERT INTO protocols_v2 (
          id,
          original_protocol_id,
          vehicle_id,
          customer_id,
          rental_id,
          protocol_type,
          data,
          status,
          created_at,
          migrated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [
                protocol.id,
                protocol.id,
                protocol.vehicle_id,
                protocol.customer_id,
                protocol.rental_id,
                protocol.protocol_type,
                protocol.data,
                'migrated',
                protocol.created_at,
                new Date()
            ]);
        }
        finally {
            client.release();
        }
    }
    /**
     * Migrácia fotografií protokolu
     */
    async migrateProtocolPhotos(protocolId, photos) {
        for (const photo of photos) {
            try {
                // Download original photo
                const originalBuffer = await this.downloadPhotoFromV1(photo.url);
                if (!originalBuffer) {
                    console.warn(`Failed to download photo ${photo.id} for protocol ${protocolId}`);
                    continue;
                }
                // Generate V2 derivatives
                const derivatives = await this.imageProcessor.generateDerivatives(originalBuffer);
                // Upload derivatives to R2
                const basePath = `protocols/${protocolId}/photos`;
                const photoId = photo.id || uuid.v4();
                const [thumbUrl, galleryUrl, pdfUrl] = await Promise.all([
                    r2_storage_1.r2Storage.uploadFile(`${basePath}/thumb/${photoId}.webp`, derivatives.thumb, 'image/webp'),
                    r2_storage_1.r2Storage.uploadFile(`${basePath}/gallery/${photoId}.jpg`, derivatives.gallery, 'image/jpeg'),
                    r2_storage_1.r2Storage.uploadFile(`${basePath}/pdf/${photoId}.jpg`, derivatives.pdf, 'image/jpeg')
                ]);
                // Save do V2 databázy
                await this.saveV2PhotoRecord({
                    photoId,
                    protocolId,
                    originalHash: derivatives.hash,
                    thumbHash: hash_calculator_1.HashCalculator.calculateSHA256(derivatives.thumb),
                    galleryHash: hash_calculator_1.HashCalculator.calculateSHA256(derivatives.gallery),
                    pdfHash: hash_calculator_1.HashCalculator.calculateSHA256(derivatives.pdf),
                    originalSize: originalBuffer.length,
                    thumbSize: derivatives.thumb.length,
                    gallerySize: derivatives.gallery.length,
                    pdfSize: derivatives.pdf.length,
                    thumbUrl,
                    galleryUrl,
                    pdfUrl,
                    metadata: {
                        ...derivatives.metadata,
                        originalPhoto: photo,
                        migratedAt: new Date()
                    }
                });
                console.log(`📸 Migrated photo ${photoId} for protocol ${protocolId}`);
            }
            catch (error) {
                console.error(`Failed to migrate photo ${photo.id}:`, error);
                // Pokračuj s ďalšími fotkami
            }
        }
    }
    /**
     * Migrácia PDF protokolu
     */
    async migrateProtocolPDF(protocolId, pdfUrl) {
        try {
            // Download original PDF
            const pdfBuffer = await this.downloadPDFFromV1(pdfUrl);
            if (!pdfBuffer) {
                console.warn(`Failed to download PDF for protocol ${protocolId}`);
                return;
            }
            // Upload do V2 storage
            const pdfHash = hash_calculator_1.HashCalculator.calculateSHA256(pdfBuffer);
            const newPdfKey = `protocols/${protocolId}/pdf/migrated_${pdfHash.substring(0, 16)}.pdf`;
            const newPdfUrl = await r2_storage_1.r2Storage.uploadFile(newPdfKey, pdfBuffer, 'application/pdf');
            // Save PDF record
            const client = await postgres_database_1.postgresDatabase.dbPool.connect();
            await client.query(`
        INSERT INTO protocol_processing_jobs (
          protocol_id,
          job_type,
          status,
          result_url,
          metadata,
          created_at,
          completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
                protocolId,
                'pdf_migration',
                'completed',
                newPdfUrl,
                JSON.stringify({
                    originalUrl: pdfUrl,
                    pdfHash,
                    fileSize: pdfBuffer.length,
                    migratedAt: new Date()
                }),
                new Date(),
                new Date()
            ]);
            client.release();
            console.log(`📄 Migrated PDF for protocol ${protocolId}`);
        }
        catch (error) {
            console.error(`Failed to migrate PDF for protocol ${protocolId}:`, error);
        }
    }
    /**
     * Download foto z V1 systému
     */
    async downloadPhotoFromV1(photoUrl) {
        try {
            // Ak je to už R2 URL, použij R2 storage
            if (photoUrl.includes('blackrent-storage')) {
                const key = this.extractR2KeyFromUrl(photoUrl);
                return await r2_storage_1.r2Storage.getFile(key);
            }
            // Inak fetch cez HTTP
            const response = await fetch(photoUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        }
        catch (error) {
            console.error(`Failed to download photo ${photoUrl}:`, error);
            return null;
        }
    }
    /**
     * Download PDF z V1 systému
     */
    async downloadPDFFromV1(pdfUrl) {
        try {
            // Podobne ako pre fotky
            if (pdfUrl.includes('blackrent-storage')) {
                const key = this.extractR2KeyFromUrl(pdfUrl);
                return await r2_storage_1.r2Storage.getFile(key);
            }
            const response = await fetch(pdfUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        }
        catch (error) {
            console.error(`Failed to download PDF ${pdfUrl}:`, error);
            return null;
        }
    }
    /**
     * Extract R2 key z URL
     */
    extractR2KeyFromUrl(url) {
        // Extract key z R2 URL formátu
        const urlParts = url.split('/');
        const keyStartIndex = urlParts.findIndex(part => part === 'blackrent-storage') + 1;
        return urlParts.slice(keyStartIndex).join('/');
    }
    /**
     * Save V2 photo record
     */
    async saveV2PhotoRecord(data) {
        const client = await postgres_database_1.postgresDatabase.dbPool.connect();
        try {
            // Insert do photo_derivatives
            await client.query(`
        INSERT INTO photo_derivatives (
          photo_id,
          protocol_id,
          original_hash,
          thumb_hash,
          gallery_hash,
          pdf_hash,
          original_size,
          thumb_size,
          gallery_size,
          pdf_size,
          thumb_url,
          gallery_url,
          pdf_url,
          status,
          processing_progress,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (photo_id) DO UPDATE SET
          thumb_url = EXCLUDED.thumb_url,
          gallery_url = EXCLUDED.gallery_url,
          pdf_url = EXCLUDED.pdf_url,
          status = EXCLUDED.status,
          processing_progress = EXCLUDED.processing_progress
      `, [
                data.photoId,
                data.protocolId,
                data.originalHash,
                data.thumbHash,
                data.galleryHash,
                data.pdfHash,
                data.originalSize,
                data.thumbSize,
                data.gallerySize,
                data.pdfSize,
                data.thumbUrl,
                data.galleryUrl,
                data.pdfUrl,
                'completed',
                100,
                new Date()
            ]);
            // Insert do photo_metadata_v2
            await client.query(`
        INSERT INTO photo_metadata_v2 (
          photo_id,
          protocol_id,
          metadata,
          created_at,
          processed_at
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (photo_id) DO UPDATE SET
          metadata = EXCLUDED.metadata,
          processed_at = EXCLUDED.processed_at
      `, [
                data.photoId,
                data.protocolId,
                JSON.stringify(data.metadata),
                new Date(),
                new Date()
            ]);
        }
        finally {
            client.release();
        }
    }
    /**
     * Označenie protokolu ako migrovaný
     */
    async markProtocolAsMigrated(protocolId) {
        const client = await postgres_database_1.postgresDatabase.dbPool.connect();
        try {
            await client.query(`
        UPDATE protocols 
        SET 
          migrated_to_v2 = true,
          migrated_at = $2
        WHERE id = $1
      `, [protocolId, new Date()]);
        }
        finally {
            client.release();
        }
    }
    /**
     * Rollback migrácie pre protokol
     */
    async rollbackProtocol(protocolId) {
        const client = await postgres_database_1.postgresDatabase.dbPool.connect();
        try {
            console.log(`🔄 Rolling back protocol ${protocolId}`);
            // Delete V2 records
            await client.query('DELETE FROM photo_metadata_v2 WHERE protocol_id = $1', [protocolId]);
            await client.query('DELETE FROM photo_derivatives WHERE protocol_id = $1', [protocolId]);
            await client.query('DELETE FROM protocol_processing_jobs WHERE protocol_id = $1', [protocolId]);
            await client.query('DELETE FROM protocols_v2 WHERE id = $1', [protocolId]);
            // Reset migration flag
            await client.query(`
        UPDATE protocols 
        SET 
          migrated_to_v2 = false,
          migrated_at = NULL
        WHERE id = $1
      `, [protocolId]);
            // TODO: Delete files from R2 storage
            // await this.deleteV2FilesFromStorage(protocolId);
            console.log(`✅ Protocol ${protocolId} rollback completed`);
        }
        finally {
            client.release();
        }
    }
    /**
     * Získanie migration progress
     */
    getProgress() {
        return { ...this.progress };
    }
    /**
     * Validácia migrácie
     */
    async validateMigration(protocolId) {
        const issues = [];
        try {
            const client = await postgres_database_1.postgresDatabase.dbPool.connect();
            // Check V2 protocol record
            const v2Result = await client.query('SELECT id FROM protocols_v2 WHERE id = $1', [protocolId]);
            if (v2Result.rows.length === 0) {
                issues.push('V2 protocol record not found');
            }
            // Check photos
            const photosResult = await client.query(`
        SELECT COUNT(*) as count FROM photo_derivatives WHERE protocol_id = $1
      `, [protocolId]);
            const photoCount = parseInt(photosResult.rows[0].count);
            // Check original photos count
            const originalPhotosResult = await client.query(`
        SELECT COUNT(*) as count FROM protocol_photos WHERE protocol_id = $1
      `, [protocolId]);
            const originalPhotoCount = parseInt(originalPhotosResult.rows[0].count);
            if (photoCount !== originalPhotoCount) {
                issues.push(`Photo count mismatch: V1=${originalPhotoCount}, V2=${photoCount}`);
            }
            client.release();
            return {
                valid: issues.length === 0,
                issues
            };
        }
        catch (error) {
            issues.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {
                valid: false,
                issues
            };
        }
    }
}
exports.ProtocolMigrationService = ProtocolMigrationService;
// Export singleton instance
exports.migrationService = new ProtocolMigrationService();
//# sourceMappingURL=migration-script.js.map