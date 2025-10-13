import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildFastify } from '../../fastify-app';
import type { FastifyInstance } from 'fastify';

describe('Protocols Routes', () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    fastify = await buildFastify();
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('GET /api/protocols', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/protocols'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/protocols/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/protocols/test-id'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/protocols/handover', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/protocols/handover',
        payload: {
          id: 'test-id',
          rentalId: 'test-rental'
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PUT /api/protocols/handover/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'PUT',
        url: '/api/protocols/handover/test-id',
        payload: {}
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/protocols/return', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/protocols/return',
        payload: {
          id: 'test-id',
          rentalId: 'test-rental'
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PUT /api/protocols/return/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'PUT',
        url: '/api/protocols/return/test-id',
        payload: {}
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/protocols/rental/:rentalId', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/protocols/rental/test-rental-id'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/protocols/bulk-status', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/protocols/bulk-status'
      });

      expect(response.statusCode).toBe(401);
    });
  });
});

