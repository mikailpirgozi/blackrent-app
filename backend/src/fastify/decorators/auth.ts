import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { postgresDatabase } from '../../models/postgres-database';
import type { User } from '../../types';

declare module 'fastify' {
  interface FastifyRequest {
    user?: Omit<User, 'password'>;
  }
}

export async function authenticateFastify(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    const queryToken = (request.query as { token?: string }).token;
    
    // Support token from Authorization header OR query parameter (for PDF downloads)
    let token: string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (queryToken) {
      token = queryToken;
    }
    
    if (!token) {
      request.log.info('❌ AUTH: No token provided');
      return reply.status(401).send({ 
        success: false,
        error: 'No token provided' 
      });
    }

    request.log.info('🔍 AUTH: Verifying JWT token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      username: string;
      role: string;
      platformId?: string;
      email?: string;
      companyId?: string;
    };
    
    request.log.info({
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role
    }, '🔍 AUTH: JWT decoded successfully');

    // ✅ CRITICAL: Get current user data from database (100% Express equivalent)
    request.log.info('🔍 AUTH: Getting user from database...');
    const user = await postgresDatabase.getUserById(decoded.userId);
    
    request.log.info({
      found: !!user,
      id: user?.id,
      username: user?.username,
      role: user?.role,
      platformId: user?.platformId,
      linkedInvestorId: user?.linkedInvestorId,
      isActive: user?.isActive
    }, '🔍 AUTH: Database user result');

    if (!user) {
      request.log.error('❌ AUTH: User not found in database');
      return reply.status(401).send({ 
        success: false,
        error: 'User not found' 
      });
    }

    // ✅ SECURITY: Check if user is active
    if (!user.isActive) {
      request.log.error('❌ AUTH: User account is inactive');
      return reply.status(401).send({ 
        success: false,
        error: 'User account is inactive' 
      });
    }
    
    // ✅ Map full user object (100% Express equivalent - all fields)
    request.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
      platformId: user.platformId,
      linkedInvestorId: user.linkedInvestorId,
      employeeNumber: user.employeeNumber,
      hireDate: user.hireDate,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      permissions: user.permissions,
      signatureTemplate: user.signatureTemplate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    request.log.info('✅ AUTH: Authentication successful');
  } catch (error) {
    request.log.error(error, '❌ AUTH: Authentication failed');
    return reply.status(401).send({ 
      success: false,
      error: 'Invalid token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export function requireRoleFastify(roles: string[]) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    if (!request.user) {
      return reply.status(401).send({ 
        success: false,
        error: 'Unauthorized' 
      });
    }

    if (!roles.includes(request.user.role)) {
      return reply.status(403).send({ 
        success: false,
        error: 'Insufficient permissions',
        required: roles,
        current: request.user.role
      });
    }
  };
}

