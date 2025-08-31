/**
 * Base Repository Class
 * Poskytuje základné databázové operácie pre všetky repository
 */

import type { Pool, PoolClient } from 'pg';
import { logger } from '../../utils/logger';

export abstract class BaseRepository {
  protected pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Získa databázové spojenie z pool
   */
  protected async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Bezpečne uvoľní databázové spojenie
   */
  protected releaseClient(client: PoolClient): void {
    try {
      client.release();
    } catch (error) {
      logger.error('Error releasing database client:', error);
    }
  }

  /**
   * Vykoná databázový query s automatickým error handling
   */
  protected async executeQuery<T = any>(
    query: string, 
    params: any[] = [], 
    client?: PoolClient
  ): Promise<T[]> {
    const dbClient = client || await this.getClient();
    const shouldRelease = !client;

    try {
      logger.debug('Executing query:', { query: query.substring(0, 100), params });
      const result = await dbClient.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Database query error:', { query, params, error });
      throw error;
    } finally {
      if (shouldRelease) {
        this.releaseClient(dbClient);
      }
    }
  }

  /**
   * Vykoná transakciu s automatickým rollback pri chybe
   */
  protected async executeTransaction<T>(
    operation: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction rolled back:', error);
      throw error;
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Invaliduje cache pre danú entitu
   */
  protected invalidateCache(cacheKey: string): void {
    // Implementácia cache invalidation
    logger.debug(`Cache invalidated for key: ${cacheKey}`);
  }

  /**
   * Formátuje dátum pre PostgreSQL
   */
  protected formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString();
  }

  /**
   * Parsuje boolean hodnotu z databázy
   */
  protected parseBoolean(value: any): boolean {
    return Boolean(value);
  }

  /**
   * Parsuje číselné hodnoty z databázy
   */
  protected parseNumber(value: any): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Parsuje JSON hodnoty z databázy
   */
  protected parseJson<T>(value: any): T | undefined {
    if (!value) {
      return undefined;
    }
    
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (error) {
      logger.warn('Failed to parse JSON:', { value, error });
      return undefined;
    }
  }
}
