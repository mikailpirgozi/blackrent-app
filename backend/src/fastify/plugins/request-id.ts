import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'crypto';

/**
 * RequestId Plugin - Adds unique request ID to every request
 * 100% Express equivalent of backend/src/middleware/requestId.ts
 */
const requestIdPlugin: FastifyPluginAsync = async (fastify) => {
  // Decorate request with requestId property
  fastify.decorateRequest('requestId', '');

  // Add hook to generate requestId for every request
  fastify.addHook('onRequest', async (request) => {
    // Generate unique UUID for this request
    request.requestId = randomUUID();
    
    // Attach requestId to logger context (child logger)
    request.log = request.log.child({ requestId: request.requestId });
    
    request.log.info({
      msg: '📝 Request started',
      method: request.method,
      url: request.url,
      requestId: request.requestId
    });
  });

  // Log response completion
  fastify.addHook('onResponse', async (request, reply) => {
    request.log.info({
      msg: '✅ Request completed',
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      requestId: request.requestId,
      responseTime: reply.elapsedTime
    });
  });

  fastify.log.info('✅ RequestId plugin registered');
};

export default fp(requestIdPlugin, {
  name: 'request-id',
  fastify: '5.x'
});

// TypeScript declarations
declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
  }
}


