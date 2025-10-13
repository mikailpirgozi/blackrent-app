import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyError, FastifyRequest, FastifyReply } from 'fastify';

/**
 * Error Handler Plugin - Consistent error handling across all routes
 * 100% Express equivalent output format from backend/src/middleware/errorHandler.ts
 */
const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const statusCode = error.statusCode || 500;
    const requestId = request.requestId || 'unknown';

    // Log error with full context
    request.log.error({
      error: error.message,
      stack: error.stack,
      statusCode,
      requestId,
      method: request.method,
      url: request.url,
      validation: error.validation
    });

    // Validation errors (from schemas)
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: error.validation,
        requestId,
        timestamp: new Date().toISOString()
      });
    }

    // JWT errors
    if (error.message?.includes('jwt') || error.message?.includes('token')) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication failed',
        message: error.message,
        requestId,
        timestamp: new Date().toISOString()
      });
    }

    // Database errors
    if (error.message?.includes('database') || error.message?.includes('PostgresDatabase')) {
      return reply.status(500).send({
        success: false,
        error: 'Database error',
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        requestId,
        timestamp: new Date().toISOString()
      });
    }

    // Generic error response (Express equivalent format)
    return reply.status(statusCode).send({
      success: false,
      error: error.message || 'Internal server error',
      statusCode,
      requestId,
      timestamp: new Date().toISOString(),
      // Include stack trace only in development
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    });
  });

  // Not Found handler (404)
  fastify.setNotFoundHandler((request, reply) => {
    request.log.warn({
      msg: '❌ 404 Not Found',
      method: request.method,
      url: request.url,
      requestId: request.requestId
    });

    return reply.status(404).send({
      success: false,
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
      requestId: request.requestId,
      timestamp: new Date().toISOString()
    });
  });

  fastify.log.info('✅ Error handler plugin registered');
};

export default fp(errorHandlerPlugin, {
  name: 'error-handler',
  fastify: '5.x'
});


