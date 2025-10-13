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
      let expenses = await postgresDatabase.getExpenses();
      const user = request.user!;
      
      fastify.log.info({ 
        msg: '💰 Expenses GET', 
        role: user.role, 
        userId: user.id,
        platformId: user.platformId,
        totalExpenses: expenses.length 
      });
      
      // 🔐 PLATFORM FILTERING - Same logic as rentals
      if (user.platformId && user.role !== 'super_admin') {
        const originalCount = expenses.length;
        
        // Get all companies for this platform
        const companies = await postgresDatabase.getCompanies();
        const platformCompanies = companies.filter(c => c.platformId === user.platformId);
        const allowedCompanyIds = platformCompanies.map(c => c.id);
        const validCompanyNames = platformCompanies.map(c => c.name);
        
        // Get all vehicles for filtering
        const vehicles = await postgresDatabase.getVehicles();
        
        // Filter expenses by platform
        expenses = expenses.filter(expense => {
          // If expense has vehicleId, check vehicle's platform
          if (expense.vehicleId) {
            const vehicle = vehicles.find(v => v.id === expense.vehicleId);
            if (!vehicle) return false;
            
            if (vehicle.platformId === user.platformId) return true;
            if (vehicle.ownerCompanyId && allowedCompanyIds.includes(vehicle.ownerCompanyId)) return true;
            if (vehicle.company && validCompanyNames.includes(vehicle.company)) return true;
            return false;
          }
          
          // If expense has company, check if it belongs to platform
          if (expense.company) {
            return validCompanyNames.includes(expense.company);
          }
          
          // If no vehicle or company info, don't show
          return false;
        });
        
        fastify.log.info({ msg: '🌐 EXPENSES: Platform filter applied', originalCount, filteredCount: expenses.length });
      } else if (user.role !== 'admin' && user.role !== 'super_admin') {
        // Regular users WITHOUT platformId: filter by company permissions
        const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(user.id);
        const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
        
        const allowedCompanyNames = await Promise.all(
          allowedCompanyIds.map(async (companyId) => {
            try {
              return await postgresDatabase.getCompanyNameById(companyId);
            } catch (error) {
              return null;
            }
          })
        );
        const validCompanyNames = allowedCompanyNames.filter(name => name !== null);
        
        // Filter expenses
        expenses = expenses.filter(expense => {
          if (expense.company) {
            return validCompanyNames.includes(expense.company);
          }
          return false;
        });
        
        fastify.log.info({ msg: '🔐 Expenses Permission Filter', userId: user.id, filteredCount: expenses.length });
      }
      
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

  // GET /api/expenses/export/csv - CSV Export
  fastify.get('/api/expenses/export/csv', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      let expenses = await postgresDatabase.getExpenses();
      const user = request.user!;
      
      // Apply platform filtering (same as GET /api/expenses)
      if (user.platformId && user.role !== 'super_admin') {
        const companies = await postgresDatabase.getCompanies();
        const platformCompanies = companies.filter(c => c.platformId === user.platformId);
        const validCompanyNames = platformCompanies.map(c => c.name);
        
        expenses = expenses.filter(expense => {
          if (expense.company) {
            return validCompanyNames.includes(expense.company);
          }
          return false;
        });
      }

      // Create CSV
      const csvHeaders = ['ID', 'Popis', 'Suma', 'Dátum', 'Vozidlo', 'Firma', 'Kategória', 'Poznámka'];
      const csvRows = expenses.map(e => [
        e.id,
        e.description || '',
        e.amount || '',
        e.date ? e.date.toISOString().split('T')[0] : '',
        e.vehicleId || '',
        e.company || '',
        e.category || '',
        e.note || ''
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      reply.header('Content-Type', 'text/csv; charset=utf-8');
      reply.header('Content-Disposition', `attachment; filename="vydavky-${new Date().toISOString().split('T')[0]}.csv"`);
      reply.header('Cache-Control', 'no-cache');
      
      fastify.log.info({ msg: '📊 CSV Export expenses', count: expenses.length });
      return reply.send('\ufeff' + csvContent);
    } catch (error) {
      fastify.log.error(error, 'CSV export error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri exporte CSV'
      });
    }
  });

  // POST /api/expenses/import/csv - CSV Import
  fastify.post<{
    Body: { csvData: string };
  }>('/api/expenses/import/csv', {
    preHandler: [authenticateFastify, checkPermissionFastify('expenses', 'create')]
  }, async (request, reply) => {
    try {
      const { csvData } = request.body;
      
      if (!csvData) {
        return reply.status(400).send({
          success: false,
          error: 'CSV data is required'
        });
      }

      const lines = csvData.trim().split('\n');
      if (lines.length < 2) {
        return reply.status(400).send({
          success: false,
          error: 'CSV must contain header and at least one data row'
        });
      }

      const dataLines = lines.slice(1);
      const results: any[] = [];
      const errors: any[] = [];

      for (let i = 0; i < dataLines.length; i++) {
        try {
          const line = dataLines[i].trim();
          if (!line) continue;

          const fields = line.split(',').map(field => field.replace(/^"|"$/g, '').trim());
          
          if (fields.length < 3) {
            errors.push({ row: i + 2, error: 'Insufficient columns' });
            continue;
          }

          const [, description, amount, date, vehicleId, company, category, note] = fields;

          if (!description || !amount) {
            errors.push({ row: i + 2, error: 'Description and amount are required' });
            continue;
          }

          const created = await postgresDatabase.createExpense({
            description: description.trim(),
            amount: parseFloat(amount),
            date: date ? new Date(date) : new Date(),
            vehicleId: vehicleId || undefined,
            company: company || '',
            category: category || 'other',
            note: note || undefined
          });
          
          results.push({ row: i + 2, expense: created });
        } catch (error: any) {
          errors.push({ 
            row: i + 2, 
            error: error.message || 'Error creating expense' 
          });
        }
      }

      fastify.log.info({ msg: '📥 CSV Import expenses', imported: results.length, errors: errors.length });

      return {
        success: true,
        message: `CSV import completed: ${results.length} successful, ${errors.length} errors`,
        data: {
          imported: results.length,
          errorsCount: errors.length,
          results,
          errors: errors.slice(0, 10)
        }
      };
    } catch (error) {
      fastify.log.error(error, 'CSV import error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri importe CSV'
      });
    }
  });

  // POST /api/expenses/batch-import - Batch import expenses
  fastify.post<{
    Body: { expenses: any[] };
  }>('/api/expenses/batch-import', {
    preHandler: [authenticateFastify, checkPermissionFastify('expenses', 'create')]
  }, async (request, reply) => {
    try {
      const { expenses } = request.body;
      
      if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'Expenses array is required'
        });
      }

      const results: any[] = [];
      const errors: any[] = [];

      for (let i = 0; i < expenses.length; i++) {
        try {
          const expenseData = expenses[i];
          
          if (!expenseData.description || !expenseData.amount) {
            errors.push({ index: i, error: 'Missing required fields' });
            continue;
          }

          const created = await postgresDatabase.createExpense({
            description: String(expenseData.description),
            amount: Number(expenseData.amount),
            date: expenseData.date ? new Date(expenseData.date) : new Date(),
            vehicleId: expenseData.vehicleId ? String(expenseData.vehicleId) : undefined,
            company: String(expenseData.company || ''),
            category: String(expenseData.category || 'other'),
            note: expenseData.note ? String(expenseData.note) : undefined
          });
          
          results.push({ index: i, expense: created });
        } catch (error: any) {
          errors.push({ 
            index: i, 
            error: error.message || 'Error creating expense' 
          });
        }
      }

      fastify.log.info({ msg: '📥 Batch import expenses', imported: results.length, errors: errors.length });

      return {
        success: true,
        message: `Batch import completed: ${results.length} successful, ${errors.length} errors`,
        data: {
          imported: results.length,
          errorsCount: errors.length,
          results,
          errors: errors.slice(0, 10)
        }
      };
    } catch (error) {
      fastify.log.error(error, 'Batch import error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri batch importe'
      });
    }
  });

  // POST /api/expenses/batch-import-stream - Batch import with stream (simplified version)
  fastify.post<{
    Body: { expenses: any[] };
  }>('/api/expenses/batch-import-stream', {
    preHandler: [authenticateFastify, checkPermissionFastify('expenses', 'create')]
  }, async (request, reply) => {
    // Same as batch-import for now (streaming would require SSE setup)
    return await fastify.inject({
      method: 'POST',
      url: '/api/expenses/batch-import',
      headers: request.headers,
      payload: request.body
    }).then(res => reply.status(res.statusCode).send(res.json()));
  });

  fastify.log.info('✅ Expenses routes registered');
}

