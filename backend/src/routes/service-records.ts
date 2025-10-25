import express from 'express';
import type { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { postgresDatabase } from '../models/postgres-database';
import type { ApiResponse } from '../types';

const router = express.Router();

// GET /api/service-records - Získanie všetkých servisných záznamov
router.get(
  '/',
  authenticateToken,
  checkPermission('vehicles', 'read'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { vehicleId } = req.query;

      const serviceRecords = await postgresDatabase.getServiceRecords(
        vehicleId as string | undefined
      );

      res.json({
        success: true,
        data: serviceRecords,
      });
    } catch (error) {
      console.error('Get service records error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri načítaní servisných záznamov',
      });
    }
  }
);

// POST /api/service-records - Vytvorenie nového servisného záznamu
router.post(
  '/',
  authenticateToken,
  checkPermission('vehicles', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const {
        vehicleId,
        serviceDate,
        serviceProvider,
        kmState,
        description,
        price,
        filePaths,
      } = req.body;

      if (!vehicleId || !serviceDate) {
        return res.status(400).json({
          success: false,
          error: 'vehicleId a serviceDate sú povinné polia',
        });
      }

      const createdRecord = await postgresDatabase.createServiceRecord({
        vehicleId,
        serviceDate: new Date(
          typeof serviceDate === 'string'
            ? serviceDate.split('T')[0]
            : serviceDate
        ),
        serviceProvider,
        kmState,
        description,
        price,
        filePaths: filePaths || [],
      });

      res.status(201).json({
        success: true,
        message: 'Servisný záznam úspešne vytvorený',
        data: createdRecord,
      });
    } catch (error) {
      console.error('Create service record error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri vytváraní servisného záznamu',
      });
    }
  }
);

// PUT /api/service-records/:id - Aktualizácia servisného záznamu
router.put(
  '/:id',
  authenticateToken,
  checkPermission('vehicles', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;
      const {
        vehicleId,
        serviceDate,
        serviceProvider,
        kmState,
        description,
        price,
        filePaths,
      } = req.body;

      if (!vehicleId || !serviceDate) {
        return res.status(400).json({
          success: false,
          error: 'vehicleId a serviceDate sú povinné polia',
        });
      }

      const updatedRecord = await postgresDatabase.updateServiceRecord(id, {
        vehicleId,
        serviceDate: new Date(
          typeof serviceDate === 'string'
            ? serviceDate.split('T')[0]
            : serviceDate
        ),
        serviceProvider,
        kmState,
        description,
        price,
        filePaths: filePaths || [],
      });

      res.json({
        success: true,
        message: 'Servisný záznam úspešne aktualizovaný',
        data: updatedRecord,
      });
    } catch (error) {
      console.error('Update service record error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri aktualizácii servisného záznamu',
      });
    }
  }
);

// DELETE /api/service-records/:id - Zmazanie servisného záznamu
router.delete(
  '/:id',
  authenticateToken,
  checkPermission('vehicles', 'delete'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;

      await postgresDatabase.deleteServiceRecord(id);

      res.json({
        success: true,
        message: 'Servisný záznam úspešne zmazaný',
      });
    } catch (error) {
      console.error('Delete service record error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri mazaní servisného záznamu',
      });
    }
  }
);

export default router;

