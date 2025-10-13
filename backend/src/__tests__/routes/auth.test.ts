import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildFastify } from '../../fastify-app';
import type { FastifyInstance } from 'fastify';

describe('Auth Routes', () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    fastify = await buildFastify();
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 when username is missing', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          password: 'test123'
        }
      });

      expect(response.statusCode).toBe(400);
      const json = response.json();
      expect(json.success).toBe(false);
      expect(json.error).toBeDefined();
    });

    it('should return 400 when password is missing', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'testuser'
        }
      });

      expect(response.statusCode).toBe(400);
      const json = response.json();
      expect(json.success).toBe(false);
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'nonexistent',
          password: 'wrongpass'
        }
      });

      expect(response.statusCode).toBe(401);
      const json = response.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/health', () => {
    it('should return health status', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/auth/health'
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.message).toBeDefined();
    });
  });

  describe('GET /api/auth/verify', () => {
    it('should return 401 without token', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/auth/verify'
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/auth/verify',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should return 400 when required fields are missing', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          username: 'testuser'
          // missing email and password
        }
      });

      expect(response.statusCode).toBe(400);
      const json = response.json();
      expect(json.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/auth/me'
      });

      expect(response.statusCode).toBe(401);
    });
  });
});

