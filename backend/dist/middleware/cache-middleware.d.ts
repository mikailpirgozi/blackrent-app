/**
 * 🗄️ CACHE MIDDLEWARE
 *
 * Express middleware pre automatic caching API responses
 */
import { Request, Response, NextFunction } from 'express';
import { cacheInstances } from '../utils/cache-service';
import type { CacheOptions } from '../utils/cache-service';
interface CacheMiddlewareOptions extends CacheOptions {
    cacheKey?: (req: Request) => string;
    shouldCache?: (req: Request, res: Response) => boolean;
    entity?: string;
}
/**
 * Cache response middleware
 */
export declare const cacheResponse: (cacheName: keyof typeof cacheInstances, options?: CacheMiddlewareOptions) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Invalidate cache on write operations
 */
export declare const invalidateCache: (entity: string) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * User-specific cache key generator
 */
export declare const userSpecificCache: (req: Request) => string;
/**
 * Cache warming middleware for app startup
 */
export declare const warmCache: () => Promise<void>;
/**
 * Cache stats endpoint middleware
 */
export declare const cacheStatsMiddleware: (req: Request, res: Response) => void;
declare const _default: {
    cacheResponse: (cacheName: keyof typeof cacheInstances, options?: CacheMiddlewareOptions) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
    invalidateCache: (entity: string) => (req: Request, res: Response, next: NextFunction) => void;
    userSpecificCache: (req: Request) => string;
    warmCache: () => Promise<void>;
    cacheStatsMiddleware: (req: Request, res: Response) => void;
};
export default _default;
//# sourceMappingURL=cache-middleware.d.ts.map