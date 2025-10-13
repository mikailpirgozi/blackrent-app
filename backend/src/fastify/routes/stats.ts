import type { FastifyInstance } from 'fastify';
import { authenticateFastify } from '../decorators/auth';
import { postgresDatabase } from '../../models/postgres-database';

export default async function statsRoutes(fastify: FastifyInstance) {
  // GET /api/stats/dashboard - Get dashboard statistics
  fastify.get('/api/stats/dashboard', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      // Get counts from database
      const vehicles = await postgresDatabase.getVehicles();
      const customers = await postgresDatabase.getCustomers();
      const rentals = await postgresDatabase.getRentals();
      
      // Calculate active rentals (endDate >= today)
      const today = new Date();
      const activeRentals = rentals.filter(r => 
        r.endDate && new Date(r.endDate) >= today
      ).length;
      
      // Calculate total revenue from rentals
      const totalRevenue = rentals.reduce((sum, r) => sum + (r.totalPrice || 0), 0);

      return {
        success: true,
        data: {
          totalVehicles: vehicles.length,
          totalCustomers: customers.length,
          activeRentals,
          totalRevenue
        }
      };
    } catch (error) {
      fastify.log.error(error, 'Get dashboard stats error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní štatistík'
      });
    }
  });

  // GET /api/stats/revenue - Get revenue statistics
  fastify.get('/api/stats/revenue', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const rentals = await postgresDatabase.getRentals();
      const revenueByMonth = rentals.reduce((acc: any, r) => {
        const month = r.startDate ? new Date(r.startDate).toISOString().slice(0, 7) : 'Unknown';
        acc[month] = (acc[month] || 0) + (r.totalPrice || 0);
        return acc;
      }, {});
      
      return { success: true, data: revenueByMonth };
    } catch (error) {
      fastify.log.error(error, 'Get revenue stats error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní štatistík príjmov'
      });
    }
  });

  // GET /api/stats/vehicles - Get vehicle statistics
  fastify.get('/api/stats/vehicles', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const vehicles = await postgresDatabase.getVehicles();
      const vehiclesByStatus = vehicles.reduce((acc: any, v) => {
        acc[v.status || 'Unknown'] = (acc[v.status || 'Unknown'] || 0) + 1;
        return acc;
      }, {});
      
      return { success: true, data: vehiclesByStatus };
    } catch (error) {
      fastify.log.error(error, 'Get vehicle stats error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní štatistík vozidiel'
      });
    }
  });

  // GET /api/stats/rentals - Get rental statistics
  fastify.get('/api/stats/rentals', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const rentals = await postgresDatabase.getRentals();
      const rentalsByStatus = rentals.reduce((acc: any, r) => {
        acc[r.status || 'Unknown'] = (acc[r.status || 'Unknown'] || 0) + 1;
        return acc;
      }, {});
      
      return { success: true, data: rentalsByStatus };
    } catch (error) {
      fastify.log.error(error, 'Get rental stats error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní štatistík prenájmov'
      });
    }
  });

  fastify.log.info('✅ Stats routes registered');
}

