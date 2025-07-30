import express from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 🔧 TEST endpoint (test DB columns)
router.get('/test', authenticateToken, async (req, res) => {
  try {
    console.log('🧪 Testing handover_protocols columns...');
    
    const query = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'handover_protocols' 
      ORDER BY column_name
    `;
    
    const client = await postgresDatabase.dbPool.connect();
    const result = await client.query(query);
    client.release();
    
    res.json({
      success: true,
      message: 'DB columns test completed',
      columns: result.rows
    });
  } catch (error) {
    console.error('❌ DB columns test failed:', error);
    res.status(500).json({
      success: false,
      error: 'DB columns test failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// 📊 Analýza base64 veľkosti
const analyzeBase64Size = (data: any): number => {
  if (typeof data !== 'string') return 0;
  if (!data.startsWith('data:')) return 0;
  
  const base64Part = data.split(',')[1] || '';
  return Math.floor(base64Part.length * 0.75); // Base64 -> bytes conversion
};

// 🔍 Database cleanup analysis endpoint v2.0 (FIXED)
router.get('/analyze', authenticateToken, async (req, res) => {  
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
    
    const client = await postgresDatabase.dbPool.connect();
    const result = await client.query(query);
    client.release();
    const protocols = result.rows;
    
    let totalBase64ImageSize = 0;
    let totalBase64PDFSize = 0;
    let protocolsWithBase64Images = 0;
    let protocolsWithBase64PDFs = 0;
    let protocolsWithR2Images = 0;
    let protocolsWithR2PDFs = 0;
    let cleanupCandidates = [];
    
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    
    for (const protocol of protocols) {
      const createdAt = new Date(protocol.created_at);
      let hasBase64Images = false;
      let hasR2Images = false;
      let hasBase64PDF = false;
      let hasR2PDF = false;
      let imageSize = 0;
      let pdfSize = 0;
      
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
          } catch (e) {
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
                } else if (media.url.includes('r2.dev') || media.url.includes('cloudflare')) {
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
      if (hasBase64Images) protocolsWithBase64Images++;
      if (hasR2Images) protocolsWithR2Images++;
      if (hasBase64PDF) protocolsWithBase64PDFs++;
      if (hasR2PDF) protocolsWithR2PDFs++;
      
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
    } else if (sizeInMB > 10) {
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
    
  } catch (error) {
    console.error('❌ Database analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Database analysis failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// 🧹 Safe cleanup endpoint (removes base64 where R2 URLs exist)
router.post('/safe-cleanup', authenticateToken, async (req, res) => {
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
      
      const client = await postgresDatabase.dbPool.connect();
      const result = await client.query(analysisQuery);
      client.release();
      
      res.json({
        success: true,
        message: 'Dry run completed',
        dryRun: true,
        protocolsToClean: result.rows.length,
        details: 'Found protocols with both base64 and R2 URLs that can be safely cleaned'
      });
    } else {
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
      
      const client2 = await postgresDatabase.dbPool.connect();
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
    
  } catch (error) {
    console.error('❌ Safe cleanup failed:', error);
    res.status(500).json({
      success: false,
      error: 'Safe cleanup failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// 📊 Database size estimate
router.get('/database-size', authenticateToken, async (req, res) => {
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
    
    const client = await postgresDatabase.dbPool.connect();
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
    
  } catch (error) {
    console.error('❌ Database size analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Database size analysis failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;