import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';

interface CacheEntry {
  data: unknown;
  expires: number;
}

declare module 'fastify' {
  interface FastifyInstance {
    cache: {
      get(key: string): unknown | null;
      set(key: string, data: unknown, ttl: number): void;
      invalidate(pattern: string): void;
      clear(): void;
    };
  }
}

const cachePlugin: FastifyPluginAsync = async (fastify) => {
  const cache = new Map<string, CacheEntry>();

  fastify.decorate('cache', {
    get: (key: string): unknown | null => {
      const entry = cache.get(key);
      if (!entry || entry.expires < Date.now()) {
        cache.delete(key);
        return null;
      }
      return entry.data;
    },
    
    set: (key: string, data: unknown, ttl: number): void => {
      cache.set(key, { 
        data, 
        expires: Date.now() + ttl 
      });
    },
    
    invalidate: (pattern: string): void => {
      for (const key of cache.keys()) {
        if (key.includes(pattern)) {
          cache.delete(key);
        }
      }
    },
    
    clear: (): void => {
      cache.clear();
    }
  });

  // Log cache stats periodically (optional)
  fastify.log.info(`Cache plugin loaded. Max entries: unlimited`);
};

export default fp(cachePlugin, {
  name: 'cache-plugin'
});


