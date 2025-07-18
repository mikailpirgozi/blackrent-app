import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { Company, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/companies - Získanie všetkých firiem
router.get('/', authenticateToken, async (req: Request, res: Response<ApiResponse<Company[]>>) => {
  try {
    const companies = await postgresDatabase.getCompanies();
    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní firiem'
    });
  }
});

// POST /api/companies - Vytvorenie novej firmy
router.post('/', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Názov firmy je povinný'
      });
    }

    const createdCompany = await postgresDatabase.createCompany({ name });

    res.status(201).json({
      success: true,
      message: 'Firma úspešne vytvorená',
      data: createdCompany
    });

  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vytváraní firmy'
    });
  }
});

// DELETE /api/companies/:id - Vymazanie firmy
router.delete('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;

    await postgresDatabase.deleteCompany(id);

    res.json({
      success: true,
      message: 'Firma úspešne vymazaná'
    });

  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vymazávaní firmy'
    });
  }
});

export default router; 