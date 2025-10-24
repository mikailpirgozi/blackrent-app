// Debug endpoint to check user permissions
import type { Request, Response } from 'express';
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { postgresDatabase } from '../models/postgres-database';
import type { ApiResponse } from '../types';
import { Pool } from 'pg';

const router: Router = Router();

// GET /api/debug/user-info - Get current user info with permissions
router.get('/user-info', 
  authenticateToken,
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      // Get user from database
      const user = await postgresDatabase.getUserById(req.user.id);
      
      res.json({
        success: true,
        data: {
          id: user?.id,
          username: user?.username,
          email: user?.email,
          role: user?.role,
          companyId: user?.companyId,
          platformId: user?.platformId,
          isActive: user?.isActive
        }
      });
    } catch (error) {
      console.error('Debug user info error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní info o používateľovi'
      });
    }
});

// GET /api/debug/rental/:id - Get rental info with vehicle company
router.get('/rental/:id',
  authenticateToken,
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;
      
      const rental = await postgresDatabase.getRental(id);
      if (!rental) {
        return res.status(404).json({
          success: false,
          error: 'Rental not found'
        });
      }

      let vehicle = null;
      if (rental.vehicleId) {
        vehicle = await postgresDatabase.getVehicle(rental.vehicleId);
      }

      res.json({
        success: true,
        data: {
          rental: {
            id: rental.id,
            customerName: rental.customerName,
            vehicleId: rental.vehicleId,
            startDate: rental.startDate,
            endDate: rental.endDate
          },
          vehicle: vehicle ? {
            id: vehicle.id,
            licensePlate: vehicle.licensePlate,
            ownerCompanyId: vehicle.ownerCompanyId
          } : null,
          access: {
            userRole: req.user?.role,
            userCompanyId: req.user?.companyId,
            vehicleCompanyId: vehicle?.ownerCompanyId,
            hasAccess: 
              req.user?.role === 'admin' || 
              req.user?.role === 'super_admin' ||
              (req.user?.role === 'company_admin' && req.user?.companyId === vehicle?.ownerCompanyId)
          }
        }
      });
    } catch (error) {
      console.error('Debug rental info error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní info o prenájme'
      });
    }
});

// GET /api/debug/database-schema - Get database schema for comparison (ADMIN ONLY)
router.get('/database-schema',
  authenticateToken,
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      // Only allow super_admin
      if (req.user?.role !== 'super_admin' && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied - admin only'
        });
      }

      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });

      const client = await pool.connect();

      try {
        const tablesToCheck = ['insurances', 'vehicle_documents', 'vehicles', 'rentals'];
        const schemas: Record<string, unknown> = {};

        for (const table of tablesToCheck) {
          // Get table schema
          const schemaResult = await client.query(`
            SELECT 
              column_name, 
              data_type,
              character_maximum_length,
              is_nullable,
              column_default,
              ordinal_position
            FROM information_schema.columns 
            WHERE table_name = $1
            ORDER BY ordinal_position
          `, [table]);

          // Get foreign keys
          const fkResult = await client.query(`
            SELECT
              tc.table_name,
              kcu.column_name,
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND tc.table_name = $1
            ORDER BY kcu.column_name
          `, [table]);

          // Get sample data count
          const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);

          schemas[table] = {
            columns: schemaResult.rows,
            foreignKeys: fkResult.rows,
            recordCount: countResult.rows[0].count
          };
        }

        client.release();
        await pool.end();

        res.json({
          success: true,
          data: {
            environment: process.env.NODE_ENV || 'unknown',
            database: process.env.DATABASE_URL?.includes('switchyard') ? 'Railway Development' : 'Railway Production',
            timestamp: new Date().toISOString(),
            schemas
          }
        });
      } catch (error) {
        client.release();
        await pool.end();
        throw error;
      }
    } catch (error) {
      console.error('Database schema error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní schémy databázy'
      });
    }
});

export default router;

