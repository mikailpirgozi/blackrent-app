import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { Vehicle, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/vehicles - Získanie všetkých vozidiel
router.get('/', authenticateToken, async (req: Request, res: Response<ApiResponse<Vehicle[]>>) => {
  try {
    const vehicles = await postgresDatabase.getVehicles();
    res.json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní vozidiel'
    });
  }
});

// GET /api/vehicles/:id - Získanie konkrétneho vozidla
router.get('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse<Vehicle>>) => {
  try {
    const { id } = req.params;
    const vehicle = await postgresDatabase.getVehicle(id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vozidlo nenájdené'
      });
    }

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní vozidla'
    });
  }
});

// POST /api/vehicles - Vytvorenie nového vozidla
router.post('/', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { brand, model, licensePlate, company, pricing, commission, status } = req.body;

    if (!brand || !model || !company) {
      return res.status(400).json({
        success: false,
        error: 'Všetky povinné polia musia byť vyplnené'
      });
    }

    const createdVehicle = await postgresDatabase.createVehicle({
      brand,
      model,
      licensePlate: licensePlate || '',
      company,
      pricing: pricing || [],
      commission: commission || { type: 'percentage', value: 0 },
      status: status || 'available'
    });

    res.status(201).json({
      success: true,
      message: 'Vozidlo úspešne vytvorené',
      data: createdVehicle
    });

  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vytváraní vozidla'
    });
  }
});

// PUT /api/vehicles/:id - Aktualizácia vozidla
router.put('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { brand, model, licensePlate, company, pricing, commission, status } = req.body;

    // Skontroluj, či vozidlo existuje
    const existingVehicle = await postgresDatabase.getVehicle(id);
    if (!existingVehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vozidlo nenájdené'
      });
    }

    const updatedVehicle: Vehicle = {
      id,
      brand: brand || existingVehicle.brand,
      model: model || existingVehicle.model,
      licensePlate: licensePlate || existingVehicle.licensePlate,
      company: company || existingVehicle.company,
      pricing: pricing || existingVehicle.pricing,
      commission: commission || existingVehicle.commission,
      status: status || existingVehicle.status
    };

    await postgresDatabase.updateVehicle(updatedVehicle);

    res.json({
      success: true,
      message: 'Vozidlo úspešne aktualizované',
      data: updatedVehicle
    });

  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri aktualizácii vozidla'
    });
  }
});

// DELETE /api/vehicles/:id - Vymazanie vozidla
router.delete('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;

    // Skontroluj, či vozidlo existuje
    const existingVehicle = await postgresDatabase.getVehicle(id);
    if (!existingVehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vozidlo nenájdené'
      });
    }

    await postgresDatabase.deleteVehicle(id);

    res.json({
      success: true,
      message: 'Vozidlo úspešne vymazané'
    });

  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vymazávaní vozidla'
    });
  }
});

export default router; 