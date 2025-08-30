/**
 * Testy pre HTTP helper
 * Testuje úspešné aj chybové scenáre
 */

import { ApiError } from '@/lib/errors';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from './http';

// Mock apiPath helper
vi.mock('./apiPath', () => ({
  apiPath: vi.fn((endpoint: string) => `http://localhost:3001/api${endpoint}`),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('HTTP Helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Úspešné requesty', () => {
    it('GET request vráti JSON dáta', async () => {
      const mockData = { id: 1, name: 'Test Vehicle' };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );

      const result = await http.get('/vehicles/1');

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/vehicles/1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('POST request s body', async () => {
      const requestBody = { name: 'New Vehicle', type: 'car' };
      const responseData = { id: 2, ...requestBody };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(responseData), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        })
      );

      const result = await http.post('/vehicles', requestBody);

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/vehicles',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('PUT request s body', async () => {
      const requestBody = { name: 'Updated Vehicle' };
      const responseData = { id: 1, ...requestBody };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(responseData), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );

      const result = await http.put('/vehicles/1', requestBody);

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/vehicles/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(requestBody),
        })
      );
    });

    it('PATCH request s body', async () => {
      const requestBody = { status: 'available' };
      const responseData = { id: 1, status: 'available' };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(responseData), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );

      const result = await http.patch('/vehicles/1', requestBody);

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/vehicles/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(requestBody),
        })
      );
    });

    it('DELETE request', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('', {
          status: 200,
        })
      );

      const result = await http.delete('/vehicles/1');

      expect(result).toBe('');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/vehicles/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('Text response namiesto JSON', async () => {
      const textResponse = 'Operation completed';

      mockFetch.mockResolvedValueOnce(
        new Response(textResponse, {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        })
      );

      const result = await http.get('/status');

      expect(result).toBe(textResponse);
    });

    it('Prázdna response', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('', {
          status: 200,
        })
      );

      const result = await http.delete('/vehicles/1');

      expect(result).toBe('');
    });
  });

  describe('Chybové scenáre', () => {
    it('Fetch vyhodí Error - má sa transformovať na ApiError', async () => {
      const networkError = new Error('Network connection failed');
      mockFetch.mockRejectedValueOnce(networkError);

      await expect(http.get('/vehicles')).rejects.toThrow(ApiError);
    });

    it('HTTP error response', async () => {
      // Test HTTP chyby s mock response
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Map([['content-type', 'application/json']]),
        text: async () =>
          JSON.stringify({
            code: 'VALIDATION_ERROR',
            message: 'Invalid data',
            requestId: 'req-123',
          }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse as Response);

      await expect(http.post('/vehicles', {})).rejects.toThrow(ApiError);
    });
  });

  describe('Konfigurácia', () => {
    it('Custom headers', async () => {
      const customHeaders = { Authorization: 'Bearer token123' };
      const mockData = { success: true };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );

      await http.get('/protected', { headers: customHeaders });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/protected',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer token123',
          }),
        })
      );
    });

    it('Custom timeout', async () => {
      const mockData = { success: true };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );

      await http.get('/vehicles', { timeout: 5000 });

      // Verify that AbortController was created (indirectly through fetch call)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/vehicles',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });
  });
});
