"use strict";
/**
 * Protocol V2 API Routes
 * Nové API endpoints pre Protocol V2 systém
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const postgres_database_1 = require("../models/postgres-database");
const setup_1 = require("../queues/setup");
const photo_service_v2_1 = require("../services/photo-service-v2");
const r2_storage_1 = require("../utils/r2-storage");
const migration_script_1 = require("../utils/v2/migration-script");
const router = express_1.default.Router();
// Multer setup pre file uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
        files: 20 // Max 20 súborov naraz
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`));
        }
    }
});
/**
 * POST /api/v2/protocols/photos/upload
 * Upload fotografií pre protokol
 */
router.post('/photos/upload', upload.array('photos', 20), async (req, res) => {
    try {
        const { protocolId, userId } = req.body;
        const files = req.files;
        if (!protocolId) {
            return res.status(400).json({
                success: false,
                error: 'protocolId is required'
            });
        }
        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No photos provided'
            });
        }
        // Check feature flag
        const client = await postgres_database_1.postgresDatabase.dbPool.connect();
        const flagResult = await client.query(`
      SELECT enabled, percentage FROM feature_flags 
      WHERE flag_name = 'PROTOCOL_V2_PHOTO_UPLOAD'
    `);
        const flagEnabled = flagResult.rows.length > 0 && flagResult.rows[0].enabled;
        client.release();
        if (!flagEnabled) {
            return res.status(403).json({
                success: false,
                error: 'Protocol V2 photo upload not enabled'
            });
        }
        // Batch upload fotografií
        const uploadRequests = files.map(file => ({
            file: file.buffer,
            filename: file.originalname,
            mimeType: file.mimetype,
            protocolId,
            userId,
            metadata: {
                size: file.size,
                uploadedAt: new Date()
            }
        }));
        const uploadResults = await photo_service_v2_1.photoServiceV2.uploadMultiplePhotos(uploadRequests);
        // Štatistiky
        const successful = uploadResults.filter(r => r.success);
        const failed = uploadResults.filter(r => !r.success);
        res.json({
            success: failed.length === 0,
            message: `Uploaded ${successful.length}/${files.length} photos`,
            results: {
                successful: successful.length,
                failed: failed.length,
                photos: uploadResults.map(result => ({
                    photoId: result.photoId,
                    success: result.success,
                    originalUrl: result.originalUrl,
                    jobId: result.jobId,
                    error: result.error
                }))
            }
        });
    }
    catch (error) {
        console.error('Photo upload failed:', error);
        res.status(500).json({
            success: false,
            error: 'Photo upload failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/v2/protocols/photos/:photoId/status
 * Status photo processing
 */
router.get('/photos/:photoId/status', async (req, res) => {
    try {
        const { photoId } = req.params;
        // Získanie statusu z databázy
        const client = await postgres_database_1.postgresDatabase.dbPool.connect();
        const photoResult = await client.query(`
      SELECT 
        pd.photo_id,
        pd.status,
        pd.original_url,
        pd.thumb_url,
        pd.gallery_url,
        pd.pdf_url,
        pd.processing_progress,
        pd.error_message,
        pm.metadata,
        pm.created_at,
        pm.processed_at
      FROM photo_derivatives pd
      LEFT JOIN photo_metadata_v2 pm ON pd.photo_id = pm.photo_id
      WHERE pd.photo_id = $1
    `, [photoId]);
        client.release();
        if (photoResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Photo not found'
            });
        }
        const photo = photoResult.rows[0];
        // Check queue job status ak je ešte pending
        let queueProgress = null;
        if (photo.status === 'processing') {
            try {
                // Nájdi job v queue
                const activeJobs = await setup_1.photoQueue.getActive();
                const pendingJobs = await setup_1.photoQueue.getWaiting();
                const allJobs = [...activeJobs, ...pendingJobs];
                const photoJob = allJobs.find(job => job.data && job.data.photoId === photoId);
                if (photoJob) {
                    queueProgress = await photoJob.progress();
                }
            }
            catch (queueError) {
                console.warn('Failed to get queue progress:', queueError);
            }
        }
        res.json({
            success: true,
            photo: {
                photoId: photo.photo_id,
                status: photo.status,
                progress: queueProgress || photo.processing_progress || 0,
                urls: {
                    original: photo.original_url,
                    thumb: photo.thumb_url,
                    gallery: photo.gallery_url,
                    pdf: photo.pdf_url
                },
                metadata: photo.metadata,
                createdAt: photo.created_at,
                processedAt: photo.processed_at,
                error: photo.error_message
            }
        });
    }
    catch (error) {
        console.error('Failed to get photo status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get photo status',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * POST /api/v2/protocols/:protocolId/generate-pdf
 * Generovanie PDF protokolu
 */
router.post('/:protocolId/generate-pdf', async (req, res) => {
    try {
        const { protocolId } = req.params;
        const { protocolType, protocolData, userId } = req.body;
        if (!protocolType || !protocolData) {
            return res.status(400).json({
                success: false,
                error: 'protocolType and protocolData are required'
            });
        }
        if (!['handover', 'return'].includes(protocolType)) {
            return res.status(400).json({
                success: false,
                error: 'protocolType must be "handover" or "return"'
            });
        }
        // Check feature flag
        const client = await postgres_database_1.postgresDatabase.dbPool.connect();
        const flagResult = await client.query(`
      SELECT enabled FROM feature_flags 
      WHERE flag_name = 'PROTOCOL_V2_PDF_GENERATION'
    `);
        const flagEnabled = flagResult.rows.length > 0 && flagResult.rows[0].enabled;
        client.release();
        if (!flagEnabled) {
            return res.status(403).json({
                success: false,
                error: 'Protocol V2 PDF generation not enabled'
            });
        }
        // Pridanie do queue
        const job = await setup_1.pdfQueue.add('build-protocol-pdf', {
            protocolId,
            protocolType,
            protocolData,
            userId,
            priority: 1
        }, {
            priority: 1,
            delay: 0
        });
        res.json({
            success: true,
            message: 'PDF generation started',
            jobId: job.id?.toString(),
            protocolId,
            estimatedTime: '2-5 minutes'
        });
    }
    catch (error) {
        console.error('PDF generation request failed:', error);
        res.status(500).json({
            success: false,
            error: 'PDF generation request failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/v2/protocols/:protocolId/pdf/status
 * Status PDF generovania
 */
router.get('/:protocolId/pdf/status', async (req, res) => {
    try {
        const { protocolId } = req.params;
        // Získanie statusu z databázy
        const client = await postgres_database_1.postgresDatabase.dbPool.connect();
        const pdfResult = await client.query(`
      SELECT 
        job_type,
        status,
        result_url,
        error_message,
        metadata,
        created_at,
        completed_at
      FROM protocol_processing_jobs
      WHERE protocol_id = $1 AND job_type = 'pdf_generation'
      ORDER BY created_at DESC
      LIMIT 1
    `, [protocolId]);
        client.release();
        if (pdfResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No PDF generation job found for this protocol'
            });
        }
        const job = pdfResult.rows[0];
        let queueProgress = null;
        // Check queue status ak je ešte processing
        if (job.status === 'processing') {
            try {
                const activeJobs = await setup_1.pdfQueue.getActive();
                const pendingJobs = await setup_1.pdfQueue.getWaiting();
                const allJobs = [...activeJobs, ...pendingJobs];
                const pdfJob = allJobs.find(queueJob => queueJob.data && queueJob.data.protocolId === protocolId);
                if (pdfJob) {
                    queueProgress = await pdfJob.progress();
                }
            }
            catch (queueError) {
                console.warn('Failed to get PDF queue progress:', queueError);
            }
        }
        res.json({
            success: true,
            pdf: {
                protocolId,
                status: job.status,
                progress: queueProgress || 100,
                url: job.result_url,
                error: job.error_message,
                metadata: job.metadata,
                createdAt: job.created_at,
                completedAt: job.completed_at
            }
        });
    }
    catch (error) {
        console.error('Failed to get PDF status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get PDF status',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * POST /api/v2/protocols/:protocolId/generate-manifest
 * Generovanie manifestu pre protokol
 */
router.post('/:protocolId/generate-manifest', async (req, res) => {
    try {
        const { protocolId } = req.params;
        const { photoIds, userId } = req.body;
        if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'photoIds array is required'
            });
        }
        // Pridanie do queue
        const job = await setup_1.pdfQueue.add('generate-manifest', {
            protocolId,
            photoIds,
            userId,
            metadata: {
                requestedAt: new Date(),
                photoCount: photoIds.length
            }
        }, {
            priority: 2, // Nižšia priorita ako PDF generation
            delay: 0
        });
        res.json({
            success: true,
            message: 'Manifest generation started',
            jobId: job.id?.toString(),
            protocolId,
            photoCount: photoIds.length
        });
    }
    catch (error) {
        console.error('Manifest generation request failed:', error);
        res.status(500).json({
            success: false,
            error: 'Manifest generation request failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/v2/protocols/:protocolId/manifest
 * Získanie manifestu protokolu
 */
router.get('/:protocolId/manifest', async (req, res) => {
    try {
        const { protocolId } = req.params;
        const client = await postgres_database_1.postgresDatabase.dbPool.connect();
        const manifestResult = await client.query(`
      SELECT 
        result_url,
        status,
        metadata,
        created_at,
        completed_at
      FROM protocol_processing_jobs
      WHERE protocol_id = $1 AND job_type = 'manifest_generation'
      ORDER BY created_at DESC
      LIMIT 1
    `, [protocolId]);
        client.release();
        if (manifestResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No manifest found for this protocol'
            });
        }
        const manifest = manifestResult.rows[0];
        if (manifest.status !== 'completed' || !manifest.result_url) {
            return res.status(202).json({
                success: false,
                error: 'Manifest not ready yet',
                status: manifest.status
            });
        }
        // Download manifestu z R2
        const manifestKey = manifest.result_url.split('/').pop();
        const manifestBuffer = await r2_storage_1.r2Storage.getFile(`protocols/${protocolId}/${manifestKey}`);
        if (!manifestBuffer) {
            return res.status(404).json({
                success: false,
                error: 'Manifest file not found'
            });
        }
        const manifestData = JSON.parse(manifestBuffer.toString('utf-8'));
        res.json({
            success: true,
            manifest: manifestData,
            metadata: {
                url: manifest.result_url,
                createdAt: manifest.created_at,
                completedAt: manifest.completed_at
            }
        });
    }
    catch (error) {
        console.error('Failed to get manifest:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get manifest',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/v2/protocols/:protocolId/photos
 * Zoznam všetkých fotografií protokolu
 */
router.get('/:protocolId/photos', async (req, res) => {
    try {
        const { protocolId } = req.params;
        const client = await postgres_database_1.postgresDatabase.dbPool.connect();
        const photosResult = await client.query(`
      SELECT 
        pd.photo_id,
        pd.status,
        pd.original_url,
        pd.thumb_url,
        pd.gallery_url,
        pd.pdf_url,
        pd.processing_progress,
        pd.error_message,
        pm.metadata,
        pm.created_at,
        pm.processed_at
      FROM photo_derivatives pd
      LEFT JOIN photo_metadata_v2 pm ON pd.photo_id = pm.photo_id
      WHERE pd.protocol_id = $1
      ORDER BY pm.created_at
    `, [protocolId]);
        client.release();
        const photos = photosResult.rows.map(row => ({
            photoId: row.photo_id,
            status: row.status,
            progress: row.processing_progress || 0,
            urls: {
                original: row.original_url,
                thumb: row.thumb_url,
                gallery: row.gallery_url,
                pdf: row.pdf_url
            },
            metadata: row.metadata,
            createdAt: row.created_at,
            processedAt: row.processed_at,
            error: row.error_message
        }));
        res.json({
            success: true,
            protocolId,
            photoCount: photos.length,
            photos
        });
    }
    catch (error) {
        console.error('Failed to get protocol photos:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get protocol photos',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * DELETE /api/v2/protocols/photos/:photoId
 * Vymazanie fotografie
 */
router.delete('/photos/:photoId', async (req, res) => {
    try {
        const { photoId } = req.params;
        const { userId } = req.body;
        // Získanie photo recordu
        const client = await postgres_database_1.postgresDatabase.dbPool.connect();
        const photoResult = await client.query(`
      SELECT protocol_id, original_url, thumb_url, gallery_url, pdf_url
      FROM photo_derivatives
      WHERE photo_id = $1
    `, [photoId]);
        if (photoResult.rows.length === 0) {
            client.release();
            return res.status(404).json({
                success: false,
                error: 'Photo not found'
            });
        }
        const photo = photoResult.rows[0];
        // Vymazanie z R2 storage
        const deletePromises = [
            photo.original_url,
            photo.thumb_url,
            photo.gallery_url,
            photo.pdf_url
        ].filter(Boolean).map(url => {
            const key = url.split('/').slice(-3).join('/'); // Extract key from URL
            return r2_storage_1.r2Storage.deleteFile(key).catch((error) => {
                console.warn(`Failed to delete file ${key}:`, error);
            });
        });
        await Promise.all(deletePromises);
        // Vymazanie z databázy
        await client.query('DELETE FROM photo_derivatives WHERE photo_id = $1', [photoId]);
        await client.query('DELETE FROM photo_metadata_v2 WHERE photo_id = $1', [photoId]);
        client.release();
        // Log deletion
        console.log(`Photo deleted: ${photoId}`, {
            protocolId: photo.protocol_id,
            userId,
            deletedAt: new Date()
        });
        res.json({
            success: true,
            message: 'Photo deleted successfully',
            photoId
        });
    }
    catch (error) {
        console.error('Failed to delete photo:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete photo',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/v2/queue/stats
 * Štatistiky queue systému
 */
router.get('/queue/stats', async (req, res) => {
    try {
        const [photoStats, pdfStats] = await Promise.all([
            {
                waiting: (await setup_1.photoQueue.getWaiting()).length,
                active: (await setup_1.photoQueue.getActive()).length,
                completed: (await setup_1.photoQueue.getCompleted()).length,
                failed: (await setup_1.photoQueue.getFailed()).length
            },
            {
                waiting: (await setup_1.pdfQueue.getWaiting()).length,
                active: (await setup_1.pdfQueue.getActive()).length,
                completed: (await setup_1.pdfQueue.getCompleted()).length,
                failed: (await setup_1.pdfQueue.getFailed()).length
            }
        ]);
        res.json({
            success: true,
            timestamp: new Date(),
            queues: {
                photo: photoStats,
                pdf: pdfStats
            },
            health: {
                photoQueue: photoStats.active + photoStats.waiting < 100,
                pdfQueue: pdfStats.active + pdfStats.waiting < 50
            }
        });
    }
    catch (error) {
        console.error('Failed to get queue stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get queue stats',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * POST /api/v2/migration/start
 * Spustenie migrácie V1 → V2
 */
router.post('/migration/start', async (req, res) => {
    try {
        const { batchSize = 10, dryRun = false, protocolIds, startDate, endDate, skipPhotos = false, skipPdfs = false } = req.body;
        // Check admin permissions
        // TODO: Add proper admin check
        console.log('🚀 Starting V1 → V2 migration', {
            dryRun,
            batchSize,
            protocolIds: protocolIds?.length || 'all',
            dateRange: startDate && endDate ? `${startDate} - ${endDate}` : 'all'
        });
        // Start migration
        const progress = await migration_script_1.migrationService.migrateProtocols({
            batchSize,
            dryRun,
            protocolIds,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            skipPhotos,
            skipPdfs
        });
        res.json({
            success: true,
            message: dryRun ? 'Dry run completed' : 'Migration completed',
            progress,
            summary: {
                total: progress.total,
                successful: progress.successful,
                failed: progress.failed,
                successRate: progress.total > 0 ? Math.round((progress.successful / progress.total) * 100) : 0,
                duration: Date.now() - progress.startTime.getTime(),
                errors: progress.errors.length
            }
        });
    }
    catch (error) {
        console.error('Migration failed:', error);
        res.status(500).json({
            success: false,
            error: 'Migration failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/v2/migration/progress
 * Status migrácie
 */
router.get('/migration/progress', async (req, res) => {
    try {
        const progress = migration_script_1.migrationService.getProgress();
        res.json({
            success: true,
            progress,
            isRunning: progress.processed < progress.total && progress.total > 0
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get migration progress',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * POST /api/v2/migration/rollback/:protocolId
 * Rollback migrácie pre konkrétny protokol
 */
router.post('/migration/rollback/:protocolId', async (req, res) => {
    try {
        const { protocolId } = req.params;
        // Check admin permissions
        // TODO: Add proper admin check
        await migration_script_1.migrationService.rollbackProtocol(protocolId);
        res.json({
            success: true,
            message: `Protocol ${protocolId} rollback completed`,
            protocolId
        });
    }
    catch (error) {
        console.error(`Rollback failed for protocol ${req.params.protocolId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Rollback failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/v2/migration/validate/:protocolId
 * Validácia migrácie pre protokol
 */
router.get('/migration/validate/:protocolId', async (req, res) => {
    try {
        const { protocolId } = req.params;
        const validation = await migration_script_1.migrationService.validateMigration(protocolId);
        res.json({
            success: true,
            protocolId,
            validation
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Validation failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=protocols-v2.js.map