import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      username: string;
      role: string;
      platformId?: string;
      email?: string;
      companyId?: string;
    };
  }
}

export async function authenticateFastify(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ 
        success: false,
        error: 'No token provided' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      username: string;
      role: string;
      platformId?: string;
      email?: string;
      companyId?: string;
    };
    
    // Map userId to id for consistency with request.user interface
    request.user = {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      platformId: decoded.platformId,
      email: decoded.email,
      companyId: decoded.companyId
    };
  } catch (error) {
    request.log.error(error, 'Authentication failed');
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

