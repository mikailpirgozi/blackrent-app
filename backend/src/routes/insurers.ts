import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { Insurer, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/insurers - Získanie všetkých poisťovní
router.get('/', authenticateToken, async (req: Request, res: Response<ApiResponse<Insurer[]>>) => {
  try {
    const insurers = await postgresDatabase.getInsurers();
    res.json({
      success: true,
      data: insurers
    });
  } catch (error) {
    console.error('Get insurers error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní poisťovní'
    });
  }
});

// POST /api/insurers - Vytvorenie novej poisťovne
router.post('/', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Názov poisťovne je povinný'
      });
    }

    const newInsurer: Insurer = {
      id: uuidv4(),
      name,
      createdAt: new Date()
    };

    await postgresDatabase.createInsurer(newInsurer);

    res.status(201).json({
      success: true,
      message: 'Poisťovňa úspešne vytvorená',
      data: newInsurer
    });

  } catch (error) {
    console.error('Create insurer error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vytváraní poisťovne'
    });
  }
});

// DELETE /api/insurers/:id - Vymazanie poisťovne
router.delete('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;

    await postgresDatabase.deleteInsurer(id);

    res.json({
      success: true,
      message: 'Poisťovňa úspešne vymazaná'
    });

  } catch (error) {
    console.error('Delete insurer error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vymazávaní poisťovne'
    });
  }
});

export default router; 