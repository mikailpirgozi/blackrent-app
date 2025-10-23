import type { Pool } from 'pg';
import type {
  BankAccount,
  CreateBankAccountDto,
  UpdateBankAccountDto,
} from '../types/payment-order.types';

/**
 * 🏦 Bank Accounts Service
 * 
 * Služba pre správu bankových účtov
 */
export class BankAccountsService {
  constructor(private db: Pool) {}

  /**
   * Vytvorí nový bankový účet
   */
  async create(dto: CreateBankAccountDto): Promise<BankAccount> {
    try {
      // Ak je tento účet nastavený ako default, zruš default u ostatných
      if (dto.isDefault) {
        await this.db.query('UPDATE bank_accounts SET is_default = false');
      }

      const result = await this.db.query(
        `
        INSERT INTO bank_accounts (
          name,
          iban,
          swift_bic,
          bank_name,
          is_active,
          is_default
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
          dto.name,
          dto.iban,
          dto.swiftBic || null,
          dto.bankName || null,
          dto.isActive ?? true,
          dto.isDefault ?? false,
        ]
      );

      console.log('✅ Bank account created:', result.rows[0].id);

      return this.mapRowToBankAccount(result.rows[0]);
    } catch (error: unknown) {
      console.error('Error creating bank account:', error);
      
      // Lepšie error handling pre duplicate IBAN
      if (error && typeof error === 'object' && 'code' in error) {
        const pgError = error as { code: string; constraint?: string; detail?: string };
        if (pgError.code === '23505' && pgError.constraint === 'bank_accounts_iban_key') {
          throw new Error('Tento IBAN už existuje v systéme. IBAN musí byť unikátny.');
        }
      }
      
      throw error;
    }
  }

  /**
   * Aktualizuje bankový účet
   */
  async update(id: string, dto: UpdateBankAccountDto): Promise<BankAccount> {
    try {
      // Ak je tento účet nastavený ako default, zruš default u ostatných
      if (dto.isDefault) {
        await this.db.query('UPDATE bank_accounts SET is_default = false WHERE id != $1', [id]);
      }

      const updates: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (dto.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(dto.name);
      }

      if (dto.iban !== undefined) {
        updates.push(`iban = $${paramIndex++}`);
        values.push(dto.iban);
      }

      if (dto.swiftBic !== undefined) {
        updates.push(`swift_bic = $${paramIndex++}`);
        values.push(dto.swiftBic);
      }

      if (dto.bankName !== undefined) {
        updates.push(`bank_name = $${paramIndex++}`);
        values.push(dto.bankName);
      }

      if (dto.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(dto.isActive);
      }

      if (dto.isDefault !== undefined) {
        updates.push(`is_default = $${paramIndex++}`);
        values.push(dto.isDefault);
      }

      updates.push(`updated_at = NOW()`);

      if (updates.length === 1) {
        // Len updated_at
        throw new Error('No fields to update');
      }

      values.push(id);

      const result = await this.db.query(
        `
        UPDATE bank_accounts 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
        `,
        values
      );

      if (result.rows.length === 0) {
        throw new Error(`Bank account not found: ${id}`);
      }

      console.log('✅ Bank account updated:', id);

      return this.mapRowToBankAccount(result.rows[0]);
    } catch (error: unknown) {
      console.error('Error updating bank account:', error);
      
      // Lepšie error handling pre duplicate IBAN
      if (error && typeof error === 'object' && 'code' in error) {
        const pgError = error as { code: string; constraint?: string; detail?: string };
        if (pgError.code === '23505' && pgError.constraint === 'bank_accounts_iban_key') {
          throw new Error('Tento IBAN už existuje v systéme. IBAN musí byť unikátny.');
        }
      }
      
      throw error;
    }
  }

  /**
   * Vymaže bankový účet
   */
  async delete(id: string): Promise<void> {
    try {
      // Skontroluj či existujú platobné príkazy pre tento účet
      const ordersResult = await this.db.query(
        'SELECT COUNT(*) as count FROM payment_orders WHERE bank_account_id = $1',
        [id]
      );

      const count = parseInt(ordersResult.rows[0].count);

      if (count > 0) {
        throw new Error(
          `Cannot delete bank account: ${count} payment order(s) exist for this account`
        );
      }

      const result = await this.db.query(
        'DELETE FROM bank_accounts WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error(`Bank account not found: ${id}`);
      }

      console.log('✅ Bank account deleted:', id);
    } catch (error) {
      console.error('Error deleting bank account:', error);
      throw error;
    }
  }

  /**
   * Načíta všetky bankové účty
   */
  async findAll(): Promise<BankAccount[]> {
    const result = await this.db.query(
      `
      SELECT * FROM bank_accounts 
      ORDER BY is_default DESC, name ASC
      `
    );

    return result.rows.map((row) => this.mapRowToBankAccount(row));
  }

  /**
   * Načíta len aktívne bankové účty
   */
  async findActive(): Promise<BankAccount[]> {
    const result = await this.db.query(
      `
      SELECT * FROM bank_accounts 
      WHERE is_active = true
      ORDER BY is_default DESC, name ASC
      `
    );

    return result.rows.map((row) => this.mapRowToBankAccount(row));
  }

  /**
   * Načíta bankový účet podľa ID
   */
  async findById(id: string): Promise<BankAccount | null> {
    const result = await this.db.query(
      'SELECT * FROM bank_accounts WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToBankAccount(result.rows[0]);
  }

  /**
   * Načíta default bankový účet
   */
  async findDefault(): Promise<BankAccount | null> {
    const result = await this.db.query(
      'SELECT * FROM bank_accounts WHERE is_default = true AND is_active = true LIMIT 1'
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToBankAccount(result.rows[0]);
  }

  /**
   * Mapuje DB row na BankAccount objekt
   */
  private mapRowToBankAccount(row: Record<string, unknown>): BankAccount {
    return {
      id: row.id as string,
      name: row.name as string,
      iban: row.iban as string,
      swiftBic: row.swift_bic as string | undefined,
      bankName: row.bank_name as string | undefined,
      isActive: row.is_active as boolean,
      isDefault: row.is_default as boolean,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
    };
  }
}

