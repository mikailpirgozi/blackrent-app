/**
 * 🔄 MIGRATION ROUTES - Fastify Migration
 * 
 * Migrated from: backend/src/routes/migration.ts
 * Purpose: R2 migration endpoints
 */

import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { r2Migration } from '../../utils/migrate-to-r2';
import { r2Storage } from '../../utils/r2-storage';

const migrationRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/migrations/r2-status - Check R2 configuration
  fastify.get('/r2-status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const isConfigured = r2Storage.isConfigured();

      return reply.send({
        success: true,
        configured: isConfigured,
        message: isConfigured ? 'R2 Storage je nakonfigurované' : 'R2 Storage nie je nakonfigurované',
        missingVariables: isConfigured ? [] : [
          'R2_ENDPOINT',
          'R2_ACCESS_KEY_ID',
          'R2_SECRET_ACCESS_KEY',
          'R2_BUCKET_NAME',
          'R2_PUBLIC_URL'
        ]
      });

    } catch (error) {
      request.log.error(error, '❌ Error checking R2 status');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri kontrole R2 stavu'
      });
    }
  });

  // POST /api/migrations/migrate-to-r2 - Start migration
  fastify.post('/migrate-to-r2', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.log.info('🚀 Spúšťam migráciu do R2...');

      // Check if R2 is configured
      if (!r2Storage.isConfigured()) {
        return reply.status(400).send({
          success: false,
          error: 'R2 Storage nie je nakonfigurované',
          message: 'Nastavte environment variables v Railway'
        });
      }

      // Start migration asynchronously
      r2Migration.migrateAllProtocols().catch(error => {
        request.log.error(error, '❌ Chyba pri migrácii');
      });

      return reply.send({
        success: true,
        message: 'Migrácia bola spustená. Kontrolujte logy pre progress.',
        note: 'Migrácia beží na pozadí. Môže trvať niekoľko minút.'
      });

    } catch (error) {
      request.log.error(error, '❌ Error starting migration');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri spúšťaní migrácie'
      });
    }
  });

  // GET /api/migrations/migration-status - Check migration status
  fastify.get('/migration-status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await r2Migration.checkMigrationStatus();

      return reply.send({
        success: true,
        message: 'Stav migrácie bol skontrolovaný. Pozrite si server logy.'
      });

    } catch (error) {
      request.log.error(error, '❌ Error checking migration status');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri kontrole stavu migrácie'
      });
    }
  });
};

export default migrationRoutes;

