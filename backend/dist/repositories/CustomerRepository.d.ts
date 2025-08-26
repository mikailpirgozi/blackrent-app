/**
 * Customer Repository
 * Spravuje všetky databázové operácie pre zákazníkov
 * Extrahované z postgres-database.ts - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
 */
import { Pool } from 'pg';
import { Customer } from '../types';
import { BaseRepository } from '../models/base/BaseRepository';
export declare class CustomerRepository extends BaseRepository {
    private customerCache;
    private readonly CUSTOMER_CACHE_TTL;
    constructor(pool: Pool);
    /**
     * Získa všetkých zákazníkov
     */
    getCustomers(): Promise<Customer[]>;
    /**
     * Načíta zákazníkov priamo z databázy (bez cache)
     */
    private getCustomersFresh;
    /**
     * Získa zákazníkov s pagináciou
     */
    getCustomersPaginated(params: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{
        customers: Customer[];
        total: number;
        page: number;
        limit: number;
    }>;
    /**
     * Vytvorí nového zákazníka - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
     */
    createCustomer(customerData: {
        name: string;
        email: string;
        phone: string;
    }): Promise<Customer>;
    /**
     * Aktualizuje zákazníka
     */
    updateCustomer(customer: Customer): Promise<void>;
    /**
     * Zmaže zákazníka
     */
    deleteCustomer(id: string): Promise<void>;
    /**
     * Mapuje databázový riadok na Customer objekt
     */
    private mapRowToCustomer;
    /**
     * Invaliduje customer cache
     */
    private invalidateCustomerCache;
}
//# sourceMappingURL=CustomerRepository.d.ts.map