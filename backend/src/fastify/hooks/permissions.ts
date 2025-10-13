import type { FastifyRequest, FastifyReply } from 'fastify';
import { postgresDatabase } from '../../models/postgres-database';
import type { UserPermission } from '../../types';

export function checkPermissionFastify(resource: string, action: string) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const user = request.user;
    
    if (!user) {
      return reply.status(401).send({ 
        success: false,
        error: 'Unauthorized' 
      });
    }

    // Super admin and admin bypass permission checks
    if (user.role === 'super_admin' || user.role === 'admin') {
      return;
    }

    try {
      // Get user permissions
      const userPermissions = await postgresDatabase.getUserPermissions(user.id);
      
      // Check if user has permission for this resource/action
      // UserPermission has structure: { id, userId, companyId, permissions: CompanyPermissions }
      // CompanyPermissions has: { vehicles: ResourcePermission, customers: ResourcePermission, etc }
      const hasPermission = userPermissions.some((perm: UserPermission) => {
        const resourcePerms = (perm.permissions as any)[resource];
        return resourcePerms && resourcePerms[action] === true;
      });

      if (!hasPermission) {
        return reply.status(403).send({ 
          success: false,
          error: `No permission for ${action} on ${resource}`,
          resource,
          action
        });
      }
    } catch (error) {
      request.log.error(error, 'Permission check failed');
      return reply.status(500).send({ 
        success: false,
        error: 'Permission check failed' 
      });
    }
  };
}

