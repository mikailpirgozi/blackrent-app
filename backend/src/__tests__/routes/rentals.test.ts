import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildFastify } from '../../fastify-app';
import type { FastifyInstance } from 'fastify';

describe('Rentals Routes', () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    fastify = await buildFastify();
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('GET /api/rentals', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/rentals'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/rentals/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/rentals/test-id'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/rentals', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/rentals',
        payload: {
          vehicleId: 'test-vehicle',
          customerId: 'test-customer',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString()
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/rentals/paginated', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/rentals/paginated?page=1&limit=10'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/rentals/:id/clone', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/rentals/test-id/clone'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/rentals/batch-import', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/rentals/batch-import',
        payload: {
          rentals: []
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });
});

