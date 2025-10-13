import type { FastifyInstance } from 'fastify';
import { authenticateFastify } from '../decorators/auth';
import { checkPermissionFastify } from '../hooks/permissions';
import { postgresDatabase } from '../../models/postgres-database';

export default async function companiesRoutes(fastify: FastifyInstance) {
  // GET /api/companies
  fastify.get('/api/companies', {
    preHandler: [authenticateFastify, checkPermissionFastify('companies', 'read')]
  }, async (request, reply) => {
    try {
      const companies = await postgresDatabase.getCompanies();
      return reply.send({ success: true, data: companies });
    } catch (error) {
      fastify.log.error(error, 'Get companies error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní firiem'
      });
    }
  });

  // GET /api/companies/:id
  fastify.get<{ Params: { id: string } }>('/api/companies/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('companies', 'read')]
  }, async (request, reply) => {
    try {
      const company = await postgresDatabase.getCompanyById(request.params.id);
      if (!company) {
        return reply.status(404).send({ success: false, error: 'Firma nenájdená' });
      }
      return reply.send({ success: true, data: company });
    } catch (error) {
      fastify.log.error(error, 'Get company error');
      return reply.status(500).send({ success: false, error: 'Chyba pri získavaní firmy' });
    }
  });

  // POST /api/companies
  fastify.post('/api/companies', {
    preHandler: [authenticateFastify, checkPermissionFastify('companies', 'create')]
  }, async (request, reply) => {
    try {
      const companyData = request.body as Record<string, unknown>;
      const newCompany = await postgresDatabase.createCompany({
        name: String(companyData.name || ''),
        personalIban: companyData.personalIban ? String(companyData.personalIban) : undefined,
        businessIban: companyData.businessIban ? String(companyData.businessIban) : undefined,
        ownerName: companyData.ownerName ? String(companyData.ownerName) : undefined,
        contactEmail: companyData.contactEmail ? String(companyData.contactEmail) : undefined,
        contactPhone: companyData.contactPhone ? String(companyData.contactPhone) : undefined,
        defaultCommissionRate: companyData.defaultCommissionRate ? Number(companyData.defaultCommissionRate) : undefined,
        isActive: companyData.isActive !== undefined ? Boolean(companyData.isActive) : undefined
      });
      fastify.log.info({ msg: '✅ Company created', id: newCompany.id });
      return reply.status(201).send({ success: true, data: newCompany });
    } catch (error) {
      fastify.log.error(error, 'Create company error');
      return reply.status(500).send({ success: false, error: 'Chyba pri vytváraní firmy' });
    }
  });

  // PUT /api/companies/:id
  fastify.put<{ Params: { id: string } }>('/api/companies/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('companies', 'update')]
  }, async (request, reply) => {
    try {
      const companyData = request.body as Record<string, unknown>;
      await postgresDatabase.updateCompany(request.params.id, companyData);
      const updatedCompany = await postgresDatabase.getCompanyById(request.params.id);
      fastify.log.info({ msg: '✅ Company updated', id: request.params.id });
      return reply.send({ success: true, data: updatedCompany });
    } catch (error) {
      fastify.log.error(error, 'Update company error');
      return reply.status(500).send({ success: false, error: 'Chyba pri aktualizácii firmy' });
    }
  });

  // DELETE /api/companies/:id
  fastify.delete<{ Params: { id: string } }>('/api/companies/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('companies', 'delete')]
  }, async (request, reply) => {
    try {
      await postgresDatabase.deleteCompany(request.params.id);
      fastify.log.info({ msg: '🗑️ Company deleted', id: request.params.id });
      return reply.send({ success: true, message: 'Firma bola odstránená' });
    } catch (error) {
      fastify.log.error(error, 'Delete company error');
      return reply.status(500).send({ success: false, error: 'Chyba pri mazaní firmy' });
    }
  });

  fastify.log.info('✅ Companies routes registered');
}

