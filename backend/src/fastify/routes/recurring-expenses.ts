import type { FastifyInstance } from 'fastify';
import { authenticateFastify } from '../decorators/auth';
import { checkPermissionFastify } from '../hooks/permissions';
import { postgresDatabase } from '../../models/postgres-database';
import type { RecurringExpense } from '../../types';

interface RecurringExpenseParams {
  id: string;
}

interface RecurringExpenseBody {
  name: string;
  description: string;
  amount: number;
  category: string;
  company: string;
  vehicleId?: string;
  note?: string;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  startDate?: string;
  endDate?: string;
  dayOfMonth?: string | number;
  isActive?: boolean;
}

interface GenerateBody {
  targetDate?: string;
}

export default async function recurringExpensesRoutes(fastify: FastifyInstance) {
  
  // GET /api/recurring-expenses/:id - Get single recurring expense by ID
  fastify.get<{ Params: { id: string } }>('/api/recurring-expenses/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('expenses', 'read')]
  }, async (request, reply) => {
    try {
      const expenses = await postgresDatabase.getRecurringExpenses();
      const expense = expenses.find(exp => exp.id === request.params.id);
      
      if (!expense) {
        return reply.status(404).send({
          success: false,
          error: 'Pravidelný náklad nenájdený'
        });
      }
      
      return {
        success: true,
        data: expense
      };
    } catch (error) {
      fastify.log.error(error, 'Get recurring expense by ID error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní pravidelného nákladu'
      });
    }
  });
  
  // GET /api/recurring-expenses - Získanie všetkých pravidelných nákladov
  fastify.get('/api/recurring-expenses', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('expenses', 'read')
    ]
  }, async (request, reply) => {
    try {
      const recurringExpenses = await postgresDatabase.getRecurringExpenses();
      
      fastify.log.info({
        msg: '🔄 Recurring Expenses GET',
        user: request.user?.username,
        count: recurringExpenses.length
      });
      
      // Pridaj cache busting headers
      reply.headers({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      return {
        success: true,
        data: recurringExpenses
      };
    } catch (error) {
      fastify.log.error(error, 'Get recurring expenses error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní pravidelných nákladov'
      });
    }
  });

  // POST /api/recurring-expenses - Vytvorenie nového pravidelného nákladu
  fastify.post<{
    Body: RecurringExpenseBody;
  }>('/api/recurring-expenses', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('expenses', 'create')
    ]
  }, async (request, reply) => {
    try {
      const { 
        name, description, amount, category, company, vehicleId, note,
        frequency, startDate, endDate, dayOfMonth 
      } = request.body;

      // Validácia povinných polí
      if (!name || !name.trim()) {
        return reply.status(400).send({
          success: false,
          error: 'Názov pravidelného nákladu je povinný'
        });
      }

      if (!description || !description.trim()) {
        return reply.status(400).send({
          success: false,
          error: 'Popis je povinný'
        });
      }

      if (!amount || amount <= 0) {
        return reply.status(400).send({
          success: false,
          error: 'Suma musí byť väčšia ako 0'
        });
      }

      if (!category || !category.trim()) {
        return reply.status(400).send({
          success: false,
          error: 'Kategória je povinná'
        });
      }

      if (!company || !company.trim()) {
        return reply.status(400).send({
          success: false,
          error: 'Firma je povinná'
        });
      }

      // Validácia frequency
      const validFrequencies = ['monthly', 'quarterly', 'yearly'];
      if (!frequency || !validFrequencies.includes(frequency)) {
        return reply.status(400).send({
          success: false,
          error: 'Neplatná frekvencia (monthly, quarterly, yearly)'
        });
      }

      // Validácia dayOfMonth
      const dayNum = parseInt(String(dayOfMonth)) || 1;
      if (dayNum < 1 || dayNum > 28) {
        return reply.status(400).send({
          success: false,
          error: 'Deň v mesiaci musí byť medzi 1-28'
        });
      }

      const recurringData = {
        name: name.trim(),
        description: description.trim(),
        amount: parseFloat(String(amount)),
        category: category.trim(),
        company: company.trim(),
        vehicleId: vehicleId?.trim() || undefined,
        note: note?.trim() || undefined,
        frequency,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : undefined,
        dayOfMonth: dayNum,
        createdBy: request.user?.id
      };

      fastify.log.info({
        msg: '🔄 Creating recurring expense',
        recurringData
      });

      const createdRecurring = await postgresDatabase.createRecurringExpense(recurringData);

      return reply.status(201).send({
        success: true,
        message: 'Pravidelný náklad úspešne vytvorený',
        data: createdRecurring
      });

    } catch (error: unknown) {
      fastify.log.error(error, 'Create recurring expense error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri vytváraní pravidelného nákladu'
      });
    }
  });

  // PUT /api/recurring-expenses/:id - Aktualizácia pravidelného nákladu
  fastify.put<{
    Params: RecurringExpenseParams;
    Body: Partial<RecurringExpenseBody>;
  }>('/api/recurring-expenses/:id', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('expenses', 'update')
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { 
        name, description, amount, category, company, vehicleId, note,
        frequency, startDate, endDate, dayOfMonth, isActive 
      } = request.body;

      // Získaj existujúci recurring expense priamo z databázy
      const recurringExpense = await postgresDatabase.getRecurringExpenseById(id);
      
      if (!recurringExpense) {
        return reply.status(404).send({
          success: false,
          error: 'Pravidelný náklad nenájdený'
        });
      }

      // Validácia
      if (name && (!name.trim())) {
        return reply.status(400).send({
          success: false,
          error: 'Názov je povinný'
        });
      }

      if (description && (!description.trim())) {
        return reply.status(400).send({
          success: false,
          error: 'Popis je povinný'
        });
      }

      if (amount && amount <= 0) {
        return reply.status(400).send({
          success: false,
          error: 'Suma musí byť väčšia ako 0'
        });
      }

      const updatedRecurring: RecurringExpense = {
        ...recurringExpense,
        name: name ? name.trim() : recurringExpense.name,
        description: description ? description.trim() : recurringExpense.description,
        amount: amount ? parseFloat(String(amount)) : recurringExpense.amount,
        category: category?.trim() || recurringExpense.category,
        company: company?.trim() || recurringExpense.company,
        vehicleId: vehicleId?.trim() || recurringExpense.vehicleId,
        note: note?.trim() || recurringExpense.note,
        frequency: frequency || recurringExpense.frequency,
        startDate: startDate ? new Date(startDate) : recurringExpense.startDate,
        endDate: endDate ? new Date(endDate) : recurringExpense.endDate,
        dayOfMonth: dayOfMonth ? parseInt(String(dayOfMonth)) : recurringExpense.dayOfMonth,
        isActive: isActive !== undefined ? isActive : recurringExpense.isActive,
        updatedAt: new Date()
      };

      await postgresDatabase.updateRecurringExpense(updatedRecurring);

      // Načítaj fresh data z databázy pre potvrdenie
      const freshData = await postgresDatabase.getRecurringExpenseById(id);
      
      fastify.log.info({
        msg: '🔄 Updated recurring expense',
        id,
        name: freshData?.name,
        category: freshData?.category
      });

      // Pridaj cache busting headers
      reply.headers({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      return {
        success: true,
        message: 'Pravidelný náklad úspešne aktualizovaný',
        data: freshData || updatedRecurring
      };

    } catch (error: unknown) {
      fastify.log.error(error, 'Update recurring expense error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri aktualizácii pravidelného nákladu'
      });
    }
  });

  // DELETE /api/recurring-expenses/:id - Zmazanie pravidelného nákladu
  fastify.delete<{
    Params: RecurringExpenseParams;
  }>('/api/recurring-expenses/:id', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('expenses', 'delete')
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      await postgresDatabase.deleteRecurringExpense(id);

      fastify.log.info({
        msg: '🔄 Deleted recurring expense',
        id,
        user: request.user?.username
      });

      return {
        success: true,
        message: 'Pravidelný náklad úspešne zmazaný'
      };

    } catch (error: unknown) {
      fastify.log.error(error, 'Delete recurring expense error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri mazaní pravidelného nákladu'
      });
    }
  });

  // POST /api/recurring-expenses/generate - Manuálne spustenie generovania
  fastify.post<{
    Body: GenerateBody;
  }>('/api/recurring-expenses/generate', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('expenses', 'create')
    ]
  }, async (request, reply) => {
    try {
      const { targetDate } = request.body;
      const date = targetDate ? new Date(targetDate) : new Date();

      fastify.log.info({
        msg: '🔄 Manual recurring expense generation triggered',
        date: date.toISOString().split('T')[0]
      });

      const results = await postgresDatabase.generateRecurringExpenses(date);

      return {
        success: true,
        message: `Generovanie dokončené: ${results.generated} vytvorených, ${results.skipped} preskočených`,
        data: results
      };

    } catch (error: unknown) {
      fastify.log.error(error, 'Generate recurring expenses error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri generovaní pravidelných nákladov'
      });
    }
  });

  // POST /api/recurring-expenses/:id/generate - Manuálne vygenerovanie konkrétneho nákladu
  fastify.post<{
    Params: RecurringExpenseParams;
    Body: GenerateBody;
  }>('/api/recurring-expenses/:id/generate', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('expenses', 'create')
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { targetDate } = request.body;

      const generatedExpenseId = await postgresDatabase.triggerRecurringExpenseGeneration(
        id, 
        targetDate ? new Date(targetDate) : new Date()
      );

      return {
        success: true,
        message: 'Náklad úspešne vygenerovaný',
        data: { generatedExpenseId }
      };

    } catch (error: unknown) {
      fastify.log.error(error, 'Generate single recurring expense error');
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Chyba pri generovaní nákladu'
      });
    }
  });

  // POST /api/recurring-expenses/generate-next-month - Generate expenses for next month
  fastify.post<{ Body: GenerateBody }>('/api/recurring-expenses/generate-next-month', {
    preHandler: [authenticateFastify, checkPermissionFastify('expenses', 'create')]
  }, async (request, reply) => {
    try {
      const targetDate = request.body.targetDate ? new Date(request.body.targetDate) : new Date();
      const nextMonth = new Date(targetDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const recurringExpenses = await postgresDatabase.getRecurringExpenses();
      const activeExpenses = recurringExpenses.filter(re => re.isActive);
      
      const generatedCount = 0;
      // Note: This would need proper implementation to create actual expenses
      // from recurring expense templates
      
      fastify.log.info({
        msg: '📅 Generated recurring expenses for next month',
        count: generatedCount,
        month: nextMonth.toISOString().slice(0, 7)
      });
      
      return {
        success: true,
        message: `Generated ${generatedCount} expenses for next month`,
        data: { 
          generated: generatedCount,
          month: nextMonth.toISOString().slice(0, 7),
          note: 'Implementation needed - currently simplified'
        }
      };
    } catch (error) {
      fastify.log.error(error, 'Generate next month expenses error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri generovaní nákladov'
      });
    }
  });

  fastify.log.info('✅ Recurring expenses routes registered');
}

