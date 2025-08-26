/**
 * Base Repository Class
 * Poskytuje základné databázové operácie pre všetky repository
 */
import { Pool, PoolClient } from 'pg';
export declare abstract class BaseRepository {
    protected pool: Pool;
    constructor(pool: Pool);
    /**
     * Získa databázové spojenie z pool
     */
    protected getClient(): Promise<PoolClient>;
    /**
     * Bezpečne uvoľní databázové spojenie
     */
    protected releaseClient(client: PoolClient): void;
    /**
     * Vykoná databázový query s automatickým error handling
     */
    protected executeQuery<T = any>(query: string, params?: any[], client?: PoolClient): Promise<T[]>;
    /**
     * Vykoná transakciu s automatickým rollback pri chybe
     */
    protected executeTransaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T>;
    /**
     * Invaliduje cache pre danú entitu
     */
    protected invalidateCache(cacheKey: string): void;
    /**
     * Formátuje dátum pre PostgreSQL
     */
    protected formatDate(date: Date | string): string;
    /**
     * Parsuje boolean hodnotu z databázy
     */
    protected parseBoolean(value: any): boolean;
    /**
     * Parsuje číselné hodnoty z databázy
     */
    protected parseNumber(value: any): number | undefined;
    /**
     * Parsuje JSON hodnoty z databázy
     */
    protected parseJson<T>(value: any): T | undefined;
}
//# sourceMappingURL=BaseRepository.d.ts.map