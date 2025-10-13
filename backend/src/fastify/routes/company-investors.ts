import type { FastifyInstance } from 'fastify';
import { authenticateFastify } from '../decorators/auth';
import { checkPermissionFastify } from '../hooks/permissions';
import { postgresDatabase } from '../../models/postgres-database';

export default async function companyInvestorsRoutes(fastify: FastifyInstance) {
  
  // GET /api/company-investors/:id - Get single investor by ID
  fastify.get<{ Params: { id: string } }>('/api/company-investors/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('companies', 'read')]
  }, async (request, reply) => {
    try {
      const investors = await postgresDatabase.getCompanyInvestors();
      const investor = investors.find(inv => inv.id === request.params.id);
      
      if (!investor) {
        return reply.status(404).send({
          success: false,
          error: 'Spoluinvestor nenájdený'
        });
      }
      
      return reply.send({
        success: true,
        data: investor
      });
    } catch (error) {
      fastify.log.error(error, 'Get company investor by ID error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní spoluinvestora'
      });
    }
  });
  
  // GET /api/company-investors
  fastify.get('/api/company-investors', {
    preHandler: [authenticateFastify, checkPermissionFastify('companies', 'read')]
  }, async (request, reply) => {
    try {
      const investors = await postgresDatabase.getCompanyInvestors();
      return reply.send({ success: true, data: investors });
    } catch (error) {
      fastify.log.error(error, 'Get company investors error');
      return reply.status(500).send({ success: false, error: 'Chyba pri získavaní spoluinvestorov' });
    }
  });

  // POST /api/company-investors
  fastify.post<{ Body: Record<string, unknown> }>('/api/company-investors', {
    preHandler: [authenticateFastify, checkPermissionFastify('companies', 'create')]
  }, async (request, reply) => {
    try {
      const { firstName, lastName, email, phone, personalId, address, notes, isActive } = request.body;
      if (!firstName || !lastName) {
        return reply.status(400).send({ success: false, error: 'Meno a priezvisko sú povinné' });
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
        return reply.status(400).send({ success: false, error: 'Neplatný formát emailu' });
      }
      const createdInvestor = await postgresDatabase.createCompanyInvestor({
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        email: email ? String(email).trim() : undefined,
        phone: phone ? String(phone).trim() : undefined,
        personalId: personalId ? String(personalId).trim() : undefined,
        address: address ? String(address).trim() : undefined,
        notes: notes ? String(notes).trim() : undefined,
        isActive: typeof isActive === 'boolean' ? isActive : true
      });
      return reply.status(201).send({ success: true, message: 'Spoluinvestor úspešne vytvorený', data: createdInvestor });
    } catch (error) {
      fastify.log.error(error, 'Create company investor error');
      return reply.status(500).send({ success: false, error: 'Chyba pri vytváraní spoluinvestora' });
    }
  });

  // PUT /api/company-investors/:id
  fastify.put<{ Params: { id: string }; Body: Record<string, unknown> }>('/api/company-investors/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('companies', 'update')]
  }, async (request, reply) => {
    try {
      const updatedInvestor = await postgresDatabase.updateCompanyInvestor(request.params.id, request.body);
      return reply.send({ success: true, message: 'Spoluinvestor úspešne aktualizovaný', data: updatedInvestor });
    } catch (error) {
      fastify.log.error(error, 'Update company investor error');
      return reply.status(500).send({ success: false, error: 'Chyba pri aktualizácii spoluinvestora' });
    }
  });

  // DELETE /api/company-investors/:id
  fastify.delete<{ Params: { id: string } }>('/api/company-investors/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('companies', 'delete')]
  }, async (request, reply) => {
    try {
      await postgresDatabase.deleteCompanyInvestor(request.params.id);
      return reply.send({ success: true, message: 'Spoluinvestor úspešne vymazaný' });
    } catch (error) {
      fastify.log.error(error, 'Delete company investor error');
      return reply.status(500).send({ success: false, error: 'Chyba pri vymazávaní spoluinvestora' });
    }
  });

  // GET /api/company-investors/:companyId/shares
  fastify.get<{ Params: { companyId: string } }>('/api/company-investors/:companyId/shares', {
    preHandler: [authenticateFastify, checkPermissionFastify('companies', 'read')]
  }, async (request, reply) => {
    try {
      const shares = await postgresDatabase.getCompanyInvestorShares(request.params.companyId);
      return reply.send({ success: true, data: shares });
    } catch (error) {
      fastify.log.error(error, 'Get company investor shares error');
      return reply.status(500).send({ success: false, error: 'Chyba pri získavaní podielov' });
    }
  });

  // POST /api/company-investors/shares
  fastify.post<{ Body: Record<string, unknown> }>('/api/company-investors/shares', {
    preHandler: [authenticateFastify, checkPermissionFastify('companies', 'update')]
  }, async (request, reply) => {
    try {
      const { companyId, investorId, ownershipPercentage, investmentAmount, isPrimaryContact, profitSharePercentage } = request.body;
      if (!companyId || !investorId || ownershipPercentage === undefined) {
        return reply.status(400).send({ success: false, error: 'Company ID, investor ID a ownership percentage sú povinné' });
      }
      const createdShare = await postgresDatabase.createCompanyInvestorShare({
        companyId: String(companyId),
        investorId: String(investorId),
        ownershipPercentage: Number(ownershipPercentage),
        investmentAmount: investmentAmount ? Number(investmentAmount) : undefined,
        isPrimaryContact: typeof isPrimaryContact === 'boolean' ? isPrimaryContact : false,
        profitSharePercentage: profitSharePercentage ? Number(profitSharePercentage) : undefined
      });
      return reply.status(201).send({ success: true, message: 'Podiel spoluinvestora úspešne vytvorený', data: createdShare });
    } catch (error) {
      fastify.log.error(error, 'Create company investor share error');
      return reply.status(500).send({ success: false, error: 'Chyba pri vytváraní podielu' });
    }
  });

  // PUT /api/company-investors/shares/:id
  fastify.put<{ Params: { id: string }; Body: Record<string, unknown> }>('/api/company-investors/shares/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('companies', 'update')]
  }, async (request, reply) => {
    try {
      const updatedShare = await postgresDatabase.updateCompanyInvestorShare(request.params.id, request.body);
      return reply.send({ success: true, message: 'Podiel úspešne aktualizovaný', data: updatedShare });
    } catch (error) {
      fastify.log.error(error, 'Update company investor share error');
      return reply.status(500).send({ success: false, error: 'Chyba pri aktualizácii podielu' });
    }
  });

  // DELETE /api/company-investors/shares/:id
  fastify.delete<{ Params: { id: string } }>('/api/company-investors/shares/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('companies', 'delete')]
  }, async (request, reply) => {
    try {
      await postgresDatabase.deleteCompanyInvestorShare(request.params.id);
      return reply.send({ success: true, message: 'Podiel úspešne vymazaný' });
    } catch (error) {
      fastify.log.error(error, 'Delete company investor share error');
      return reply.status(500).send({ success: false, error: 'Chyba pri vymazávaní podielu' });
    }
  });

  fastify.log.info('✅ Company investors routes registered');
}

