import type { FastifyInstance } from 'fastify';
import { authenticateFastify } from '../decorators/auth';
import { checkPermissionFastify } from '../hooks/permissions';
import { postgresDatabase } from '../../models/postgres-database';

export default async function customersRoutes(fastify: FastifyInstance) {
  // GET /api/customers
  fastify.get('/api/customers', {
    preHandler: [authenticateFastify, checkPermissionFastify('customers', 'read')]
  }, async (request, reply) => {
    try {
      const customers = await postgresDatabase.getCustomers();
      return { success: true, data: customers };
    } catch (error) {
      fastify.log.error(error, 'Get customers error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní zákazníkov'
      });
    }
  });

  // GET /api/customers/:id
  fastify.get<{ Params: { id: string } }>('/api/customers/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('customers', 'read')]
  }, async (request, reply) => {
    try {
      const customers = await postgresDatabase.getCustomers();
      const customer = customers.find(c => c.id === request.params.id);
      if (!customer) {
        return reply.status(404).send({ success: false, error: 'Zákazník nenájdený' });
      }
      return { success: true, data: customer };
    } catch (error) {
      fastify.log.error(error, 'Get customer error');
      return reply.status(500).send({ success: false, error: 'Chyba pri získavaní zákazníka' });
    }
  });

  // POST /api/customers
  fastify.post('/api/customers', {
    preHandler: [authenticateFastify, checkPermissionFastify('customers', 'create')]
  }, async (request, reply) => {
    try {
      const customerData = request.body as any;
      
      // Ensure required fields
      const customerToCreate = {
        name: customerData.name || 'Unknown',
        email: customerData.email || '',
        phone: customerData.phone || ''
      };
      
      const newCustomer = await postgresDatabase.createCustomer(customerToCreate);
      fastify.log.info({ msg: '✅ Customer created', id: newCustomer.id, name: newCustomer.name });
      return reply.status(201).send({ success: true, data: newCustomer });
    } catch (error) {
      fastify.log.error(error, 'Create customer error');
      return reply.status(500).send({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Chyba pri vytváraní zákazníka' 
      });
    }
  });

  // PUT /api/customers/:id
  fastify.put<{ Params: { id: string } }>('/api/customers/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('customers', 'update')]
  }, async (request, reply) => {
    try {
      const customerData = request.body as Record<string, unknown>;
      await postgresDatabase.updateCustomer({
        id: request.params.id,
        name: String(customerData.name || ''),
        email: String(customerData.email || ''),
        phone: String(customerData.phone || ''),
        firstName: customerData.firstName ? String(customerData.firstName) : undefined,
        lastName: customerData.lastName ? String(customerData.lastName) : undefined,
        createdAt: new Date()
      });
      const customers = await postgresDatabase.getCustomers();
      const updatedCustomer = customers.find(c => c.id === request.params.id);
      fastify.log.info({ msg: '✅ Customer updated', id: request.params.id });
      return { success: true, data: updatedCustomer };
    } catch (error) {
      fastify.log.error(error, 'Update customer error');
      return reply.status(500).send({ success: false, error: 'Chyba pri aktualizácii zákazníka' });
    }
  });

  // DELETE /api/customers/:id
  fastify.delete<{ Params: { id: string } }>('/api/customers/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('customers', 'delete')]
  }, async (request, reply) => {
    try {
      await postgresDatabase.deleteCustomer(request.params.id);
      fastify.log.info({ msg: '🗑️ Customer deleted', id: request.params.id });
      return { success: true, message: 'Zákazník bol odstránený' };
    } catch (error) {
      fastify.log.error(error, 'Delete customer error');
      return reply.status(500).send({ success: false, error: 'Chyba pri mazaní zákazníka' });
    }
  });

  fastify.log.info('✅ Customers routes registered');
}

