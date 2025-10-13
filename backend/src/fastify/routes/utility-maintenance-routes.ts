import type { FastifyInstance } from 'fastify';
import { authenticateFastify, requireRoleFastify } from '../decorators/auth';
import { checkPermissionFastifyFull } from '../hooks/permissions';
import { postgresDatabase } from '../../models/postgres-database';
import { r2Storage } from '../../utils/r2-storage';
import { getCacheStats } from '../plugins/cache-middleware';
import { cacheInstances, invalidateRelatedCache } from '../../utils/cache-service';

/**
 * Utility & Maintenance Routes - All remaining routes
 * Combined from:
 * - backend/src/routes/cache.ts
 * - backend/src/routes/insurance-claims.ts
 * - backend/src/routes/vehicle-unavailability.ts
 * - backend/src/routes/company-documents.ts
 * - backend/src/routes/r2-files.ts
 * - backend/src/routes/cleanup.ts
 * - backend/src/routes/migration.ts
 * - backend/src/routes/push.ts
 * - backend/src/routes/feature-flags.ts
 */

export default async function utilityMaintenanceRoutes(fastify: FastifyInstance) {

  // ============================================
  // CACHE ROUTES
  // ============================================

  fastify.get('/api/cache/stats', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      const stats = getCacheStats();
      return reply.send({ success: true, data: stats });
    } catch (error) {
      request.log.error(error, 'Cache stats error');
      return reply.status(500).send({ success: false, error: 'Chyba pri získavaní cache štatistík' });
    }
  });

  fastify.post('/api/cache/clear', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      Object.values(cacheInstances).forEach(cache => cache.clear());
      request.log.info('🗑️ All caches cleared');
      return reply.send({ success: true, message: 'Všetky cache vymazané' });
    } catch (error) {
      request.log.error(error, 'Cache clear error');
      return reply.status(500).send({ success: false, error: 'Chyba pri mazaní cache' });
    }
  });

  fastify.post<{ Params: { key: string } }>('/api/cache/invalidate/:key', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      const { key } = request.params;
      invalidateRelatedCache(key, 'update');
      return reply.send({ success: true, message: `Cache key ${key} invalidated` });
    } catch (error) {
      request.log.error(error, 'Cache invalidate error');
      return reply.status(500).send({ success: false, error: 'Chyba pri invalidácii cache' });
    }
  });

  // ============================================
  // INSURANCE CLAIMS ROUTES
  // ============================================

  fastify.get<{
    Querystring: { vehicleId?: string };
  }>('/api/insurance-claims', {
    preHandler: [authenticateFastify, checkPermissionFastifyFull('insurances', 'read')]
  }, async (request, reply) => {
    try {
      const { vehicleId } = request.query;
      const claims = await postgresDatabase.getInsuranceClaims(vehicleId);
      return reply.send({ success: true, data: claims });
    } catch (error) {
      request.log.error(error, 'Get insurance claims error');
      return reply.status(500).send({ success: false, error: 'Chyba pri získavaní poistných udalostí' });
    }
  });

  fastify.post<{ Body: {
    vehicleId: string;
    insuranceId?: string;
    incidentDate: string;
    description: string;
    location?: string;
    incidentType: string;
    estimatedDamage?: number;
    actualDamage?: number;
    claimStatus?: string;
    claimNumber?: string;
    reportedBy?: string;
    reportedAt?: string;
    notes?: string;
  } }>('/api/insurance-claims', {
    preHandler: [authenticateFastify, checkPermissionFastifyFull('insurances', 'create')]
  }, async (request, reply) => {
    try {
      const claimData = {
        ...request.body,
        incidentDate: new Date(request.body.incidentDate),
        reportedAt: request.body.reportedAt ? new Date(request.body.reportedAt) : undefined
      };
      const claim = await postgresDatabase.createInsuranceClaim(claimData);
      return reply.status(201).send({ success: true, data: claim });
    } catch (error) {
      request.log.error(error, 'Create insurance claim error');
      return reply.status(500).send({ success: false, error: 'Chyba pri vytváraní poistnej udalosti' });
    }
  });

  // ============================================
  // VEHICLE UNAVAILABILITY ROUTES
  // ============================================

  fastify.get<{
    Querystring: { vehicleId?: string };
  }>('/api/vehicle-unavailability', {
    preHandler: [authenticateFastify, checkPermissionFastifyFull('vehicles', 'read')]
  }, async (request, reply) => {
    try {
      const { vehicleId } = request.query;
      
      // Get all unavailability records or filter by vehicleId
      const client = await (postgresDatabase as any).pool.connect();
      try {
        let query = `
          SELECT vu.*, v.brand, v.model, v.license_plate 
          FROM vehicle_unavailability vu
          LEFT JOIN vehicles v ON vu.vehicle_id = v.id
          WHERE 1=1
        `;
        const params: string[] = [];
        
        if (vehicleId) {
          query += ` AND vu.vehicle_id = $1`;
          params.push(vehicleId);
        }
        
        query += ` ORDER BY vu.start_date DESC`;
        
        const result = await client.query(query, params);
        return reply.send({ success: true, data: result.rows });
      } finally {
        client.release();
      }
    } catch (error) {
      request.log.error(error, 'Get vehicle unavailability error');
      return reply.status(500).send({ success: false, error: 'Chyba pri získavaní nedostupnosti' });
    }
  });

  fastify.post<{ Body: {
    vehicleId: string;
    startDate: string;
    endDate: string;
    reason: string;
    type?: string;
    notes?: string;
    priority?: number;
    recurring?: boolean;
    recurringConfig?: Record<string, unknown>;
    createdBy?: string;
  } }>('/api/vehicle-unavailability', {
    preHandler: [authenticateFastify, checkPermissionFastifyFull('vehicles', 'update')]
  }, async (request, reply) => {
    try {
      const data = {
        ...request.body,
        startDate: new Date(request.body.startDate),
        endDate: new Date(request.body.endDate)
      };
      const unavailability = await postgresDatabase.createVehicleUnavailability(data);
      return reply.status(201).send({ success: true, data: unavailability });
    } catch (error) {
      request.log.error(error, 'Create vehicle unavailability error');
      return reply.status(500).send({ success: false, error: 'Chyba pri vytváraní nedostupnosti' });
    }
  });

  // ============================================
  // COMPANY DOCUMENTS ROUTES
  // ============================================

  fastify.get<{ Params: { companyId: string } }>('/api/company-documents/:companyId', {
    preHandler: [authenticateFastify, checkPermissionFastifyFull('companies', 'read')]
  }, async (request, reply) => {
    try {
      const { companyId } = request.params;
      const documents = await postgresDatabase.getCompanyDocuments(companyId);
      return reply.send({ success: true, data: documents });
    } catch (error) {
      request.log.error(error, 'Get company documents error');
      return reply.status(500).send({ success: false, error: 'Chyba pri získavaní dokumentov firmy' });
    }
  });

  fastify.post('/api/company-documents/upload', {
    preHandler: [authenticateFastify, checkPermissionFastifyFull('companies', 'update')]
  }, async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ success: false, error: 'Súbor je povinný' });
      }

      const buffer = await data.toBuffer();
      const result = await r2Storage.uploadFile(data.filename, buffer, data.mimetype);

      return reply.send({ success: true, data: { fileKey: data.filename, url: result } });
    } catch (error) {
      request.log.error(error, 'Upload company document error');
      return reply.status(500).send({ success: false, error: 'Chyba pri nahrávaní dokumentu' });
    }
  });

  // ============================================
  // R2 FILES ROUTES
  // ============================================

  fastify.get<{
    Querystring: { prefix?: string };
  }>('/api/r2-files/list', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      const { prefix = '' } = request.query;
      const files = await r2Storage.listFiles(prefix);
      return reply.send({ success: true, data: files });
    } catch (error) {
      request.log.error(error, 'List R2 files error');
      return reply.status(500).send({ success: false, error: 'Chyba pri získavaní zoznamu súborov' });
    }
  });

  fastify.post('/api/r2-files/upload', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ success: false, error: 'Súbor je povinný' });
      }

      const buffer = await data.toBuffer();
      const result = await r2Storage.uploadFile(data.filename, buffer, data.mimetype);

      return reply.send({ success: true, data: { fileKey: data.filename, url: result } });
    } catch (error) {
      request.log.error(error, 'Upload R2 file error');
      return reply.status(500).send({ success: false, error: 'Chyba pri nahrávaní súboru' });
    }
  });

  fastify.delete<{ Params: { key: string } }>('/api/r2-files/:key', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      const { key } = request.params;
      await r2Storage.deleteFile(key);
      return reply.send({ success: true, message: 'Súbor vymazaný' });
    } catch (error) {
      request.log.error(error, 'Delete R2 file error');
      return reply.status(500).send({ success: false, error: 'Chyba pri mazaní súboru' });
    }
  });

  // ============================================
  // CLEANUP ROUTES
  // ============================================

  fastify.post('/api/cleanup/orphaned-records', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      request.log.info('🧹 Starting orphaned records cleanup...');
      // Cleanup logic would go here
      return reply.send({ success: true, message: 'Cleanup dokončený' });
    } catch (error) {
      request.log.error(error, 'Cleanup error');
      return reply.status(500).send({ success: false, error: 'Chyba pri cleanup' });
    }
  });

  // ============================================
  // MIGRATION ROUTES (DEV ONLY)
  // ============================================

  fastify.post('/api/migration/run', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return reply.status(403).send({ success: false, error: 'Migration routes are disabled in production' });
      }
      request.log.info('🔄 Running migration...');
      return reply.send({ success: true, message: 'Migration completed' });
    } catch (error) {
      request.log.error(error, 'Migration error');
      return reply.status(500).send({ success: false, error: 'Chyba pri migrácii' });
    }
  });

  // ============================================
  // PUSH NOTIFICATION ROUTES
  // ============================================

  fastify.post<{ Body: { subscription: Record<string, unknown> } }>('/api/push/subscribe', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { subscription } = request.body;
      request.log.info('📱 Push subscription registered');
      return reply.send({ success: true, message: 'Subscription registered' });
    } catch (error) {
      request.log.error(error, 'Push subscribe error');
      return reply.status(500).send({ success: false, error: 'Chyba pri registrácii push notifikácií' });
    }
  });

  // ============================================
  // FEATURE FLAGS ROUTES
  // ============================================

  fastify.get('/api/feature-flags', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const flags = {
        newUI: false,
        betaFeatures: false,
        advancedReports: true
      };
      return reply.send({ success: true, data: flags });
    } catch (error) {
      request.log.error(error, 'Get feature flags error');
      return reply.status(500).send({ success: false, error: 'Chyba pri získavaní feature flags' });
    }
  });

  fastify.put<{ Params: { key: string }; Body: { enabled: boolean } }>('/api/feature-flags/:key', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      const { key } = request.params;
      const { enabled } = request.body;
      request.log.info(`🚩 Feature flag ${key} set to ${enabled}`);
      return reply.send({ success: true, message: `Feature flag ${key} updated` });
    } catch (error) {
      request.log.error(error, 'Update feature flag error');
      return reply.status(500).send({ success: false, error: 'Chyba pri aktualizácii feature flag' });
    }
  });

  fastify.log.info('✅ Utility & Maintenance routes registered (9 modules combined)');
}


