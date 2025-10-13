import type { Request, Response } from 'express';
import { Router } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import type { VehicleUnavailability, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { invalidateRelatedCache } from '../utils/cache-service';

const router: Router = Router();

// GET /api/vehicle-unavailability - Získanie všetkých nedostupností
router.get('/', authenticateToken, async (req: Request, res: Response<ApiResponse<VehicleUnavailability[]>>) => {
  try {
    const { vehicleId, startDate, endDate } = req.query;

    // Parse query parameters
    const parsedStartDate = startDate ? new Date(startDate as string) : undefined;
    const parsedEndDate = endDate ? new Date(endDate as string) : undefined;

    const unavailabilities = await postgresDatabase.getVehicleUnavailabilities(
      vehicleId as string | undefined,
      parsedStartDate,
      parsedEndDate
    );

    res.json({
      success: true,
      data: unavailabilities
    });
  } catch (error) {
    console.error('Get vehicle unavailabilities error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní nedostupností vozidiel'
    });
  }
});

// GET /api/vehicle-unavailability/:id - Získanie konkrétnej nedostupnosti
router.get('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse<VehicleUnavailability>>) => {
  try {
    const { id } = req.params;
    const unavailability = await postgresDatabase.getVehicleUnavailability(id);
    
    if (!unavailability) {
      return res.status(404).json({
        success: false,
        error: 'Nedostupnosť vozidla nenájdená'
      });
    }

    res.json({
      success: true,
      data: unavailability
    });
  } catch (error) {
    console.error('Get vehicle unavailability error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní nedostupnosti vozidla'
    });
  }
});

// POST /api/vehicle-unavailability - Vytvorenie novej nedostupnosti
router.post('/', authenticateToken, async (req: Request, res: Response<ApiResponse<VehicleUnavailability>>) => {
  try {
    const {
      vehicleId,
      startDate,
      endDate,
      reason,
      type,
      notes,
      priority,
      recurring,
      recurringConfig
    } = req.body;

    // Validation
    if (!vehicleId || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Povinné polia: vehicleId, startDate, endDate, reason'
      });
    }

    // Get username from authenticated user for createdBy
    const createdBy = (req as any).user?.username || 'system';

    const unavailability = await postgresDatabase.createVehicleUnavailability({
      vehicleId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      type,
      notes,
      priority,
      recurring,
      recurringConfig,
      createdBy
    });

    // 🗄️ CLEAR CACHE: Invalidate calendar cache after unavailability creation
    invalidateRelatedCache('unavailability', 'create');

    res.status(201).json({
      success: true,
      data: unavailability,
      message: 'Nedostupnosť vozidla úspešne vytvorená'
    });
  } catch (error: unknown) {
    console.error('Create vehicle unavailability error:', error);
    
    // Handle duplicate constraint error
    const dbError = error as { code?: string; constraint?: string };
    if (dbError.code === '23505' && dbError.constraint === 'unique_vehicle_period') {
      return res.status(409).json({
        success: false,
        error: 'Nedostupnosť pre toto vozidlo v danom období už existuje. Skúste iný dátumový rozsah alebo typ nedostupnosti.',
        code: 'DUPLICATE_UNAVAILABILITY'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error) || 'Chyba pri vytváraní nedostupnosti vozidla'
    });
  }
});

// PUT /api/vehicle-unavailability/:id - Aktualizácia nedostupnosti
router.put('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse<VehicleUnavailability>>) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Parse dates if provided
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    const unavailability = await postgresDatabase.updateVehicleUnavailability(id, updateData);

    // 🗄️ CLEAR CACHE: Invalidate calendar cache after unavailability update
    invalidateRelatedCache('unavailability', 'update');

    res.json({
      success: true,
      data: unavailability,
      message: 'Nedostupnosť vozidla úspešne aktualizovaná'
    });
  } catch (error: unknown) {
    console.error('Update vehicle unavailability error:', error);
    
    if (error instanceof Error ? error.message : String(error) === 'Nedostupnosť vozidla nenájdená') {
      return res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error) || 'Chyba pri aktualizácii nedostupnosti vozidla'
    });
  }
});

// DELETE /api/vehicle-unavailability/:id - Zmazanie nedostupnosti
router.delete('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const deleted = await postgresDatabase.deleteVehicleUnavailability(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Nedostupnosť vozidla nenájdená'
      });
    }

    // 🗄️ CLEAR CACHE: Invalidate calendar cache after unavailability deletion
    invalidateRelatedCache('unavailability', 'delete');

    res.json({
      success: true,
      message: 'Nedostupnosť vozidla úspešne zmazaná'
    });
  } catch (error) {
    console.error('Delete vehicle unavailability error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri mazaní nedostupnosti vozidla'
    });
  }
});

// GET /api/vehicle-unavailability/date-range/:startDate/:endDate - Nedostupnosti pre kalendár
router.get('/date-range/:startDate/:endDate', authenticateToken, async (req: Request, res: Response<ApiResponse<VehicleUnavailability[]>>) => {
  try {
    const { startDate, endDate } = req.params;
    
    const unavailabilities = await postgresDatabase.getUnavailabilitiesForDateRange(
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      data: unavailabilities
    });
  } catch (error) {
    console.error('Get unavailabilities for date range error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní nedostupností pre dátumový rozsah'
    });
  }
});

export default router; 