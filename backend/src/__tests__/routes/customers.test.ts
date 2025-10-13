import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildFastify } from '../../fastify-app';
import type { FastifyInstance } from 'fastify';

describe('Customers Routes', () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    fastify = await buildFastify();
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('GET /api/customers', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/customers'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/customers/test-id'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/customers', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/customers',
        payload: {
          name: 'Test Customer',
          email: 'test@example.com'
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/customers/export/csv', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/customers/export/csv'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/customers/paginated', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/customers/paginated?page=1&limit=10'
      });

      expect(response.statusCode).toBe(401);
    });
  });
});

