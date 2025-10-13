import type { FastifyInstance } from 'fastify';
import { authenticateFastify } from '../decorators/auth';
import { checkPermissionFastify } from '../hooks/permissions';
import { postgresDatabase } from '../../models/postgres-database';

export default async function expensesRoutes(fastify: FastifyInstance) {
  // GET /api/expenses
  fastify.get('/api/expenses', {
    preHandler: [authenticateFastify, checkPermissionFastify('expenses', 'read')]
  }, async (request, reply) => {
    try {
      const expenses = await postgresDatabase.getExpenses();
      return { success: true, data: expenses };
    } catch (error) {
      fastify.log.error(error, 'Get expenses error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní výdavkov'
      });
    }
  });

  // GET /api/expenses/:id
  fastify.get<{ Params: { id: string } }>('/api/expenses/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('expenses', 'read')]
  }, async (request, reply) => {
    try {
      const expense = await postgresDatabase.getExpenseById(request.params.id);
      if (!expense) {
        return reply.status(404).send({ success: false, error: 'Výdavok nenájdený' });
      }
      return { success: true, data: expense };
    } catch (error) {
      fastify.log.error(error, 'Get expense error');
      return reply.status(500).send({ success: false, error: 'Chyba pri získavaní výdavku' });
    }
  });

  // POST /api/expenses
  fastify.post('/api/expenses', {
    preHandler: [authenticateFastify, checkPermissionFastify('expenses', 'create')]
  }, async (request, reply) => {
    try {
      const expenseData = request.body as Record<string, unknown>;
      const newExpense = await postgresDatabase.createExpense({
        description: String(expenseData.description || ''),
        amount: Number(expenseData.amount || 0),
        date: expenseData.date ? new Date(String(expenseData.date)) : new Date(),
        vehicleId: expenseData.vehicleId ? String(expenseData.vehicleId) : undefined,
        company: String(expenseData.company || ''),
        category: String(expenseData.category || 'other'),
        note: expenseData.note ? String(expenseData.note) : undefined
      });
      fastify.log.info({ msg: '✅ Expense created', id: newExpense.id });
      return reply.status(201).send({ success: true, data: newExpense });
    } catch (error) {
      fastify.log.error(error, 'Create expense error');
      return reply.status(500).send({ success: false, error: 'Chyba pri vytváraní výdavku' });
    }
  });

  // PUT /api/expenses/:id
  fastify.put<{ Params: { id: string } }>('/api/expenses/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('expenses', 'update')]
  }, async (request, reply) => {
    try {
      const expenseData = request.body as Record<string, unknown>;
      await postgresDatabase.updateExpense({
        id: request.params.id,
        description: String(expenseData.description || ''),
        amount: Number(expenseData.amount || 0),
        date: expenseData.date ? new Date(String(expenseData.date)) : new Date(),
        vehicleId: expenseData.vehicleId ? String(expenseData.vehicleId) : undefined,
        company: String(expenseData.company || ''),
        category: String(expenseData.category || 'other'),
        note: expenseData.note ? String(expenseData.note) : undefined
      });
      const updatedExpense = await postgresDatabase.getExpenseById(request.params.id);
      fastify.log.info({ msg: '✅ Expense updated', id: request.params.id });
      return { success: true, data: updatedExpense };
    } catch (error) {
      fastify.log.error(error, 'Update expense error');
      return reply.status(500).send({ success: false, error: 'Chyba pri aktualizácii výdavku' });
    }
  });

  // DELETE /api/expenses/:id
  fastify.delete<{ Params: { id: string } }>('/api/expenses/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('expenses', 'delete')]
  }, async (request, reply) => {
    try {
      await postgresDatabase.deleteExpense(request.params.id);
      fastify.log.info({ msg: '🗑️ Expense deleted', id: request.params.id });
      return { success: true, message: 'Výdavok bol odstránený' };
    } catch (error) {
      fastify.log.error(error, 'Delete expense error');
      return reply.status(500).send({ success: false, error: 'Chyba pri mazaní výdavku' });
    }
  });

  fastify.log.info('✅ Expenses routes registered');
}

