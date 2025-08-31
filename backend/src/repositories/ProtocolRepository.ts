/**
 * Protocol Repository
 * Spravuje všetky databázové operácie pre protokoly (handover a return)
 * Extrahované z postgres-database.ts - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
 */

import type { Pool} from 'pg';
import { PoolClient } from 'pg';
import type { HandoverProtocol, ReturnProtocol } from '../types';
import { BaseRepository } from '../models/base/BaseRepository';
import { logger } from '../utils/logger';

export class ProtocolRepository extends BaseRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  // ============================================================================
  // HANDOVER PROTOCOL METHODS
  // ============================================================================

  /**
   * Získa handover protokoly pre prenájom
   */
  async getHandoverProtocolsByRental(rentalId: string): Promise<HandoverProtocol[]> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        'SELECT * FROM handover_protocols WHERE rental_id = $1 ORDER BY created_at DESC',
        [rentalId]
      );
      return result.rows.map(row => this.mapRowToHandoverProtocol(row));
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Získa handover protokol podľa ID
   */
  async getHandoverProtocolById(id: string): Promise<HandoverProtocol | null> {
    const client = await this.getClient();
    try {
      const result = await client.query('SELECT * FROM handover_protocols WHERE id = $1', [id]);
      return result.rows.length > 0 ? this.mapRowToHandoverProtocol(result.rows[0]) : null;
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Vytvorí handover protokol
   */
  async createHandoverProtocol(protocolData: {
    rentalId: string;
    vehicleCondition: any;
    fuelLevel: number;
    mileage: number;
    photos?: string[];
    notes?: string;
    signature?: string;
    createdBy?: string;
  }): Promise<HandoverProtocol> {
    return this.executeTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO handover_protocols (
          rental_id, vehicle_condition, fuel_level, mileage,
          photos, notes, signature, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          protocolData.rentalId,
          JSON.stringify(protocolData.vehicleCondition),
          protocolData.fuelLevel,
          protocolData.mileage,
          protocolData.photos ? JSON.stringify(protocolData.photos) : null,
          protocolData.notes || null,
          protocolData.signature || null,
          protocolData.createdBy || null
        ]
      );

      return this.mapRowToHandoverProtocol(result.rows[0]);
    });
  }

  /**
   * Aktualizuje handover protokol
   */
  async updateHandoverProtocol(id: string, protocolData: {
    vehicleCondition: any;
    fuelLevel: number;
    mileage: number;
    photos?: string[];
    notes?: string;
    signature?: string;
  }): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query(
        `UPDATE handover_protocols SET 
          vehicle_condition = $1, fuel_level = $2, mileage = $3,
          photos = $4, notes = $5, signature = $6, updated_at = CURRENT_TIMESTAMP
        WHERE id = $7`,
        [
          JSON.stringify(protocolData.vehicleCondition),
          protocolData.fuelLevel,
          protocolData.mileage,
          protocolData.photos ? JSON.stringify(protocolData.photos) : null,
          protocolData.notes || null,
          protocolData.signature || null,
          id
        ]
      );
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Zmaže handover protokol
   */
  async deleteHandoverProtocol(id: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query('DELETE FROM handover_protocols WHERE id = $1', [id]);
    } finally {
      this.releaseClient(client);
    }
  }

  // ============================================================================
  // RETURN PROTOCOL METHODS
  // ============================================================================

  /**
   * Získa return protokoly pre prenájom
   */
  async getReturnProtocolsByRental(rentalId: string): Promise<ReturnProtocol[]> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        'SELECT * FROM return_protocols WHERE rental_id = $1 ORDER BY created_at DESC',
        [rentalId]
      );
      return result.rows.map(row => this.mapRowToReturnProtocol(row));
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Získa return protokol podľa ID
   */
  async getReturnProtocolById(id: string): Promise<ReturnProtocol | null> {
    const client = await this.getClient();
    try {
      const result = await client.query('SELECT * FROM return_protocols WHERE id = $1', [id]);
      return result.rows.length > 0 ? this.mapRowToReturnProtocol(result.rows[0]) : null;
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Vytvorí return protokol
   */
  async createReturnProtocol(protocolData: {
    rentalId: string;
    vehicleCondition: any;
    fuelLevel: number;
    mileage: number;
    damages?: any[];
    photos?: string[];
    notes?: string;
    signature?: string;
    createdBy?: string;
  }): Promise<ReturnProtocol> {
    return this.executeTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO return_protocols (
          rental_id, vehicle_condition, fuel_level, mileage,
          damages, photos, notes, signature, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          protocolData.rentalId,
          JSON.stringify(protocolData.vehicleCondition),
          protocolData.fuelLevel,
          protocolData.mileage,
          protocolData.damages ? JSON.stringify(protocolData.damages) : null,
          protocolData.photos ? JSON.stringify(protocolData.photos) : null,
          protocolData.notes || null,
          protocolData.signature || null,
          protocolData.createdBy || null
        ]
      );

      return this.mapRowToReturnProtocol(result.rows[0]);
    });
  }

  /**
   * Aktualizuje return protokol
   */
  async updateReturnProtocol(id: string, protocolData: {
    vehicleCondition: any;
    fuelLevel: number;
    mileage: number;
    damages?: any[];
    photos?: string[];
    notes?: string;
    signature?: string;
  }): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query(
        `UPDATE return_protocols SET 
          vehicle_condition = $1, fuel_level = $2, mileage = $3,
          damages = $4, photos = $5, notes = $6, signature = $7,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8`,
        [
          JSON.stringify(protocolData.vehicleCondition),
          protocolData.fuelLevel,
          protocolData.mileage,
          protocolData.damages ? JSON.stringify(protocolData.damages) : null,
          protocolData.photos ? JSON.stringify(protocolData.photos) : null,
          protocolData.notes || null,
          protocolData.signature || null,
          id
        ]
      );
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Zmaže return protokol
   */
  async deleteReturnProtocol(id: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query('DELETE FROM return_protocols WHERE id = $1', [id]);
    } finally {
      this.releaseClient(client);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Získa všetky protokoly pre štatistiky
   */
  async getAllProtocolsForStats(): Promise<any[]> {
    const client = await this.getClient();
    try {
      const handoverResult = await client.query(`
        SELECT 'handover' as type, rental_id, created_at FROM handover_protocols
      `);
      
      const returnResult = await client.query(`
        SELECT 'return' as type, rental_id, created_at FROM return_protocols
      `);

      return [...handoverResult.rows, ...returnResult.rows].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Získa bulk protocol status
   */
  async getBulkProtocolStatus(rentalIds: string[]): Promise<any[]> {
    const client = await this.getClient();
    try {
      const result = await client.query(`
        SELECT 
          r.id as rental_id,
          CASE WHEN hp.id IS NOT NULL THEN true ELSE false END as has_handover,
          CASE WHEN rp.id IS NOT NULL THEN true ELSE false END as has_return
        FROM (SELECT unnest($1::text[]) as id) r
        LEFT JOIN handover_protocols hp ON r.id = hp.rental_id
        LEFT JOIN return_protocols rp ON r.id = rp.rental_id
      `, [rentalIds]);

      return result.rows;
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Nahrá protocol súbor
   */
  async uploadProtocolFile(protocolId: string, protocolType: 'handover' | 'return', filePath: string): Promise<void> {
    const client = await this.getClient();
    try {
      const table = protocolType === 'handover' ? 'handover_protocols' : 'return_protocols';
      await client.query(
        `UPDATE ${table} SET file_path = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [filePath, protocolId]
      );
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Nahrá protocol PDF
   */
  async uploadProtocolPDF(protocolId: string, protocolType: 'handover' | 'return', pdfPath: string): Promise<void> {
    const client = await this.getClient();
    try {
      const table = protocolType === 'handover' ? 'handover_protocols' : 'return_protocols';
      await client.query(
        `UPDATE ${table} SET pdf_path = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [pdfPath, protocolId]
      );
    } finally {
      this.releaseClient(client);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Mapuje databázový riadok na HandoverProtocol objekt
   */
  private mapRowToHandoverProtocol(row: any): HandoverProtocol {
    return {
      id: row.id,
      rentalId: row.rental_id,

      type: 'handover',
      status: row.status || 'draft',
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      location: row.location || '',
      vehicleCondition: typeof row.vehicle_condition === 'string' ? JSON.parse(row.vehicle_condition) : row.vehicle_condition,
      vehicleImages: row.vehicle_images ? (typeof row.vehicle_images === 'string' ? JSON.parse(row.vehicle_images) : row.vehicle_images) : [],
      vehicleVideos: row.vehicle_videos ? (typeof row.vehicle_videos === 'string' ? JSON.parse(row.vehicle_videos) : row.vehicle_videos) : [],
      documentImages: row.document_images ? (typeof row.document_images === 'string' ? JSON.parse(row.document_images) : row.document_images) : [],
      documentVideos: row.document_videos ? (typeof row.document_videos === 'string' ? JSON.parse(row.document_videos) : row.document_videos) : [],
      damageImages: row.damage_images ? (typeof row.damage_images === 'string' ? JSON.parse(row.damage_images) : row.damage_images) : [],
      damageVideos: row.damage_videos ? (typeof row.damage_videos === 'string' ? JSON.parse(row.damage_videos) : row.damage_videos) : [],
      damages: row.damages ? (typeof row.damages === 'string' ? JSON.parse(row.damages) : row.damages) : [],
      signatures: row.signatures ? (typeof row.signatures === 'string' ? JSON.parse(row.signatures) : row.signatures) : [],
      rentalData: row.rental_data ? (typeof row.rental_data === 'string' ? JSON.parse(row.rental_data) : row.rental_data) : {} as any,
      pdfUrl: row.pdf_url || undefined,
      emailSent: Boolean(row.email_sent),
      emailSentAt: row.email_sent_at ? new Date(row.email_sent_at) : undefined,
      createdBy: row.created_by || '',
      notes: row.notes || undefined
    };
  }

  /**
   * Mapuje databázový riadok na ReturnProtocol objekt
   */
  private mapRowToReturnProtocol(row: any): ReturnProtocol {
    return {
      id: row.id,
      rentalId: row.rental_id,

      handoverProtocolId: row.handover_protocol_id || '',

      type: 'return',
      status: row.status || 'draft',
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      location: row.location || '',
      vehicleCondition: typeof row.vehicle_condition === 'string' ? JSON.parse(row.vehicle_condition) : row.vehicle_condition,
      vehicleImages: row.vehicle_images ? (typeof row.vehicle_images === 'string' ? JSON.parse(row.vehicle_images) : row.vehicle_images) : [],
      vehicleVideos: row.vehicle_videos ? (typeof row.vehicle_videos === 'string' ? JSON.parse(row.vehicle_videos) : row.vehicle_videos) : [],
      documentImages: row.document_images ? (typeof row.document_images === 'string' ? JSON.parse(row.document_images) : row.document_images) : [],
      documentVideos: row.document_videos ? (typeof row.document_videos === 'string' ? JSON.parse(row.document_videos) : row.document_videos) : [],
      damageImages: row.damage_images ? (typeof row.damage_images === 'string' ? JSON.parse(row.damage_images) : row.damage_images) : [],
      damageVideos: row.damage_videos ? (typeof row.damage_videos === 'string' ? JSON.parse(row.damage_videos) : row.damage_videos) : [],
      damages: row.damages ? (typeof row.damages === 'string' ? JSON.parse(row.damages) : row.damages) : [],
      newDamages: row.new_damages ? (typeof row.new_damages === 'string' ? JSON.parse(row.new_damages) : row.new_damages) : [],
      signatures: row.signatures ? (typeof row.signatures === 'string' ? JSON.parse(row.signatures) : row.signatures) : [],
      kilometersUsed: row.kilometers_used || 0,
      kilometerOverage: row.kilometer_overage || 0,
      kilometerFee: row.kilometer_fee || 0,
      fuelUsed: row.fuel_used || 0,
      fuelFee: row.fuel_fee || 0,
      totalExtraFees: row.total_extra_fees || 0,
      depositRefund: row.deposit_refund || 0,
      additionalCharges: row.additional_charges || 0,
      finalRefund: row.final_refund || 0,
      rentalData: row.rental_data ? (typeof row.rental_data === 'string' ? JSON.parse(row.rental_data) : row.rental_data) : {} as any,
      pdfUrl: row.pdf_url || undefined,
      emailSent: Boolean(row.email_sent),
      emailSentAt: row.email_sent_at ? new Date(row.email_sent_at) : undefined,
      createdBy: row.created_by || '',
      notes: row.notes || undefined
    };
  }
}
