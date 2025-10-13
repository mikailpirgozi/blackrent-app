import type { FastifyInstance } from 'fastify';
import { authenticateFastify } from '../decorators/auth';
import { checkPermissionFastify } from '../hooks/permissions';
import { postgresDatabase } from '../../models/postgres-database';

export default async function rentalsRoutes(fastify: FastifyInstance) {
  // GET /api/rentals
  fastify.get('/api/rentals', {
    preHandler: [authenticateFastify, checkPermissionFastify('rentals', 'read')]
  }, async (request, reply) => {
    try {
      let rentals = await postgresDatabase.getRentals();
      const user = request.user!;
      
      fastify.log.info({ 
        msg: '🚗 Rentals GET', 
        role: user.role, 
        userId: user.id,
        username: user.username,
        platformId: user.platformId,
        totalRentals: rentals.length 
      });
      
      // 🔐 PLATFORM FILTERING - Apply to ALL users with platformId (including admin role)
      if (user.platformId && user.role !== 'super_admin') {
        const originalCount = rentals.length;
        
        // ✅ PLATFORM FILTERING: Any user with platformId sees only their platform rentals
        fastify.log.info({ msg: '🌐 RENTALS: Platform filtering', username: user.username, role: user.role, platformId: user.platformId });
        
        // Get all companies for this platform
        const companies = await postgresDatabase.getCompanies();
        const platformCompanies = companies.filter(c => c.platformId === user.platformId);
        const allowedCompanyIds = platformCompanies.map(c => c.id);
        const validCompanyNames = platformCompanies.map(c => c.name);
        
        fastify.log.info({ msg: '🔍 RENTALS: Platform companies', platformId: user.platformId, companyCount: platformCompanies.length });
        
        // 🚨 STRICT FILTERING: Only show rentals where vehicle platform can be determined AND matches
        rentals = rentals.filter(rental => {
          // ❌ REJECT: No vehicle data
          if (!rental.vehicle) {
            return false;
          }
          
          // ✅ ACCEPT: vehicle has matching platformId
          if (rental.vehicle.platformId === user.platformId) {
            return true;
          }
          
          // ✅ ACCEPT: vehicle has ownerCompanyId in platform companies
          if (rental.vehicle.ownerCompanyId && allowedCompanyIds.includes(rental.vehicle.ownerCompanyId)) {
            return true;
          }
          
          // ✅ ACCEPT: vehicle company name matches platform companies
          if (rental.vehicle.company && validCompanyNames.includes(rental.vehicle.company)) {
            return true;
          }
          
          // ❌ REJECT: Cannot determine platform or doesn't match
          return false;
        });
        
        fastify.log.info({ msg: '🌐 RENTALS: Platform filter applied', originalCount, filteredCount: rentals.length });
      } else if (user.role !== 'admin' && user.role !== 'super_admin') {
        // Regular users WITHOUT platformId: filter by company permissions
        const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(user.id);
        const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
        
        // Get allowed company names
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
        
        // Filter rentals based on historical ownership
        rentals = rentals.filter(rental => {
          if (rental.vehicle && rental.vehicle.ownerCompanyId) {
            return allowedCompanyIds.includes(rental.vehicle.ownerCompanyId);
          } else if (rental.vehicle && rental.vehicle.company) {
            return validCompanyNames.includes(rental.vehicle.company);
          }
          return false; // If no vehicle or company info, don't show
        });
        
        fastify.log.info({ msg: '🔐 Rentals Permission Filter', userId: user.id, allowedCompanyIds, filteredCount: rentals.length });
      }
      
      return { success: true, data: rentals };
    } catch (error) {
      fastify.log.error(error, 'Get rentals error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní prenájmov'
      });
    }
  });

  // GET /api/rentals/:id
  fastify.get<{ Params: { id: string } }>('/api/rentals/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('rentals', 'read')]
  }, async (request, reply) => {
    try {
      const rental = await postgresDatabase.getRental(request.params.id);
      if (!rental) {
        return reply.status(404).send({ success: false, error: 'Prenájom nenájdený' });
      }
      return { success: true, data: rental };
    } catch (error) {
      fastify.log.error(error, 'Get rental error');
      return reply.status(500).send({ success: false, error: 'Chyba pri získavaní prenájmu' });
    }
  });

  // POST /api/rentals
  fastify.post('/api/rentals', {
    preHandler: [authenticateFastify, checkPermissionFastify('rentals', 'create')]
  }, async (request, reply) => {
    try {
      const rentalData = request.body as Record<string, unknown>;
      const newRental = await postgresDatabase.createRental({
        vehicleId: rentalData.vehicleId ? String(rentalData.vehicleId) : undefined,
        customerId: rentalData.customerId ? String(rentalData.customerId) : undefined,
        customerName: String(rentalData.customerName || ''),
        startDate: rentalData.startDate ? new Date(String(rentalData.startDate)) : new Date(),
        endDate: rentalData.endDate ? new Date(String(rentalData.endDate)) : new Date(),
        totalPrice: Number(rentalData.totalPrice || 0),
        commission: Number(rentalData.commission || 0),
        paymentMethod: String(rentalData.paymentMethod || 'cash')
      });
      fastify.log.info({ msg: '✅ Rental created', id: newRental.id });
      return reply.status(201).send({ success: true, data: newRental });
    } catch (error) {
      fastify.log.error(error, 'Create rental error');
      return reply.status(500).send({ success: false, error: 'Chyba pri vytváraní prenájmu' });
    }
  });

  // PUT /api/rentals/:id
  fastify.put<{ Params: { id: string } }>('/api/rentals/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('rentals', 'update')]
  }, async (request, reply) => {
    try {
      const rentalData = request.body as Record<string, unknown>;
      const rentalToUpdate = await postgresDatabase.getRental(request.params.id);
      if (!rentalToUpdate) {
        return reply.status(404).send({ success: false, error: 'Prenájom nenájdený' });
      }
      
      await postgresDatabase.updateRental({
        ...rentalToUpdate,
        vehicleId: rentalData.vehicleId ? String(rentalData.vehicleId) : rentalToUpdate.vehicleId,
        customerId: rentalData.customerId ? String(rentalData.customerId) : rentalToUpdate.customerId,
        customerName: rentalData.customerName ? String(rentalData.customerName) : rentalToUpdate.customerName,
        startDate: rentalData.startDate ? new Date(String(rentalData.startDate)) : rentalToUpdate.startDate,
        endDate: rentalData.endDate ? new Date(String(rentalData.endDate)) : rentalToUpdate.endDate,
        totalPrice: rentalData.totalPrice ? Number(rentalData.totalPrice) : rentalToUpdate.totalPrice,
        commission: rentalData.commission ? Number(rentalData.commission) : rentalToUpdate.commission,
        paymentMethod: rentalData.paymentMethod ? String(rentalData.paymentMethod) as 'cash' | 'bank_transfer' | 'vrp' | 'direct_to_owner' : rentalToUpdate.paymentMethod
      });
      const updatedRental = await postgresDatabase.getRental(request.params.id);
      fastify.log.info({ msg: '✅ Rental updated', id: request.params.id });
      return { success: true, data: updatedRental };
    } catch (error) {
      fastify.log.error(error, 'Update rental error');
      return reply.status(500).send({ success: false, error: 'Chyba pri aktualizácii prenájmu' });
    }
  });

  // DELETE /api/rentals/:id
  fastify.delete<{ Params: { id: string } }>('/api/rentals/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('rentals', 'delete')]
  }, async (request, reply) => {
    try {
      await postgresDatabase.deleteRental(request.params.id);
      fastify.log.info({ msg: '🗑️ Rental deleted', id: request.params.id });
      return { success: true, message: 'Prenájom bol odstránený' };
    } catch (error) {
      fastify.log.error(error, 'Delete rental error');
      return reply.status(500).send({ success: false, error: 'Chyba pri mazaní prenájmu' });
    }
  });

  // GET /api/rentals/paginated - Paginated rental search with filters
  fastify.get<{
    Querystring: {
      page?: number;
      limit?: number;
      search?: string;
      dateFilter?: string;
      dateFrom?: string;
      dateTo?: string;
      company?: string;
      status?: string;
      protocolStatus?: string;
      paymentMethod?: string;
      paymentStatus?: string;
      vehicleBrand?: string;
      priceMin?: string;
      priceMax?: string;
      sortBy?: string;
      sortOrder?: string;
    };
  }>('/api/rentals/paginated', {
    preHandler: [authenticateFastify, checkPermissionFastify('rentals', 'read')]
  }, async (request, reply) => {
    try {
      const { 
        page = 1, 
        limit = 50,
        search = '',
        dateFilter = 'all',
        dateFrom = '',
        dateTo = '',
        company = 'all',
        status = 'all',
        protocolStatus = 'all',
        paymentMethod = 'all',
        paymentStatus = 'all',
        vehicleBrand = 'all',
        priceMin = '',
        priceMax = '',
        sortBy = 'smart_priority',
        sortOrder = 'asc'
      } = request.query;

      const pageNum = Number(page);
      const limitNum = Number(limit);
      const offset = (pageNum - 1) * limitNum;

      // Get paginated rentals with filters
      const result = await postgresDatabase.getRentalsPaginated({
        limit: limitNum,
        offset,
        search: String(search),
        dateFilter: String(dateFilter),
        dateFrom: String(dateFrom),
        dateTo: String(dateTo),
        company: String(company),
        status: String(status),
        protocolStatus: String(protocolStatus),
        paymentMethod: String(paymentMethod),
        paymentStatus: String(paymentStatus),
        vehicleBrand: String(vehicleBrand),
        priceMin: String(priceMin),
        priceMax: String(priceMax),
        userId: request.user?.id,
        userRole: request.user?.role,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any
      });

      const user = request.user!;
      fastify.log.info({ msg: '🚗 Rentals PAGINATED GET', role: user.role, userId: user.id, totalRentals: result.rentals.length });

      // 🔐 PLATFORM FILTERING - Same as GET /api/rentals
      let filteredRentals = result.rentals;
      if (user.platformId && user.role !== 'super_admin') {
        const companies = await postgresDatabase.getCompanies();
        const platformCompanies = companies.filter(c => c.platformId === user.platformId);
        const allowedCompanyIds = platformCompanies.map(c => c.id);
        const validCompanyNames = platformCompanies.map(c => c.name);
        
        filteredRentals = filteredRentals.filter(rental => {
          if (!rental.vehicle) return false;
          if (rental.vehicle.platformId === user.platformId) return true;
          if (rental.vehicle.ownerCompanyId && allowedCompanyIds.includes(rental.vehicle.ownerCompanyId)) return true;
          if (rental.vehicle.company && validCompanyNames.includes(rental.vehicle.company)) return true;
          return false;
        });
      }

      return {
        success: true,
        data: {
          rentals: filteredRentals,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(filteredRentals.length / limitNum),
            totalItems: filteredRentals.length,
            hasMore: (pageNum * limitNum) < filteredRentals.length,
            itemsPerPage: limitNum
          }
        }
      };
    } catch (error) {
      fastify.log.error(error, 'Get paginated rentals error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní prenájmov'
      });
    }
  });

  // POST /api/rentals/:id/clone - Clone rental
  fastify.post<{
    Params: { id: string };
  }>('/api/rentals/:id/clone', {
    preHandler: [authenticateFastify, checkPermissionFastify('rentals', 'create')]
  }, async (request, reply) => {
    try {
      const originalRental = await postgresDatabase.getRental(request.params.id);
      
      if (!originalRental) {
        return reply.status(404).send({
          success: false,
          error: 'Prenájom nenájdený'
        });
      }

      // Clone rental with new dates (add days based on duration)
      const startDate = typeof originalRental.startDate === 'string' ? new Date(originalRental.startDate) : originalRental.startDate;
      const endDate = typeof originalRental.endDate === 'string' ? new Date(originalRental.endDate) : originalRental.endDate;
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const newStartDate = new Date(endDate);
      newStartDate.setDate(newStartDate.getDate() + 1); // Start day after end
      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newEndDate.getDate() + duration);

      const clonedRental = await postgresDatabase.createRental({
        vehicleId: originalRental.vehicleId,
        customerId: originalRental.customerId,
        customerName: originalRental.customerName,
        startDate: newStartDate,
        endDate: newEndDate,
        totalPrice: originalRental.totalPrice,
        commission: originalRental.commission,
        paymentMethod: originalRental.paymentMethod
      });

      fastify.log.info({ msg: '📋 Rental cloned', originalId: request.params.id, newId: clonedRental.id });

      return reply.status(201).send({
        success: true,
        message: 'Prenájom bol naklonovaný',
        data: clonedRental
      });
    } catch (error) {
      fastify.log.error(error, 'Clone rental error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri klonovaní prenájmu'
      });
    }
  });

  // POST /api/rentals/batch-import - Batch import rentals
  fastify.post<{
    Body: { rentals: any[] };
  }>('/api/rentals/batch-import', {
    preHandler: [authenticateFastify, checkPermissionFastify('rentals', 'create')]
  }, async (request, reply) => {
    try {
      const { rentals } = request.body;
      
      if (!rentals || !Array.isArray(rentals) || rentals.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'Rentals array is required'
        });
      }

      const results: any[] = [];
      const errors: any[] = [];

      for (let i = 0; i < rentals.length; i++) {
        try {
          const rentalData = rentals[i];
          
          if (!rentalData.vehicleId || !rentalData.customerName || !rentalData.startDate || !rentalData.endDate) {
            errors.push({ index: i, error: 'Missing required fields' });
            continue;
          }

          const created = await postgresDatabase.createRental({
            vehicleId: rentalData.vehicleId,
            customerId: rentalData.customerId,
            customerName: rentalData.customerName,
            startDate: new Date(rentalData.startDate),
            endDate: new Date(rentalData.endDate),
            totalPrice: Number(rentalData.totalPrice || 0),
            commission: Number(rentalData.commission || 0),
            paymentMethod: rentalData.paymentMethod || 'cash'
          });
          
          results.push({ index: i, rental: created });
        } catch (error: any) {
          errors.push({ 
            index: i, 
            error: error.message || 'Error creating rental' 
          });
        }
      }

      fastify.log.info({ msg: '📥 Batch import rentals', imported: results.length, errors: errors.length });

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

  fastify.log.info('✅ Rentals routes registered');
}

