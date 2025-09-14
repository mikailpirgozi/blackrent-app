"use strict";
/**
 * Rental Repository
 * Spravuje všetky databázové operácie pre prenájmy
 * Extrahované z postgres-database.ts - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentalRepository = void 0;
const BaseRepository_1 = require("../models/base/BaseRepository");
const logger_1 = require("../utils/logger");
class RentalRepository extends BaseRepository_1.BaseRepository {
    constructor(pool) {
        super(pool);
        // 🚀 FÁZA 2.3: SMART CACHING LAYER - rental cache system
        this.rentalCache = new Map();
        this.RENTAL_CACHE_TTL = 2 * 60 * 1000; // 2 minúty
    }
    /**
     * Získa všetky prenájmy
     */
    async getRentals() {
        const cacheKey = 'all_rentals';
        const cached = this.rentalCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.RENTAL_CACHE_TTL) {
            logger_1.logger.migration('🎯 RENTAL CACHE HIT - returning cached rentals');
            return cached.data;
        }
        logger_1.logger.migration('🔄 RENTAL CACHE MISS - loading fresh rentals from DB');
        const rentals = await this.getRentalsFresh();
        // Cache the result
        this.rentalCache.set(cacheKey, {
            data: rentals,
            timestamp: Date.now()
        });
        return rentals;
    }
    /**
     * Načíta prenájmy priamo z databázy (bez cache)
     */
    async getRentalsFresh() {
        const client = await this.getClient();
        try {
            const result = await client.query(`
        SELECT r.*, 
               c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
               c.created_at as customer_created_at,
               v.brand, v.model, v.license_plate, v.vin, v.company as vehicle_company,
               v.pricing, v.commission as v_commission, v.status as v_status,
               companies.name as company_name,
               COALESCE(companies.name, v.company, 'BlackRent') as billing_company_name
        FROM rentals r 
        LEFT JOIN customers c ON r.customer_id = c.id 
        LEFT JOIN vehicles v ON r.vehicle_id = v.id
        LEFT JOIN companies ON v.company_id = companies.id
        ORDER BY r.start_date DESC
      `);
            return result.rows.map(row => this.mapRowToRental(row));
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Získa prenájmy pre dátumový rozsah
     */
    async getRentalsForDateRange(startDate, endDate) {
        const client = await this.getClient();
        try {
            const result = await client.query(`
        SELECT r.*, 
               c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
               c.created_at as customer_created_at,
               v.brand, v.model, v.license_plate, v.vin, v.company as vehicle_company,
               v.pricing, v.commission as v_commission, v.status as v_status,
               companies.name as company_name,
               COALESCE(companies.name, v.company, 'BlackRent') as billing_company_name
        FROM rentals r 
        LEFT JOIN customers c ON r.customer_id = c.id 
        LEFT JOIN vehicles v ON r.vehicle_id = v.id
        LEFT JOIN companies ON v.company_id = companies.id
        WHERE r.start_date <= $2 AND r.end_date >= $1
        ORDER BY r.start_date DESC
      `, [startDate, endDate]);
            return result.rows.map(row => this.mapRowToRental(row));
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Získa prenájmy s pagináciou
     */
    async getRentalsPaginated(params) {
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
                whereConditions.push(`(c.name ILIKE $${paramIndex} OR v.brand ILIKE $${paramIndex} OR v.model ILIKE $${paramIndex} OR r.order_number ILIKE $${paramIndex})`);
                queryParams.push(`%${params.search}%`);
                paramIndex++;
            }
            // Status filter
            if (params.status) {
                whereConditions.push(`r.status = $${paramIndex}`);
                queryParams.push(params.status);
                paramIndex++;
            }
            // Date range filter
            if (params.startDate) {
                whereConditions.push(`r.start_date >= $${paramIndex}`);
                queryParams.push(params.startDate);
                paramIndex++;
            }
            if (params.endDate) {
                whereConditions.push(`r.end_date <= $${paramIndex}`);
                queryParams.push(params.endDate);
                paramIndex++;
            }
            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
            // Get total count
            const countQuery = `
        SELECT COUNT(*) 
        FROM rentals r 
        LEFT JOIN customers c ON r.customer_id = c.id 
        LEFT JOIN vehicles v ON r.vehicle_id = v.id
        ${whereClause}
      `;
            const countResult = await client.query(countQuery, queryParams);
            const total = parseInt(countResult.rows[0].count);
            // Get paginated results
            const dataQuery = `
        SELECT r.*, 
               c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
               c.created_at as customer_created_at,
               v.brand, v.model, v.license_plate, v.vin, v.company as vehicle_company,
               v.pricing, v.commission as v_commission, v.status as v_status,
               companies.name as company_name,
               COALESCE(companies.name, v.company, 'BlackRent') as billing_company_name
        FROM rentals r 
        LEFT JOIN customers c ON r.customer_id = c.id 
        LEFT JOIN vehicles v ON r.vehicle_id = v.id
        LEFT JOIN companies ON v.company_id = companies.id
        ${whereClause}
        ORDER BY r.start_date DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
            queryParams.push(limit, offset);
            const dataResult = await client.query(dataQuery, queryParams);
            const rentals = dataResult.rows.map(row => this.mapRowToRental(row));
            return { rentals, total, page, limit };
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Získa jeden prenájom podľa ID
     */
    async getRental(id) {
        const client = await this.getClient();
        try {
            logger_1.logger.migration('🔍 getRental called for ID:', id);
            const result = await client.query(`
        SELECT r.*, v.brand, v.model, v.license_plate, v.vin, v.company as vehicle_company,
               COALESCE(c.name, v.company, 'BlackRent') as billing_company_name
        FROM rentals r 
        LEFT JOIN vehicles v ON r.vehicle_id = v.id 
        LEFT JOIN companies c ON v.company_id = c.id
        WHERE r.id = $1
      `, [parseInt(id)]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapRowToRental(result.rows[0]);
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Vytvorí nový prenájom - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
     */
    async createRental(rentalData) {
        return this.executeTransaction(async (client) => {
            const result = await client.query(`
        INSERT INTO rentals (
          vehicle_id, customer_id, customer_name, start_date, end_date, total_price,
          commission, payment_method, discount, custom_commission, extra_km_charge,
          paid, status, handover_place, confirmed, payments, history, order_number,
          deposit, allowed_kilometers, daily_kilometers, extra_kilometer_rate,
          return_conditions, fuel_level, odometer, return_fuel_level, return_odometer,
          actual_kilometers, fuel_refill_cost, handover_protocol_id, return_protocol_id,
          is_flexible, flexible_end_date, source_type, approval_status, email_content,
          auto_processed_at, approved_by, approved_at, rejection_reason
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34,
          $35, $36, $37, $38, $39, $40
        ) RETURNING *
      `, [
                rentalData.vehicleId ? parseInt(rentalData.vehicleId) : null,
                rentalData.customerId ? parseInt(rentalData.customerId) : null,
                rentalData.customerName,
                rentalData.startDate,
                rentalData.endDate,
                rentalData.totalPrice,
                rentalData.commission,
                rentalData.paymentMethod,
                rentalData.discount ? JSON.stringify(rentalData.discount) : null,
                rentalData.customCommission ? JSON.stringify(rentalData.customCommission) : null,
                rentalData.extraKmCharge || 0,
                rentalData.paid || false,
                rentalData.status || 'confirmed',
                rentalData.handoverPlace || null,
                rentalData.confirmed !== undefined ? rentalData.confirmed : true,
                rentalData.payments ? JSON.stringify(rentalData.payments) : null,
                rentalData.history ? JSON.stringify(rentalData.history) : null,
                rentalData.orderNumber || null,
                rentalData.deposit || null,
                rentalData.allowedKilometers || null,
                rentalData.dailyKilometers || null,
                rentalData.extraKilometerRate || null,
                rentalData.returnConditions || null,
                rentalData.fuelLevel || null,
                rentalData.odometer || null,
                rentalData.returnFuelLevel || null,
                rentalData.returnOdometer || null,
                rentalData.actualKilometers || null,
                rentalData.fuelRefillCost || null,
                rentalData.handoverProtocolId || null,
                rentalData.returnProtocolId || null,
                rentalData.isFlexible || false,
                rentalData.flexibleEndDate || null,
                rentalData.sourceType || 'manual',
                rentalData.approvalStatus || 'approved',
                rentalData.emailContent || null,
                rentalData.autoProcessedAt || null,
                rentalData.approvedBy || null,
                rentalData.approvedAt || null,
                rentalData.rejectionReason || null
            ]);
            // Invalidate cache
            this.invalidateRentalCache();
            return this.mapRowToRental(result.rows[0]);
        });
    }
    /**
     * Aktualizuje prenájom
     */
    async updateRental(rental) {
        const client = await this.getClient();
        try {
            await client.query(`
        UPDATE rentals SET 
          vehicle_id = $1, customer_id = $2, customer_name = $3, start_date = $4,
          end_date = $5, total_price = $6, commission = $7, payment_method = $8,
          discount = $9, custom_commission = $10, extra_km_charge = $11, paid = $12,
          status = $13, handover_place = $14, confirmed = $15, payments = $16,
          history = $17, order_number = $18, deposit = $19, allowed_kilometers = $20,
          daily_kilometers = $21, extra_kilometer_rate = $22, return_conditions = $23,
          fuel_level = $24, odometer = $25, return_fuel_level = $26, return_odometer = $27,
          actual_kilometers = $28, fuel_refill_cost = $29, handover_protocol_id = $30,
          return_protocol_id = $31, is_flexible = $32, flexible_end_date = $33
        WHERE id = $34
      `, [
                rental.vehicleId ? parseInt(rental.vehicleId) : null,
                rental.customerId ? parseInt(rental.customerId) : null,
                rental.customerName,
                rental.startDate,
                rental.endDate,
                rental.totalPrice,
                rental.commission,
                rental.paymentMethod,
                rental.discount ? JSON.stringify(rental.discount) : null,
                rental.customCommission ? JSON.stringify(rental.customCommission) : null,
                rental.extraKmCharge || 0,
                rental.paid || false,
                rental.status,
                rental.handoverPlace || null,
                rental.confirmed !== undefined ? rental.confirmed : true,
                rental.payments ? JSON.stringify(rental.payments) : null,
                rental.history ? JSON.stringify(rental.history) : null,
                rental.orderNumber || null,
                rental.deposit || null,
                rental.allowedKilometers || null,
                rental.dailyKilometers || null,
                rental.extraKilometerRate || null,
                rental.returnConditions || null,
                rental.fuelLevel || null,
                rental.odometer || null,
                rental.returnFuelLevel || null,
                rental.returnOdometer || null,
                rental.actualKilometers || null,
                rental.fuelRefillCost || null,
                rental.handoverProtocolId || null,
                rental.returnProtocolId || null,
                rental.isFlexible || false,
                rental.flexibleEndDate || null,
                parseInt(rental.id)
            ]);
            // Invalidate cache
            this.invalidateRentalCache();
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Zmaže prenájom
     */
    async deleteRental(id) {
        return this.executeTransaction(async (client) => {
            // Delete related protocols first
            await client.query('DELETE FROM handover_protocols WHERE rental_id = $1', [id]);
            await client.query('DELETE FROM return_protocols WHERE rental_id = $1', [id]);
            // Delete the rental
            await client.query('DELETE FROM rentals WHERE id = $1', [parseInt(id)]);
            // Invalidate cache
            this.invalidateRentalCache();
        });
    }
    /**
     * Mapuje databázový riadok na Rental objekt
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapRowToRental(row) {
        return {
            id: row.id.toString(),
            vehicleId: row.vehicle_id?.toString(),
            customerId: row.customer_id?.toString(),
            customerName: row.customer_name,
            startDate: new Date(row.start_date),
            endDate: new Date(row.end_date),
            totalPrice: parseFloat(row.total_price),
            commission: parseFloat(row.commission),
            paymentMethod: row.payment_method,
            discount: row.discount ? (typeof row.discount === 'string' ? JSON.parse(row.discount) : row.discount) : undefined,
            customCommission: row.custom_commission ? (typeof row.custom_commission === 'string' ? JSON.parse(row.custom_commission) : row.custom_commission) : undefined,
            extraKmCharge: row.extra_km_charge ? parseFloat(row.extra_km_charge) : undefined,
            paid: Boolean(row.paid),
            status: row.status,
            handoverPlace: row.handover_place || undefined,
            confirmed: Boolean(row.confirmed),
            payments: row.payments ? (typeof row.payments === 'string' ? JSON.parse(row.payments) : row.payments) : undefined,
            history: row.history ? (typeof row.history === 'string' ? JSON.parse(row.history) : row.history) : undefined,
            orderNumber: row.order_number || undefined,
            deposit: row.deposit ? parseFloat(row.deposit) : undefined,
            allowedKilometers: row.allowed_kilometers || undefined,
            dailyKilometers: row.daily_kilometers || undefined,
            extraKilometerRate: row.extra_kilometer_rate ? parseFloat(row.extra_kilometer_rate) : undefined,
            returnConditions: row.return_conditions || undefined,
            fuelLevel: row.fuel_level || undefined,
            odometer: row.odometer || undefined,
            returnFuelLevel: row.return_fuel_level || undefined,
            returnOdometer: row.return_odometer || undefined,
            actualKilometers: row.actual_kilometers || undefined,
            fuelRefillCost: row.fuel_refill_cost ? parseFloat(row.fuel_refill_cost) : undefined,
            handoverProtocolId: row.handover_protocol_id || undefined,
            returnProtocolId: row.return_protocol_id || undefined,
            company: row.company || undefined,
            vehicleName: row.vehicle_name || undefined,
            createdAt: new Date(row.created_at),
            isFlexible: Boolean(row.is_flexible),
            flexibleEndDate: row.flexible_end_date ? new Date(row.flexible_end_date) : undefined,
            approvalStatus: row.approval_status || 'approved',
            emailContent: row.email_content || undefined,
            autoProcessedAt: row.auto_processed_at ? new Date(row.auto_processed_at) : undefined,
            // Customer information from JOIN
            customer: row.customer_name ? {
                id: row.customer_id?.toString() || '',
                name: row.customer_name,
                email: row.customer_email || '',
                phone: row.customer_phone || '',
                createdAt: row.customer_created_at ? new Date(row.customer_created_at) : new Date()
            } : undefined,
            // Vehicle information from JOIN
            vehicle: row.brand ? {
                id: row.vehicle_id?.toString() || '',
                brand: row.brand,
                model: row.model,
                licensePlate: row.license_plate,
                vin: row.vin || null,
                company: row.vehicle_company || row.company_name || 'N/A',
                pricing: row.pricing ? (typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing) : [],
                commission: row.v_commission ? (typeof row.v_commission === 'string' ? JSON.parse(row.v_commission) : row.v_commission) : { type: 'percentage', value: 0 },
                status: row.v_status || 'available',
                ownerCompanyId: row.company_id || undefined
            } : undefined
        };
    }
    /**
     * Invaliduje rental cache
     */
    invalidateRentalCache() {
        this.rentalCache.clear();
        logger_1.logger.debug('🗑️ Rental cache invalidated');
    }
}
exports.RentalRepository = RentalRepository;
//# sourceMappingURL=RentalRepository.js.map