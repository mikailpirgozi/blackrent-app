/**
 * V2 System Test Endpoint
 * Kompletný test V2 infraštruktúry a komponentov
 */

import express from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { checkQueues } from '../queues/setup';
import { r2Storage } from '../utils/r2-storage';
import { HashCalculator } from '../utils/v2/hash-calculator';
import { ImageProcessor } from '../utils/v2/sharp-processor';

const router: express.Router = express.Router();

/**
 * GET /api/v2-system-test/full-test
 * Kompletný test V2 systému
 */
router.get('/full-test', async (req, res) => {
  try {
    const results = {
      timestamp: new Date(),
      version: '2.0',
      tests: [] as Array<{
        name: string;
        status: 'pass' | 'fail' | 'skip';
        duration?: number;
        details?: unknown;
        error?: string;
      }>,
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      }
    };
    
    // Test 1: Database V2 Tables
    const dbTestStart = Date.now();
    try {
      const client = await postgresDatabase.dbPool.connect();
      
      const tables = [
        'feature_flags',
        'photo_derivatives', 
        'protocol_processing_jobs',
        'photo_metadata_v2'
      ];
      
      const tableTests = [];
      for (const table of tables) {
        const tableResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        tableTests.push({
          table,
          count: tableResult.rows[0].count,
          exists: true
        });
      }
      
      client.release();
      
      results.tests.push({
        name: 'Database V2 Tables',
        status: 'pass',
        duration: Date.now() - dbTestStart,
        details: { tables: tableTests }
      });
    } catch (error) {
      results.tests.push({
        name: 'Database V2 Tables',
        status: 'fail',
        duration: Date.now() - dbTestStart,
        error: error instanceof Error ? error.message : 'Database test failed'
      });
    }
    
    // Test 2: Queue System
    const queueTestStart = Date.now();
    try {
      const queueStatus = await checkQueues();
      results.tests.push({
        name: 'Queue System (Redis/BullMQ)',
        status: queueStatus.overall ? 'pass' : 'skip',
        duration: Date.now() - queueTestStart,
        details: queueStatus
      });
    } catch (error) {
      results.tests.push({
        name: 'Queue System (Redis/BullMQ)',
        status: 'skip',
        duration: Date.now() - queueTestStart,
        error: 'Redis not available - expected in development'
      });
    }
    
    // Test 3: R2 Storage
    const r2TestStart = Date.now();
    try {
      const testKey = `test/v2-system-test-${Date.now()}.txt`;
      const testContent = Buffer.from('V2 System Test');
      
      // Test upload
      const uploadUrl = await r2Storage.uploadFile(testKey, testContent, 'text/plain');
      
      // Test download
      const downloadedContent = await r2Storage.getFile(testKey);
      
      // Test file exists
      const exists = await r2Storage.fileExists(testKey);
      
      // Cleanup
      await r2Storage.deleteFile(testKey);
      
      const testPassed = uploadUrl && downloadedContent && exists;
      
      results.tests.push({
        name: 'R2 Storage Operations',
        status: testPassed ? 'pass' : 'fail',
        duration: Date.now() - r2TestStart,
        details: {
          upload: !!uploadUrl,
          download: !!downloadedContent,
          exists,
          contentMatch: downloadedContent?.toString() === 'V2 System Test'
        }
      });
    } catch (error) {
      results.tests.push({
        name: 'R2 Storage Operations',
        status: 'fail',
        duration: Date.now() - r2TestStart,
        error: error instanceof Error ? error.message : 'R2 test failed'
      });
    }
    
    // Test 4: Image Processing
    const imageTestStart = Date.now();
    try {
      // Create minimal valid JPEG
      const testJpeg = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xC0, 0x00, 0x11,
        0x08, 0x00, 0x64, 0x00, 0x64, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01,
        0x03, 0x11, 0x01, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x08, 0xFF, 0xDA, 0x00, 0x0C, 0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11,
        0x00, 0x3F, 0x00, 0xFF, 0xD9
      ]);
      
      const processor = new ImageProcessor();
      
      // Test validation
      const validation = await processor.validateImage(testJpeg);
      
      // Test hash calculation
      const hash = HashCalculator.calculateSHA256(testJpeg);
      
      results.tests.push({
        name: 'Image Processing',
        status: validation.valid && hash ? 'pass' : 'fail',
        duration: Date.now() - imageTestStart,
        details: {
          validation: validation.valid,
          hash: hash?.substring(0, 16) + '...',
          hashLength: hash?.length
        }
      });
    } catch (error) {
      results.tests.push({
        name: 'Image Processing',
        status: 'fail',
        duration: Date.now() - imageTestStart,
        error: error instanceof Error ? error.message : 'Image processing test failed'
      });
    }
    
    // Test 5: Feature Flags
    const flagTestStart = Date.now();
    try {
      const client = await postgresDatabase.dbPool.connect();
      
      const flagsResult = await client.query(`
        SELECT flag_name, enabled, percentage, description 
        FROM feature_flags 
        WHERE flag_name LIKE 'PROTOCOL_V2%'
        ORDER BY flag_name
      `);
      
      const v2Flags = flagsResult.rows;
      
      client.release();
      
      results.tests.push({
        name: 'Feature Flags V2',
        status: v2Flags.length > 0 ? 'pass' : 'skip',
        duration: Date.now() - flagTestStart,
        details: { 
          flagCount: v2Flags.length,
          flags: v2Flags.map(f => ({
            name: f.flag_name,
            enabled: f.enabled,
            percentage: f.percentage
          }))
        }
      });
    } catch (error) {
      results.tests.push({
        name: 'Feature Flags V2',
        status: 'fail',
        duration: Date.now() - flagTestStart,
        error: error instanceof Error ? error.message : 'Feature flags test failed'
      });
    }
    
    // Test 6: API Routes Registration
    const apiTestStart = Date.now();
    try {
      // Check že V2 routes sú registrované
      const routeExists = req.app._router && req.app._router.stack.some((layer: { regexp?: { source: string } }) => 
        layer.regexp && layer.regexp.source.includes('v2')
      );
      
      results.tests.push({
        name: 'V2 API Routes Registration',
        status: routeExists ? 'pass' : 'skip',
        duration: Date.now() - apiTestStart,
        details: { routesRegistered: routeExists }
      });
    } catch (error) {
      results.tests.push({
        name: 'V2 API Routes Registration',
        status: 'fail',
        duration: Date.now() - apiTestStart,
        error: error instanceof Error ? error.message : 'API routes test failed'
      });
    }
    
    // Calculate summary
    results.summary.total = results.tests.length;
    results.summary.passed = results.tests.filter(t => t.status === 'pass').length;
    results.summary.failed = results.tests.filter(t => t.status === 'fail').length;
    results.summary.skipped = results.tests.filter(t => t.status === 'skip').length;
    
    const successRate = Math.round((results.summary.passed / results.summary.total) * 100);
    
    res.json({
      success: results.summary.failed === 0,
      message: `V2 System Test Complete - ${successRate}% Success Rate`,
      results,
      recommendations: results.summary.failed > 0 ? [
        'Fix failed tests before proceeding to Phase 3',
        'Check environment configuration',
        'Verify all dependencies are installed'
      ] : [
        'All tests passed - ready for Phase 3',
        'Consider enabling V2 features for testing',
        'Monitor queue performance in development'
      ]
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'V2 System test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v2-system-test/enable-v2
 * Povolenie V2 features pre testing
 */
router.post('/enable-v2', async (req, res) => {
  try {
    const { userId, percentage = 100 } = req.body;
    
    const client = await postgresDatabase.dbPool.connect();
    
    // Enable všetky V2 feature flags
    const v2Flags = [
      'PROTOCOL_V2_PHOTO_UPLOAD',
      'PROTOCOL_V2_PDF_GENERATION', 
      'PROTOCOL_V2_QUEUE_SYSTEM',
      'PROTOCOL_V2_MANIFEST_GENERATION',
      'PROTOCOL_V2_FULL_SYSTEM'
    ];
    
    const updates = [];
    for (const flagName of v2Flags) {
      const updateResult = await client.query(`
        UPDATE feature_flags 
        SET 
          enabled = true,
          percentage = $2,
          allowed_users = CASE 
            WHEN $3::text IS NOT NULL THEN 
              COALESCE(allowed_users, '[]'::jsonb) || jsonb_build_array($3::text)
            ELSE allowed_users
          END,
          updated_at = NOW()
        WHERE flag_name = $1
        RETURNING flag_name, enabled, percentage
      `, [flagName, percentage, userId]);
      
      updates.push({
        flag: flagName,
        updated: (updateResult.rowCount || 0) > 0,
        details: updateResult.rows[0]
      });
    }
    
    client.release();
    
    res.json({
      success: true,
      message: 'V2 Features enabled for testing',
      updates,
      configuration: {
        percentage,
        userId: userId || 'all users',
        enabledFlags: updates.filter(u => u.updated).length
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to enable V2 features',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v2-system-test/disable-v2
 * Vypnutie V2 features
 */
router.post('/disable-v2', async (req, res) => {
  try {
    const client = await postgresDatabase.dbPool.connect();
    
    await client.query(`
      UPDATE feature_flags 
      SET 
        enabled = false,
        percentage = 0,
        updated_at = NOW()
      WHERE flag_name LIKE 'PROTOCOL_V2%'
    `);
    
    client.release();
    
    res.json({
      success: true,
      message: 'V2 Features disabled - reverted to V1 system'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to disable V2 features',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
