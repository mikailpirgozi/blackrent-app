import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildFastify } from '../../fastify-app';
import type { FastifyInstance } from 'fastify';

describe('Leasings Routes', () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    fastify = await buildFastify();
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('GET /api/leasings', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/leasings'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/leasings/paginated', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/leasings/paginated?page=1&limit=10'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/leasings/dashboard', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/leasings/dashboard'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/leasings/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/leasings/test-id'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/leasings', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/leasings',
        payload: {
          vehicleId: 'test-vehicle',
          leasingCompany: 'Test Company',
          loanCategory: 'autoúver',
          initialLoanAmount: 10000,
          totalInstallments: 12,
          firstPaymentDate: new Date().toISOString()
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/leasings/:id/schedule', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/leasings/test-id/schedule'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/leasings/:id/payments', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/leasings/test-id/payments'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/leasings/upcoming-payments', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/leasings/upcoming-payments'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/leasings/overdue', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/leasings/overdue'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/leasings/:id/early-repayment', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/leasings/test-id/early-repayment',
        payload: {}
      });

      expect(response.statusCode).toBe(401);
    });
  });
});

