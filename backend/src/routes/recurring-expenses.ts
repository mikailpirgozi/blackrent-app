import type { Request, Response } from 'express';
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { postgresDatabase } from '../models/postgres-database';
import type { ApiResponse, RecurringExpense } from '../types';

const router = Router();

// GET /api/recurring-expenses - Získanie všetkých pravidelných nákladov
router.get('/', 
  authenticateToken,
  checkPermission('expenses', 'read'),
  async (req: Request, res: Response<ApiResponse<RecurringExpense[]>>) => {
    try {
      const recurringExpenses = await postgresDatabase.getRecurringExpenses();
      
      console.log('🔄 Recurring Expenses GET:', { 
        user: req.user?.username, 
        count: recurringExpenses.length 
      });
      
      // Pridaj cache busting headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.json({
        success: true,
        data: recurringExpenses
      });
    } catch (error) {
      console.error('Get recurring expenses error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní pravidelných nákladov'
      });
    }
  });

// POST /api/recurring-expenses - Vytvorenie nového pravidelného nákladu
router.post('/', 
  authenticateToken,
  checkPermission('expenses', 'create'),
  async (req: Request, res: Response<ApiResponse<RecurringExpense>>) => {
    try {
      const { 
        name, description, amount, category, company, vehicleId, note,
        frequency, startDate, endDate, dayOfMonth 
      } = req.body;

      // Validácia povinných polí
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Názov pravidelného nákladu je povinný'
        });
      }

      if (!description || !description.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Popis je povinný'
        });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Suma musí byť väčšia ako 0'
        });
      }

      if (!category || !category.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Kategória je povinná'
        });
      }

      if (!company || !company.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Firma je povinná'
        });
      }

      // Validácia frequency
      const validFrequencies = ['monthly', 'quarterly', 'yearly'];
      if (!frequency || !validFrequencies.includes(frequency)) {
        return res.status(400).json({
          success: false,
          error: 'Neplatná frekvencia (monthly, quarterly, yearly)'
        });
      }

      // Validácia dayOfMonth
      const dayNum = parseInt(dayOfMonth) || 1;
      if (dayNum < 1 || dayNum > 28) {
        return res.status(400).json({
          success: false,
          error: 'Deň v mesiaci musí byť medzi 1-28'
        });
      }

      const recurringData = {
        name: name.trim(),
        description: description.trim(),
        amount: parseFloat(amount),
        category: category.trim(),
        company: company.trim(),
        vehicleId: vehicleId?.trim() || undefined,
        note: note?.trim() || undefined,
        frequency,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : undefined,
        dayOfMonth: dayNum,
        createdBy: req.user?.id
      };

      console.log('🔄 Creating recurring expense:', recurringData);

      const createdRecurring = await postgresDatabase.createRecurringExpense(recurringData);

      res.status(201).json({
        success: true,
        message: 'Pravidelný náklad úspešne vytvorený',
        data: createdRecurring
      });

    } catch (error: unknown) {
      console.error('Create recurring expense error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri vytváraní pravidelného nákladu'
      });
    }
  });

// PUT /api/recurring-expenses/:id - Aktualizácia pravidelného nákladu
router.put('/:id', 
  authenticateToken,
  checkPermission('expenses', 'update'),
  async (req: Request, res: Response<ApiResponse<RecurringExpense>>) => {
    try {
      const { id } = req.params;
      const { 
        name, description, amount, category, company, vehicleId, note,
        frequency, startDate, endDate, dayOfMonth, isActive 
      } = req.body;

      // Získaj existujúci recurring expense priamo z databázy
      const recurringExpense = await postgresDatabase.getRecurringExpenseById(id);
      
      if (!recurringExpense) {
        return res.status(404).json({
          success: false,
          error: 'Pravidelný náklad nenájdený'
        });
      }

      // Validácia
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Názov je povinný'
        });
      }

      if (!description || !description.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Popis je povinný'
        });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Suma musí byť väčšia ako 0'
        });
      }

      const updatedRecurring: RecurringExpense = {
        ...recurringExpense,
        name: name.trim(),
        description: description.trim(),
        amount: parseFloat(amount),
        category: category?.trim() || recurringExpense.category,
        company: company?.trim() || recurringExpense.company,
        vehicleId: vehicleId?.trim() || recurringExpense.vehicleId,
        note: note?.trim() || recurringExpense.note,
        frequency: frequency || recurringExpense.frequency,
        startDate: startDate ? new Date(startDate) : recurringExpense.startDate,
        endDate: endDate ? new Date(endDate) : recurringExpense.endDate,
        dayOfMonth: dayOfMonth ? parseInt(dayOfMonth) : recurringExpense.dayOfMonth,
        isActive: isActive !== undefined ? isActive : recurringExpense.isActive,
        updatedAt: new Date()
      };

      await postgresDatabase.updateRecurringExpense(updatedRecurring);

      // Načítaj fresh data z databázy pre potvrdenie
      const freshData = await postgresDatabase.getRecurringExpenseById(id);
      
      console.log('🔄 Updated recurring expense:', { id, name, freshData: freshData?.category });

      // Pridaj cache busting headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.json({
        success: true,
        message: 'Pravidelný náklad úspešne aktualizovaný',
        data: freshData || updatedRecurring
      });

    } catch (error: unknown) {
      console.error('Update recurring expense error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri aktualizácii pravidelného nákladu'
      });
    }
  });

// DELETE /api/recurring-expenses/:id - Zmazanie pravidelného nákladu
router.delete('/:id', 
  authenticateToken,
  checkPermission('expenses', 'delete'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;

      await postgresDatabase.deleteRecurringExpense(id);

      console.log('🔄 Deleted recurring expense:', { id, user: req.user?.username });

      res.json({
        success: true,
        message: 'Pravidelný náklad úspešne zmazaný'
      });

    } catch (error: unknown) {
      console.error('Delete recurring expense error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri mazaní pravidelného nákladu'
      });
    }
  });

// POST /api/recurring-expenses/generate - Manuálne spustenie generovania
router.post('/generate', 
  authenticateToken,
  checkPermission('expenses', 'create'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { targetDate } = req.body;
      const date = targetDate ? new Date(targetDate) : new Date();

      console.log('🔄 Manual recurring expense generation triggered for:', date.toISOString().split('T')[0]);

      const results = await postgresDatabase.generateRecurringExpenses(date);

      res.json({
        success: true,
        message: `Generovanie dokončené: ${results.generated} vytvorených, ${results.skipped} preskočených`,
        data: results
      });

    } catch (error: unknown) {
      console.error('Generate recurring expenses error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri generovaní pravidelných nákladov'
      });
    }
  });

// POST /api/recurring-expenses/:id/generate - Manuálne vygenerovanie konkrétneho nákladu
router.post('/:id/generate', 
  authenticateToken,
  checkPermission('expenses', 'create'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;
      const { targetDate } = req.body;

      const generatedExpenseId = await postgresDatabase.triggerRecurringExpenseGeneration(
        id, 
        targetDate ? new Date(targetDate) : new Date()
      );

      res.json({
        success: true,
        message: 'Náklad úspešne vygenerovaný',
        data: { generatedExpenseId }
      });

    } catch (error: unknown) {
      console.error('Generate single recurring expense error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Chyba pri generovaní nákladu'
      });
    }
  });

export default router;
