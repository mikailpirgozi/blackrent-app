/**
 * HTTP helper pre BlackRent API
 * Wrapper nad fetch s centralizovaným error handling
 */

import { ApiError } from '@/lib/errors';
import { apiPath } from './apiPath';

/**
 * HTTP metódy podporované helperom
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Konfigurácia pre HTTP request
 */
interface RequestConfig {
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

/**
 * Štandardné headers pre API requesty
 */
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
} as const;

/**
 * Štandardný timeout (10 sekúnd)
 */
const DEFAULT_TIMEOUT = 10000;

/**
 * Vytvorí AbortController s timeout
 */
function createTimeoutController(timeout: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller;
}

/**
 * Generický HTTP request wrapper
 */
async function request<T = unknown>(
  method: HttpMethod,
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { headers = {}, body, timeout = DEFAULT_TIMEOUT } = config;

  const url = apiPath(endpoint);
  const controller = createTimeoutController(timeout);

  try {
    const requestInit: RequestInit = {
      method,
      headers: {
        ...DEFAULT_HEADERS,
        ...headers,
      },
      signal: controller.signal,
    };

    // Pridaj body pre metódy ktoré ho podporujú
    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      requestInit.body = JSON.stringify(body);
    }

    const response = await fetch(url, requestInit);

    // Ak nie je response OK, vyhoď ApiError
    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    // Pokús sa parsovať JSON, ak sa nepodarí vráť text
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return (await response.json()) as T;
    }

    // Pre non-JSON odpovede vráť text
    const text = await response.text();
    return text as T;
  } catch (error) {
    // Ak je to už ApiError, prehoď ho ďalej
    if (error instanceof ApiError) {
      throw error;
    }

    // Timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(
        'REQUEST_TIMEOUT',
        `Request timeout after ${timeout}ms`,
        {
          status: 408,
          details: { endpoint, method, timeout },
        }
      );
    }

    // Network error alebo iná chyba
    if (error instanceof Error) {
      throw new ApiError('NETWORK_ERROR', error.message, {
        details: { endpoint, method, originalError: error.name },
      });
    }

    // Neznáma chyba
    throw new ApiError('UNKNOWN_ERROR', 'Unknown error occurred', {
      details: { endpoint, method, error: String(error) },
    });
  }
}

/**
 * HTTP helper methods
 */
export const http = {
  /**
   * GET request
   */
  async get<T = unknown>(
    endpoint: string,
    config?: Omit<RequestConfig, 'body'>
  ): Promise<T> {
    return request<T>('GET', endpoint, config);
  },

  /**
   * POST request
   */
  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    config?: Omit<RequestConfig, 'body'>
  ): Promise<T> {
    return request<T>('POST', endpoint, { ...config, body });
  },

  /**
   * PUT request
   */
  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    config?: Omit<RequestConfig, 'body'>
  ): Promise<T> {
    return request<T>('PUT', endpoint, { ...config, body });
  },

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    config?: Omit<RequestConfig, 'body'>
  ): Promise<T> {
    return request<T>('PATCH', endpoint, { ...config, body });
  },

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    endpoint: string,
    config?: Omit<RequestConfig, 'body'>
  ): Promise<T> {
    return request<T>('DELETE', endpoint, config);
  },
} as const;

/**
 * Export default pre jednoduchšie importy
 */
export default http;
