import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { postgresDatabase } from '../models/postgres-database';
import { BankAccountsService } from '../services/bank-accounts.service';
import { PaymentOrdersService } from '../services/payment-orders.service';
import type { ApiResponse } from '../types';
import {
  CreateBankAccountSchema,
  CreatePaymentOrderSchema,
  UpdateBankAccountSchema,
  UpdatePaymentStatusSchema,
} from '../types/payment-order.types';

const router: Router = Router();

// Inicializuj služby
const paymentOrdersService = new PaymentOrdersService(postgresDatabase.dbPool);
const bankAccountsService = new BankAccountsService(postgresDatabase.dbPool);

// ============================================================================
// BANK ACCOUNTS ENDPOINTS
// ⚠️ DÔLEŽITÉ: Tieto routes MUSIA byť PRED generickými /:id routes!
// ============================================================================

/**
 * GET /api/payment-orders/bank-accounts
 * Načíta všetky bankové účty
 */
router.get(
  '/bank-accounts',
  authenticateToken,
  checkPermission('settings', 'read'),
  async (_req: Request, res: Response<ApiResponse>) => {
    try {
      const bankAccounts = await bankAccountsService.findAll();

      res.json({
        success: true,
        data: bankAccounts,
      });
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bank accounts',
      });
    }
  }
);

/**
 * GET /api/payment-orders/bank-accounts/active
 * Načíta len aktívne bankové účty
 */
router.get(
  '/bank-accounts/active',
  authenticateToken,
  checkPermission('rentals', 'read'),
  async (_req: Request, res: Response<ApiResponse>) => {
    try {
      const bankAccounts = await bankAccountsService.findActive();

      res.json({
        success: true,
        data: bankAccounts,
      });
    } catch (error) {
      console.error('Error fetching active bank accounts:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch active bank accounts',
      });
    }
  }
);

/**
 * POST /api/payment-orders/bank-accounts
 * Vytvorí nový bankový účet
 */
router.post(
  '/bank-accounts',
  authenticateToken,
  checkPermission('settings', 'create'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      // Validuj input
      const dto = CreateBankAccountSchema.parse(req.body);

      const bankAccount = await bankAccountsService.create(dto);

      res.status(201).json({
        success: true,
        data: bankAccount,
        message: 'Bank account created successfully',
      });
    } catch (error) {
      console.error('Error creating bank account:', error);

      if (error instanceof z.ZodError) {
        return (res as any).status(400).json({
          error: 'Validation error',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create bank account',
      });
    }
  }
);

/**
 * PATCH /api/payment-orders/bank-accounts/:id
 * Aktualizuje bankový účet
 */
router.patch(
  '/bank-accounts/:id',
  authenticateToken,
  checkPermission('settings', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Bank account ID is required',
        });
      }

      // Validuj input
      const dto = UpdateBankAccountSchema.parse(req.body);

      const bankAccount = await bankAccountsService.update(id, dto);

      res.json({
        success: true,
        data: bankAccount,
        message: 'Bank account updated successfully',
      });
    } catch (error) {
      console.error('Error updating bank account:', error);

      if (error instanceof z.ZodError) {
        return (res as any).status(400).json({
          error: 'Validation error',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update bank account',
      });
    }
  }
);

/**
 * DELETE /api/payment-orders/bank-accounts/:id
 * Vymaže bankový účet
 */
router.delete(
  '/bank-accounts/:id',
  authenticateToken,
  checkPermission('settings', 'delete'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Bank account ID is required',
        });
      }

      await bankAccountsService.delete(id);

      res.json({
        success: true,
        message: 'Bank account deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting bank account:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete bank account',
      });
    }
  }
);

// ============================================================================
// PAYMENT ORDERS ENDPOINTS
// ⚠️ DÔLEŽITÉ: Tieto generické routes MUSIA byť PO špecifických routes!
// ============================================================================

/**
 * POST /api/payment-orders
 * Vytvorí nový platobný príkaz
 */
router.post(
  '/',
  authenticateToken,
  checkPermission('rentals', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      // Validuj input
      const dto = CreatePaymentOrderSchema.parse(req.body);

      // Vytvor platobný príkaz
      const paymentOrder = await paymentOrdersService.create(dto, req.user?.id);

      res.status(201).json({
        success: true,
        data: paymentOrder,
        message: 'Payment order created successfully',
      });
    } catch (error) {
      console.error('Error creating payment order:', error);

      if (error instanceof z.ZodError) {
        return (res as any).status(400).json({
          error: 'Validation error',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment order',
      });
    }
  }
);

/**
 * GET /api/payment-orders/rental/:rentalId
 * Načíta všetky platobné príkazy pre rental
 */
router.get(
  '/rental/:rentalId',
  authenticateToken,
  checkPermission('rentals', 'read'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { rentalId } = req.params;

      if (!rentalId) {
        return res.status(400).json({
          success: false,
          error: 'Rental ID is required',
        });
      }

      const paymentOrders = await paymentOrdersService.findByRental(rentalId);

      res.json({
        success: true,
        data: paymentOrders,
      });
    } catch (error) {
      console.error('Error fetching payment orders:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch payment orders',
      });
    }
  }
);

/**
 * GET /api/payment-orders/:id/pdf
 * Stiahne PDF platobného príkazu
 */
router.get(
  '/:id/pdf',
  authenticateToken,
  checkPermission('rentals', 'read'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Payment order ID is required',
        });
      }

      const pdfBuffer = await paymentOrdersService.getPDFBuffer(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="platobny-prikaz-${id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to download PDF',
      });
    }
  }
);

/**
 * PATCH /api/payment-orders/:id/status
 * Aktualizuje status platby
 */
router.patch(
  '/:id/status',
  authenticateToken,
  checkPermission('rentals', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Payment order ID is required',
        });
      }

      // Validuj input
      const dto = UpdatePaymentStatusSchema.parse(req.body);

      const paymentOrder = await paymentOrdersService.updatePaymentStatus(id, dto);

      res.json({
        success: true,
        data: paymentOrder,
        message: 'Payment status updated successfully',
      });
    } catch (error) {
      console.error('Error updating payment status:', error);

      if (error instanceof z.ZodError) {
        return (res as any).status(400).json({
          error: 'Validation error',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update payment status',
      });
    }
  }
);

/**
 * GET /api/payment-orders/:id
 * Načíta konkrétny platobný príkaz
 * ⚠️ MUSÍ byť POSLEDNÉ aby nezachytávalo špecifické routes!
 */
router.get(
  '/:id',
  authenticateToken,
  checkPermission('rentals', 'read'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Payment order ID is required',
        });
      }

      const paymentOrder = await paymentOrdersService.findById(id);

      if (!paymentOrder) {
        return res.status(404).json({
          success: false,
          error: 'Payment order not found',
        });
      }

      res.json({
        success: true,
        data: paymentOrder,
      });
    } catch (error) {
      console.error('Error fetching payment order:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch payment order',
      });
    }
  }
);

export default router;

