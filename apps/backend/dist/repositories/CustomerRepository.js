"use strict";
/**
 * Customer Repository
 * Spravuje všetky databázové operácie pre zákazníkov
 * Extrahované z postgres-database.ts - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerRepository = void 0;
const BaseRepository_1 = require("../models/base/BaseRepository");
const logger_1 = require("../utils/logger");
class CustomerRepository extends BaseRepository_1.BaseRepository {
    constructor(pool) {
        super(pool);
        // 🚀 FÁZA 2.3: SMART CACHING LAYER - customer cache system
        this.customerCache = new Map();
        this.CUSTOMER_CACHE_TTL = 3 * 60 * 1000; // 3 minúty
    }
    /**
     * Získa všetkých zákazníkov
     */
    async getCustomers() {
        const cacheKey = 'all_customers';
        const cached = this.customerCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.CUSTOMER_CACHE_TTL) {
            logger_1.logger.migration('🎯 CUSTOMER CACHE HIT - returning cached customers');
            return cached.data;
        }
        logger_1.logger.migration('🔄 CUSTOMER CACHE MISS - loading fresh customers from DB');
        const customers = await this.getCustomersFresh();
        // Cache the result
        this.customerCache.set(cacheKey, {
            data: customers,
            timestamp: Date.now()
        });
        return customers;
    }
    /**
     * Načíta zákazníkov priamo z databázy (bez cache)
     */
    async getCustomersFresh() {
        const client = await this.getClient();
        try {
            const result = await client.query(`
        SELECT * FROM customers 
        ORDER BY created_at DESC
      `);
            return result.rows.map(row => this.mapRowToCustomer(row));
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Získa zákazníkov s pagináciou
     */
    async getCustomersPaginated(params) {
        const client = await this.getClient();
        try {
            const page = params.page || 1;
            const limit = params.limit || 20;
            const offset = (page - 1) * limit;
            const whereConditions = [];
            const queryParams = [];
            let paramIndex = 1;
            // Search filter
            if (params.search) {
                whereConditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`);
                queryParams.push(`%${params.search}%`);
                paramIndex++;
            }
            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
            // Get total count
            const countQuery = `SELECT COUNT(*) FROM customers ${whereClause}`;
            const countResult = await client.query(countQuery, queryParams);
            const total = parseInt(countResult.rows[0].count);
            // Get paginated results
            const dataQuery = `
        SELECT * FROM customers 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
            queryParams.push(limit, offset);
            const dataResult = await client.query(dataQuery, queryParams);
            const customers = dataResult.rows.map(row => this.mapRowToCustomer(row));
            return { customers, total, page, limit };
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Vytvorí nového zákazníka - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
     */
    async createCustomer(customerData) {
        return this.executeTransaction(async (client) => {
            logger_1.logger.migration('📝 Creating customer with data:', customerData);
            // Rozdelenie mena na first_name a last_name - presne ako v pôvodnej databáze
            const nameParts = customerData.name.trim().split(/\s+/);
            const firstName = nameParts[0] || customerData.name.trim();
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
            logger_1.logger.migration('📝 Name parsing:', {
                originalName: customerData.name,
                firstName,
                lastName
            });
            const result = await client.query('INSERT INTO customers (first_name, last_name, name, email, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, name, email, phone, created_at', [firstName, lastName, customerData.name, customerData.email, customerData.phone]);
            const row = result.rows[0];
            logger_1.logger.migration('✅ Customer created with ID:', row.id);
            // Invalidate cache
            this.invalidateCustomerCache();
            return this.mapRowToCustomer(row);
        });
    }
    /**
     * Aktualizuje zákazníka
     */
    async updateCustomer(customer) {
        const client = await this.getClient();
        try {
            // Parse name into first_name and last_name - presne ako v pôvodnej databáze
            const nameParts = customer.name.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            await client.query('UPDATE customers SET name = $1, first_name = $2, last_name = $3, email = $4, phone = $5 WHERE id = $6', [customer.name, firstName, lastName, customer.email, customer.phone, customer.id]);
            // Invalidate cache
            this.invalidateCustomerCache();
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Zmaže zákazníka
     */
    async deleteCustomer(id) {
        return this.executeTransaction(async (client) => {
            // Delete the customer - presne ako v pôvodnej databáze
            await client.query('DELETE FROM customers WHERE id = $1', [id]); // Removed parseInt for UUID
            // Invalidate cache
            this.invalidateCustomerCache();
        });
    }
    /**
     * Mapuje databázový riadok na Customer objekt
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapRowToCustomer(row) {
        return {
            id: row.id.toString(),
            name: row.name || `${row.first_name} ${row.last_name}`.trim(),
            firstName: row.first_name || undefined,
            lastName: row.last_name || undefined,
            email: row.email,
            phone: row.phone,
            createdAt: new Date(row.created_at)
        };
    }
    /**
     * Invaliduje customer cache
     */
    invalidateCustomerCache() {
        this.customerCache.clear();
        logger_1.logger.debug('🗑️ Customer cache invalidated');
    }
}
exports.CustomerRepository = CustomerRepository;
//# sourceMappingURL=CustomerRepository.js.map