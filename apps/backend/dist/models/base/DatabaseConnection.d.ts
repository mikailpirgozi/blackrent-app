/**
 * Database Connection Manager
 * Spravuje PostgreSQL connection pool a poskytuje ho repository
 */
import { Pool } from 'pg';
export declare class DatabaseConnection {
    private static instance;
    private pool;
    private constructor();
    /**
     * Singleton pattern - vráti jedinú inštanciu
     */
    static getInstance(): DatabaseConnection;
    /**
     * Vráti connection pool
     */
    getPool(): Pool;
    /**
     * Testuje databázové spojenie
     */
    testConnection(): Promise<boolean>;
    /**
     * Zatvorí všetky spojenia
     */
    close(): Promise<void>;
    /**
     * Vráti štatistiky connection pool
     */
    getPoolStats(): {
        totalCount: number;
        idleCount: number;
        waitingCount: number;
    };
}
//# sourceMappingURL=DatabaseConnection.d.ts.map