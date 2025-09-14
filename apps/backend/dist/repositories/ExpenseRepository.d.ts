/**
 * Expense Repository
 * Spravuje všetky databázové operácie pre výdavky a kategórie
 * Extrahované z postgres-database.ts - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
 */
import type { Pool } from 'pg';
import { BaseRepository } from '../models/base/BaseRepository';
import type { Expense, ExpenseCategory, RecurringExpense } from '../types';
export declare class ExpenseRepository extends BaseRepository {
    constructor(pool: Pool);
    /**
     * Získa všetky výdavky
     */
    getExpenses(): Promise<Expense[]>;
    /**
     * Vytvorí nový výdavok
     */
    createExpense(expenseData: {
        vehicleId?: string;
        companyId?: string;
        categoryId?: string;
        amount: number;
        description: string;
        date: Date;
        receipt?: string;
        notes?: string;
    }): Promise<Expense>;
    /**
     * Aktualizuje výdavok
     */
    updateExpense(id: string, expenseData: {
        vehicleId?: string;
        companyId?: string;
        categoryId?: string;
        amount: number;
        description: string;
        date: Date;
        receipt?: string;
        notes?: string;
    }): Promise<void>;
    /**
     * Zmaže výdavok
     */
    deleteExpense(id: string): Promise<void>;
    /**
     * Získa všetky kategórie výdavkov
     */
    getExpenseCategories(): Promise<ExpenseCategory[]>;
    /**
     * Vytvorí novú kategóriu výdavkov
     */
    createExpenseCategory(categoryData: {
        name: string;
        description?: string;
        color?: string;
    }): Promise<ExpenseCategory>;
    /**
     * Aktualizuje kategóriu výdavkov
     */
    updateExpenseCategory(id: string, categoryData: {
        name: string;
        description?: string;
        color?: string;
    }): Promise<void>;
    /**
     * Zmaže kategóriu výdavkov
     */
    deleteExpenseCategory(id: string): Promise<void>;
    /**
     * Získa všetky opakujúce sa výdavky
     */
    getRecurringExpenses(): Promise<RecurringExpense[]>;
    /**
     * Vytvorí nový opakujúci sa výdavok
     */
    createRecurringExpense(expenseData: {
        vehicleId?: string;
        companyId?: string;
        categoryId?: string;
        amount: number;
        description: string;
        frequency: string;
        nextDueDate: Date;
        isActive?: boolean;
        notes?: string;
    }): Promise<RecurringExpense>;
    /**
     * Aktualizuje opakujúci sa výdavok
     */
    updateRecurringExpense(id: string, expenseData: {
        vehicleId?: string;
        companyId?: string;
        categoryId?: string;
        amount: number;
        description: string;
        frequency: string;
        nextDueDate: Date;
        isActive?: boolean;
        notes?: string;
    }): Promise<void>;
    /**
     * Zmaže opakujúci sa výdavok
     */
    deleteRecurringExpense(id: string): Promise<void>;
    /**
     * Generuje opakujúce sa výdavky
     */
    generateRecurringExpenses(): Promise<void>;
    /**
     * Spustí generovanie opakujúcich sa výdavkov
     */
    triggerRecurringExpenseGeneration(): Promise<void>;
    /**
     * Mapuje databázový riadok na Expense objekt
     */
    private mapRowToExpense;
    /**
     * Mapuje databázový riadok na ExpenseCategory objekt
     */
    private mapRowToExpenseCategory;
    /**
     * Mapuje databázový riadok na RecurringExpense objekt
     */
    private mapRowToRecurringExpense;
    /**
     * Vypočíta ďalší dátum splatnosti
     */
    private calculateNextDueDate;
}
//# sourceMappingURL=ExpenseRepository.d.ts.map