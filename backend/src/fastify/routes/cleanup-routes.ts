/**
 * 🧹 CLEANUP ROUTES - Fastify Migration
 * 
 * Migrated from: backend/src/routes/cleanup.ts
 * Purpose: Database cleanup utilities and R2 file management
 */

import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticateFastify } from '../decorators/auth';
import { postgresDatabase } from '../../models/postgres-database';
import { r2Storage } from '../../utils/r2-storage';

// Zod schemas
const SafeCleanupSchema = z.object({
  dryRun: z.boolean().default(true)
});

const BulkDeleteConfirmSchema = z.object({
  confirm: z.literal('DELETE_ALL_R2_FILES')
});

const ResetProtocolsConfirmSchema = z.object({
  confirm: z.literal('DELETE_ALL_PROTOCOLS'),
  includeRentals: z.boolean().optional()
});

const cleanupRoutes: FastifyPluginAsync = async (fastify) => {
  // 🔧 TEST endpoint (test DB columns)
  fastify.get('/test', {
    onRequest: [authenticateFastify]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.log.info('🧪 Testing handover_protocols columns...');

      const query = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'handover_protocols' 
        ORDER BY column_name
      `;

      const client = await postgresDatabase.dbPool.connect();
      const result = await client.query(query);
      client.release();

      return reply.send({
        success: true,
        message: 'DB columns test completed',
        columns: result.rows
      });
    } catch (error) {
      request.log.error(error, '❌ DB columns test failed');
      return reply.status(500).send({
        success: false,
        error: 'DB columns test failed',
        details: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
      });
    }
  });

  // 📊 R2 files analysis
  fastify.get('/r2-analyze', {
    onRequest: [authenticateFastify]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.log.info('🔍 Analyzing R2 storage files...');

      if (!r2Storage.isConfigured()) {
        return reply.send({
          success: true,
          message: 'R2 not configured, using local storage',
          r2Configured: false,
          totalFiles: 0,
          totalSizeBytes: 0
        });
      }

      const allFiles = await r2Storage.listFiles('');

      // Categorize files
      const filesByType = {
        protocols: allFiles.filter(file => file.startsWith('protocols/')),
        organized: allFiles.filter(file => file.match(/^\d{4}\/\d{2}\//)),
        other: allFiles.filter(file => 
          !file.startsWith('protocols/') && !file.match(/^\d{4}\/\d{2}\//)
        )
      };

      let imageFiles = 0;
      let pdfFiles = 0;
      let otherFiles = 0;

      allFiles.forEach(file => {
        if (file.endsWith('.pdf')) pdfFiles++;
        else if (file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) imageFiles++;
        else otherFiles++;
      });

      request.log.info({
        totalFiles: allFiles.length,
        protocolFiles: filesByType.protocols.length,
        organizedFiles: filesByType.organized.length,
        imageFiles,
        pdfFiles
      }, '✅ R2 analysis completed');

      return reply.send({
        success: true,
        message: 'R2 analysis completed',
        r2Configured: true,
        totalFiles: allFiles.length,
        analysis: {
          byStructure: {
            oldProtocols: filesByType.protocols.length,
            newOrganized: filesByType.organized.length,
            other: filesByType.other.length
          },
          byType: {
            images: imageFiles,
            pdfs: pdfFiles,
            other: otherFiles
          }
        },
        examples: {
          oldStructure: filesByType.protocols.slice(0, 3),
          newStructure: filesByType.organized.slice(0, 3)
        }
      });

    } catch (error) {
      request.log.error(error, '❌ R2 analysis failed');
      return reply.status(500).send({
        success: false,
        error: 'R2 analysis failed',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 🧹 R2 BULK DELETE (all files) - PRODUCTION SAFETY CHECK
  fastify.delete<{
    Body: z.infer<typeof BulkDeleteConfirmSchema>;
  }>('/r2-clear-all', {
    onRequest: [authenticateFastify],
    schema: {
      body: BulkDeleteConfirmSchema
    }
  }, async (request, reply) => {
    // 🛡️ PRODUCTION SAFETY: Disable in production
    if (process.env.NODE_ENV === 'production') {
      return reply.status(403).send({
        success: false,
        error: 'SECURITY: Bulk delete operations are disabled in production environment for data safety',
        suggestion: 'Use database console directly if cleanup is absolutely necessary'
      });
    }

    try {
      request.log.info('🧹 Starting R2 bulk delete operation...');

      if (!r2Storage.isConfigured()) {
        // Clear local storage
        const path = require('path');
        const fs = require('fs');
        const localStorageDir = path.join(process.cwd(), 'local-storage');

        if (fs.existsSync(localStorageDir)) {
          fs.rmSync(localStorageDir, { recursive: true, force: true });
          request.log.info('✅ Local storage cleared');
        }

        return reply.send({
          success: true,
          message: 'Local storage cleared (R2 not configured)',
          filesDeleted: 'all local files'
        });
      }

      const allFiles = await r2Storage.listFiles('');
      request.log.info({ count: allFiles.length }, `📋 Found files to delete`);

      if (allFiles.length === 0) {
        return reply.send({
          success: true,
          message: 'No files found in R2 storage',
          filesDeleted: 0
        });
      }

      // Bulk delete (in batches for better performance)
      const batchSize = 50;
      let deletedCount = 0;

      for (let i = 0; i < allFiles.length; i += batchSize) {
        const batch = allFiles.slice(i, i + batchSize);

        const deletePromises = batch.map(async (fileKey) => {
          try {
            await r2Storage.deleteFile(fileKey);
            deletedCount++;
            return reply.send({ success: true, file: fileKey });
          } catch (error) {
            request.log.error({ fileKey, error }, `❌ Failed to delete file`);
            return reply.send({ success: false, file: fileKey, error });
          }
        });

        await Promise.all(deletePromises);
        request.log.info(`✅ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allFiles.length / batchSize)} completed`);
      }

      request.log.info({ deletedCount, totalFiles: allFiles.length }, `✅ R2 bulk delete completed`);

      return reply.send({
        success: true,
        message: 'R2 bulk delete completed',
        filesDeleted: deletedCount,
        totalFiles: allFiles.length,
        successRate: `${Math.round((deletedCount / allFiles.length) * 100)}%`
      });

    } catch (error) {
      request.log.error(error, '❌ R2 bulk delete failed');
      return reply.status(500).send({
        success: false,
        error: 'R2 bulk delete failed',
        details: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
      });
    }
  });

  // 📊 Database size estimate
  fastify.get('/database-size', {
    onRequest: [authenticateFastify]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
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

      return reply.send({
        success: true,
        message: 'Database size analysis completed',
        tables: result.rows,
        totalSizeBytes: totalSize,
        totalSizeMB: parseFloat((totalSize / 1024 / 1024).toFixed(2))
      });

    } catch (error) {
      request.log.error(error, '❌ Database size analysis failed');
      return reply.status(500).send({
        success: false,
        error: 'Database size analysis failed',
        details: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
      });
    }
  });
};

export default cleanupRoutes;

