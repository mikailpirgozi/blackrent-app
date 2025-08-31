import type { Request, Response } from 'express';
import { Router } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import type { ExpenseCategory, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = Router();

// GET /api/expense-categories - Získanie všetkých kategórií nákladov
router.get('/', 
  authenticateToken,
  checkPermission('expenses', 'read'),
  async (req: Request, res: Response<ApiResponse<ExpenseCategory[]>>) => {
    try {
      const categories = await postgresDatabase.getExpenseCategories();
      
      console.log('📂 Expense Categories GET:', { 
        user: req.user?.username, 
        categoriesCount: categories.length 
      });
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Get expense categories error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní kategórií nákladov'
      });
    }
  });

// POST /api/expense-categories - Vytvorenie novej kategórie
router.post('/', 
  authenticateToken,
  checkPermission('expenses', 'create'),
  async (req: Request, res: Response<ApiResponse<ExpenseCategory>>) => {
    try {
      const { name, displayName, description, icon, color, sortOrder } = req.body;

      // Validácia povinných polí
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Názov kategórie je povinný'
        });
      }

      if (!displayName || !displayName.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Zobrazovaný názov kategórie je povinný'
        });
      }

      // Validácia farby
      const validColors = ['primary', 'secondary', 'success', 'error', 'warning', 'info'];
      if (color && !validColors.includes(color)) {
        return res.status(400).json({
          success: false,
          error: 'Neplatná farba kategórie'
        });
      }

      // Vytvorenie kategórie
      const categoryData = {
        name: name.trim().toLowerCase().replace(/\s+/g, '_'), // automatické formátovanie názvu
        displayName: displayName.trim(),
        description: description?.trim() || undefined,
        icon: icon?.trim() || 'receipt',
        color: color || 'primary',
        sortOrder: sortOrder || 0,
        createdBy: req.user?.id
      };

      console.log('📂 Creating expense category:', categoryData);

      const createdCategory = await postgresDatabase.createExpenseCategory(categoryData);

      res.status(201).json({
        success: true,
        message: 'Kategória nákladov úspešne vytvorená',
        data: createdCategory
      });

    } catch (error: any) {
      console.error('Create expense category error:', error);
      
      // Špecifické error handling pre unique constraint
      if (error.message?.includes('unique') || error.code === '23505') {
        return res.status(400).json({
          success: false,
          error: 'Kategória s týmto názvom už existuje'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Chyba pri vytváraní kategórie nákladov'
      });
    }
  });

// PUT /api/expense-categories/:id - Aktualizácia kategórie
router.put('/:id', 
  authenticateToken,
  checkPermission('expenses', 'update'),
  async (req: Request, res: Response<ApiResponse<ExpenseCategory>>) => {
    try {
      const { id } = req.params;
      const { displayName, description, icon, color, sortOrder } = req.body;

      // Validácia povinných polí
      if (!displayName || !displayName.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Zobrazovaný názov kategórie je povinný'
        });
      }

      // Validácia farby
      const validColors = ['primary', 'secondary', 'success', 'error', 'warning', 'info'];
      if (color && !validColors.includes(color)) {
        return res.status(400).json({
          success: false,
          error: 'Neplatná farba kategórie'
        });
      }

      // Získaj aktuálnu kategóriu
      const categories = await postgresDatabase.getExpenseCategories();
      const existingCategory = categories.find(c => c.id === id);
      
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          error: 'Kategória nenájdená'
        });
      }

      // Aktualizácia kategórie
      const updatedCategory: ExpenseCategory = {
        ...existingCategory,
        displayName: displayName.trim(),
        description: description?.trim() || undefined,
        icon: icon?.trim() || existingCategory.icon,
        color: color || existingCategory.color,
        sortOrder: sortOrder !== undefined ? sortOrder : existingCategory.sortOrder,
        updatedAt: new Date()
      };

      await postgresDatabase.updateExpenseCategory(updatedCategory);

      console.log('📂 Updated expense category:', { id, displayName });

      res.json({
        success: true,
        message: 'Kategória nákladov úspešne aktualizovaná',
        data: updatedCategory
      });

    } catch (error: any) {
      console.error('Update expense category error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri aktualizácii kategórie nákladov'
      });
    }
  });

// DELETE /api/expense-categories/:id - Zmazanie kategórie
router.delete('/:id', 
  authenticateToken,
  checkPermission('expenses', 'delete'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;

      await postgresDatabase.deleteExpenseCategory(id);

      console.log('📂 Deleted expense category:', { id, user: req.user?.username });

      res.json({
        success: true,
        message: 'Kategória nákladov úspešne zmazaná'
      });

    } catch (error: any) {
      console.error('Delete expense category error:', error);
      
      // Špecifické error handling
      if (error.message?.includes('základnú kategóriu')) {
        return res.status(400).json({
          success: false,
          error: 'Nemožno zmazať základnú kategóriu'
        });
      }
      
      if (error.message?.includes('používa v nákladoch')) {
        return res.status(400).json({
          success: false,
          error: 'Nemožno zmazať kategóriu ktorá sa používa v existujúcich nákladoch'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Chyba pri mazaní kategórie nákladov'
      });
    }
  });

export default router;
