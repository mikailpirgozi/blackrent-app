"use strict";
/**
 * Database Connection Manager
 * Spravuje PostgreSQL connection pool a poskytuje ho repository
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConnection = void 0;
const pg_1 = require("pg");
const logger_1 = require("../../utils/logger");
class DatabaseConnection {
    constructor() {
        // 🚀 FÁZA 2.2: OPTIMALIZED CONNECTION POOL pre produkčné škálovanie
        const poolConfig = {
            // Railway optimalizácie
            max: 15, // Znížené z 25 - Railway má connection limity 
            min: 2, // Minimálne 2 connections ready
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
            this.pool = new pg_1.Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                ...poolConfig
            });
        }
        else {
            // Local development or manual config
            this.pool = new pg_1.Pool({
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
            logger_1.logger.info('🔗 New database client connected');
        });
        this.pool.on('error', (err) => {
            logger_1.logger.error('🚨 Database pool error:', err);
        });
        this.pool.on('remove', () => {
            logger_1.logger.info('🔌 Database client removed from pool');
        });
        logger_1.logger.info('🗄️ Database connection pool initialized');
    }
    /**
     * Singleton pattern - vráti jedinú inštanciu
     */
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    /**
     * Vráti connection pool
     */
    getPool() {
        return this.pool;
    }
    /**
     * Testuje databázové spojenie
     */
    async testConnection() {
        try {
            const client = await this.pool.connect();
            const result = await client.query('SELECT NOW()');
            client.release();
            logger_1.logger.info('✅ Database connection test successful');
            return true;
        }
        catch (error) {
            logger_1.logger.error('❌ Database connection test failed:', error);
            return false;
        }
    }
    /**
     * Zatvorí všetky spojenia
     */
    async close() {
        try {
            await this.pool.end();
            logger_1.logger.info('🔒 Database pool closed');
        }
        catch (error) {
            logger_1.logger.error('Error closing database pool:', error);
        }
    }
    /**
     * Vráti štatistiky connection pool
     */
    getPoolStats() {
        return {
            totalCount: this.pool.totalCount,
            idleCount: this.pool.idleCount,
            waitingCount: this.pool.waitingCount,
        };
    }
}
exports.DatabaseConnection = DatabaseConnection;
//# sourceMappingURL=DatabaseConnection.js.map