"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const r2_storage_1 = require("../utils/r2-storage");
const router = express_1.default.Router();
// 🔧 TEST endpoint (test DB columns)
router.get('/test', auth_1.authenticateToken, async (req, res) => {
    try {
        console.log('🧪 Testing handover_protocols columns...');
        const query = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'handover_protocols' 
      ORDER BY column_name
    `;
        const client = await postgres_database_1.postgresDatabase.dbPool.connect();
        const result = await client.query(query);
        client.release();
        res.json({
            success: true,
            message: 'DB columns test completed',
            columns: result.rows
        });
    }
    catch (error) {
        console.error('❌ DB columns test failed:', error);
        res.status(500).json({
            success: false,
            error: 'DB columns test failed',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
// 📊 Analýza base64 veľkosti
const analyzeBase64Size = (data) => {
    if (typeof data !== 'string')
        return 0;
    if (!data.startsWith('data:'))
        return 0;
    const base64Part = data.split(',')[1] || '';
    return Math.floor(base64Part.length * 0.75); // Base64 -> bytes conversion
};
// 🔍 Database cleanup analysis endpoint v2.0 (FIXED)
router.get('/analyze', auth_1.authenticateToken, async (req, res) => {
    try {
        console.log('🔍 Starting database cleanup analysis v2.0...');
        // Get all handover protocols
        const query = `
      SELECT 
        id, 
        created_at,
        vehicle_images_urls,
        vehicle_videos_urls,
        document_images_urls,
        damage_images_urls,
        pdf_url
      FROM handover_protocols 
      ORDER BY created_at DESC
    `;
        const client = await postgres_database_1.postgresDatabase.dbPool.connect();
        const result = await client.query(query);
        client.release();
        const protocols = result.rows;
        let totalBase64ImageSize = 0;
        const totalBase64PDFSize = 0;
        let protocolsWithBase64Images = 0;
        let protocolsWithBase64PDFs = 0;
        let protocolsWithR2Images = 0;
        let protocolsWithR2PDFs = 0;
        const cleanupCandidates = [];
        const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
        for (const protocol of protocols) {
            const createdAt = new Date(protocol.created_at);
            let hasBase64Images = false;
            let hasR2Images = false;
            const hasBase64PDF = false;
            let hasR2PDF = false;
            let imageSize = 0;
            const pdfSize = 0;
            // Analyze all media columns
            const mediaColumns = [
                'vehicle_images_urls',
                'vehicle_videos_urls',
                'document_images_urls',
                'damage_images_urls'
            ];
            for (const columnName of mediaColumns) {
                if (protocol[columnName]) {
                    let mediaArray;
                    try {
                        mediaArray = JSON.parse(protocol[columnName]);
                    }
                    catch (e) {
                        mediaArray = [];
                    }
                    if (Array.isArray(mediaArray)) {
                        for (const media of mediaArray) {
                            if (media.url) {
                                if (media.url.startsWith('data:')) {
                                    hasBase64Images = true;
                                    const size = analyzeBase64Size(media.url);
                                    imageSize += size;
                                    totalBase64ImageSize += size;
                                }
                                else if (media.url.includes('r2.dev') || media.url.includes('cloudflare')) {
                                    hasR2Images = true;
                                }
                            }
                        }
                    }
                }
            }
            // Analyze PDF URL (PDF data is now stored as R2 URLs, not base64)
            if (protocol.pdf_url && (protocol.pdf_url.includes('r2.dev') || protocol.pdf_url.includes('cloudflare'))) {
                hasR2PDF = true;
            }
            // Statistics
            if (hasBase64Images)
                protocolsWithBase64Images++;
            if (hasR2Images)
                protocolsWithR2Images++;
            if (hasBase64PDF)
                protocolsWithBase64PDFs++;
            if (hasR2PDF)
                protocolsWithR2PDFs++;
            // Cleanup candidate (has base64 data and is old)
            if ((hasBase64Images || hasBase64PDF) && createdAt < thirtyDaysAgo) {
                cleanupCandidates.push({
                    id: protocol.id,
                    createdAt,
                    imageSize,
                    pdfSize,
                    hasR2Images,
                    hasR2PDF
                });
            }
        }
        const totalSize = totalBase64ImageSize + totalBase64PDFSize;
        const sizeInMB = totalSize / 1024 / 1024;
        // Determine cleanup priority
        let priority = 'LOW';
        let recommendation = 'No cleanup needed currently';
        if (sizeInMB > 50) {
            priority = 'HIGH';
            recommendation = 'Immediate cleanup recommended';
        }
        else if (sizeInMB > 10) {
            priority = 'MEDIUM';
            recommendation = 'Consider cleanup in future';
        }
        const analysis = {
            summary: {
                totalProtocols: protocols.length,
                cleanupCandidates: cleanupCandidates.length,
                totalBase64SizeBytes: totalSize,
                totalBase64SizeMB: parseFloat(sizeInMB.toFixed(2)),
                priority,
                recommendation
            },
            images: {
                protocolsWithBase64Images,
                protocolsWithR2Images,
                totalBase64ImageSizeMB: parseFloat((totalBase64ImageSize / 1024 / 1024).toFixed(2))
            },
            pdfs: {
                protocolsWithBase64PDFs,
                protocolsWithR2PDFs,
                totalBase64PDFSizeMB: parseFloat((totalBase64PDFSize / 1024 / 1024).toFixed(2))
            },
            cleanupStrategy: {
                safeImageCleanup: protocolsWithBase64Images > 0 && protocolsWithR2Images > 0,
                pdfMigrationNeeded: protocolsWithBase64PDFs > 0,
                estimatedSavings: `${sizeInMB.toFixed(2)} MB`
            }
        };
        console.log('✅ Database analysis completed');
        res.json({
            success: true,
            message: 'Database cleanup analysis completed',
            analysis
        });
    }
    catch (error) {
        console.error('❌ Database analysis failed:', error);
        res.status(500).json({
            success: false,
            error: 'Database analysis failed',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
// 🧹 Safe cleanup endpoint (removes base64 where R2 URLs exist)
router.post('/safe-cleanup', auth_1.authenticateToken, async (req, res) => {
    try {
        const { dryRun = true } = req.body;
        console.log(`🧹 ${dryRun ? 'DRY RUN' : 'EXECUTING'} safe cleanup...`);
        if (dryRun) {
            // Just analyze what would be cleaned
            const analysisQuery = `
        SELECT 
          id,
          created_at,
          vehicle_images_urls
        FROM handover_protocols 
        WHERE vehicle_images_urls IS NOT NULL 
          AND vehicle_images_urls::text LIKE '%data:%'
          AND vehicle_images_urls::text LIKE '%r2.dev%'
          AND created_at < NOW() - INTERVAL '7 days'
      `;
            const client = await postgres_database_1.postgresDatabase.dbPool.connect();
            const result = await client.query(analysisQuery);
            client.release();
            res.json({
                success: true,
                message: 'Dry run completed',
                dryRun: true,
                protocolsToClean: result.rows.length,
                details: 'Found protocols with both base64 and R2 URLs that can be safely cleaned'
            });
        }
        else {
            // CAREFUL: This actually modifies data
            const cleanupQuery = `
        UPDATE handover_protocols 
        SET vehicle_images_urls = (
          SELECT json_agg(
            CASE 
              WHEN (img->>'url') LIKE 'data:%'
              THEN json_build_object(
                'id', img->>'id',
                'url', '',
                'type', img->>'type',
                'description', COALESCE(img->>'description', ''),
                'timestamp', img->>'timestamp'
              )
              ELSE img
            END
          )::text
          FROM json_array_elements(vehicle_images_urls::json) AS img
        )
        WHERE vehicle_images_urls IS NOT NULL 
          AND vehicle_images_urls::text LIKE '%data:%'
          AND vehicle_images_urls::text LIKE '%r2.dev%'
          AND created_at < NOW() - INTERVAL '7 days'
      `;
            const client2 = await postgres_database_1.postgresDatabase.dbPool.connect();
            const result = await client2.query(cleanupQuery);
            client2.release();
            console.log(`✅ Cleaned up ${result.rowCount} protocols`);
            res.json({
                success: true,
                message: 'Safe cleanup completed',
                dryRun: false,
                protocolsCleaned: result.rowCount
            });
        }
    }
    catch (error) {
        console.error('❌ Safe cleanup failed:', error);
        res.status(500).json({
            success: false,
            error: 'Safe cleanup failed',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
// 📊 Database size estimate
router.get('/database-size', auth_1.authenticateToken, async (req, res) => {
    try {
        const sizeQuery = `
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `;
        const client = await postgres_database_1.postgresDatabase.dbPool.connect();
        const result = await client.query(sizeQuery);
        client.release();
        const totalSize = result.rows.reduce((sum, row) => sum + parseInt(row.size_bytes), 0);
        res.json({
            success: true,
            message: 'Database size analysis completed',
            tables: result.rows,
            totalSizeBytes: totalSize,
            totalSizeMB: parseFloat((totalSize / 1024 / 1024).toFixed(2))
        });
    }
    catch (error) {
        console.error('❌ Database size analysis failed:', error);
        res.status(500).json({
            success: false,
            error: 'Database size analysis failed',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
// 🗂️ R2 CLEANUP ENDPOINTS
// 📊 R2 súbory analýza
router.get('/r2-analyze', auth_1.authenticateToken, async (req, res) => {
    try {
        console.log('🔍 Analyzing R2 storage files...');
        if (!r2_storage_1.r2Storage.isConfigured()) {
            return res.status(200).json({
                success: true,
                message: 'R2 not configured, using local storage',
                r2Configured: false,
                totalFiles: 0,
                totalSizeBytes: 0
            });
        }
        // Získanie všetkých súborov z R2
        const allFiles = await r2_storage_1.r2Storage.listFiles('');
        // Kategorizácia súborov
        const protocolFiles = 0;
        let imageFiles = 0;
        let pdfFiles = 0;
        let otherFiles = 0;
        const totalSize = 0;
        const filesByType = {
            protocols: allFiles.filter(file => file.startsWith('protocols/')),
            organized: allFiles.filter(file => file.match(/^\d{4}\/\d{2}\//)), // New organized structure
            other: []
        };
        filesByType.other = allFiles.filter(file => !file.startsWith('protocols/') && !file.match(/^\d{4}\/\d{2}\//));
        // Counting by file extension
        allFiles.forEach(file => {
            if (file.endsWith('.pdf'))
                pdfFiles++;
            else if (file.match(/\.(jpg|jpeg|png|gif|webp)$/i))
                imageFiles++;
            else
                otherFiles++;
        });
        console.log('✅ R2 analysis completed:', {
            totalFiles: allFiles.length,
            protocolFiles: filesByType.protocols.length,
            organizedFiles: filesByType.organized.length,
            imageFiles,
            pdfFiles
        });
        res.json({
            success: true,
            message: 'R2 analysis completed',
            r2Configured: true,
            totalFiles: allFiles.length,
            analysis: {
                byStructure: {
                    oldProtocols: filesByType.protocols.length,
                    newOrganized: filesByType.organized.length,
                    other: filesByType.other.length
                },
                byType: {
                    images: imageFiles,
                    pdfs: pdfFiles,
                    other: otherFiles
                }
            },
            examples: {
                oldStructure: filesByType.protocols.slice(0, 3),
                newStructure: filesByType.organized.slice(0, 3)
            }
        });
    }
    catch (error) {
        console.error('❌ R2 analysis failed:', error);
        res.status(500).json({
            success: false,
            error: 'R2 analysis failed',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
// 🧹 R2 BULK DELETE (všetky súbory) - PRODUCTION SAFETY CHECK
router.delete('/r2-clear-all', auth_1.authenticateToken, async (req, res) => {
    // 🛡️ PRODUCTION SAFETY: Disable in production to prevent data loss
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
            success: false,
            error: 'SECURITY: Bulk delete operations are disabled in production environment for data safety',
            suggestion: 'Use database console directly if cleanup is absolutely necessary'
        });
    }
    try {
        const { confirm } = req.body;
        if (confirm !== 'DELETE_ALL_R2_FILES') {
            return res.status(400).json({
                success: false,
                error: 'Pre potvrdenie je potrebné poslať: { "confirm": "DELETE_ALL_R2_FILES" }',
                warning: 'Táto akcia je NEVRATNÁ!'
            });
        }
        console.log('🧹 Starting R2 bulk delete operation...');
        if (!r2_storage_1.r2Storage.isConfigured()) {
            // Vymazanie local storage súborov
            const path = require('path');
            const fs = require('fs');
            const localStorageDir = path.join(process.cwd(), 'local-storage');
            if (fs.existsSync(localStorageDir)) {
                fs.rmSync(localStorageDir, { recursive: true, force: true });
                console.log('✅ Local storage cleared');
            }
            return res.json({
                success: true,
                message: 'Local storage cleared (R2 not configured)',
                filesDeleted: 'all local files'
            });
        }
        // Získanie všetkých súborov
        const allFiles = await r2_storage_1.r2Storage.listFiles('');
        console.log(`📋 Found ${allFiles.length} files to delete`);
        if (allFiles.length === 0) {
            return res.json({
                success: true,
                message: 'No files found in R2 storage',
                filesDeleted: 0
            });
        }
        // Bulk delete (po skupinách pre lepšiu performance)
        const batchSize = 50;
        let deletedCount = 0;
        for (let i = 0; i < allFiles.length; i += batchSize) {
            const batch = allFiles.slice(i, i + batchSize);
            const deletePromises = batch.map(async (fileKey) => {
                try {
                    await r2_storage_1.r2Storage.deleteFile(fileKey);
                    deletedCount++;
                    return { success: true, file: fileKey };
                }
                catch (error) {
                    console.error(`❌ Failed to delete ${fileKey}:`, error);
                    return { success: false, file: fileKey, error };
                }
            });
            await Promise.all(deletePromises);
            console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allFiles.length / batchSize)} completed`);
        }
        console.log(`✅ R2 bulk delete completed: ${deletedCount}/${allFiles.length} files deleted`);
        res.json({
            success: true,
            message: 'R2 bulk delete completed',
            filesDeleted: deletedCount,
            totalFiles: allFiles.length,
            successRate: `${Math.round((deletedCount / allFiles.length) * 100)}%`
        });
    }
    catch (error) {
        console.error('❌ R2 bulk delete failed:', error);
        res.status(500).json({
            success: false,
            error: 'R2 bulk delete failed',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
// 🗃️ RESET DATABASE PROTOCOLS - EXTREMELY DANGEROUS - PRODUCTION PROTECTED
router.delete('/reset-protocols', auth_1.authenticateToken, async (req, res) => {
    // 🛡️ PRODUCTION SAFETY: This endpoint can DELETE ALL RENTALS! 
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
            success: false,
            error: '🚨 CRITICAL SECURITY: This endpoint can DELETE ALL RENTALS and is disabled in production!',
            reason: 'This endpoint caused data loss on August 5, 2025 - all rental data was deleted!',
            suggestion: 'For protocol cleanup, use database console with surgical DELETE statements'
        });
    }
    try {
        const { confirm, includeRentals } = req.body;
        if (confirm !== 'DELETE_ALL_PROTOCOLS') {
            return res.status(400).json({
                success: false,
                error: 'Pre potvrdenie je potrebné poslať: { "confirm": "DELETE_ALL_PROTOCOLS" }',
                warning: 'Táto akcia je NEVRATNÁ! Vymaže všetky protokoly z databázy.'
            });
        }
        console.log('🗃️ Starting database protocols reset...');
        const client = await postgres_database_1.postgresDatabase.dbPool.connect();
        try {
            await client.query('BEGIN');
            // Získanie štatistík pred vymazaním
            const handoverCount = await client.query('SELECT COUNT(*) FROM handover_protocols');
            const returnCount = await client.query('SELECT COUNT(*) FROM return_protocols');
            // Vymazanie protokolov
            await client.query('DELETE FROM return_protocols');
            await client.query('DELETE FROM handover_protocols');
            let rentalResetInfo = '';
            if (includeRentals) {
                const rentalCount = await client.query('SELECT COUNT(*) FROM rentals');
                await client.query('DELETE FROM rentals');
                rentalResetInfo = `, ${rentalCount.rows[0].count} rentals`;
            }
            await client.query('COMMIT');
            console.log('✅ Database protocols reset completed');
            res.json({
                success: true,
                message: 'Database protocols reset completed',
                deleted: {
                    handoverProtocols: parseInt(handoverCount.rows[0].count),
                    returnProtocols: parseInt(returnCount.rows[0].count),
                    rentals: includeRentals ? 'included' : 'preserved'
                },
                warning: 'Všetky protokoly boli vymazané z databázy. Vytvorte nové protokoly pre fresh start.'
            });
        }
        catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('❌ Database reset failed:', error);
        res.status(500).json({
            success: false,
            error: 'Database reset failed',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
exports.default = router;
//# sourceMappingURL=cleanup.js.map