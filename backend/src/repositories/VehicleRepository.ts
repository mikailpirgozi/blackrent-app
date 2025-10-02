/**
 * Vehicle Repository
 * Spravuje všetky databázové operácie pre vozidlá
 * Extrahované z postgres-database.ts - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
 */

import type { Pool } from 'pg';

import type { Commission, Vehicle, VehiclePricing } from '../types';

import { BaseRepository } from '../models/base/BaseRepository';
import { logger } from '../utils/logger';
import { r2Storage } from '../utils/r2-storage';

export class VehicleRepository extends BaseRepository {
  // 🚀 FÁZA 2.3: SMART CACHING LAYER - vehicle cache system
  private vehicleCache = new Map<string, {
    data: Vehicle[];
    timestamp: number;
    includeRemoved: boolean;
    includePrivate: boolean;
  }>();
  private readonly VEHICLE_CACHE_TTL = 1 * 60 * 1000; // 1 minúta

  constructor(pool: Pool) {
    super(pool);
  }

  /**
   * Získa všetky vozidlá s cache systémom
   */
  async getVehicles(includeRemoved: boolean = false, includePrivate: boolean = false): Promise<Vehicle[]> {
    const cacheKey = `vehicles_${includeRemoved}_${includePrivate}`;
    const cached = this.vehicleCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.VEHICLE_CACHE_TTL) {
      logger.migration('🎯 VEHICLE CACHE HIT - returning cached vehicles');
      return cached.data;
    }

    logger.migration('🔄 VEHICLE CACHE MISS - loading fresh vehicles from DB');
    const vehicles = await this.getVehiclesFresh(includeRemoved, includePrivate);
    
    // Cache the result
    this.vehicleCache.set(cacheKey, {
      data: vehicles,
      timestamp: Date.now(),
      includeRemoved,
      includePrivate
    });

    return vehicles;
  }

  /**
   * Načíta vozidlá priamo z databázy (bez cache)
   */
  private async getVehiclesFresh(includeRemoved: boolean = false, includePrivate: boolean = false): Promise<Vehicle[]> {
    const client = await this.getClient();
    try {
      let query = `
        SELECT v.*, c.name as company_name
        FROM vehicles v 
        LEFT JOIN companies c ON v.company_id = c.id
        WHERE 1=1
      `;
      const params: (string | number | boolean)[] = [];

      if (!includeRemoved) {
        query += ` AND v.status != 'removed' AND v.status != 'temp_removed'`;
      }

      if (!includePrivate) {
        query += ` AND v.status != 'private'`;
      }

      query += ` ORDER BY v.brand, v.model`;

      const result = await client.query(query, params);
      
      return result.rows.map(row => ({
        id: row.id?.toString() || '',
        brand: row.brand,
        model: row.model,
        year: row.year,
        licensePlate: row.license_plate,
        vin: row.vin || null,
        company: row.company_name || row.company || 'N/A',
        category: row.category || null,
        ownerCompanyId: row.company_id?.toString(),
        pricing: typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing,
        commission: typeof row.commission === 'string' ? JSON.parse(row.commission) : row.commission,
        status: row.status,
        stk: row.stk ? new Date(row.stk) : undefined,
        createdAt: new Date(row.created_at)
      }));
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Získa jedno vozidlo podľa ID
   */
  async getVehicle(id: string): Promise<Vehicle | null> {
    const client = await this.getClient();
    try {
      const result = await client.query(`
        SELECT v.*, c.name as company_name
        FROM vehicles v 
        LEFT JOIN companies c ON v.company_id = c.id
        WHERE v.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id.toString(),
        brand: row.brand,
        model: row.model,
        year: row.year,
        licensePlate: row.license_plate,
        vin: row.vin || null,
        company: row.company_name || row.company || 'N/A',
        category: row.category || null,
        ownerCompanyId: row.company_id?.toString(),
        pricing: typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing,
        commission: typeof row.commission === 'string' ? JSON.parse(row.commission) : row.commission,
        status: row.status,
        stk: row.stk ? new Date(row.stk) : undefined,
        createdAt: new Date(row.created_at)
      };
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Vytvorí nové vozidlo - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
   */
  async createVehicle(vehicleData: {
    brand: string;
    model: string;
    licensePlate: string;
    vin?: string;
    company: string;
    pricing: VehiclePricing[];
    commission: Commission;
    status: string;
    year?: number;
  }): Promise<Vehicle> {
    return this.executeTransaction(async (client) => {
      // Kontrola duplicít - presne ako v pôvodnej databáze
      if (vehicleData.licensePlate && vehicleData.licensePlate.trim()) {
        const existingVehicle = await client.query(
          'SELECT id, brand, model FROM vehicles WHERE LOWER(license_plate) = LOWER($1)',
          [vehicleData.licensePlate.trim()]
        );
        
        if (existingVehicle.rows.length > 0) {
          const existing = existingVehicle.rows[0];
          logger.migration(`⚠️ Vozidlo s ŠPZ ${vehicleData.licensePlate} už existuje: ${existing.brand} ${existing.model}`);
          throw new Error(`Vozidlo s ŠPZ ${vehicleData.licensePlate} už existuje v databáze`);
        }
      }

      const result = await client.query(`
        INSERT INTO vehicles (
          brand, model, license_plate, vin, company, pricing, commission, status, year
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *
      `, [
        vehicleData.brand,
        vehicleData.model,
        vehicleData.licensePlate,
        vehicleData.vin,
        vehicleData.company,
        JSON.stringify(vehicleData.pricing),
        JSON.stringify(vehicleData.commission),
        vehicleData.status,
        vehicleData.year
      ]);

      // Invalidate cache
      this.invalidateVehicleCache();

      const row = result.rows[0];
      return {
        id: row.id.toString(),
        brand: row.brand,
        model: row.model,
        year: row.year,
        licensePlate: row.license_plate,
        vin: row.vin,
        company: row.company,
        ownerCompanyId: row.company_id?.toString(),
        pricing: typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing,
        commission: typeof row.commission === 'string' ? JSON.parse(row.commission) : row.commission,
        status: row.status,
        createdAt: new Date(row.created_at)
      };
    });
  }

  /**
   * Aktualizuje vozidlo - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
   */
  async updateVehicle(vehicle: Vehicle): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query(`
        UPDATE vehicles SET 
          brand = $1, model = $2, year = $3, license_plate = $4, vin = $5,
          company = $6, pricing = $7, commission = $8, status = $9
        WHERE id = $10
      `, [
        vehicle.brand,
        vehicle.model, 
        vehicle.year,
        vehicle.licensePlate,
        vehicle.vin,
        vehicle.company,
        JSON.stringify(vehicle.pricing),
        JSON.stringify(vehicle.commission),
        vehicle.status,
        vehicle.id
      ]);

      // Invalidate cache
      this.invalidateVehicleCache();
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Zmaže vozidlo
   */
  async deleteVehicle(id: string): Promise<void> {
    return this.executeTransaction(async (client) => {
      // Check for active rentals
      const rentalCheck = await client.query(
        'SELECT COUNT(*) FROM rentals WHERE vehicle_id = $1 AND status IN ($2, $3)',
        [id, 'active', 'confirmed']
      );

      if (parseInt(rentalCheck.rows[0].count) > 0) {
        throw new Error('Nemožno zmazať vozidlo s aktívnymi prenájmami');
      }

      // Delete vehicle documents from R2 storage
      const documents = await client.query('SELECT * FROM vehicle_documents WHERE vehicle_id = $1', [id]);
      for (const doc of documents.rows) {
        if (doc.file_path) {
          try {
            await r2Storage.deleteFile(doc.file_path);
          } catch (error) {
            logger.warn(`Failed to delete file from R2: ${doc.file_path}`, error);
          }
        }
      }

      // Delete related records
      await client.query('DELETE FROM vehicle_documents WHERE vehicle_id = $1', [id]);
      await client.query('DELETE FROM vehicle_unavailabilities WHERE vehicle_id = $1', [id]);
      await client.query('DELETE FROM vehicles WHERE id = $1', [id]);

      // Invalidate cache
      this.invalidateVehicleCache();
    });
  }

  /**
   * Získa vozidlá s pagináciou
   */
  async getVehiclesPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    company?: string;
    category?: string;
  }): Promise<{ vehicles: Vehicle[]; total: number; page: number; limit: number }> {
    const client = await this.getClient();
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const offset = (page - 1) * limit;

      const whereConditions: string[] = [];
      const queryParams: (string | number | boolean)[] = [];
      let paramIndex = 1;

      // Search filter
      if (params.search) {
        whereConditions.push(`(v.brand ILIKE $${paramIndex} OR v.model ILIKE $${paramIndex} OR v.license_plate ILIKE $${paramIndex})`);
        queryParams.push(`%${params.search}%`);
        paramIndex++;
      }

      // Status filter
      if (params.status) {
        whereConditions.push(`v.status = $${paramIndex}`);
        queryParams.push(params.status);
        paramIndex++;
      }

      // Company filter
      if (params.company) {
        whereConditions.push(`v.company_id = $${paramIndex}`);
        queryParams.push(params.company);
        paramIndex++;
      }

      // Category filter
      if (params.category) {
        whereConditions.push(`v.category = $${paramIndex}`);
        queryParams.push(params.category);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) 
        FROM vehicles v 
        LEFT JOIN companies c ON v.company_id = c.id
        ${whereClause}
      `;
      const countResult = await client.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      const dataQuery = `
        SELECT v.*, c.name as company_name
        FROM vehicles v 
        LEFT JOIN companies c ON v.company_id = c.id
        ${whereClause}
        ORDER BY v.brand, v.model
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      queryParams.push(limit, offset);
      
      const dataResult = await client.query(dataQuery, queryParams);
      
      const vehicles = dataResult.rows.map(row => ({
        id: row.id,
        brand: row.brand,
        model: row.model,
        licensePlate: row.license_plate,
        vin: row.vin,
        company: row.company_name || row.company || 'N/A',
        category: row.category,
        pricing: row.pricing ? (typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing) : [],
        commission: row.commission ? (typeof row.commission === 'string' ? JSON.parse(row.commission) : row.commission) : { type: 'percentage', value: 0 },
        status: row.status || 'available',
        year: row.year,
        stk: row.stk,
        ownerCompanyId: row.company_id,
      }));

      return { vehicles, total, page, limit };
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Invaliduje vehicle cache
   */
  private invalidateVehicleCache(): void {
    this.vehicleCache.clear();
    logger.debug('🗑️ Vehicle cache invalidated');
  }

  // Ďalšie vehicle-related metódy budú pridané postupne...
  // getVehicleUnavailabilities, createVehicleUnavailability, etc.
}
