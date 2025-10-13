/**
 * 🚩 FEATURE FLAGS ROUTES - Fastify Migration
 * 
 * Migrated from: backend/src/routes/feature-flags.ts
 * Purpose: Feature flag management for frontend
 */

import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { authenticateFastify } from '../decorators/auth';

// In-memory feature flags (can be moved to database later)
const featureFlags = {
  PROTOCOL_V2_ENABLED: {
    enabled: process.env.PROTOCOL_V2_ENABLED === 'true',
    percentage: parseInt(process.env.PROTOCOL_V2_PERCENTAGE || '100'),
    users: process.env.PROTOCOL_V2_USER_IDS?.split(',') || [],
  },
};

const featureFlagsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/feature-flags/:flagName - Get specific feature flag
  fastify.get<{
    Params: { flagName: string };
  }>('/:flagName', {
    onRequest: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { flagName } = request.params;
      const flag = featureFlags[flagName as keyof typeof featureFlags];

      if (!flag) {
        return reply.status(404).send({
          success: false,
          error: `Feature flag '${flagName}' not found`,
        });
      }

      return reply.send({
        success: true,
        flag: {
          name: flagName,
          enabled: flag.enabled,
          percentage: flag.percentage,
          users: flag.users,
        },
      });
    } catch (error) {
      request.log.error(error, 'Feature flag error');
      return reply.status(500).send({
        success: false,
        error: 'Failed to get feature flag',
      });
    }
  });

  // GET /api/feature-flags - Get all feature flags
  fastify.get('/', {
    onRequest: [authenticateFastify]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return reply.send({
        success: true,
        flags: featureFlags,
      });
    } catch (error) {
      request.log.error(error, 'Feature flags error');
      return reply.status(500).send({
        success: false,
        error: 'Failed to get feature flags',
      });
    }
  });
};

export default featureFlagsRoutes;

