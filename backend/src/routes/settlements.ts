import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { Settlement, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/settlements - Získanie všetkých vyúčtovaní
router.get('/', authenticateToken, async (req: Request, res: Response<ApiResponse<Settlement[]>>) => {
  try {
    const settlements = await postgresDatabase.getSettlements();
    res.json({
      success: true,
      data: settlements
    });
  } catch (error) {
    console.error('Get settlements error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní vyúčtovaní'
    });
  }
});

// GET /api/settlements/:id - Získanie konkrétneho vyúčtovania
router.get('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse<Settlement>>) => {
  try {
    const { id } = req.params;
    const settlement = await postgresDatabase.getSettlement(id);
    
    if (!settlement) {
      return res.status(404).json({
        success: false,
        error: 'Vyúčtovanie nenájdené'
      });
    }

    res.json({
      success: true,
      data: settlement
    });
  } catch (error) {
    console.error('Get settlement error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní vyúčtovania'
    });
  }
});

// POST /api/settlements - Vytvorenie nového vyúčtovania
router.post('/', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const {
      company,
      period,
      fromDate,
      toDate,
      totalRentals,
      totalIncome,
      totalExpenses,
      commission,
      netIncome,
      rentalsByPaymentMethod,
      expensesByCategory,
      summary
    } = req.body;

    if (!company || !period || !fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        error: 'Všetky povinné polia musia byť vyplnené'
      });
    }

    const createdSettlement = await postgresDatabase.createSettlement({
      company,
      period,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      totalRentals: totalRentals || 0,
      totalIncome: totalIncome || 0,
      totalExpenses: totalExpenses || 0,
      commission: commission || 0,
      netIncome: netIncome || 0,
      rentalsByPaymentMethod: rentalsByPaymentMethod || {},
      expensesByCategory: expensesByCategory || {},
      summary: summary || ''
    });

    res.status(201).json({
      success: true,
      message: 'Vyúčtovanie úspešne vytvorené',
      data: createdSettlement
    });

  } catch (error) {
    console.error('Create settlement error:', error);
    res.status(500).json({
      success: false,
      error: `Chyba pri vytváraní vyúčtovania: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
    });
  }
});

// PUT /api/settlements/:id - Aktualizácia vyúčtovania
router.put('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Skontroluj, či vyúčtovanie existuje
    const existingSettlement = await postgresDatabase.getSettlement(id);
    if (!existingSettlement) {
      return res.status(404).json({
        success: false,
        error: 'Vyúčtovanie nenájdené'
      });
    }

    const updatedSettlement = await postgresDatabase.updateSettlement(id, updateData);

    res.json({
      success: true,
      message: 'Vyúčtovanie úspešne aktualizované',
      data: updatedSettlement
    });

  } catch (error) {
    console.error('Update settlement error:', error);
    res.status(500).json({
      success: false,
      error: `Chyba pri aktualizácii vyúčtovania: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
    });
  }
});

// DELETE /api/settlements/:id - Vymazanie vyúčtovania
router.delete('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;

    // Skontroluj, či vyúčtovanie existuje
    const existingSettlement = await postgresDatabase.getSettlement(id);
    if (!existingSettlement) {
      return res.status(404).json({
        success: false,
        error: 'Vyúčtovanie nenájdené'
      });
    }

    await postgresDatabase.deleteSettlement(id);

    res.json({
      success: true,
      message: 'Vyúčtovanie úspešne vymazané'
    });

  } catch (error) {
    console.error('Delete settlement error:', error);
    res.status(500).json({
      success: false,
      error: `Chyba pri vymazávaní vyúčtovania: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
    });
  }
});

export default router; 