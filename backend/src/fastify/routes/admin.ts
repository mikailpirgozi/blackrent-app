import type { FastifyInstance } from 'fastify';
import { authenticateFastify, requireRoleFastify } from '../decorators/auth';
import { postgresDatabase } from '../../models/postgres-database';
import jwt from 'jsonwebtoken';

/**
 * Admin Routes - Administrative operations
 * 100% Express equivalent from backend/src/routes/admin.ts
 * SECURITY: Dangerous operations like database reset are disabled
 */
export default async function adminRoutes(fastify: FastifyInstance) {
  
  // 🔑 GET ADMIN TOKEN - For database management
  fastify.post<{
    Body: { username: string; password: string };
  }>('/api/admin/get-token', async (request, reply) => {
    try {
      const { username, password } = request.body;

      if (username !== 'admin' || password !== 'Black123') {
        return reply.status(401).send({
          success: false,
          error: 'Nesprávne prihlasovacie údaje'
        });
      }

      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';

      // Find admin user
      const client = await (postgresDatabase as any).pool.connect();
      let adminUser;
      try {
        const result = await client.query('SELECT * FROM users WHERE username = $1', ['admin']);
        adminUser = result.rows[0];
      } finally {
        client.release();
      }

      if (!adminUser) {
        return reply.status(404).send({
          success: false,
          error: 'Admin používateľ nenájdený'
        });
      }

      // Create token
      const token = jwt.sign(
        {
          userId: adminUser.id,
          username: adminUser.username,
          role: adminUser.role
        },
        jwtSecret,
        { expiresIn: '24h' }
      );

      request.log.info('🔑 Admin token generated for database management');

      return reply.send({
        success: true,
        token,
        message: 'Token pre admin operácie',
        expiresIn: '24h'
      });

    } catch (error) {
      request.log.error(error, '❌ Get token error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri generovaní tokenu'
      });
    }
  });

  // 📊 ADMIN STATS - Statistics overview
  fastify.get('/api/admin/stats', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      request.log.info('📊 ADMIN: Getting statistics...');

      const [
        vehicles,
        rentals,
        customers,
        companies,
        expenses,
        users
      ] = await Promise.all([
        postgresDatabase.getVehicles(true, true),
        postgresDatabase.getRentals(),
        postgresDatabase.getCustomers(),
        postgresDatabase.getCompanies(),
        postgresDatabase.getExpenses(),
        postgresDatabase.getUsers()
      ]);

      const stats = {
        totalVehicles: vehicles.length,
        activeVehicles: vehicles.filter(v => v.status === 'available').length,
        totalRentals: rentals.length,
        activeRentals: rentals.filter(r => r.status === 'active').length,
        totalCustomers: customers.length,
        totalCompanies: companies.length,
        totalExpenses: expenses.length,
        totalUsers: users.length,
        totalRevenue: rentals.reduce((sum, r) => sum + (r.totalPrice || 0), 0),
        totalExpenseAmount: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
        timestamp: new Date().toISOString()
      };

      request.log.info('✅ ADMIN: Statistics retrieved');

      return reply.send({
        success: true,
        data: stats
      });

    } catch (error) {
      request.log.error(error, '❌ ADMIN: Stats error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri načítaní štatistík'
      });
    }
  });

  // 🗑️ DATABASE RESET - DISABLED FOR SECURITY
  // This endpoint is intentionally not implemented
  // Database resets should be done manually with proper backups

  // 🔧 FIX DATABASE SCHEMA - ADMIN ONLY
  fastify.post('/api/admin/fix-schema', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      request.log.info('🔧 ADMIN: Starting schema fix...');

      const client = await (postgresDatabase as any).pool.connect();
      try {
        // Basic schema fixes (safe operations only)
        const fixSchemaSQL = `
          BEGIN;
          
          -- Add missing columns if needed
          ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
          ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
          
          -- Update NULL values
          UPDATE companies SET is_active = true WHERE is_active IS NULL;
          UPDATE vehicles SET is_active = true WHERE is_active IS NULL;
          UPDATE users SET is_active = true WHERE is_active IS NULL;
          
          COMMIT;
        `;

        await client.query(fixSchemaSQL);
        request.log.info('✅ ADMIN: Schema fix completed');

        return reply.send({
          success: true,
          message: 'Schema fixed successfully'
        });

      } finally {
        client.release();
      }

    } catch (error) {
      request.log.error(error, '❌ ADMIN: Schema fix error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri oprave schémy'
      });
    }
  });

  // 💾 BACKUP DATABASE - Trigger backup
  fastify.post('/api/admin/backup', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      request.log.info('💾 ADMIN: Backup requested');

      // Note: Actual backup should be handled by external tools
      // This endpoint just logs the request

      return reply.send({
        success: true,
        message: 'Backup request logged. Use external backup tools for actual backup.',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      request.log.error(error, '❌ ADMIN: Backup error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri backup requeste'
      });
    }
  });

  fastify.log.info('✅ Admin routes registered');
}


