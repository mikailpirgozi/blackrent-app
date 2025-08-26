/**
 * Database Connection Manager
 * Spravuje PostgreSQL connection pool a poskytuje ho repository
 */

import { Pool } from 'pg';
import { logger } from '../../utils/logger';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool;

  private constructor() {
    // 🚀 FÁZA 2.2: OPTIMALIZED CONNECTION POOL pre produkčné škálovanie
    const poolConfig = {
      // Railway optimalizácie
      max: 15, // Znížené z 25 - Railway má connection limity 
      min: 2,  // Minimálne 2 connections ready
      idleTimeoutMillis: 30000, // 30s - rýchlejšie cleanup
      connectionTimeoutMillis: 2000, // 2s - rýchly timeout
      acquireTimeoutMillis: 3000, // 3s pre získanie connection
      allowExitOnIdle: true,
      // Keepalive pre produkciu
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,
      // Performance tuning
      statement_timeout: 60000, // 60s statement timeout  
      query_timeout: 45000, // 45s query timeout (enough for IMAP operations)
    };

    // Railway.app provides DATABASE_URL
    if (process.env.DATABASE_URL) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        ...poolConfig
      });
    } else {
      // Local development or manual config
      this.pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'blackrent',
        password: process.env.DB_PASSWORD || 'password',
        port: parseInt(process.env.DB_PORT || '5432'),
        ...poolConfig
      });
    }

    // Connection event handlers
    this.pool.on('connect', (client) => {
      logger.info('🔗 New database client connected');
    });

    this.pool.on('error', (err) => {
      logger.error('🚨 Database pool error:', err);
    });

    this.pool.on('remove', () => {
      logger.info('🔌 Database client removed from pool');
    });

    logger.info('🗄️ Database connection pool initialized');
  }

  /**
   * Singleton pattern - vráti jedinú inštanciu
   */
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Vráti connection pool
   */
  public getPool(): Pool {
    return this.pool;
  }

  /**
   * Testuje databázové spojenie
   */
  public async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      logger.info('✅ Database connection test successful');
      return true;
    } catch (error) {
      logger.error('❌ Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Zatvorí všetky spojenia
   */
  public async close(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('🔒 Database pool closed');
    } catch (error) {
      logger.error('Error closing database pool:', error);
    }
  }

  /**
   * Vráti štatistiky connection pool
   */
  public getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }
}
