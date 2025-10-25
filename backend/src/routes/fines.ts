import express from 'express';
import type { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { postgresDatabase } from '../models/postgres-database';
import type { ApiResponse } from '../types';

const router = express.Router();

// GET /api/fines - Získanie všetkých pokút
router.get(
  '/',
  authenticateToken,
  checkPermission('vehicles', 'read'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { vehicleId } = req.query;

      const fines = await postgresDatabase.getFines(
        vehicleId as string | undefined
      );

      res.json({
        success: true,
        data: fines,
      });
    } catch (error) {
      console.error('Get fines error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri načítaní pokút',
      });
    }
  }
);

// POST /api/fines - Vytvorenie novej pokuty
router.post(
  '/',
  authenticateToken,
  checkPermission('vehicles', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const {
        vehicleId,
        customerId,
        fineDate,
        amount,
        amountLate,
        country,
        enforcementCompany,
        isPaid,
        ownerPaidDate,
        customerPaidDate,
        notes,
        filePaths,
      } = req.body;

      if (!vehicleId || !fineDate || !amount) {
        return res.status(400).json({
          success: false,
          error: 'vehicleId, fineDate a amount sú povinné polia',
        });
      }

      const createdFine = await postgresDatabase.createFine({
        vehicleId,
        customerId,
        fineDate: new Date(
          typeof fineDate === 'string' ? fineDate.split('T')[0] : fineDate
        ),
        amount,
        amountLate,
        country,
        enforcementCompany,
        isPaid,
        ownerPaidDate: ownerPaidDate
          ? new Date(
              typeof ownerPaidDate === 'string'
                ? ownerPaidDate.split('T')[0]
                : ownerPaidDate
            )
          : undefined,
        customerPaidDate: customerPaidDate
          ? new Date(
              typeof customerPaidDate === 'string'
                ? customerPaidDate.split('T')[0]
                : customerPaidDate
            )
          : undefined,
        notes,
        filePaths: filePaths || [],
      });

      res.status(201).json({
        success: true,
        message: 'Pokuta úspešne vytvorená',
        data: createdFine,
      });
    } catch (error) {
      console.error('Create fine error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri vytváraní pokuty',
      });
    }
  }
);

// PUT /api/fines/:id - Aktualizácia pokuty
router.put(
  '/:id',
  authenticateToken,
  checkPermission('vehicles', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;
      const {
        vehicleId,
        customerId,
        fineDate,
        amount,
        amountLate,
        country,
        enforcementCompany,
        isPaid,
        ownerPaidDate,
        customerPaidDate,
        notes,
        filePaths,
      } = req.body;

      if (!vehicleId || !fineDate || !amount) {
        return res.status(400).json({
          success: false,
          error: 'vehicleId, fineDate a amount sú povinné polia',
        });
      }

      const updatedFine = await postgresDatabase.updateFine(id, {
        vehicleId,
        customerId,
        fineDate: new Date(
          typeof fineDate === 'string' ? fineDate.split('T')[0] : fineDate
        ),
        amount,
        amountLate,
        country,
        enforcementCompany,
        isPaid,
        ownerPaidDate: ownerPaidDate
          ? new Date(
              typeof ownerPaidDate === 'string'
                ? ownerPaidDate.split('T')[0]
                : ownerPaidDate
            )
          : undefined,
        customerPaidDate: customerPaidDate
          ? new Date(
              typeof customerPaidDate === 'string'
                ? customerPaidDate.split('T')[0]
                : customerPaidDate
            )
          : undefined,
        notes,
        filePaths: filePaths || [],
      });

      res.json({
        success: true,
        message: 'Pokuta úspešne aktualizovaná',
        data: updatedFine,
      });
    } catch (error) {
      console.error('Update fine error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri aktualizácii pokuty',
      });
    }
  }
);

// DELETE /api/fines/:id - Zmazanie pokuty
router.delete(
  '/:id',
  authenticateToken,
  checkPermission('vehicles', 'delete'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;

      await postgresDatabase.deleteFine(id);

      res.json({
        success: true,
        message: 'Pokuta úspešne zmazaná',
      });
    } catch (error) {
      console.error('Delete fine error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri mazaní pokuty',
      });
    }
  }
);

export default router;

