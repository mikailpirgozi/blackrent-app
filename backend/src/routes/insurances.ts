import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { Insurance, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/insurances - Získanie všetkých poistiek
router.get('/', authenticateToken, async (req: Request, res: Response<ApiResponse<Insurance[]>>) => {
  try {
    const insurances = await postgresDatabase.getInsurances();
    res.json({
      success: true,
      data: insurances
    });
  } catch (error) {
    console.error('Get insurances error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní poistiek'
    });
  }
});

// POST /api/insurances - Vytvorenie novej poistky
router.post('/', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { vehicleId, type, validFrom, validTo, price, company } = req.body;

    if (!vehicleId || !type || !validFrom || !validTo || !price || !company) {
      return res.status(400).json({
        success: false,
        error: 'Všetky povinné polia musia byť vyplnené'
      });
    }

    const newInsurance: Insurance = {
      id: uuidv4(),
      vehicleId,
      type,
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
      price,
      company
    };

    await postgresDatabase.createInsurance(newInsurance);

    res.status(201).json({
      success: true,
      message: 'Poistka úspešne vytvorená',
      data: newInsurance
    });

  } catch (error) {
    console.error('Create insurance error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vytváraní poistky'
    });
  }
});

export default router; 