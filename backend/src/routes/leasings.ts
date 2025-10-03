/**
 * ===================================================================
 * LEASING ROUTES - API endpointy pre leasing management
 * ===================================================================
 * Created: 2025-10-02
 * Description: REST API pre CRUD operácie, payment tracking, documents
 * ===================================================================
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { cacheResponse, invalidateCache } from '../middleware/cache-middleware';
import { checkPermission } from '../middleware/permissions';
import { postgresDatabase } from '../models/postgres-database';
import type { ApiResponse, Leasing, LeasingDocument, PaymentScheduleItem } from '../types';

// Inline Zod schemas (validácia)
const createLeasingSchema = z.object({
  vehicleId: z.string().uuid(),
  leasingCompany: z.string().min(1),
  loanCategory: z.enum(['autoúver', 'operatívny_leasing', 'pôžička']),
  paymentType: z.enum(['anuita', 'lineárne', 'len_úrok']).default('anuita'),
  initialLoanAmount: z.number().positive(),
  totalInstallments: z.number().int().positive(),
  firstPaymentDate: z.string().or(z.date()),
  lastPaymentDate: z.string().or(z.date()).optional(),
  monthlyFee: z.number().nonnegative().default(0),
  processingFee: z.number().nonnegative().default(0),
  interestRate: z.number().nonnegative().optional(),
  rpmn: z.number().nonnegative().optional(),
  monthlyPayment: z.number().positive().optional(),
  totalMonthlyPayment: z.number().positive().optional(),
  earlyRepaymentPenalty: z.number().nonnegative().default(0),
  earlyRepaymentPenaltyType: z.enum(['percent_principal', 'fixed_amount']).default('percent_principal'),
  acquisitionPriceWithoutVAT: z.number().positive().optional(),
  acquisitionPriceWithVAT: z.number().positive().optional(),
  isNonDeductible: z.boolean().default(false),
});

const updateLeasingSchema = createLeasingSchema.partial();
const markPaymentSchema = z.object({
  installmentNumber: z.number().int().positive(),
  paidDate: z.string().or(z.date()).optional(),
});
const bulkMarkPaymentsSchema = z.object({
  installmentNumbers: z.array(z.number().int().positive()).min(1),
  paidDate: z.string().or(z.date()).optional(),
});
const uploadDocumentSchema = z.object({
  type: z.enum(['contract', 'payment_schedule', 'photo', 'other']),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  fileSize: z.number().positive(),
  mimeType: z.string().min(1),
});
const leasingFiltersSchema = z.object({
  vehicleId: z.string().uuid().optional(),
  leasingCompany: z.string().optional(),
  loanCategory: z.enum(['autoúver', 'operatívny_leasing', 'pôžička']).optional(),
  status: z.enum(['active', 'completed']).optional(),
  searchQuery: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

const router = Router();

// ===================================================================
// CRUD OPERÁCIE
// ===================================================================

/**
 * GET /api/leasings - Získaj všetky leasingy
 * Query params: vehicleId, leasingCompany, loanCategory, status, searchQuery, page, pageSize
 */
router.get(
  '/',
  authenticateToken,
  checkPermission('expenses', 'read'),
  cacheResponse('expenses', {
    ttl: 5 * 60 * 1000, // 5 minút
  }),
  async (req: Request, res: Response<ApiResponse<Leasing[]>>) => {
    try {
      // Validácia query params
      const filters = leasingFiltersSchema.parse(req.query);
      
      const leasings = await postgresDatabase.getLeasings(filters);
      
      res.json({
        success: true,
        data: leasings,
      });
    } catch (error) {
      console.error('Get leasings error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri načítavaní leasingov',
      });
    }
  }
);

/**
 * GET /api/leasings/:id - Získaj detail leasingu
 */
router.get(
  '/:id',
  authenticateToken,
  checkPermission('expenses', 'read'),
  async (req: Request, res: Response<ApiResponse<Leasing>>) => {
    try {
      const { id } = req.params;
      
      const leasing = await postgresDatabase.getLeasing(id);
      
      if (!leasing) {
        return res.status(404).json({
          success: false,
          error: 'Leasing nenájdený',
        });
      }
      
      res.json({
        success: true,
        data: leasing,
      });
    } catch (error) {
      console.error('Get leasing error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri načítavaní leasingu',
      });
    }
  }
);

/**
 * POST /api/leasings - Vytvor nový leasing
 */
router.post(
  '/',
  authenticateToken,
  checkPermission('expenses', 'create'),
  async (req: Request, res: Response<ApiResponse<Leasing>>) => {
    try {
      // Validácia vstupu
      const input = createLeasingSchema.parse(req.body);
      
      // Vytvor leasing (s automatickým generovaním payment schedule)
      const leasing = await postgresDatabase.createLeasing(input);
      
      // Invaliduj cache
      await invalidateCache('expenses');
      
      res.status(201).json({
        success: true,
        data: leasing,
        message: 'Leasing úspešne vytvorený',
      });
    } catch (error) {
      console.error('Create leasing error:', error);
      
      if (error instanceof Error && error.message.includes('validation')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Chyba pri vytváraní leasingu',
      });
    }
  }
);

/**
 * PUT /api/leasings/:id - Aktualizuj leasing
 */
router.put(
  '/:id',
  authenticateToken,
  checkPermission('expenses', 'update'),
  async (req: Request, res: Response<ApiResponse<Leasing>>) => {
    try {
      const { id } = req.params;
      
      // Validácia vstupu
      const input = updateLeasingSchema.parse(req.body);
      
      // Aktualizuj leasing
      const leasing = await postgresDatabase.updateLeasing(id, input);
      
      if (!leasing) {
        return res.status(404).json({
          success: false,
          error: 'Leasing nenájdený',
        });
      }
      
      // Invaliduj cache
      await invalidateCache('expenses');
      
      res.json({
        success: true,
        data: leasing,
        message: 'Leasing úspešne aktualizovaný',
      });
    } catch (error) {
      console.error('Update leasing error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri aktualizácii leasingu',
      });
    }
  }
);

/**
 * DELETE /api/leasings/:id - Zmaž leasing
 */
router.delete(
  '/:id',
  authenticateToken,
  checkPermission('expenses', 'delete'),
  async (req: Request, res: Response<ApiResponse<void>>) => {
    try {
      const { id } = req.params;
      
      const success = await postgresDatabase.deleteLeasing(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Leasing nenájdený',
        });
      }
      
      // Invaliduj cache
      await invalidateCache('expenses');
      
      res.json({
        success: true,
        message: 'Leasing úspešne zmazaný',
      });
    } catch (error) {
      console.error('Delete leasing error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri mazaní leasingu',
      });
    }
  }
);

// ===================================================================
// PAYMENT SCHEDULE OPERÁCIE
// ===================================================================

/**
 * GET /api/leasings/:id/schedule - Získaj splátkový kalendár
 */
router.get(
  '/:id/schedule',
  authenticateToken,
  checkPermission('expenses', 'read'),
  cacheResponse('expenses', {
    ttl: 5 * 60 * 1000, // 5 minút
  }),
  async (req: Request, res: Response<ApiResponse<PaymentScheduleItem[]>>) => {
    try {
      const { id } = req.params;
      
      const schedule = await postgresDatabase.getPaymentSchedule(id);
      
      res.json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      console.error('Get payment schedule error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri načítavaní splátkového kalendára',
      });
    }
  }
);

/**
 * POST /api/leasings/:id/schedule/:installmentNumber/pay - Označ splátku ako uhradenú
 */
router.post(
  '/:id/schedule/:installmentNumber/pay',
  authenticateToken,
  checkPermission('expenses', 'update'),
  async (req: Request, res: Response<ApiResponse<PaymentScheduleItem>>) => {
    try {
      const { id, installmentNumber } = req.params;
      
      // Validácia vstupu
      const input = markPaymentSchema.parse({
        installmentNumber: parseInt(installmentNumber),
        paidDate: req.body.paidDate,
      });
      
      const payment = await postgresDatabase.markPaymentAsPaid(id, input.installmentNumber, input.paidDate);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Splátka nenájdená',
        });
      }
      
      // Invaliduj cache
      await invalidateCache('expenses');
      
      res.json({
        success: true,
        data: payment,
        message: 'Splátka označená ako uhradená',
      });
    } catch (error) {
      console.error('Mark payment error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri označovaní splátky',
      });
    }
  }
);

/**
 * DELETE /api/leasings/:id/schedule/:installmentNumber/pay - Zruš úhradu splátky
 */
router.delete(
  '/:id/schedule/:installmentNumber/pay',
  authenticateToken,
  checkPermission('expenses', 'update'),
  async (req: Request, res: Response<ApiResponse<PaymentScheduleItem>>) => {
    try {
      const { id, installmentNumber } = req.params;
      
      const payment = await postgresDatabase.unmarkPayment(id, parseInt(installmentNumber));
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Splátka nenájdená',
        });
      }
      
      // Invaliduj cache
      await invalidateCache('expenses');
      
      res.json({
        success: true,
        data: payment,
        message: 'Úhrada splátky zrušená',
      });
    } catch (error) {
      console.error('Unmark payment error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri rušení úhrady',
      });
    }
  }
);

/**
 * POST /api/leasings/:id/schedule/bulk-pay - Bulk označenie splátok ako uhradených
 */
router.post(
  '/:id/schedule/bulk-pay',
  authenticateToken,
  checkPermission('expenses', 'update'),
  async (req: Request, res: Response<ApiResponse<PaymentScheduleItem[]>>) => {
    try {
      const { id } = req.params;
      
      // Validácia vstupu
      const input = bulkMarkPaymentsSchema.parse(req.body);
      
      const payments = await postgresDatabase.bulkMarkPayments(id, input.installmentNumbers, input.paidDate);
      
      // Invaliduj cache
      await invalidateCache('expenses');
      
      res.json({
        success: true,
        data: payments,
        message: `${payments.length} splátok označených ako uhradené`,
      });
    } catch (error) {
      console.error('Bulk mark payments error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri bulk označovaní splátok',
      });
    }
  }
);

// ===================================================================
// DOCUMENT OPERÁCIE
// ===================================================================

/**
 * GET /api/leasings/:id/documents - Získaj dokumenty leasingu
 */
router.get(
  '/:id/documents',
  authenticateToken,
  checkPermission('expenses', 'read'),
  async (req: Request, res: Response<ApiResponse<LeasingDocument[]>>) => {
    try {
      const { id } = req.params;
      
      const documents = await postgresDatabase.getLeasingDocuments(id);
      
      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      console.error('Get leasing documents error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri načítavaní dokumentov',
      });
    }
  }
);

/**
 * POST /api/leasings/:id/documents/upload - Upload dokumentu
 * Note: Samotný upload súborov sa robí cez /api/files endpoint,
 * tento endpoint len zaznamená metadata do DB
 */
router.post(
  '/:id/documents/upload',
  authenticateToken,
  checkPermission('expenses', 'update'),
  async (req: Request, res: Response<ApiResponse<LeasingDocument>>) => {
    try {
      const { id } = req.params;
      
      // Validácia vstupu
      const input = uploadDocumentSchema.parse(req.body);
      
      const document = await postgresDatabase.createLeasingDocument(id, input);
      
      // Invaliduj cache
      await invalidateCache('expenses');
      
      res.status(201).json({
        success: true,
        data: document,
        message: 'Dokument úspešne nahraný',
      });
    } catch (error) {
      console.error('Upload document error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri nahrávaní dokumentu',
      });
    }
  }
);

/**
 * DELETE /api/leasings/:id/documents/:documentId - Zmaž dokument
 */
router.delete(
  '/:id/documents/:documentId',
  authenticateToken,
  checkPermission('expenses', 'update'),
  async (req: Request, res: Response<ApiResponse<void>>) => {
    try {
      const { id, documentId } = req.params;
      
      const success = await postgresDatabase.deleteLeasingDocument(id, documentId);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Dokument nenájdený',
        });
      }
      
      // Invaliduj cache
      await invalidateCache('expenses');
      
      res.json({
        success: true,
        message: 'Dokument úspešne zmazaný',
      });
    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri mazaní dokumentu',
      });
    }
  }
);

/**
 * GET /api/leasings/:id/photos/zip - Stiahni všetky fotky ako ZIP
 * Note: Tento endpoint potrebuje implementáciu ZIP generátora
 */
router.get(
  '/:id/photos/zip',
  authenticateToken,
  checkPermission('expenses', 'read'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // TODO: Implementovať ZIP generation z R2 storage
      // Pre teraz vráť 501 Not Implemented
      res.status(501).json({
        success: false,
        error: 'ZIP download bude implementovaný neskôr',
      });
    } catch (error) {
      console.error('Download photos ZIP error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri sťahovaní fotiek',
      });
    }
  }
);

// ===================================================================
// DASHBOARD & ANALYTICS
// ===================================================================

/**
 * GET /api/leasings/dashboard - Dashboard overview
 */
router.get(
  '/dashboard',
  authenticateToken,
  checkPermission('expenses', 'read'),
  cacheResponse('expenses', {
    ttl: 2 * 60 * 1000, // 2 minúty
  }),
  async (req: Request, res: Response<ApiResponse<unknown>>) => {
    try {
      const dashboard = await postgresDatabase.getLeasingDashboard();
      
      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      console.error('Get leasing dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri načítavaní dashboard',
      });
    }
  }
);

export default router;

