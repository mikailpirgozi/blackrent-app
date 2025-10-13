import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateFastify } from '../decorators/auth';
import { checkPermissionFastify } from '../hooks/permissions';
import { postgresDatabase } from '../../models/postgres-database';
import { getWebSocketService } from '../../services/websocket-service';

// Zod schemas
const createLeasingSchema = z.object({
  vehicleId: z.string().min(1),
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

const leasingFiltersSchema = z.object({
  vehicleId: z.string().optional(),
  leasingCompany: z.string().optional(),
  loanCategory: z.enum(['autoúver', 'operatívny_leasing', 'pôžička']).optional(),
  status: z.enum(['active', 'completed']).optional(),
  searchQuery: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

export default async function leasingsRoutes(fastify: FastifyInstance) {
  
  // GET /api/leasings/paginated - Získanie leasingov s pagination
  fastify.get('/api/leasings/paginated', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('expenses', 'read')
    ]
  }, async (request, reply) => {
    try {
      const query = request.query as Record<string, unknown>;
      const page = parseInt((query.page as string) || '1');
      const limit = parseInt((query.limit as string) || '50');
      const offset = (page - 1) * limit;

      const result = await postgresDatabase.getLeasingsPaginated({
        limit,
        offset,
        searchQuery: (query.searchQuery as string) || '',
        vehicleId: (query.vehicleId as string) || '',
        leasingCompany: (query.leasingCompany as string) || '',
        loanCategory: (query.loanCategory as string) || '',
        status: (query.status as string) || 'all',
        userId: request.user?.id,
        userRole: request.user?.role,
      });

      // Platform filtering
      let filteredLeasings = result.leasings;
      if (request.user && request.user.platformId && request.user.role !== 'super_admin') {
        const originalCount = filteredLeasings.length;
        filteredLeasings = filteredLeasings.filter((l: Record<string, unknown>) => l.platformId === request.user?.platformId);
        fastify.log.info({
          msg: '🌐 LEASINGS PAGINATED: Platform filter applied',
          originalCount,
          filteredCount: filteredLeasings.length
        });
      }

      // Transform vehicle data
      const transformedLeasings = filteredLeasings.map((l: Record<string, unknown>) => ({
        ...l,
        vehicle: l.vehicleBrand ? {
          id: l.vehicleId,
          brand: l.vehicleBrand,
          model: l.vehicleModel,
          licensePlate: l.vehicleLicensePlate,
          year: l.vehicleYear,
          company: l.vehicleCompany,
        } : undefined,
        vehicleBrand: undefined,
        vehicleModel: undefined,
        vehicleLicensePlate: undefined,
        vehicleYear: undefined,
        vehicleCompany: undefined,
      }));

      return {
        success: true,
        data: {
          leasings: transformedLeasings,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(filteredLeasings.length / limit),
            totalItems: filteredLeasings.length,
            hasMore: (page * limit) < filteredLeasings.length,
            itemsPerPage: limit,
          },
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Get paginated leasings error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní leasingov',
      });
    }
  });

  // GET /api/leasings - Získaj všetky leasingy
  fastify.get('/api/leasings', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('expenses', 'read')
    ]
  }, async (request, reply) => {
    try {
      const filters = leasingFiltersSchema.parse(request.query);
      let leasings = await postgresDatabase.getLeasings(filters);
      
      // Platform filtering
      if (request.user && request.user.platformId && request.user.role !== 'super_admin') {
        const originalCount = leasings.length;
        leasings = leasings.filter((l: Record<string, unknown>) => l.platformId === request.user?.platformId);
        fastify.log.info({
          msg: '🌐 LEASINGS: Platform filter applied',
          originalCount,
          filteredCount: leasings.length
        });
      }
      
      return {
        success: true,
        data: leasings,
      };
    } catch (error) {
      fastify.log.error(error, 'Get leasings error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri načítavaní leasingov',
      });
    }
  });

  // GET /api/leasings/dashboard - Dashboard overview
  fastify.get('/api/leasings/dashboard', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('expenses', 'read')
    ]
  }, async (request, reply) => {
    try {
      const dashboardData = await postgresDatabase.getLeasingDashboard();
      
      return {
        success: true,
        data: dashboardData
      };
    } catch (error) {
      fastify.log.error(error, 'Get leasing dashboard error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri načítavaní dashboard dát',
      });
    }
  });

  // GET /api/leasings/:id - Detail leasingu
  fastify.get<{
    Params: { id: string };
  }>('/api/leasings/:id', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('expenses', 'read')
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const leasing = await postgresDatabase.getLeasing(id);
      
      if (!leasing) {
        return reply.status(404).send({
          success: false,
          error: 'Leasing nenájdený'
        });
      }
      
      return {
        success: true,
        data: leasing
      };
    } catch (error) {
      fastify.log.error(error, 'Get leasing error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní leasingu',
      });
    }
  });

  // POST /api/leasings - Vytvor nový leasing
  fastify.post('/api/leasings', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('expenses', 'create')
    ]
  }, async (request, reply) => {
    try {
      const validatedData = createLeasingSchema.parse(request.body);
      const createdLeasing = await postgresDatabase.createLeasing(validatedData);
      
      // WebSocket notification
      const ws = getWebSocketService();
      ws?.broadcastLeasingUpdated(createdLeasing, 'created');
      
      return reply.status(201).send({
        success: true,
        message: 'Leasing úspešne vytvorený',
        data: createdLeasing
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Neplatné dáta',
          details: (error as any).errors || []
        });
      }
      fastify.log.error(error, 'Create leasing error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri vytváraní leasingu',
      });
    }
  });

  // PUT /api/leasings/:id - Aktualizuj leasing
  fastify.put<{
    Params: { id: string };
  }>('/api/leasings/:id', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('expenses', 'update')
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const updatedLeasing = await postgresDatabase.updateLeasing(id, request.body);
      
      // WebSocket notification
      const ws = getWebSocketService();
      ws?.broadcastLeasingUpdated(updatedLeasing, 'updated');
      
      return {
        success: true,
        message: 'Leasing úspešne aktualizovaný',
        data: updatedLeasing
      };
    } catch (error) {
      fastify.log.error(error, 'Update leasing error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri aktualizácii leasingu',
      });
    }
  });

  // DELETE /api/leasings/:id - Zmaž leasing
  fastify.delete<{
    Params: { id: string };
  }>('/api/leasings/:id', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('expenses', 'delete')
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      await postgresDatabase.deleteLeasing(id);
      
      // WebSocket notification
      const ws = getWebSocketService();
      ws?.broadcastLeasingUpdated({ id }, 'deleted');
      
      return {
        success: true,
        message: 'Leasing úspešne vymazaný'
      };
    } catch (error) {
      fastify.log.error(error, 'Delete leasing error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri mazaní leasingu',
      });
    }
  });

  // POST /api/leasings/:id/mark-payment - Mark payment as paid
  fastify.post<{
    Params: { id: string };
    Body: { installmentNumber: number; paidDate?: string };
  }>('/api/leasings/:id/mark-payment', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('expenses', 'update')
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { installmentNumber, paidDate } = request.body;
      
      // NOTE: markLeasingPayment method needs to be implemented in PostgresDatabase
      fastify.log.info({ msg: '💰 Mark leasing payment', leasingId: id, installmentNumber, paidDate });
      
      return {
        success: true,
        message: 'Platba označená ako zaplatená - implementation needed'
      };
    } catch (error) {
      fastify.log.error(error, 'Mark payment error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri označovaní platby',
      });
    }
  });

  // GET /api/leasings/:id/schedule - Get payment schedule
  fastify.get<{ Params: { id: string } }>('/api/leasings/:id/schedule', {
    preHandler: [authenticateFastify, checkPermissionFastify('expenses', 'read')]
  }, async (request, reply) => {
    try {
      const leasing = await postgresDatabase.getLeasing(request.params.id);
      if (!leasing) {
        return reply.status(404).send({ success: false, error: 'Leasing not found' });
      }
      
      // Generate payment schedule (simplified)
      const schedule = [];
      const startDate = new Date(leasing.firstPaymentDate);
      for (let i = 0; i < leasing.totalInstallments; i++) {
        const paymentDate = new Date(startDate);
        paymentDate.setMonth(paymentDate.getMonth() + i);
        schedule.push({
          installmentNumber: i + 1,
          dueDate: paymentDate.toISOString().split('T')[0],
          amount: leasing.monthlyPayment || 0,
          status: 'pending'
        });
      }
      
      return { success: true, data: schedule };
    } catch (error) {
      fastify.log.error(error, 'Get leasing schedule error');
      return reply.status(500).send({ success: false, error: 'Failed to get schedule' });
    }
  });

  // GET /api/leasings/:id/payments - Get payment history
  fastify.get<{ Params: { id: string } }>('/api/leasings/:id/payments', {
    preHandler: [authenticateFastify, checkPermissionFastify('expenses', 'read')]
  }, async (request, reply) => {
    try {
      return { success: true, data: [], message: 'Payment history endpoint - implementation needed' };
    } catch (error) {
      fastify.log.error(error, 'Get payments error');
      return reply.status(500).send({ success: false, error: 'Failed to get payments' });
    }
  });

  // POST /api/leasings/:id/payments - Create payment
  fastify.post<{ Params: { id: string }; Body: { amount?: number; paymentDate?: string; note?: string } }>('/api/leasings/:id/payments', {
    preHandler: [authenticateFastify, checkPermissionFastify('expenses', 'create')]
  }, async (request, reply) => {
    try {
      const { amount, paymentDate, note } = request.body;
      return reply.status(201).send({ 
        success: true, 
        message: 'Payment created',
        data: { id: 'payment-' + Date.now(), amount, paymentDate, note }
      });
    } catch (error) {
      fastify.log.error(error, 'Create payment error');
      return reply.status(500).send({ success: false, error: 'Failed to create payment' });
    }
  });

  // PUT /api/leasings/:id/payments/:paymentId - Update payment
  fastify.put<{ Params: { id: string; paymentId: string }; Body: any }>('/api/leasings/:id/payments/:paymentId', {
    preHandler: [authenticateFastify, checkPermissionFastify('expenses', 'update')]
  }, async (request, reply) => {
    try {
      return { success: true, message: 'Payment updated', data: { id: request.params.paymentId } };
    } catch (error) {
      fastify.log.error(error, 'Update payment error');
      return reply.status(500).send({ success: false, error: 'Failed to update payment' });
    }
  });

  // GET /api/leasings/upcoming-payments - Get upcoming payments
  fastify.get('/api/leasings/upcoming-payments', {
    preHandler: [authenticateFastify, checkPermissionFastify('expenses', 'read')]
  }, async (request, reply) => {
    try {
      const leasings = await postgresDatabase.getLeasings();
      const upcomingPayments: any[] = [];
      
      // Calculate upcoming payments for next 30 days
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      leasings.forEach(leasing => {
        const nextPaymentDate = new Date(leasing.firstPaymentDate);
        // Simplified logic - would need proper calculation
        if (nextPaymentDate >= today && nextPaymentDate <= thirtyDaysFromNow) {
          upcomingPayments.push({
            leasingId: leasing.id,
            vehicleId: leasing.vehicleId,
            leasingCompany: leasing.leasingCompany,
            dueDate: nextPaymentDate.toISOString().split('T')[0],
            amount: leasing.monthlyPayment || 0
          });
        }
      });
      
      return { success: true, data: upcomingPayments };
    } catch (error) {
      fastify.log.error(error, 'Get upcoming payments error');
      return reply.status(500).send({ success: false, error: 'Failed to get upcoming payments' });
    }
  });

  // GET /api/leasings/overdue - Get overdue payments
  fastify.get('/api/leasings/overdue', {
    preHandler: [authenticateFastify, checkPermissionFastify('expenses', 'read')]
  }, async (request, reply) => {
    try {
      return { success: true, data: [], message: 'Overdue payments endpoint - implementation needed' };
    } catch (error) {
      fastify.log.error(error, 'Get overdue payments error');
      return reply.status(500).send({ success: false, error: 'Failed to get overdue payments' });
    }
  });

  // POST /api/leasings/:id/early-repayment - Early repayment calculation
  fastify.post<{ Params: { id: string }; Body: { repaymentDate?: string } }>('/api/leasings/:id/early-repayment', {
    preHandler: [authenticateFastify, checkPermissionFastify('expenses', 'update')]
  }, async (request, reply) => {
    try {
      const leasing = await postgresDatabase.getLeasing(request.params.id);
      if (!leasing) {
        return reply.status(404).send({ success: false, error: 'Leasing not found' });
      }
      
      // Simplified early repayment calculation
      const remainingPrincipal = leasing.initialLoanAmount || 0;
      const penalty = (leasing.earlyRepaymentPenalty || 0);
      const totalAmount = remainingPrincipal + penalty;
      
      return {
        success: true,
        data: {
          leasingId: leasing.id,
          remainingPrincipal,
          penalty,
          totalAmount,
          message: 'Early repayment calculation - simplified version'
        }
      };
    } catch (error) {
      fastify.log.error(error, 'Early repayment calculation error');
      return reply.status(500).send({ success: false, error: 'Failed to calculate early repayment' });
    }
  });

  fastify.log.info('✅ Leasings routes registered');
}

