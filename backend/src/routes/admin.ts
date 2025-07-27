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
      
      const tablesDropped = await postgresDatabase.resetDatabase();
      
      console.log('✅ Database reset completed');
      
      res.json({
        success: true,
        message: 'Databáza úspešne resetovaná. Reštartujte aplikáciu pre vytvorenie novej schémy.',
        tablesDropped
      });
      
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