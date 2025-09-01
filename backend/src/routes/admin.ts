import type { Request, Response } from 'express';
import { Router } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { authenticateToken, requireRole } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

const router = Router();

// 🔑 GET ADMIN TOKEN - Pre reset databázy
router.post('/get-token', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (username !== 'admin' || password !== 'Black123') {
      return res.status(401).json({
        success: false,
        error: 'Nesprávne prihlasovacie údaje'
      });
    }
    
    // Import JWT tu
    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    
    // Nájdi admin používateľa
    const client = await (postgresDatabase as any).pool.connect();
    let adminUser;
    try {
      const result = await client.query('SELECT * FROM users WHERE username = $1', ['admin']);
      adminUser = result.rows[0];
    } finally {
      client.release();
    }
    
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        error: 'Admin používateľ nenájdený'
      });
    }
    
    // Vytvor token
    const token = jwt.sign(
      {
        userId: adminUser.id,
        username: adminUser.username,
        role: adminUser.role
      },
      jwtSecret,
      { expiresIn: '24h' }
    );
    
    // console.log('🔑 Admin token generated for database reset');
    
    res.json({
      success: true,
      token,
      message: 'Token pre reset databázy',
      expiresIn: '24h'
    });
    
  } catch (error) {
    console.error('❌ Get token error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri generovaní tokenu'
    });
  }
});

// 🗑️ RESET DATABASE ENDPOINT - DISABLED FOR SECURITY
// This endpoint was DANGEROUS and could delete all production data!
// If database reset is ever needed, do it manually:
// 1. Create full backup first
// 2. Run reset SQL directly in database console 
// 3. Never expose this via API in production!
//
// router.post('/reset-database', ...) - REMOVED FOR SECURITY

// 🔧 FIX DATABASE SCHEMA - ADMIN ONLY
router.post('/fix-schema', 
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      // console.log('🔧 ADMIN: Starting schema fix...');
      
      const client = await (postgresDatabase as any).pool.connect();
      try {
        // SQL script na opravu schémy
        const fixSchemaSQL = `
          -- 🔧 OPRAVA DATABÁZOVEJ SCHÉMY
          BEGIN;
          
          -- 1. OPRAVA COMPANIES TABUĽKY
          ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
          UPDATE companies SET is_active = true WHERE is_active IS NULL;
          
          -- 2. OPRAVA VEHICLES TABUĽKY  
          ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT 2024;
          ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS stk DATE;
          
          -- 3. OPRAVA RENTALS TABUĽKY
          ALTER TABLE rentals ALTER COLUMN vehicle_id DROP NOT NULL;
          
          COMMIT;
        `;
        
        await client.query(fixSchemaSQL);
        
        // Diagnostika - zisti štruktúru tabuliek
        const companiesInfo = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default 
          FROM information_schema.columns 
          WHERE table_name = 'companies' 
          ORDER BY ordinal_position
        `);
        
        const vehiclesInfo = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default 
          FROM information_schema.columns 
          WHERE table_name = 'vehicles' 
          ORDER BY ordinal_position
        `);
        
        // console.log('✅ Schema fix completed');
        // console.log('📊 Companies columns:', companiesInfo.rows.length);
        // console.log('📊 Vehicles columns:', vehiclesInfo.rows.length);
        
        res.json({
          success: true,
          message: 'Databázová schéma úspešne opravená',
          details: {
            companiesColumns: companiesInfo.rows.length,
            vehiclesColumns: vehiclesInfo.rows.length,
            companiesStructure: companiesInfo.rows,
            vehiclesStructure: vehiclesInfo.rows
          }
        });
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('❌ Schema fix error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri oprave schémy',
        details: error instanceof Error ? error.message : 'Neznáma chyba'
      });
    }
  }
);

// 🛡️ RENTAL INTEGRITY MONITORING endpoint
router.get('/rental-integrity', 
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      // console.log('🛡️ ADMIN: Checking rental integrity...');
      
      const integrityReport = await postgresDatabase.checkRentalIntegrity();
      
      res.json({
        success: true,
        message: 'Rental integrity check completed',
        data: integrityReport
      });
      
    } catch (error) {
      console.error('❌ Rental integrity check failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check rental integrity'
      });
    }
  }
);

export default router; 