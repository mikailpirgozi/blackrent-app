import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { Expense, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/expenses - Získanie všetkých nákladov
router.get('/', authenticateToken, async (req: Request, res: Response<ApiResponse<Expense[]>>) => {
  try {
    const expenses = await postgresDatabase.getExpenses();
    res.json({
      success: true,
      data: expenses
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní nákladov'
    });
  }
});

// POST /api/expenses - Vytvorenie nového nákladu
router.post('/', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { description, amount, date, vehicleId, company, category, note } = req.body;

    if (!description || !date || !company || !category) {
      return res.status(400).json({
        success: false,
        error: 'Všetky povinné polia musia byť vyplnené'
      });
    }

    const newExpense: Expense = {
      id: uuidv4(),
      description,
      amount: amount || 0,
      date: new Date(date),
      vehicleId,
      company,
      category,
      note: note || ''
    };

    await postgresDatabase.createExpense(newExpense);

    res.status(201).json({
      success: true,
      message: 'Náklad úspešne vytvorený',
      data: newExpense
    });

  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vytváraní nákladu'
    });
  }
});

// PUT /api/expenses/:id - Aktualizácia nákladu
router.put('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { description, amount, date, vehicleId, company, category, note } = req.body;

    if (!description || !date || !company || !category) {
      return res.status(400).json({
        success: false,
        error: 'Všetky povinné polia musia byť vyplnené'
      });
    }

    const updatedExpense: Expense = {
      id,
      description,
      amount: amount || 0,
      date: new Date(date),
      vehicleId,
      company,
      category,
      note: note || ''
    };

    await postgresDatabase.updateExpense(updatedExpense);

    res.json({
      success: true,
      message: 'Náklad úspešne aktualizovaný',
      data: updatedExpense
    });

  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri aktualizácii nákladu'
    });
  }
});

// DELETE /api/expenses/:id - Zmazanie nákladu
router.delete('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;

    await postgresDatabase.deleteExpense(id);

    res.json({
      success: true,
      message: 'Náklad úspešne zmazaný'
    });

  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri mazaní nákladu'
    });
  }
});

export default router; 