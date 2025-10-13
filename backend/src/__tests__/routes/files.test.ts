import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildFastify } from '../../fastify-app';
import type { FastifyInstance } from 'fastify';

describe('Files Routes', () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    fastify = await buildFastify();
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('POST /api/files/upload', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/files/upload'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/files/:key', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/files/test-key'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/files/:key', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/files/test-key'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/files/presigned-url', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/files/presigned-url',
        payload: {
          filename: 'test.pdf',
          contentType: 'application/pdf',
          type: 'protocol',
          entityId: 'test-id'
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/files/proxy/:key', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/files/proxy/test-key'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/files/:key/url', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/files/test-key/url'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/files/status', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/files/status'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/files/download-zip', () => {
    it('should return 401 without authentication', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/files/download-zip',
        payload: {
          keys: ['key1', 'key2']
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });
});

