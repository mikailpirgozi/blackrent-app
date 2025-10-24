/**
 * Debug Schema Endpoint - Production Database Schema Inspector
 */

import express, { type Router } from 'express';
import type { Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import type { ApiResponse } from '../types';

const router: Router = express.Router();

// GET /api/debug/schema - Get database schema info
router.get('/schema', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const pool = (postgresDatabase as any).pool;
    const client = await pool.connect();
    
    try {
      // Get insurances schema
      const insurancesSchema = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'insurances' 
        ORDER BY ordinal_position
      `);
      
      // Get vehicle_documents schema
      const vehicleDocsSchema = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'vehicle_documents' 
        ORDER BY ordinal_position
      `);
      
      // Get sample insurance data with types
      const sampleInsurances = await client.query(`
        SELECT 
          id, vehicle_id, type, policy_number,
          pg_typeof(id) as id_type, 
          pg_typeof(vehicle_id) as vehicle_id_type
        FROM insurances 
        ORDER BY id 
        LIMIT 3
      `);
      
      // Get foreign keys
      const foreignKeys = await client.query(`
        SELECT tc.table_name, kcu.column_name,
               ccu.table_name AS foreign_table,
               ccu.column_name AS foreign_column
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name IN ('insurances', 'vehicle_documents')
        ORDER BY tc.table_name
      `);
      
      res.json({
        success: true,
        data: {
          insurances: {
            schema: insurancesSchema.rows,
            sample: sampleInsurances.rows
          },
          vehicle_documents: {
            schema: vehicleDocsSchema.rows
          },
          foreignKeys: foreignKeys.rows,
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        }
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Debug schema error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Schema check failed'
    });
  }
});

export default router;

