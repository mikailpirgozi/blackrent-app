"use strict";
/**
 * Manifest Worker pre Protocol V2
 * Spravuje manifesty súborov a integrity checking
 */
Object.defineProperty(exports, "__esModule", { value: true });
const setup_1 = require("../queues/setup");
const hash_calculator_1 = require("../utils/v2/hash-calculator");
const r2_storage_1 = require("../utils/r2-storage");
const postgres_database_1 = require("../models/postgres-database");
/**
 * Worker pre generovanie protocol manifestov
 */
setup_1.pdfQueue.process('generate-manifest', async (job) => {
    const startTime = Date.now();
    const { protocolId, photoIds } = job.data;
    try {
        await job.progress(10);
        // Získanie všetkých photo recordov
        const client = await postgres_database_1.postgresDatabase.dbPool.connect();
        const photosQuery = `
      SELECT 
        pd.photo_id,
        pd.original_hash,
        pd.thumb_hash,
        pd.gallery_hash, 
        pd.pdf_hash,
        pd.original_size,
        pd.thumb_size,
        pd.gallery_size,
        pd.pdf_size,
        pm.metadata,
        pm.created_at
      FROM photo_derivatives pd
      LEFT JOIN photo_metadata_v2 pm ON pd.photo_id = pm.photo_id
      WHERE pd.photo_id = ANY($1)
      ORDER BY pm.created_at
    `;
        const photosResult = await client.query(photosQuery, [photoIds]);
        client.release();
        await job.progress(30);
        if (photosResult.rows.length === 0) {
            throw new Error(`No photos found for protocol ${protocolId}`);
        }
        // Vytvorenie protocol manifestu
        const manifest = {
            protocolId,
            version: '2.0',
            createdAt: new Date(),
            photos: photosResult.rows.map(row => ({
                photoId: row.photo_id,
                hashes: {
                    original: row.original_hash,
                    thumb: row.thumb_hash,
                    gallery: row.gallery_hash,
                    pdf: row.pdf_hash
                },
                sizes: {
                    original: row.original_size,
                    thumb: row.thumb_size,
                    gallery: row.gallery_size,
                    pdf: row.pdf_size
                },
                metadata: row.metadata,
                createdAt: row.created_at
            })),
            summary: {
                photoCount: photosResult.rows.length,
                totalOriginalSize: photosResult.rows.reduce((sum, row) => sum + (row.original_size || 0), 0),
                totalDerivativeSize: photosResult.rows.reduce((sum, row) => sum + (row.thumb_size || 0) + (row.gallery_size || 0) + (row.pdf_size || 0), 0),
                compressionRatio: 0 // Vypočíta sa nižšie
            }
        };
        // Vypočítanie compression ratio
        const totalOriginal = manifest.summary.totalOriginalSize;
        const totalDerivatives = manifest.summary.totalDerivativeSize;
        manifest.summary.compressionRatio = totalOriginal > 0
            ? Math.round(((totalOriginal * 3 - totalDerivatives) / (totalOriginal * 3)) * 100)
            : 0;
        await job.progress(60);
        // Generovanie manifest hash
        const manifestJson = JSON.stringify(manifest, null, 2);
        const manifestBuffer = Buffer.from(manifestJson, 'utf-8');
        const manifestHash = hash_calculator_1.HashCalculator.calculateSHA256(manifestBuffer);
        // Upload manifestu na R2
        const manifestKey = `protocols/${protocolId}/manifest_${manifestHash.substring(0, 16)}.json`;
        const manifestUrl = await r2_storage_1.r2Storage.uploadFile(manifestKey, manifestBuffer, 'application/json');
        await job.progress(80);
        // Save manifest record do databázy
        const manifestClient = await postgres_database_1.postgresDatabase.dbPool.connect();
        await manifestClient.query(`
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
            'manifest_generation',
            'completed',
            manifestUrl,
            JSON.stringify({
                manifestHash,
                photoCount: manifest.summary.photoCount,
                totalSize: manifest.summary.totalOriginalSize,
                compressionRatio: manifest.summary.compressionRatio,
                processingTime: Date.now() - startTime
            }),
            new Date(),
            new Date()
        ]);
        manifestClient.release();
        await job.progress(100);
        const processingTime = Date.now() - startTime;
        return {
            success: true,
            protocolId,
            manifestUrl,
            photoCount: manifest.summary.photoCount,
            totalSize: manifest.summary.totalOriginalSize,
            processingTime
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to generate manifest for protocol ${protocolId}:`, error);
        // Log error do databázy
        try {
            const errorClient = await postgres_database_1.postgresDatabase.dbPool.connect();
            await errorClient.query(`
        INSERT INTO protocol_processing_jobs (
          protocol_id, 
          job_type, 
          status, 
          error_message,
          metadata,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
                protocolId,
                'manifest_generation',
                'failed',
                errorMessage,
                JSON.stringify({
                    photoIds,
                    processingTime: Date.now() - startTime,
                    error: errorMessage
                }),
                new Date()
            ]);
            errorClient.release();
        }
        catch (dbError) {
            console.error('Failed to log manifest error:', dbError);
        }
        throw new Error(`Manifest generation failed: ${errorMessage}`);
    }
});
/**
 * Worker pre verifikáciu integrity manifestov
 */
setup_1.pdfQueue.process('verify-manifest', async (job) => {
    const { manifestUrl, protocolId } = job.data;
    try {
        // Download manifest
        const manifestKey = manifestUrl.split('/').pop();
        if (!manifestKey) {
            throw new Error('Invalid manifest URL');
        }
        const manifestBuffer = await r2_storage_1.r2Storage.getFile(`protocols/${protocolId}/${manifestKey}`);
        if (!manifestBuffer) {
            throw new Error('Manifest file not found');
        }
        const manifest = JSON.parse(manifestBuffer.toString('utf-8'));
        const issues = [];
        // Verifikácia každého súboru v manifeste
        for (const photo of manifest.photos) {
            // Check original hash
            const originalKey = `protocols/${protocolId}/photos/original/${photo.photoId}`;
            const originalBuffer = await r2_storage_1.r2Storage.getFile(originalKey);
            if (originalBuffer) {
                const actualHash = hash_calculator_1.HashCalculator.calculateSHA256(originalBuffer);
                if (actualHash !== photo.hashes.original) {
                    issues.push(`Original hash mismatch for photo ${photo.photoId}`);
                }
            }
            else {
                issues.push(`Original file missing for photo ${photo.photoId}`);
            }
        }
        return {
            success: true,
            verified: issues.length === 0,
            issues: issues.length > 0 ? issues : undefined
        };
    }
    catch (error) {
        return {
            success: false,
            verified: false,
            issues: [error instanceof Error ? error.message : 'Verification failed']
        };
    }
});
/**
 * Event handlers pre monitoring
 */
setup_1.pdfQueue.on('completed', (job, result) => {
    if (job.name === 'generate-manifest') {
        console.log(`Manifest generated: ${job.id}`, {
            protocolId: result.protocolId,
            photoCount: result.photoCount,
            processingTime: result.processingTime
        });
    }
});
setup_1.pdfQueue.on('failed', (job, err) => {
    if (job.name === 'generate-manifest') {
        console.error(`Manifest generation failed: ${job.id}`, err.message);
    }
});
setup_1.pdfQueue.on('stalled', (job) => {
    console.warn(`Manifest job stalled: ${job.id}`);
});
//# sourceMappingURL=manifest-worker.js.map