import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildFastify } from '../../fastify-app';
import type { FastifyInstance } from 'fastify';

describe('Expenses Routes', () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    fastify = await buildFastify();
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('GET /api/expenses', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/expenses'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/expenses/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/expenses/test-id'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/expenses', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/expenses',
        payload: {
          description: 'Test expense',
          amount: 100,
          date: new Date().toISOString()
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/expenses/export/csv', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/expenses/export/csv'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/expenses/import/csv', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/expenses/import/csv',
        payload: {
          csvData: 'test,data'
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/expenses/batch-import', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/expenses/batch-import',
        payload: {
          expenses: []
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });
});

