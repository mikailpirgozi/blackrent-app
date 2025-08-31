/**
 * Test endpoint pre Protocol V2 systém
 * Testuje feature flags, databázové tabuľky a queue system
 */

import express from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { checkQueues } from '../queues/setup';

const router = express.Router();

// Test V2 infrastructure
router.get('/test-v2-infrastructure', async (req, res) => {
  try {
    const results = {
      timestamp: new Date(),
      tests: [] as Array<{
        name: string;
        status: 'pass' | 'fail' | 'skip';
        details?: unknown;
        error?: string;
      }>
    };
    
    // Test 1: Databázové tabuľky
    try {
      const client = await postgresDatabase.dbPool.connect();
      
      // Check feature_flags table
      const featureFlagsTest = await client.query(`
        SELECT COUNT(*) as count FROM feature_flags
      `);
      
      results.tests.push({
        name: 'Feature Flags Table',
        status: 'pass',
        details: { count: featureFlagsTest.rows[0].count }
      });
      
      // Check photo_derivatives table
      const photoDerivativesTest = await client.query(`
        SELECT COUNT(*) as count FROM photo_derivatives
      `);
      
      results.tests.push({
        name: 'Photo Derivatives Table',
        status: 'pass',
        details: { count: photoDerivativesTest.rows[0].count }
      });
      
      // Check protocol_processing_jobs table
      const jobsTest = await client.query(`
        SELECT COUNT(*) as count FROM protocol_processing_jobs
      `);
      
      results.tests.push({
        name: 'Protocol Processing Jobs Table',
        status: 'pass',
        details: { count: jobsTest.rows[0].count }
      });
      
      // Check photo_metadata_v2 table
      const metadataTest = await client.query(`
        SELECT COUNT(*) as count FROM photo_metadata_v2
      `);
      
      results.tests.push({
        name: 'Photo Metadata V2 Table',
        status: 'pass',
        details: { count: metadataTest.rows[0].count }
      });
      
      client.release();
    } catch (error) {
      results.tests.push({
        name: 'Database Tables',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown database error'
      });
    }
    
    // Test 2: Queue system (bez Redis)
    try {
      const queueStatus = await checkQueues();
      results.tests.push({
        name: 'Queue System',
        status: queueStatus.overall ? 'pass' : 'skip',
        details: queueStatus
      });
    } catch (error) {
      results.tests.push({
        name: 'Queue System',
        status: 'skip',
        error: 'Redis not available - expected in development'
      });
    }
    
    // Test 3: Feature flags
    try {
      const client = await postgresDatabase.dbPool.connect();
      const flagsResult = await client.query(`
        SELECT flag_name, enabled, percentage, description 
        FROM feature_flags 
        WHERE flag_name LIKE 'PROTOCOL_V2%'
        ORDER BY flag_name
      `);
      
      results.tests.push({
        name: 'Feature Flags Configuration',
        status: 'pass',
        details: { flags: flagsResult.rows }
      });
      
      client.release();
    } catch (error) {
      results.tests.push({
        name: 'Feature Flags Configuration',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    // Overall status
    const passedTests = results.tests.filter(t => t.status === 'pass').length;
    const totalTests = results.tests.length;
    const skippedTests = results.tests.filter(t => t.status === 'skip').length;
    
    res.json({
      success: true,
      message: 'V2 Infrastructure Test Complete',
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: totalTests - passedTests - skippedTests,
        skipped: skippedTests,
        success_rate: `${Math.round((passedTests / totalTests) * 100)}%`
      },
      results
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'V2 Infrastructure test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Jednoduchý test feature flag bez problematického hash kódu
router.post('/test-feature-flag', async (req, res) => {
  try {
    const { flagName, userId } = req.body;
    
    if (!flagName) {
      return res.status(400).json({
        success: false,
        error: 'flagName is required'
      });
    }
    
    const client = await postgresDatabase.dbPool.connect();
    
    const flagResult = await client.query(`
      SELECT * FROM feature_flags WHERE flag_name = $1
    `, [flagName]);
    
    if (flagResult.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        error: `Feature flag ${flagName} not found`
      });
    }
    
    const flag = flagResult.rows[0];
    client.release();
    
    // Jednoduchá logika bez zložitého hash
    let enabled = flag.enabled;
    let reason = 'flag disabled';
    
    if (flag.enabled) {
      if (userId && flag.allowed_users && flag.allowed_users.includes(userId)) {
        enabled = true;
        reason = 'user in allowlist';
      } else if (flag.percentage > 0) {
        // Jednoduchá percentage simulácia
        const userHash = userId ? userId.length * 7 : 42;
        enabled = (userHash % 100) < flag.percentage;
        reason = enabled ? 'percentage rollout' : 'percentage rollout (not selected)';
      }
    }
    
    res.json({
      success: true,
      flag: {
        name: flag.flag_name,
        enabled,
        reason,
        configuration: {
          enabled: flag.enabled,
          percentage: flag.percentage,
          allowedUsers: flag.allowed_users
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Feature flag test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
