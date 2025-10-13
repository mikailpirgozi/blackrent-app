/**
 * Expense Repository
 * Spravuje všetky databázové operácie pre výdavky a kategórie
 * Extrahované z postgres-database.ts - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
 */

import type { Pool } from 'pg';

import { BaseRepository } from '../models/base/BaseRepository';
import type { Expense, ExpenseCategory, RecurringExpense } from '../types';


export class ExpenseRepository extends BaseRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  // ============================================================================
  // EXPENSE METHODS
  // ============================================================================

  /**
   * Získa všetky výdavky
   */
  async getExpenses(): Promise<Expense[]> {
    const client = await this.getClient();
    try {
      const result = await client.query(`
        SELECT 
          e.*,
          ec.name as category_name,
          v.brand as vehicle_brand,
          v.model as vehicle_model,
          v.license_plate as vehicle_license_plate,
          c.name as company_name
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        LEFT JOIN vehicles v ON e.vehicle_id = v.id
        LEFT JOIN companies c ON e.company_id = c.id
        ORDER BY e.date DESC, e.created_at DESC
      `);

      return result.rows.map(row => this.mapRowToExpense(row));
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Vytvorí nový výdavok
   */
  async createExpense(expenseData: {
    vehicleId?: string;
    companyId?: string;
    categoryId?: string;
    amount: number;
    description: string;
    date: Date;
    receipt?: string;
    notes?: string;
  }): Promise<Expense> {
    return this.executeTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO expenses (
          vehicle_id, company_id, category_id, amount, description,
          date, receipt, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          expenseData.vehicleId || null,
          expenseData.companyId || null,
          expenseData.categoryId || null,
          expenseData.amount,
          expenseData.description,
          expenseData.date,
          expenseData.receipt || null,
          expenseData.notes || null
        ]
      );

      return this.mapRowToExpense(result.rows[0]);
    });
  }

  /**
   * Aktualizuje výdavok
   */
  async updateExpense(id: string, expenseData: {
    vehicleId?: string;
    companyId?: string;
    categoryId?: string;
    amount: number;
    description: string;
    date: Date;
    receipt?: string;
    notes?: string;
  }): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query(
        `UPDATE expenses SET 
          vehicle_id = $1, company_id = $2, category_id = $3, amount = $4,
          description = $5, date = $6, receipt = $7, notes = $8,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9`,
        [
          expenseData.vehicleId || null,
          expenseData.companyId || null,
          expenseData.categoryId || null,
          expenseData.amount,
          expenseData.description,
          expenseData.date,
          expenseData.receipt || null,
          expenseData.notes || null,
          id
        ]
      );
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Zmaže výdavok
   */
  async deleteExpense(id: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query('DELETE FROM expenses WHERE id = $1', [id]);
    } finally {
      this.releaseClient(client);
    }
  }

  // ============================================================================
  // EXPENSE CATEGORY METHODS
  // ============================================================================

  /**
   * Získa všetky kategórie výdavkov
   */
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    const client = await this.getClient();
    try {
      const result = await client.query('SELECT * FROM expense_categories ORDER BY name');
      return result.rows.map(row => this.mapRowToExpenseCategory(row));
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Vytvorí novú kategóriu výdavkov
   */
  async createExpenseCategory(categoryData: {
    name: string;
    description?: string;
    color?: string;
  }): Promise<ExpenseCategory> {
    return this.executeTransaction(async (client) => {
      const result = await client.query(
        'INSERT INTO expense_categories (name, description, color) VALUES ($1, $2, $3) RETURNING *',
        [categoryData.name, categoryData.description || null, categoryData.color || null]
      );

      return this.mapRowToExpenseCategory(result.rows[0]);
    });
  }

  /**
   * Aktualizuje kategóriu výdavkov
   */
  async updateExpenseCategory(id: string, categoryData: {
    name: string;
    description?: string;
    color?: string;
  }): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query(
        `UPDATE expense_categories SET 
          name = $1, description = $2, color = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4`,
        [categoryData.name, categoryData.description || null, categoryData.color || null, id]
      );
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Zmaže kategóriu výdavkov
   */
  async deleteExpenseCategory(id: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query('DELETE FROM expense_categories WHERE id = $1', [id]);
    } finally {
      this.releaseClient(client);
    }
  }

  // ============================================================================
  // RECURRING EXPENSE METHODS
  // ============================================================================

  /**
   * Získa všetky opakujúce sa výdavky
   */
  async getRecurringExpenses(): Promise<RecurringExpense[]> {
    const client = await this.getClient();
    try {
      const result = await client.query(`
        SELECT 
          re.*,
          ec.name as category_name,
          v.brand as vehicle_brand,
          v.model as vehicle_model,
          v.license_plate as vehicle_license_plate,
          c.name as company_name
        FROM recurring_expenses re
        LEFT JOIN expense_categories ec ON re.category_id = ec.id
        LEFT JOIN vehicles v ON re.vehicle_id = v.id
        LEFT JOIN companies c ON re.company_id = c.id
        ORDER BY re.next_due_date ASC
      `);

      return result.rows.map(row => this.mapRowToRecurringExpense(row));
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Vytvorí nový opakujúci sa výdavok
   */
  async createRecurringExpense(expenseData: {
    vehicleId?: string;
    companyId?: string;
    categoryId?: string;
    amount: number;
    description: string;
    frequency: string;
    nextDueDate: Date;
    isActive?: boolean;
    notes?: string;
  }): Promise<RecurringExpense> {
    return this.executeTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO recurring_expenses (
          vehicle_id, company_id, category_id, amount, description,
          frequency, next_due_date, is_active, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          expenseData.vehicleId || null,
          expenseData.companyId || null,
          expenseData.categoryId || null,
          expenseData.amount,
          expenseData.description,
          expenseData.frequency,
          expenseData.nextDueDate,
          expenseData.isActive !== undefined ? expenseData.isActive : true,
          expenseData.notes || null
        ]
      );

      return this.mapRowToRecurringExpense(result.rows[0]);
    });
  }

  /**
   * Aktualizuje opakujúci sa výdavok
   */
  async updateRecurringExpense(id: string, expenseData: {
    vehicleId?: string;
    companyId?: string;
    categoryId?: string;
    amount: number;
    description: string;
    frequency: string;
    nextDueDate: Date;
    isActive?: boolean;
    notes?: string;
  }): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query(
        `UPDATE recurring_expenses SET 
          vehicle_id = $1, company_id = $2, category_id = $3, amount = $4,
          description = $5, frequency = $6, next_due_date = $7, is_active = $8,
          notes = $9, updated_at = CURRENT_TIMESTAMP
        WHERE id = $10`,
        [
          expenseData.vehicleId || null,
          expenseData.companyId || null,
          expenseData.categoryId || null,
          expenseData.amount,
          expenseData.description,
          expenseData.frequency,
          expenseData.nextDueDate,
          expenseData.isActive !== undefined ? expenseData.isActive : true,
          expenseData.notes || null,
          id
        ]
      );
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Zmaže opakujúci sa výdavok
   */
  async deleteRecurringExpense(id: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query('DELETE FROM recurring_expenses WHERE id = $1', [id]);
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Generuje opakujúce sa výdavky
   */
  async generateRecurringExpenses(): Promise<void> {
    const client = await this.getClient();
    try {
      // Získaj všetky aktívne opakujúce sa výdavky ktoré sú splatné
      const result = await client.query(`
        SELECT * FROM recurring_expenses 
        WHERE is_active = true AND next_due_date <= CURRENT_DATE
      `);

      for (const recurringExpense of result.rows) {
        // Vytvor nový výdavok
        await client.query(
          `INSERT INTO expenses (
            vehicle_id, company_id, category_id, amount, description,
            date, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            recurringExpense.vehicle_id,
            recurringExpense.company_id,
            recurringExpense.category_id,
            recurringExpense.amount,
            recurringExpense.description,
            new Date(),
            `Automaticky generovaný z opakujúceho sa výdavku: ${recurringExpense.description}`
          ]
        );

        // Aktualizuj next_due_date
        const nextDueDate = this.calculateNextDueDate(recurringExpense.next_due_date, recurringExpense.frequency);
        await client.query(
          'UPDATE recurring_expenses SET next_due_date = $1 WHERE id = $2',
          [nextDueDate, recurringExpense.id]
        );
      }
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Spustí generovanie opakujúcich sa výdavkov
   */
  async triggerRecurringExpenseGeneration(): Promise<void> {
    await this.generateRecurringExpenses();
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Mapuje databázový riadok na Expense objekt
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToExpense(row: Record<string, unknown>): Expense {
    return {
      id: String(row.id),
      description: String(row.description),
      amount: Number(row.amount),
      date: new Date(row.date as string | number | Date),
      vehicleId: row.vehicle_id ? String(row.vehicle_id) : undefined,
      company: String(row.company || ''),
      category: String(row.category || ''),
      note: row.notes ? String(row.notes) : undefined
    };
  }

  /**
   * Mapuje databázový riadok na ExpenseCategory objekt
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToExpenseCategory(row: Record<string, unknown>): ExpenseCategory {
    return {
      id: String(row.id),
      name: String(row.name),
      displayName: String(row.display_name || row.name),
      description: row.description ? String(row.description) : undefined,
      icon: String(row.icon || 'category'),
      color: (row.color || 'primary') as 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info',
      isDefault: Boolean(row.is_default),
      isActive: Boolean(row.is_active !== false),
      sortOrder: Number(row.sort_order || 0),
      createdAt: new Date(row.created_at as string | number | Date),
      updatedAt: row.updated_at ? new Date(row.updated_at as string | number | Date) : new Date(),
      createdBy: row.created_by ? String(row.created_by) : undefined
    };
  }

  /**
   * Mapuje databázový riadok na RecurringExpense objekt
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToRecurringExpense(row: Record<string, unknown>): RecurringExpense {
    return {
      id: String(row.id),
      name: String(row.name || row.description),
      description: String(row.description),
      amount: Number(row.amount),
      category: String(row.category || ''),
      company: String(row.company || ''),
      vehicleId: row.vehicle_id ? String(row.vehicle_id) : undefined,
      note: row.notes ? String(row.notes) : undefined,
      frequency: (row.frequency || 'monthly') as 'monthly' | 'quarterly' | 'yearly',
      startDate: new Date((row.start_date || row.created_at) as string | number | Date),
      endDate: row.end_date ? new Date(row.end_date as string | number | Date) : undefined,
      dayOfMonth: Number(row.day_of_month || 1),
      isActive: Boolean(row.is_active),
      lastGeneratedDate: row.last_generated_date ? new Date(row.last_generated_date as string | number | Date) : undefined,
      nextGenerationDate: row.next_generation_date ? new Date(row.next_generation_date as string | number | Date) : undefined,
      totalGenerated: Number(row.total_generated || 0),
      createdAt: new Date(row.created_at as string | number | Date),
      updatedAt: row.updated_at ? new Date(row.updated_at as string | number | Date) : new Date(),
      createdBy: row.created_by ? String(row.created_by) : undefined
    };
  }

  /**
   * Vypočíta ďalší dátum splatnosti
   */
  private calculateNextDueDate(currentDate: Date, frequency: string): Date {
    const nextDate = new Date(currentDate);
    
    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1); // default monthly
    }
    
    return nextDate;
  }
}
