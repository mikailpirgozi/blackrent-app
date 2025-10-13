import type { FastifyInstance } from 'fastify';
import { authenticateFastify, requireRoleFastify } from '../decorators/auth';
import { postgresDatabase } from '../../models/postgres-database';
import type { CompanyPermissions } from '../../types';

/**
 * Permissions Routes - User permissions management
 * 100% Express equivalent from backend/src/routes/permissions.ts
 */
export default async function permissionsRoutes(fastify: FastifyInstance) {

  // GET /api/permissions/user/:userId - Get user permissions
  fastify.get<{
    Params: { userId: string };
  }>('/api/permissions/user/:userId', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      const { userId } = request.params;
      const permissions = await postgresDatabase.getUserPermissions(userId);

      return reply.send({
        success: true,
        data: permissions,
        message: 'Práva používateľa úspešne načítané'
      });
    } catch (error) {
      request.log.error(error, '❌ Chyba pri získavaní práv používateľa');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní práv používateľa'
      });
    }
  });

  // GET /api/permissions/user/:userId/access - Get user company access
  fastify.get<{
    Params: { userId: string };
  }>('/api/permissions/user/:userId/access', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { userId } = request.params;

      // Check - user can only see their own permissions, admin sees all
      if (request.user?.role !== 'admin' && request.user?.role !== 'super_admin' && request.user?.id !== userId) {
        return reply.status(403).send({
          success: false,
          error: 'Nemáte oprávnenie na zobrazenie týchto práv'
        });
      }

      const access = await postgresDatabase.getUserCompanyAccess(userId);

      request.log.info(`🔐 getUserCompanyAccess - returning ${access.length} company access records for user ${userId}`);

      return reply.send({
        success: true,
        data: access,
        message: 'Prístup k firmám úspešne načítaný'
      });
    } catch (error) {
      request.log.error(error, '❌ Chyba pri získavaní prístupu k firmám');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní prístupu k firmám'
      });
    }
  });

  // POST /api/permissions/user/:userId/company/:companyId - Set user permissions for company
  fastify.post<{
    Params: { userId: string; companyId: string };
    Body: { permissions: CompanyPermissions };
  }>('/api/permissions/user/:userId/company/:companyId', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      const { userId, companyId } = request.params;
      const { permissions } = request.body;

      if (!permissions) {
        return reply.status(400).send({
          success: false,
          error: 'Práva sú povinné'
        });
      }

      await postgresDatabase.setUserPermission(userId, companyId, permissions);

      return reply.send({
        success: true,
        message: 'Práva používateľa úspešne nastavené'
      });
    } catch (error) {
      request.log.error(error, '❌ Chyba pri nastavovaní práv');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri nastavovaní práv'
      });
    }
  });

  // DELETE /api/permissions/user/:userId/company/:companyId - Remove user permissions
  fastify.delete<{
    Params: { userId: string; companyId: string };
  }>('/api/permissions/user/:userId/company/:companyId', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      const { userId, companyId } = request.params;

      await postgresDatabase.removeUserPermission(userId, companyId);

      return reply.send({
        success: true,
        message: 'Práva používateľa úspešne odstránené'
      });
    } catch (error) {
      request.log.error(error, '❌ Chyba pri odstraňovaní práv');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri odstraňovaní práv'
      });
    }
  });

  // GET /api/permissions/company/:companyId/users - Get users with company access
  fastify.get<{
    Params: { companyId: string };
  }>('/api/permissions/company/:companyId/users', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      const { companyId } = request.params;
      const users = await postgresDatabase.getUsersWithCompanyAccess(companyId);

      return reply.send({
        success: true,
        data: users,
        message: 'Používatelia s prístupom k firme úspešne načítaní'
      });
    } catch (error) {
      request.log.error(error, '❌ Chyba pri získavaní používateľov firmy');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní používateľov firmy'
      });
    }
  });

  // POST /api/permissions/bulk - Bulk permissions assignment
  fastify.post<{
    Body: { assignments: Array<{ userId: string; companyId: string; permissions: CompanyPermissions }> };
  }>('/api/permissions/bulk', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      const { assignments } = request.body;

      if (!Array.isArray(assignments)) {
        return reply.status(400).send({
          success: false,
          error: 'Assignments musí byť pole'
        });
      }

      const results = [];
      const errors = [];

      for (const assignment of assignments) {
        try {
          const { userId, companyId, permissions } = assignment;
          await postgresDatabase.setUserPermission(userId, companyId, permissions);
          results.push({ userId, companyId, success: true });
        } catch (error: unknown) {
          errors.push({
            assignment,
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
          });
        }
      }

      return reply.send({
        success: true,
        data: {
          successful: results.length,
          failed: errors.length,
          errors: errors.length > 0 ? errors : undefined
        },
        message: `Hromadné nastavenie práv dokončené (${results.length} úspešných, ${errors.length} chýb)`
      });
    } catch (error) {
      request.log.error(error, '❌ Chyba pri hromadnom nastavovaní práv');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri hromadnom nastavovaní práv'
      });
    }
  });

  fastify.log.info('✅ Permissions routes registered');
}


