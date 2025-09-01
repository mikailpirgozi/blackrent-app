"use strict";
/**
 * PDF Builder Queue pre Protocol V2
 * Koordinuje generovanie PDF protokolov s fotografiami
 */
Object.defineProperty(exports, "__esModule", { value: true });
const setup_1 = require("./setup");
const pdf_a_generator_1 = require("../utils/v2/pdf-a-generator");
const r2_storage_1 = require("../utils/r2-storage");
const postgres_database_1 = require("../models/postgres-database");
const pdfGenerator = new pdf_a_generator_1.PDFAGenerator();
/**
 * Worker pre generovanie PDF protokolov
 */
setup_1.pdfQueue.process('build-protocol-pdf', async (job) => {
    const startTime = Date.now();
    const { protocolId, protocolType, protocolData, userId } = job.data;
    try {
        await job.progress(10);
        // Validácia vstupných dát
        if (!protocolData.vehicle || !protocolData.customer || !protocolData.rental) {
            throw new Error('Missing required protocol data');
        }
        await job.progress(20);
        // Príprava photos pre PDF generátor
        const photos = protocolData.photos || [];
        const processedPhotos = [];
        for (const photo of photos) {
            try {
                // Získanie PDF verzie obrázka
                const pdfPhotoKey = `protocols/${protocolId}/photos/pdf/${photo.photoId}`;
                const photoExists = await r2_storage_1.r2Storage.fileExists(pdfPhotoKey);
                if (photoExists) {
                    processedPhotos.push({
                        ...photo,
                        url: await r2_storage_1.r2Storage.getSignedUrl(pdfPhotoKey, 3600) // 1 hodina
                    });
                }
                else {
                    console.warn(`PDF photo not found: ${pdfPhotoKey}`);
                    // Skúsi gallery verziu ako fallback
                    const galleryPhotoKey = `protocols/${protocolId}/photos/gallery/${photo.photoId}`;
                    const galleryExists = await r2_storage_1.r2Storage.fileExists(galleryPhotoKey);
                    if (galleryExists) {
                        processedPhotos.push({
                            ...photo,
                            url: await r2_storage_1.r2Storage.getSignedUrl(galleryPhotoKey, 3600)
                        });
                    }
                }
            }
            catch (error) {
                console.error(`Failed to process photo ${photo.photoId}:`, error);
                // Pokračuj bez tohto obrázka
            }
        }
        await job.progress(50);
        // Generovanie PDF
        const pdfRequest = {
            protocolId,
            protocolType,
            data: {
                ...protocolData,
                photos: processedPhotos
            },
            userId
        };
        const pdfResult = await pdfGenerator.generateProtocolPDF(pdfRequest);
        if (!pdfResult.success) {
            throw new Error(pdfResult.error || 'PDF generation failed');
        }
        await job.progress(80);
        // Uloženie záznamu do databázy
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
            'pdf_generation',
            'completed',
            pdfResult.pdfUrl,
            JSON.stringify({
                protocolType,
                pdfHash: pdfResult.pdfHash,
                fileSize: pdfResult.fileSize,
                pageCount: pdfResult.pageCount,
                photoCount: processedPhotos.length,
                processingTime: pdfResult.processingTime,
                userId
            }),
            new Date(),
            new Date()
        ]);
        client.release();
        await job.progress(100);
        const totalProcessingTime = Date.now() - startTime;
        return {
            success: true,
            protocolId,
            pdfUrl: pdfResult.pdfUrl,
            pdfHash: pdfResult.pdfHash,
            fileSize: pdfResult.fileSize,
            pageCount: pdfResult.pageCount,
            processingTime: totalProcessingTime
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`PDF build failed for protocol ${protocolId}:`, error);
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
                'pdf_generation',
                'failed',
                errorMessage,
                JSON.stringify({
                    protocolType,
                    userId,
                    processingTime: Date.now() - startTime,
                    error: errorMessage
                }),
                new Date()
            ]);
            errorClient.release();
        }
        catch (dbError) {
            console.error('Failed to log PDF build error:', dbError);
        }
        throw new Error(`PDF build failed: ${errorMessage}`);
    }
});
/**
 * Bulk PDF generation pre multiple protokoly
 */
setup_1.pdfQueue.process('bulk-pdf-build', async (job) => {
    const { protocols } = job.data;
    const results = [];
    let completed = 0;
    let failed = 0;
    // Spracovanie po batch-och (max 3 súčasne)
    const batchSize = 3;
    for (let i = 0; i < protocols.length; i += batchSize) {
        const batch = protocols.slice(i, i + batchSize);
        const batchPromises = batch.map(async (protocolJob) => {
            try {
                const result = await pdfGenerator.generateProtocolPDF({
                    protocolId: protocolJob.protocolId,
                    protocolType: protocolJob.protocolType,
                    data: protocolJob.protocolData,
                    userId: protocolJob.userId
                });
                if (result.success) {
                    completed++;
                }
                else {
                    failed++;
                }
                // Convert PDFGenerationResult to PDFBuildResult
                return {
                    ...result,
                    protocolId: protocolJob.protocolId,
                    photoCount: protocolJob.protocolData.photos?.length || 0,
                    totalSize: 0 // TODO: Calculate from photo sizes
                };
            }
            catch (error) {
                failed++;
                return {
                    success: false,
                    protocolId: protocolJob.protocolId,
                    photoCount: 0,
                    totalSize: 0,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        // Update progress
        const progress = Math.round(((i + batch.length) / protocols.length) * 100);
        await job.progress(progress);
    }
    return {
        success: failed === 0,
        completed,
        failed,
        results
    };
});
/**
 * Event handlers pre monitoring
 */
setup_1.pdfQueue.on('completed', (job, result) => {
    if (job.name === 'build-protocol-pdf') {
        console.log(`PDF generated: ${job.id}`, {
            protocolId: result.protocolId,
            fileSize: result.fileSize,
            processingTime: result.processingTime
        });
    }
});
setup_1.pdfQueue.on('failed', (job, err) => {
    if (job.name === 'build-protocol-pdf') {
        console.error(`PDF generation failed: ${job.id}`, err.message);
    }
});
setup_1.pdfQueue.on('stalled', (job) => {
    console.warn(`PDF job stalled: ${job.id}`);
});
//# sourceMappingURL=pdf-builder.js.map