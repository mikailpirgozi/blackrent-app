import type { FastifyInstance } from 'fastify';
import { authenticateFastify, requireRoleFastify } from '../decorators/auth';
import { postgresDatabase } from '../../models/postgres-database';
import type { Platform } from '../../types';

interface PlatformParams {
  id: string;
}

interface AssignCompanyParams {
  platformId: string;
  companyId: string;
}

interface PlatformBody {
  name: string;
  displayName?: string;
  subdomain?: string;
  logoUrl?: string;
  settings?: Record<string, unknown>;
}

export default async function platformsRoutes(fastify: FastifyInstance) {
  
  // GET /api/platforms - Get all platforms
  fastify.get('/api/platforms', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const user = request.user!;

      // Security: Only super_admin, admin, and company_admin can view platforms
      if (user.role !== 'super_admin' && user.role !== 'admin' && user.role !== 'company_admin') {
        return reply.status(403).send({
          success: false,
          error: 'Prístup zamietnutý. Len admin môže vidieť platformy.'
        });
      }

      let platforms = await postgresDatabase.getPlatforms();
      
      // Platform filtering: Company admin sees only their own platform
      if (user.role === 'company_admin' && user.platformId) {
        platforms = platforms.filter(p => p.id === user.platformId);
      }
      
      fastify.log.info({
        msg: '✅ Platforms retrieved',
        username: user.username,
        count: platforms.length,
        userId: user.id
      });

      return {
        success: true,
        data: platforms
      };
    } catch (error) {
      fastify.log.error(error, '❌ Get platforms error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní platforiem'
      });
    }
  });

  // GET /api/platforms/:id - Get platform by ID
  fastify.get<{
    Params: PlatformParams;
  }>('/api/platforms/:id', {
    preHandler: [
      authenticateFastify,
      requireRoleFastify(['super_admin', 'admin'])
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      const platform = await postgresDatabase.getPlatform(id);

      if (!platform) {
        return reply.status(404).send({
          success: false,
          error: 'Platforma nenájdená'
        });
      }

      return {
        success: true,
        data: platform
      };
    } catch (error) {
      fastify.log.error(error, '❌ Get platform error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní platformy'
      });
    }
  });

  // GET /api/platforms/:id/stats - Get platform statistics
  fastify.get<{
    Params: PlatformParams;
  }>('/api/platforms/:id/stats', {
    preHandler: [
      authenticateFastify,
      requireRoleFastify(['super_admin', 'admin'])
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      const stats = await postgresDatabase.getPlatformStats(id);

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      fastify.log.error(error, '❌ Get platform stats error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní štatistík platformy'
      });
    }
  });

  // POST /api/platforms - Create new platform
  fastify.post<{
    Body: PlatformBody;
  }>('/api/platforms', {
    preHandler: [
      authenticateFastify,
      requireRoleFastify(['super_admin', 'admin'])
    ]
  }, async (request, reply) => {
    try {
      const { name, displayName, subdomain, logoUrl, settings } = request.body;

      if (!name) {
        return reply.status(400).send({
          success: false,
          error: 'Názov platformy je povinný'
        });
      }

      const platform = await postgresDatabase.createPlatform({
        name,
        displayName,
        subdomain,
        logoUrl,
        settings
      });

      fastify.log.info({
        msg: '✅ Platform created',
        username: request.user!.username,
        platformId: platform.id,
        platformName: platform.name,
        userId: request.user!.id
      });

      return reply.status(201).send({
        success: true,
        message: 'Platforma úspešne vytvorená',
        data: platform
      });
    } catch (error) {
      fastify.log.error(error, '❌ Create platform error');
      return reply.status(500).send({
        success: false,
        error: `Chyba pri vytváraní platformy: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
      });
    }
  });

  // PUT /api/platforms/:id - Update platform
  fastify.put<{
    Params: PlatformParams;
    Body: Partial<Platform>;
  }>('/api/platforms/:id', {
    preHandler: [
      authenticateFastify,
      requireRoleFastify(['super_admin', 'admin'])
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      const platform = await postgresDatabase.updatePlatform(id, request.body);

      if (!platform) {
        return reply.status(404).send({
          success: false,
          error: 'Platforma nenájdená'
        });
      }

      fastify.log.info({
        msg: '✅ Platform updated',
        username: request.user!.username,
        platformId: id,
        platformName: platform.name,
        userId: request.user!.id
      });

      return {
        success: true,
        message: 'Platforma úspešne aktualizovaná',
        data: platform
      };
    } catch (error) {
      fastify.log.error(error, '❌ Update platform error');
      return reply.status(500).send({
        success: false,
        error: `Chyba pri aktualizácii platformy: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
      });
    }
  });

  // DELETE /api/platforms/:id - Delete platform
  fastify.delete<{
    Params: PlatformParams;
  }>('/api/platforms/:id', {
    preHandler: [
      authenticateFastify,
      requireRoleFastify(['super_admin', 'admin'])
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      const deleted = await postgresDatabase.deletePlatform(id);

      if (!deleted) {
        return reply.status(404).send({
          success: false,
          error: 'Platforma nenájdená'
        });
      }

      fastify.log.info({
        msg: '✅ Platform deleted',
        username: request.user!.username,
        platformId: id,
        userId: request.user!.id
      });

      return {
        success: true,
        message: 'Platforma úspešne vymazaná'
      };
    } catch (error) {
      fastify.log.error(error, '❌ Delete platform error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri vymazávaní platformy'
      });
    }
  });

  // POST /api/platforms/:platformId/assign-company/:companyId - Assign company to platform
  fastify.post<{
    Params: AssignCompanyParams;
  }>('/api/platforms/:platformId/assign-company/:companyId', {
    preHandler: [
      authenticateFastify,
      requireRoleFastify(['super_admin', 'admin'])
    ]
  }, async (request, reply) => {
    try {
      const { platformId, companyId } = request.params;

      const success = await postgresDatabase.assignCompanyToPlatform(companyId, platformId);

      if (!success) {
        return reply.status(404).send({
          success: false,
          error: 'Firma alebo platforma nenájdená'
        });
      }

      fastify.log.info({
        msg: '✅ Company assigned to platform',
        username: request.user!.username,
        platformId,
        companyId,
        userId: request.user!.id
      });

      return {
        success: true,
        message: 'Firma úspešne priradená k platforme'
      };
    } catch (error) {
      fastify.log.error(error, '❌ Assign company to platform error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri priraďovaní firmy k platforme'
      });
    }
  });

  fastify.log.info('✅ Platforms routes registered');
}

