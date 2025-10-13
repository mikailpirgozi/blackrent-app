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
      fastify.log.info({ msg: '👥 Customers GET', count: customers.length, userId: request.user?.id });
      
      // ✅ FIX: Ensure proper JSON response with Content-Type header
      return reply
        .header('Content-Type', 'application/json')
        .send({ success: true, data: customers });
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
      return reply.send({ success: true, data: customer });
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
      const customerData = request.body as Record<string, unknown>;
      
      // Ensure required fields
      const customerToCreate = {
        name: String(customerData.name || 'Unknown'),
        email: String(customerData.email || ''),
        phone: String(customerData.phone || '')
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
      return reply.send({ success: true, data: updatedCustomer });
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
      return reply.send({ success: true, message: 'Zákazník bol odstránený' });
    } catch (error) {
      fastify.log.error(error, 'Delete customer error');
      return reply.status(500).send({ success: false, error: 'Chyba pri mazaní zákazníka' });
    }
  });

  // GET /api/customers/export/csv - CSV Export
  fastify.get('/api/customers/export/csv', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      let customers = await postgresDatabase.getCustomers();
      
      // 🔐 NON-ADMIN USERS - filter by company permissions
      if (request.user?.role !== 'admin' && request.user) {
        const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(request.user.id);
        const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
        
        const rentals = await postgresDatabase.getRentals();
        const vehicles = await postgresDatabase.getVehicles();
        
        const allowedCustomerIds = new Set<string>();
        rentals.forEach(rental => {
          if (!rental.customerId || !rental.vehicleId) return;
          const vehicle = vehicles.find(v => v.id === rental.vehicleId);
          if (!vehicle || !vehicle.ownerCompanyId) return;
          if (allowedCompanyIds.includes(vehicle.ownerCompanyId)) {
            allowedCustomerIds.add(rental.customerId);
          }
        });
        
        customers = customers.filter(c => allowedCustomerIds.has(c.id));
      }

      // Create CSV headers
      const csvHeaders = ['ID', 'Meno', 'Email', 'Telefón', 'Vytvorené'];

      // Convert customers to CSV rows
      const csvRows = customers.map(customer => [
        customer.id,
        customer.name,
        customer.email || '',
        customer.phone || '',
        customer.createdAt ? customer.createdAt.toISOString().split('T')[0] : ''
      ]);

      // Create CSV content
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Set response headers for CSV download
      reply.header('Content-Type', 'text/csv; charset=utf-8');
      reply.header('Content-Disposition', `attachment; filename="zakaznici-${new Date().toISOString().split('T')[0]}.csv"`);
      reply.header('Cache-Control', 'no-cache');
      
      // Add BOM for proper diacritics display in Excel
      fastify.log.info({ msg: '📊 CSV Export', count: customers.length, user: request.user?.username });
      return reply.send('\ufeff' + csvContent);
    } catch (error) {
      fastify.log.error(error, 'CSV export error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri exporte CSV'
      });
    }
  });

  // POST /api/customers/import/csv - CSV Import
  fastify.post<{
    Body: { csvData: string };
  }>('/api/customers/import/csv', {
    preHandler: [authenticateFastify, checkPermissionFastify('customers', 'create')]
  }, async (request, reply) => {
    try {
      const { csvData } = request.body;
      
      if (!csvData || typeof csvData !== 'string') {
        return reply.status(400).send({
          success: false,
          error: 'CSV dáta sú povinné'
        });
      }

      // Parse CSV
      const lines = csvData.trim().split('\n');
      if (lines.length < 2) {
        return reply.status(400).send({
          success: false,
          error: 'CSV musí obsahovať aspoň hlavičku a jeden riadok dát'
        });
      }

      // Skip header
      const dataLines = lines.slice(1);
      const results: Record<string, unknown>[] = [];
      const errors: Record<string, unknown>[] = [];

      for (let i = 0; i < dataLines.length; i++) {
        try {
          const line = dataLines[i].trim();
          if (!line) continue;

          // Parse CSV row
          const fields = line.split(',').map(field => field.replace(/^"|"$/g, '').trim());
          
          if (fields.length < 2) {
            errors.push({ row: i + 2, error: 'Nedostatok stĺpcov' });
            continue;
          }

          const [, name, email, phone] = fields;

          if (!name) {
            errors.push({ row: i + 2, error: 'Meno zákazníka je povinné' });
            continue;
          }

          // Create customer
          const customerData = {
            name: name.trim(),
            email: email?.trim() || '',
            phone: phone?.trim() || ''
          };

          const createdCustomer = await postgresDatabase.createCustomer(customerData);
          results.push({ row: i + 2, customer: createdCustomer });
        } catch (error: unknown) {
          errors.push({ 
            row: i + 2, 
            error: error instanceof Error ? error.message : String(error) || 'Chyba pri vytváraní zákazníka' 
          });
        }
      }

      fastify.log.info({ msg: '📥 CSV Import', imported: results.length, errors: errors.length });

      return reply.send({
        success: true,
        message: `CSV import dokončený: ${results.length} úspešných, ${errors.length} chýb`,
        data: {
          imported: results.length,
          errorsCount: errors.length,
          results,
          errors: errors.slice(0, 10) // Limit to first 10 errors
        }
      });
    } catch (error) {
      fastify.log.error(error, 'CSV import error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri importe CSV'
      });
    }
  });

  // GET /api/customers/paginated - Paginated customer search
  fastify.get<{
    Querystring: {
      page?: number;
      limit?: number;
      search?: string;
      city?: string;
      country?: string;
      hasRentals?: string;
    };
  }>('/api/customers/paginated', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { 
        page = 1, 
        limit = 50,
        search = '',
        city = 'all',
        country = 'all',
        hasRentals = 'all'
      } = request.query;

      fastify.log.info({ 
        msg: '👥 Customers paginated', 
        page, limit, search, city, country, hasRentals,
        role: request.user?.role, 
        userId: request.user?.id
      });

      const pageNum = Number(page);
      const limitNum = Number(limit);
      const offset = (pageNum - 1) * limitNum;

      // Get paginated customers with filters
      const result = await postgresDatabase.getCustomersPaginated({
        limit: limitNum,
        offset,
        search: String(search),
        city: String(city),
        country: String(country),
        hasRentals: String(hasRentals),
        userId: request.user?.id,
        userRole: request.user?.role
      });

      fastify.log.info({ msg: `📊 Found ${result.customers.length}/${result.total} customers`, page: pageNum });

      return reply.send({
        success: true,
        data: {
          customers: result.customers,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(result.total / limitNum),
            totalItems: result.total,
            hasMore: (pageNum * limitNum) < result.total,
            itemsPerPage: limitNum
          }
        }
      });
    } catch (error) {
      fastify.log.error(error, 'Get paginated customers error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní zákazníkov'
      });
    }
  });

  fastify.log.info('✅ Customers routes registered');
}

