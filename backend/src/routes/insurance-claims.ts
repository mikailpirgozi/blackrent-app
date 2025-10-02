import type { Request, Response } from 'express';
import { Router } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import type { InsuranceClaim, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/insurance-claims - Získanie všetkých poistných udalostí
router.get('/', authenticateToken, async (req: Request, res: Response<ApiResponse<InsuranceClaim[]>>) => {
  try {
    const { vehicleId } = req.query;
    const claims = await postgresDatabase.getInsuranceClaims(vehicleId as string);
    res.json({
      success: true,
      data: claims
    });
  } catch (error) {
    console.error('Get insurance claims error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní poistných udalostí'
    });
  }
});

// POST /api/insurance-claims - Vytvorenie novej poistnej udalosti
router.post('/', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { 
      vehicleId, 
      insuranceId, 
      incidentDate, 
      description, 
      location, 
      incidentType, 
      estimatedDamage, 
      deductible, 
      payoutAmount, 
      status, 
      claimNumber, 
      filePaths, 
      policeReportNumber, 
      otherPartyInfo, 
      notes 
    } = req.body;

    if (!vehicleId || !incidentDate || !description || !incidentType) {
      return res.status(400).json({
        success: false,
        error: 'vehicleId, incidentDate, description a incidentType sú povinné polia'
      });
    }

    const createdClaim = await postgresDatabase.createInsuranceClaim({
      vehicleId,
      insuranceId,
      incidentDate: new Date(incidentDate),
      description,
      location,
      incidentType,
      estimatedDamage,
      deductible,
      payoutAmount,
      status,
      claimNumber,
      filePaths,
      policeReportNumber,
      otherPartyInfo,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Poistná udalosť úspešne vytvorená',
      data: createdClaim
    });

  } catch (error) {
    console.error('Create insurance claim error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vytváraní poistnej udalosti'
    });
  }
});

// PUT /api/insurance-claims/:id - Aktualizácia poistnej udalosti
router.put('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { 
      vehicleId, 
      insuranceId, 
      incidentDate, 
      description, 
      location, 
      incidentType, 
      estimatedDamage, 
      deductible, 
      payoutAmount, 
      status, 
      claimNumber, 
      filePaths, 
      policeReportNumber, 
      otherPartyInfo, 
      notes 
    } = req.body;

    if (!vehicleId || !incidentDate || !description || !incidentType) {
      return res.status(400).json({
        success: false,
        error: 'vehicleId, incidentDate, description a incidentType sú povinné polia'
      });
    }

    const updatedClaim = await postgresDatabase.updateInsuranceClaim(id, {
      vehicleId,
      insuranceId,
      incidentDate: new Date(incidentDate),
      description,
      location,
      incidentType,
      estimatedDamage,
      deductible,
      payoutAmount,
      status,
      claimNumber,
      filePaths,
      policeReportNumber,
      otherPartyInfo,
      notes
    });

    res.json({
      success: true,
      message: 'Poistná udalosť úspešne aktualizovaná',
      data: updatedClaim
    });

  } catch (error) {
    console.error('Update insurance claim error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri aktualizácii poistnej udalosti'
    });
  }
});

// DELETE /api/insurance-claims/:id - Vymazanie poistnej udalosti
router.delete('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;

    await postgresDatabase.deleteInsuranceClaim(id);

    res.json({
      success: true,
      message: 'Poistná udalosť úspešne vymazaná'
    });

  } catch (error) {
    console.error('Delete insurance claim error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vymazávaní poistnej udalosti'
    });
  }
});

export default router; 