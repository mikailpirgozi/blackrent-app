import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildFastify } from '../../fastify-app';
import type { FastifyInstance } from 'fastify';

describe('Vehicles Routes', () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    fastify = await buildFastify();
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('GET /api/vehicles', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/vehicles'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/vehicles/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/vehicles/test-id'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/vehicles', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/vehicles',
        payload: {
          brand: 'Test Brand',
          model: 'Test Model',
          licensePlate: 'ABC123'
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/vehicles/export/csv', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/vehicles/export/csv'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/vehicles/paginated', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/vehicles/paginated?page=1&limit=10'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/vehicles/check-duplicate/:licensePlate', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/vehicles/check-duplicate/ABC123'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/vehicles/batch-import', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/vehicles/batch-import',
        payload: {
          vehicles: []
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });
});

