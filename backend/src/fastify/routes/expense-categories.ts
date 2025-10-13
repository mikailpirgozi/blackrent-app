import type { FastifyInstance } from 'fastify';
import { authenticateFastify } from '../decorators/auth';
import { checkPermissionFastify } from '../hooks/permissions';
import { postgresDatabase } from '../../models/postgres-database';
import type { ExpenseCategory } from '../../types';

interface CategoryParams {
  id: string;
}

interface CategoryBody {
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

export default async function expenseCategoriesRoutes(fastify: FastifyInstance) {
  
  // GET /api/expense-categories - Získanie všetkých kategórií nákladov
  fastify.get('/api/expense-categories', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('expenses', 'read')
    ]
  }, async (request, reply) => {
    try {
      const categories = await postgresDatabase.getExpenseCategories();
      
      fastify.log.info({
        msg: '📂 Expense Categories GET',
        user: request.user?.username,
        categoriesCount: categories.length
      });
      
      return reply.send({
        success: true,
        data: categories
      });
    } catch (error) {
      fastify.log.error(error, 'Get expense categories error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní kategórií nákladov'
      });
    }
  });

  // POST /api/expense-categories - Vytvorenie novej kategórie
  fastify.post<{
    Body: CategoryBody;
  }>('/api/expense-categories', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('expenses', 'create')
    ]
  }, async (request, reply) => {
    try {
      const { name, displayName, description, icon, color, sortOrder } = request.body;

      // Validácia povinných polí
      if (!name || !name.trim()) {
        return reply.status(400).send({
          success: false,
          error: 'Názov kategórie je povinný'
        });
      }

      if (!displayName || !displayName.trim()) {
        return reply.status(400).send({
          success: false,
          error: 'Zobrazovaný názov kategórie je povinný'
        });
      }

      // Validácia farby
      const validColors = ['primary', 'secondary', 'success', 'error', 'warning', 'info'];
      if (color && !validColors.includes(color)) {
        return reply.status(400).send({
          success: false,
          error: 'Neplatná farba kategórie'
        });
      }

      // Vytvorenie kategórie
      const categoryData = {
        name: name.trim().toLowerCase().replace(/\s+/g, '_'), // automatické formátovanie názvu
        displayName: displayName.trim(),
        description: description?.trim() || undefined,
        icon: icon?.trim() || 'receipt',
        color: color || 'primary',
        sortOrder: sortOrder || 0,
        createdBy: request.user?.id
      };

      fastify.log.info({
        msg: '📂 Creating expense category',
        categoryData
      });

      const createdCategory = await postgresDatabase.createExpenseCategory(categoryData);

      return reply.status(201).send({
        success: true,
        message: 'Kategória nákladov úspešne vytvorená',
        data: createdCategory
      });

    } catch (error: unknown) {
      fastify.log.error(error, 'Create expense category error');
      
      // Špecifické error handling pre unique constraint
      const err = error as { message?: string; code?: string };
      if (err.message?.includes('unique') || err.code === '23505') {
        return reply.status(400).send({
          success: false,
          error: 'Kategória s týmto názvom už existuje'
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'Chyba pri vytváraní kategórie nákladov'
      });
    }
  });

  // PUT /api/expense-categories/:id - Aktualizácia kategórie
  fastify.put<{
    Params: CategoryParams;
    Body: Partial<CategoryBody>;
  }>('/api/expense-categories/:id', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('expenses', 'update')
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { displayName, description, icon, color, sortOrder } = request.body;

      // Validácia povinných polí
      if (!displayName || !displayName.trim()) {
        return reply.status(400).send({
          success: false,
          error: 'Zobrazovaný názov kategórie je povinný'
        });
      }

      // Validácia farby
      const validColors = ['primary', 'secondary', 'success', 'error', 'warning', 'info'];
      if (color && !validColors.includes(color)) {
        return reply.status(400).send({
          success: false,
          error: 'Neplatná farba kategórie'
        });
      }

      // Získaj aktuálnu kategóriu
      const categories = await postgresDatabase.getExpenseCategories();
      const existingCategory = categories.find(c => c.id === id);
      
      if (!existingCategory) {
        return reply.status(404).send({
          success: false,
          error: 'Kategória nenájdená'
        });
      }

      // Aktualizácia kategórie
      const updatedCategory: ExpenseCategory = {
        ...existingCategory,
        displayName: displayName.trim(),
        description: description?.trim() || undefined,
        icon: icon?.trim() || existingCategory.icon,
        color: (color as ExpenseCategory['color']) || existingCategory.color,
        sortOrder: sortOrder !== undefined ? sortOrder : existingCategory.sortOrder,
        updatedAt: new Date()
      };

      await postgresDatabase.updateExpenseCategory(updatedCategory);

      fastify.log.info({
        msg: '📂 Updated expense category',
        id,
        displayName
      });

      return reply.send({
        success: true,
        message: 'Kategória nákladov úspešne aktualizovaná',
        data: updatedCategory
      });

    } catch (error: unknown) {
      fastify.log.error(error, 'Update expense category error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri aktualizácii kategórie nákladov'
      });
    }
  });

  // DELETE /api/expense-categories/:id - Zmazanie kategórie
  fastify.delete<{
    Params: CategoryParams;
  }>('/api/expense-categories/:id', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('expenses', 'delete')
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      await postgresDatabase.deleteExpenseCategory(id);

      fastify.log.info({
        msg: '📂 Deleted expense category',
        id,
        user: request.user?.username
      });

      return reply.send({
        success: true,
        message: 'Kategória nákladov úspešne zmazaná'
      });

    } catch (error: unknown) {
      fastify.log.error(error, 'Delete expense category error');
      
      const err = error as { message?: string };
      // Špecifické error handling
      if (err.message?.includes('základnú kategóriu')) {
        return reply.status(400).send({
          success: false,
          error: 'Nemožno zmazať základnú kategóriu'
        });
      }
      
      if (err.message?.includes('používa v nákladoch')) {
        return reply.status(400).send({
          success: false,
          error: 'Nemožno zmazať kategóriu ktorá sa používa v existujúcich nákladoch'
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'Chyba pri mazaní kategórie nákladov'
      });
    }
  });

  fastify.log.info('✅ Expense categories routes registered');
}

