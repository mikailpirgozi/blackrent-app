"use strict";
/**
 * Base Repository Class
 * Poskytuje základné databázové operácie pre všetky repository
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const logger_1 = require("../../utils/logger");
class BaseRepository {
    constructor(pool) {
        this.pool = pool;
    }
    /**
     * Získa databázové spojenie z pool
     */
    async getClient() {
        return await this.pool.connect();
    }
    /**
     * Bezpečne uvoľní databázové spojenie
     */
    releaseClient(client) {
        try {
            client.release();
        }
        catch (error) {
            logger_1.logger.error('Error releasing database client:', error);
        }
    }
    /**
     * Vykoná databázový query s automatickým error handling
     */
    async executeQuery(query, params = [], client) {
        const dbClient = client || await this.getClient();
        const shouldRelease = !client;
        try {
            logger_1.logger.debug('Executing query:', { query: query.substring(0, 100), params });
            const result = await dbClient.query(query, params);
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error('Database query error:', { query, params, error });
            throw error;
        }
        finally {
            if (shouldRelease) {
                this.releaseClient(dbClient);
            }
        }
    }
    /**
     * Vykoná transakciu s automatickým rollback pri chybe
     */
    async executeTransaction(operation) {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await operation(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.logger.error('Transaction rolled back:', error);
            throw error;
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Invaliduje cache pre danú entitu
     */
    invalidateCache(cacheKey) {
        // Implementácia cache invalidation
        logger_1.logger.debug(`Cache invalidated for key: ${cacheKey}`);
    }
    /**
     * Formátuje dátum pre PostgreSQL
     */
    formatDate(date) {
        if (typeof date === 'string') {
            return date;
        }
        return date.toISOString();
    }
    /**
     * Parsuje boolean hodnotu z databázy
     */
    parseBoolean(value) {
        return Boolean(value);
    }
    /**
     * Parsuje číselné hodnoty z databázy
     */
    parseNumber(value) {
        if (value === null || value === undefined) {
            return undefined;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? undefined : parsed;
    }
    /**
     * Parsuje JSON hodnoty z databázy
     */
    parseJson(value) {
        if (!value) {
            return undefined;
        }
        try {
            return typeof value === 'string' ? JSON.parse(value) : value;
        }
        catch (error) {
            logger_1.logger.warn('Failed to parse JSON:', { value, error });
            return undefined;
        }
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=BaseRepository.js.map