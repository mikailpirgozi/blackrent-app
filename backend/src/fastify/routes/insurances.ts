import type { FastifyInstance } from 'fastify';
import { authenticateFastify } from '../decorators/auth';
import { checkPermissionFastify } from '../hooks/permissions';
import { postgresDatabase } from '../../models/postgres-database';
import type { Insurance } from '../../types';

interface InsuranceParams {
  id: string;
}

interface InsuranceQuerystring {
  search?: string;
  type?: string;
  company?: string;
  status?: string;
  vehicleId?: string;
  page?: string;
  limit?: string;
}

interface InsuranceBody {
  vehicleId: string;
  type: string;
  policyNumber: string;
  validFrom: string;
  validTo: string;
  price: number;
  company: string;
  insurerId?: string;
  paymentFrequency?: string;
  filePath?: string;
  filePaths?: string[];
  greenCardValidFrom?: string;
  greenCardValidTo?: string;
  deductibleAmount?: number;
  deductiblePercentage?: number;
}

// Helper function for filtering insurances based on query parameters
const filterInsurances = (insurances: Insurance[], query: InsuranceQuerystring) => {
  let filtered = [...insurances];
  
  // Search filter
  if (query.search && typeof query.search === 'string') {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(insurance => 
      insurance.type?.toLowerCase().includes(searchTerm) ||
      insurance.company?.toLowerCase().includes(searchTerm) ||
      insurance.policyNumber?.toLowerCase().includes(searchTerm)
    );
  }
  
  // Type filter
  if (query.type && typeof query.type === 'string') {
    filtered = filtered.filter(insurance => insurance.type === query.type);
  }
  
  // Company filter
  if (query.company && typeof query.company === 'string') {
    filtered = filtered.filter(insurance => insurance.company === query.company);
  }
  
  // Status filter (valid, expiring, expired)
  if (query.status && typeof query.status === 'string' && query.status !== 'all') {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    filtered = filtered.filter(insurance => {
      const validTo = new Date(insurance.validTo);
      
      switch (query.status) {
        case 'valid':
          return validTo > thirtyDaysFromNow;
        case 'expiring':
          return validTo > today && validTo <= thirtyDaysFromNow;
        case 'expired':
          return validTo <= today;
        default:
          return true;
      }
    });
  }
  
  // Vehicle filter
  if (query.vehicleId && typeof query.vehicleId === 'string') {
    filtered = filtered.filter(insurance => insurance.vehicleId === query.vehicleId);
  }
  
  return filtered;
};

export default async function insurancesRoutes(fastify: FastifyInstance) {
  
  // GET /api/insurances - Získanie všetkých poistiek
  fastify.get<{
    Querystring: InsuranceQuerystring;
  }>('/api/insurances', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('insurances', 'read')
    ]
  }, async (request, reply) => {
    try {
      let insurances = await postgresDatabase.getInsurances();
      
      // Platform filtering: Admin and company_admin see only their platform insurances
      if (request.user && (request.user.role === 'admin' || request.user.role === 'company_admin') && request.user.platformId) {
        fastify.log.info({
          msg: '🌐 INSURANCES: Filtering by platform',
          platformId: request.user.platformId
        });
        
        const vehicles = await postgresDatabase.getVehicles();
        const platformVehicleIds = vehicles
          .filter(v => v.platformId === request.user?.platformId)
          .map(v => v.id);
        
        const originalCount = insurances.length;
        insurances = insurances.filter(i => 
          i.vehicleId && platformVehicleIds.includes(i.vehicleId)
        );
        
        fastify.log.info({
          msg: '🌐 INSURANCES: Platform filter applied',
          originalCount,
          filteredCount: insurances.length
        });
      }
      
      return {
        success: true,
        data: insurances
      };
    } catch (error) {
      fastify.log.error(error, 'Get insurances error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní poistiek'
      });
    }
  });

  // GET /api/insurances/paginated - Získanie poistiek s pagináciou a filtrovaním
  fastify.get<{
    Querystring: InsuranceQuerystring;
  }>('/api/insurances/paginated', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('insurances', 'read')
    ]
  }, async (request, reply) => {
    try {
      fastify.log.info({
        msg: '📄 INSURANCES: Paginated request',
        query: request.query
      });
      
      const page = parseInt(request.query.page || '1') || 1;
      const limit = parseInt(request.query.limit || '20') || 20;
      const offset = (page - 1) * limit;
      
      // Load all insurances first
      let allInsurances = await postgresDatabase.getInsurances();
      
      // Company owner - filter len poistky vlastných vozidiel
      if (request.user?.role === 'company_admin' && request.user.companyId) {
        const vehicles = await postgresDatabase.getVehicles();
        const companyVehicleIds = vehicles
          .filter(v => v.ownerCompanyId === request.user?.companyId)
          .map(v => v.id);
        
        allInsurances = allInsurances.filter(i => 
          i.vehicleId && companyVehicleIds.includes(i.vehicleId)
        );
      }
      
      // Apply filters
      const filteredInsurances = filterInsurances(allInsurances, request.query);
      
      // Sort by valid to date (newest first)
      filteredInsurances.sort((a, b) => 
        new Date(b.validTo).getTime() - new Date(a.validTo).getTime()
      );
      
      // Apply pagination
      const paginatedInsurances = filteredInsurances.slice(offset, offset + limit);
      const totalCount = filteredInsurances.length;
      const totalPages = Math.ceil(totalCount / limit);
      
      fastify.log.info({
        msg: `📄 INSURANCES: Returning page ${page}/${totalPages}`,
        items: `${paginatedInsurances.length}/${totalCount}`
      });
      
      return {
        success: true,
        data: {
          insurances: paginatedInsurances,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: totalCount,
            hasMore: page < totalPages
          }
        }
      };
    } catch (error) {
      fastify.log.error(error, '❌ INSURANCES: Paginated error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri načítavaní poistiek'
      });
    }
  });

  // POST /api/insurances - Vytvorenie novej poistky
  fastify.post<{
    Body: InsuranceBody;
  }>('/api/insurances', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('insurances', 'create')
    ]
  }, async (request, reply) => {
    try {
      fastify.log.info({
        msg: '🔧 INSURANCE POST: Request body',
        body: request.body
      });
      
      const { 
        vehicleId, type, policyNumber, validFrom, validTo, price, company, 
        paymentFrequency, filePath, filePaths, greenCardValidFrom, greenCardValidTo, 
        deductibleAmount, deductiblePercentage 
      } = request.body;

      if (!vehicleId || !type || !policyNumber || !validFrom || !validTo || typeof price !== 'number' || price < 0 || !company) {
        fastify.log.info({
          msg: '🔧 INSURANCE POST: Validation failed',
          validation: {
            vehicleId: !!vehicleId,
            type: !!type,
            policyNumber: !!policyNumber,
            validFrom: !!validFrom,
            validTo: !!validTo,
            price: typeof price,
            company: !!company
          }
        });
        
        return reply.status(400).send({
          success: false,
          error: 'Všetky povinné polia musia byť vyplnené'
        });
      }

      const insuranceData = {
        vehicleId,
        type,
        policyNumber,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        price,
        company,
        paymentFrequency,
        filePath,
        filePaths,
        greenCardValidFrom: greenCardValidFrom ? new Date(greenCardValidFrom) : undefined,
        greenCardValidTo: greenCardValidTo ? new Date(greenCardValidTo) : undefined,
        deductibleAmount,
        deductiblePercentage
      };

      fastify.log.info({
        msg: '🔧 INSURANCE POST: Calling createInsurance',
        insuranceData
      });

      const createdInsurance = await postgresDatabase.createInsurance(insuranceData);

      fastify.log.info({
        msg: '🔧 INSURANCE POST: Successfully created',
        insurance: createdInsurance
      });

      return reply.status(201).send({
        success: true,
        message: 'Poistka úspešne vytvorená',
        data: createdInsurance
      });

    } catch (error) {
      fastify.log.error(error, '🔧 INSURANCE POST: Create insurance error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri vytváraní poistky'
      });
    }
  });

  // PUT /api/insurances/:id - Aktualizácia poistky
  fastify.put<{
    Params: InsuranceParams;
    Body: Partial<InsuranceBody>;
  }>('/api/insurances/:id', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('insurances', 'update')
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { 
        vehicleId, type, policyNumber, validFrom, validTo, price, company, 
        insurerId, paymentFrequency, filePath, filePaths, greenCardValidFrom, 
        greenCardValidTo, deductibleAmount, deductiblePercentage 
      } = request.body;

      if (!vehicleId || !type || !policyNumber || !validFrom || !validTo || typeof price !== 'number' || price < 0 || !company) {
        return reply.status(400).send({
          success: false,
          error: 'Všetky povinné polia musia byť vyplnené'
        });
      }

      const updatedInsurance = await postgresDatabase.updateInsurance(id, {
        vehicleId,
        type,
        policyNumber,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        price,
        company,
        insurerId,
        paymentFrequency,
        filePath,
        filePaths,
        greenCardValidFrom: greenCardValidFrom ? new Date(greenCardValidFrom) : undefined,
        greenCardValidTo: greenCardValidTo ? new Date(greenCardValidTo) : undefined,
        deductibleAmount,
        deductiblePercentage
      });

      return {
        success: true,
        message: 'Poistka úspešne aktualizovaná',
        data: updatedInsurance
      };

    } catch (error) {
      fastify.log.error(error, 'Update insurance error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri aktualizácii poistky'
      });
    }
  });

  // DELETE /api/insurances/:id - Zmazanie poistky
  fastify.delete<{
    Params: InsuranceParams;
  }>('/api/insurances/:id', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('insurances', 'delete')
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      await postgresDatabase.deleteInsurance(id);

      return {
        success: true,
        message: 'Poistka úspešne zmazaná'
      };

    } catch (error) {
      fastify.log.error(error, 'Delete insurance error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri mazaní poistky'
      });
    }
  });

  fastify.log.info('✅ Insurances routes registered');
}

