import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { authenticateToken, requireRole } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

const router = Router();

// 🗑️ RESET DATABASE - ADMIN ONLY
router.post('/reset-database', 
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      console.log('🗑️ ADMIN: Starting database reset...');
      
      const client = await postgresDatabase.pool.connect();
      try {
        // Vypnúť foreign key constraints
        await client.query('SET session_replication_role = replica');
        
        // Zmazať všetky tabuľky
        const tables = [
          'settlements',
          'user_permissions', 
          'insurance_claims',
          'insurances',
          'expenses',
          'rentals',
          'customers',
          'vehicles',
          'users',
          'companies',
          'insurers'
        ];
        
        for (const table of tables) {
          await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
          console.log(`🗑️ Dropped table: ${table}`);
        }
        
        // Zapnúť foreign key constraints
        await client.query('SET session_replication_role = DEFAULT');
        
        console.log('✅ Database reset completed');
        
        res.json({
          success: true,
          message: 'Databáza úspešne resetovaná. Reštartujte aplikáciu pre vytvorenie novej schémy.',
          tablesDropped: tables.length
        });
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('❌ Database reset error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri resetovaní databázy',
        details: error instanceof Error ? error.message : 'Neznáma chyba'
      });
    }
  }
);

export default router; 