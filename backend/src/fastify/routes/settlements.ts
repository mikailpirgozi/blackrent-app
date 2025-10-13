import type { FastifyInstance } from 'fastify';
import { authenticateFastify } from '../decorators/auth';
import { checkPermissionFastify } from '../hooks/permissions';
import { postgresDatabase } from '../../models/postgres-database';

export default async function settlementsRoutes(fastify: FastifyInstance) {
  // GET /api/settlements
  fastify.get('/api/settlements', {
    preHandler: [authenticateFastify, checkPermissionFastify('settlements', 'read')]
  }, async (request, reply) => {
    try {
      const settlements = await postgresDatabase.getSettlements();
      return reply.send({ success: true, data: settlements });
    } catch (error) {
      fastify.log.error(error, 'Get settlements error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní vyúčtovaní'
      });
    }
  });

  // GET /api/settlements/:id
  fastify.get<{ Params: { id: string } }>('/api/settlements/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('settlements', 'read')]
  }, async (request, reply) => {
    try {
      const settlement = await postgresDatabase.getSettlement(request.params.id);
      if (!settlement) {
        return reply.status(404).send({ success: false, error: 'Vyúčtovanie nenájdené' });
      }
      return reply.send({ success: true, data: settlement });
    } catch (error) {
      fastify.log.error(error, 'Get settlement error');
      return reply.status(500).send({ success: false, error: 'Chyba pri získavaní vyúčtovania' });
    }
  });

  // POST /api/settlements
  fastify.post('/api/settlements', {
    preHandler: [authenticateFastify, checkPermissionFastify('settlements', 'create')]
  }, async (request, reply) => {
    try {
      const settlementData = request.body as Record<string, unknown>;
      
      // Convert period object to string if needed
      let periodString = 'Current Period';
      if (settlementData.period && typeof settlementData.period === 'object') {
        const period = settlementData.period as { from?: Date; to?: Date };
        if (period.from && period.to) {
          periodString = `${new Date(period.from).toISOString().split('T')[0]} - ${new Date(period.to).toISOString().split('T')[0]}`;
        }
      } else if (typeof settlementData.period === 'string') {
        periodString = settlementData.period;
      }
      
      const newSettlement = await postgresDatabase.createSettlement({
        period: periodString,
        company: settlementData.company ? String(settlementData.company) : undefined,
        totalIncome: Number(settlementData.totalIncome || 0),
        totalExpenses: Number(settlementData.totalExpenses || 0),
        commission: Number(settlementData.totalCommission || 0),
        totalToOwner: Number(settlementData.totalToOwner || 0),
        profit: Number(settlementData.profit || 0),
        summary: settlementData.summary ? String(settlementData.summary) : undefined
      });
      fastify.log.info({ msg: '✅ Settlement created', id: newSettlement.id });
      return reply.status(201).send({ success: true, data: newSettlement });
    } catch (error) {
      fastify.log.error(error, 'Create settlement error');
      return reply.status(500).send({ success: false, error: 'Chyba pri vytváraní vyúčtovania' });
    }
  });

  // PUT /api/settlements/:id
  fastify.put<{ Params: { id: string } }>('/api/settlements/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('settlements', 'update')]
  }, async (request, reply) => {
    try {
      const settlementData = request.body as Record<string, unknown>;
      await postgresDatabase.updateSettlement(request.params.id, {
        totalIncome: settlementData.totalIncome ? Number(settlementData.totalIncome) : undefined,
        totalExpenses: settlementData.totalExpenses ? Number(settlementData.totalExpenses) : undefined,
        commission: settlementData.totalCommission ? Number(settlementData.totalCommission) : undefined,
        profit: settlementData.profit ? Number(settlementData.profit) : undefined
      });
      const updatedSettlement = await postgresDatabase.getSettlement(request.params.id);
      fastify.log.info({ msg: '✅ Settlement updated', id: request.params.id });
      return reply.send({ success: true, data: updatedSettlement });
    } catch (error) {
      fastify.log.error(error, 'Update settlement error');
      return reply.status(500).send({ success: false, error: 'Chyba pri aktualizácii vyúčtovania' });
    }
  });

  // DELETE /api/settlements/:id
  fastify.delete<{ Params: { id: string } }>('/api/settlements/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('settlements', 'delete')]
  }, async (request, reply) => {
    try {
      await postgresDatabase.deleteSettlement(request.params.id);
      fastify.log.info({ msg: '🗑️ Settlement deleted', id: request.params.id });
      return reply.send({ success: true, message: 'Vyúčtovanie bolo odstránené' });
    } catch (error) {
      fastify.log.error(error, 'Delete settlement error');
      return reply.status(500).send({ success: false, error: 'Chyba pri mazaní vyúčtovania' });
    }
  });

  // GET /api/settlements/:id/pdf - Generate PDF for settlement
  fastify.get<{ Params: { id: string } }>('/api/settlements/:id/pdf', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const settlement = await postgresDatabase.getSettlement(request.params.id);
      
      if (!settlement) {
        return reply.status(404).send({
          success: false,
          error: 'Vyúčtovanie nenájdené'
        });
      }

      // Simple PDF generation response (actual PDF generation would require pdf-lib or similar)
      fastify.log.info({ msg: '📄 Settlement PDF requested', id: request.params.id });
      
      return reply.send({
        success: true,
        message: 'PDF generation endpoint - implementation needed',
        data: {
          settlementId: settlement.id,
          period: settlement.period,
          company: settlement.company,
          totalIncome: settlement.totalIncome,
          totalExpenses: settlement.totalExpenses,
          profit: settlement.profit
        }
      });
    } catch (error) {
      fastify.log.error(error, 'Settlement PDF error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri generovaní PDF'
      });
    }
  });

  fastify.log.info('✅ Settlements routes registered');
}

