import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { VehicleDocument, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/vehicle-documents - Získanie všetkých dokumentov vozidiel alebo pre konkrétne vozidlo
router.get('/', authenticateToken, async (req: Request, res: Response<ApiResponse<VehicleDocument[]>>) => {
  try {
    const { vehicleId } = req.query;
    const documents = await postgresDatabase.getVehicleDocuments(vehicleId as string);
    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Get vehicle documents error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní dokumentov vozidiel'
    });
  }
});

// POST /api/vehicle-documents - Vytvorenie nového dokumentu vozidla
router.post('/', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { vehicleId, documentType, validFrom, validTo, documentNumber, price, notes, filePath } = req.body;

    if (!vehicleId || !documentType || !validTo) {
      return res.status(400).json({
        success: false,
        error: 'vehicleId, documentType a validTo sú povinné polia'
      });
    }

    const createdDocument = await postgresDatabase.createVehicleDocument({
      vehicleId,
      documentType,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validTo: new Date(validTo),
      documentNumber,
      price,
      notes,
      filePath
    });

    res.status(201).json({
      success: true,
      message: 'Dokument vozidla úspešne vytvorený',
      data: createdDocument
    });

  } catch (error) {
    console.error('Create vehicle document error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vytváraní dokumentu vozidla'
    });
  }
});

// PUT /api/vehicle-documents/:id - Aktualizácia dokumentu vozidla
router.put('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { vehicleId, documentType, validFrom, validTo, documentNumber, price, notes, filePath } = req.body;

    if (!vehicleId || !documentType || !validTo) {
      return res.status(400).json({
        success: false,
        error: 'vehicleId, documentType a validTo sú povinné polia'
      });
    }

    const updatedDocument = await postgresDatabase.updateVehicleDocument(id, {
      vehicleId,
      documentType,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validTo: new Date(validTo),
      documentNumber,
      price,
      notes,
      filePath
    });

    res.json({
      success: true,
      message: 'Dokument vozidla úspešne aktualizovaný',
      data: updatedDocument
    });

  } catch (error) {
    console.error('Update vehicle document error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri aktualizácii dokumentu vozidla'
    });
  }
});

// DELETE /api/vehicle-documents/:id - Vymazanie dokumentu vozidla
router.delete('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;

    await postgresDatabase.deleteVehicleDocument(id);

    res.json({
      success: true,
      message: 'Dokument vozidla úspešne vymazaný'
    });

  } catch (error) {
    console.error('Delete vehicle document error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vymazávaní dokumentu vozidla'
    });
  }
});

export default router; 