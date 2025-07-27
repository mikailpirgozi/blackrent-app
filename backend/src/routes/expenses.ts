import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { Expense, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// 🔍 CONTEXT FUNCTIONS
const getExpenseContext = async (req: Request) => {
  const expenseId = req.params.id;
  if (!expenseId) return {};
  
  const expenses = await postgresDatabase.getExpenses();
  const expense = expenses.find(e => e.id === expenseId);
  if (!expense || !expense.vehicleId) return {};
  
  // Získaj vehicle pre company context
  const vehicle = await postgresDatabase.getVehicle(expense.vehicleId);
  return {
    resourceCompanyId: vehicle?.ownerCompanyId,
    amount: expense.amount
  };
};

// GET /api/expenses - Získanie všetkých nákladov
router.get('/', 
  authenticateToken,
  checkPermission('expenses', 'read'),
  async (req: Request, res: Response<ApiResponse<Expense[]>>) => {
    try {
      let expenses = await postgresDatabase.getExpenses();
      
      console.log('💰 Expenses GET - user:', { 
        role: req.user?.role, 
        userId: req.user?.id, 
        totalExpenses: expenses.length 
      });
      
      // 🔐 NON-ADMIN USERS - filter podľa company permissions
      if (req.user?.role !== 'admin' && req.user) {
        const user = req.user; // TypeScript safe assignment
        const originalCount = expenses.length;
        
        // Získaj company access pre používateľa
        const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(user!.id);
        const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
        
        // Získaj názvy firiem pre mapping
        const companies = await postgresDatabase.getCompanies();
        const allowedCompanyNames = companies
          .filter(c => allowedCompanyIds.includes(c.id))
          .map(c => c.name);
        
        // Filter expenses len pre povolené firmy
        expenses = expenses.filter(e => 
          e.company && allowedCompanyNames.includes(e.company)
        );
        
        console.log('🔐 Expenses Company Permission Filter:', {
          userId: user!.id,
          allowedCompanyIds,
          allowedCompanyNames,
          originalCount,
          filteredCount: expenses.length
        });
      }
      
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
router.post('/', 
  authenticateToken,
  checkPermission('expenses', 'create'),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { description, amount, date, vehicleId, company, category, note } = req.body;

    // Povinné je len description
    if (!description || description.toString().trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Popis nákladu je povinný'
      });
    }

    const createdExpense = await postgresDatabase.createExpense({
      description: description.toString().trim(),
      amount: amount && !isNaN(Number(amount)) ? Number(amount) : 0,
      date: date ? new Date(date) : new Date(),
      vehicleId: vehicleId || undefined,
      company: company && company.toString().trim() !== '' ? company.toString().trim() : 'Neznáma firma',
      category: category && ['service', 'insurance', 'fuel', 'other'].includes(category) ? category : 'other',
      note: note && note.toString().trim() !== '' ? note.toString().trim() : undefined
    });

    res.status(201).json({
      success: true,
      message: 'Náklad úspešne vytvorený',
      data: createdExpense
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
router.put('/:id', 
  authenticateToken,
  checkPermission('expenses', 'update', { getContext: getExpenseContext }),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { description, amount, date, vehicleId, company, category, note } = req.body;

    // Povinné je len description
    if (!description || description.toString().trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Popis nákladu je povinný'
      });
    }

    const updatedExpense: Expense = {
      id,
      description: description.toString().trim(),
      amount: amount && !isNaN(Number(amount)) ? Number(amount) : 0,
      date: date ? new Date(date) : new Date(),
      vehicleId: vehicleId || undefined,
      company: company && company.toString().trim() !== '' ? company.toString().trim() : 'Neznáma firma',
      category: category && ['service', 'insurance', 'fuel', 'other'].includes(category) ? category : 'other',
      note: note && note.toString().trim() !== '' ? note.toString().trim() : undefined
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
router.delete('/:id', 
  authenticateToken,
  checkPermission('expenses', 'delete', { getContext: getExpenseContext }),
  async (req: Request, res: Response<ApiResponse>) => {
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