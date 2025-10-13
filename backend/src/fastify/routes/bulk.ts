import type { FastifyInstance } from 'fastify';
import { authenticateFastify } from '../decorators/auth';
import { postgresDatabase } from '../../models/postgres-database';

/**
 * Bulk Data Routes - Load all data in single request
 * 100% Express equivalent from backend/src/routes/bulk.ts
 */
export default async function bulkRoutes(fastify: FastifyInstance) {
  // ⚡ BULK DATA ENDPOINT - Načíta všetky dáta jedným requestom
  fastify.get('/api/bulk/data', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      request.log.info('🚀 BULK: Loading all data in single request...');
      const startTime = Date.now();

      const user = request.user!;
      request.log.info({
        id: user.id,
        role: user.role,
        companyId: user.companyId,
        platformId: user.platformId
      }, '👤 BULK: User info');

      // ⚡ PHASE 1: Load all data in parallel (no filtering yet)
      request.log.info('📦 BULK: Phase 1 - Loading raw data...');
      const rawDataStart = Date.now();

      try {
        const [
          vehicles,
          rentals,
          customers,
          companies,
          insurers,
          expenses,
          insurances,
          settlements,
          vehicleDocuments,
          insuranceClaims
        ] = await Promise.all([
          postgresDatabase.getVehicles(true, true), // Include all vehicles (removed, private)
          postgresDatabase.getRentals(),
          postgresDatabase.getCustomers(),
          postgresDatabase.getCompanies(),
          postgresDatabase.getInsurers(),
          postgresDatabase.getExpenses(),
          postgresDatabase.getInsurances(),
          postgresDatabase.getSettlements(),
          postgresDatabase.getVehicleDocuments(),
          postgresDatabase.getInsuranceClaims()
        ]);

        const rawDataTime = Date.now() - rawDataStart;
        request.log.info(`✅ BULK: Raw data loaded in ${rawDataTime}ms`);

        // ⚡ PHASE 2: Apply permission filtering (only if not admin)
        let filteredData = {
          vehicles,
          rentals,
          customers,
          companies,
          insurers,
          expenses,
          insurances,
          settlements,
          vehicleDocuments,
          insuranceClaims
        };

        if (user.role !== 'admin' && user.role !== 'super_admin') {
          request.log.info('🔐 BULK: Applying permission filtering...');
          const filterStart = Date.now();

          let allowedCompanyIds: string[] = [];
          let allowedCompanyNames: string[] = [];

          // ✅ PLATFORM FILTERING: Company admin with platformId sees all platform companies
          if (user.role === 'company_admin' && user.platformId) {
            request.log.info({ platformId: user.platformId }, '🌐 BULK: Company admin - filtering by platform');
            const platformCompanies = companies.filter(c => c.platformId === user.platformId);
            allowedCompanyIds = platformCompanies.map(c => c.id);
            allowedCompanyNames = platformCompanies.map(c => c.name);
          } else {
            // Get user permissions once (should be cached)
            const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(user.id);
            allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
            allowedCompanyNames = userCompanyAccess.map(access => access.companyName);
          }

          request.log.info({
            allowedCompanyIds: allowedCompanyIds.length,
            allowedCompanyNames: allowedCompanyNames.length,
            userRole: user.role,
            platformId: user.platformId
          }, '🔐 BULK: User access');

          // Filter data based on permissions
          filteredData = {
            // Vehicles: filter by owner_company_id
            vehicles: vehicles.filter(v =>
              v.ownerCompanyId && allowedCompanyIds.includes(v.ownerCompanyId)
            ),

            // Rentals: filter by vehicle ownership (historical)
            rentals: rentals.filter(rental => {
              if (rental.vehicle && rental.vehicle.ownerCompanyId) {
                return allowedCompanyIds.includes(rental.vehicle.ownerCompanyId);
              } else if (rental.vehicle && rental.vehicle.company) {
                return allowedCompanyNames.includes(rental.vehicle.company);
              }
              return false;
            }),

            // Customers: no filtering (all users can see all customers)
            customers,

            // Companies: filter to only accessible companies
            companies: companies.filter(c =>
              allowedCompanyIds.includes(c.id) || allowedCompanyNames.includes(c.name)
            ),

            // Insurers: no filtering
            insurers,

            // Expenses: filter by company
            expenses: expenses.filter(e =>
              allowedCompanyNames.includes(e.company)
            ),

            // Insurances: filter by company
            insurances: insurances.filter(i =>
              i.company && allowedCompanyNames.includes(i.company)
            ),

            // Settlements: filter by company
            settlements: settlements.filter(s =>
              s.company && allowedCompanyNames.includes(s.company)
            ),

            // Vehicle Documents: filter by vehicle access
            vehicleDocuments: vehicleDocuments.filter(doc => {
              const allowedVehicleIds = filteredData.vehicles.map(v => v.id);
              return allowedVehicleIds.includes(doc.vehicleId);
            }),

            // Insurance Claims: filter by vehicle access
            insuranceClaims: insuranceClaims.filter(claim => {
              const allowedVehicleIds = filteredData.vehicles.map(v => v.id);
              return claim.vehicleId && allowedVehicleIds.includes(claim.vehicleId);
            })
          };

          const filterTime = Date.now() - filterStart;
          request.log.info(`🔐 BULK: Permission filtering applied in ${filterTime}ms`);
        }

        const totalTime = Date.now() - startTime;

        request.log.info({
          totalTime: `${totalTime}ms`,
          vehicles: filteredData.vehicles.length,
          rentals: filteredData.rentals.length,
          customers: filteredData.customers.length,
          companies: filteredData.companies.length,
          insurers: filteredData.insurers.length,
          expenses: filteredData.expenses.length,
          insurances: filteredData.insurances.length,
          settlements: filteredData.settlements.length,
          vehicleDocuments: filteredData.vehicleDocuments.length,
          insuranceClaims: filteredData.insuranceClaims.length
        }, '✅ BULK: All data loaded successfully');

        return reply.send({
          success: true,
          data: {
            ...filteredData,
            metadata: {
              loadTimeMs: totalTime,
              userRole: user.role,
              isFiltered: user.role !== 'admin' && user.role !== 'super_admin',
              timestamp: new Date().toISOString()
            }
          }
        });

      } catch (dataError) {
        request.log.error(dataError, '❌ BULK: Data loading error');
        throw dataError;
      }

    } catch (error) {
      request.log.error(error, '❌ BULK: Error loading bulk data');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri načítaní dát',
        message: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
      });
    }
  });

  fastify.log.info('✅ Bulk routes registered');
}
