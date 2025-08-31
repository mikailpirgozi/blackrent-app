/**
 * Settlement Repository
 * Spravuje všetky databázové operácie pre vyúčtovania
 * Extrahované z postgres-database.ts - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
 */

import type { Pool} from 'pg';
import { PoolClient } from 'pg';
import type { Settlement } from '../types';
import { BaseRepository } from '../models/base/BaseRepository';
import { logger } from '../utils/logger';

export class SettlementRepository extends BaseRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  // ============================================================================
  // SETTLEMENT METHODS
  // ============================================================================

  /**
   * Získa všetky vyúčtovania
   */
  async getSettlements(): Promise<Settlement[]> {
    const client = await this.getClient();
    try {
      const result = await client.query(`
        SELECT 
          s.*,
          c.name as company_name
        FROM settlements s
        LEFT JOIN companies c ON s.company_id = c.id
        ORDER BY s.period_start DESC, s.created_at DESC
      `);

      return result.rows.map(row => this.mapRowToSettlement(row));
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Získa vyúčtovanie podľa ID
   */
  async getSettlement(id: string): Promise<Settlement | null> {
    const client = await this.getClient();
    try {
      const result = await client.query(`
        SELECT 
          s.*,
          c.name as company_name
        FROM settlements s
        LEFT JOIN companies c ON s.company_id = c.id
        WHERE s.id = $1
      `, [id]);

      return result.rows.length > 0 ? this.mapRowToSettlement(result.rows[0]) : null;
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Vytvorí nové vyúčtovanie
   */
  async createSettlement(settlementData: {
    companyId: string;
    periodStart: Date;
    periodEnd: Date;
    totalRevenue: number;
    totalExpenses: number;
    commission: number;
    netAmount: number;
    status?: string;
    notes?: string;
    details?: any;
  }): Promise<Settlement> {
    return this.executeTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO settlements (
          company_id, period_start, period_end, total_revenue,
          total_expenses, commission, net_amount, status, notes, details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          settlementData.companyId,
          settlementData.periodStart,
          settlementData.periodEnd,
          settlementData.totalRevenue,
          settlementData.totalExpenses,
          settlementData.commission,
          settlementData.netAmount,
          settlementData.status || 'draft',
          settlementData.notes || null,
          settlementData.details ? JSON.stringify(settlementData.details) : null
        ]
      );

      return this.mapRowToSettlement(result.rows[0]);
    });
  }

  /**
   * Aktualizuje vyúčtovanie
   */
  async updateSettlement(id: string, settlementData: {
    periodStart?: Date;
    periodEnd?: Date;
    totalRevenue?: number;
    totalExpenses?: number;
    commission?: number;
    netAmount?: number;
    status?: string;
    notes?: string;
    details?: any;
  }): Promise<void> {
    const client = await this.getClient();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Dynamicky stavaj UPDATE query
      Object.entries(settlementData).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbField = this.camelToSnake(key);
          if (key === 'details' && value) {
            fields.push(`${dbField} = $${paramIndex}`);
            values.push(JSON.stringify(value));
          } else {
            fields.push(`${dbField} = $${paramIndex}`);
            values.push(value);
          }
          paramIndex++;
        }
      });

      if (fields.length === 0) return;

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const query = `UPDATE settlements SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
      await client.query(query, values);
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Zmaže vyúčtovanie
   */
  async deleteSettlement(id: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query('DELETE FROM settlements WHERE id = $1', [id]);
    } finally {
      this.releaseClient(client);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Mapuje databázový riadok na Settlement objekt
   */
  private mapRowToSettlement(row: any): Settlement {
    return {
      id: row.id,
      period: {
        from: new Date(row.period_start),
        to: new Date(row.period_end)
      },
      rentals: [],
      expenses: [],
      totalIncome: row.total_revenue || 0,
      totalExpenses: row.total_expenses || 0,
      totalCommission: row.commission || 0,
      profit: row.net_amount || 0,
      company: row.company || undefined,
      vehicleId: row.vehicle_id || undefined
    };
  }

  /**
   * Konvertuje camelCase na snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}
