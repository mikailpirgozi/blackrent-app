import type { FastifyInstance } from 'fastify';
import { addDays, endOfMonth, format, startOfDay, startOfMonth } from 'date-fns';
import { authenticateFastify } from '../decorators/auth';
import { postgresDatabase } from '../../models/postgres-database';
import { calculateRentalDays } from '../../utils/rentalDaysCalculator';

export default async function availabilityRoutes(fastify: FastifyInstance) {
  
  // GET /api/availability/check - Check vehicle availability for date range
  fastify.get('/api/availability/check', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { vehicleId, startDate, endDate } = request.query as Record<string, string>;
      
      if (!vehicleId || !startDate || !endDate) {
        return reply.status(400).send({
          success: false,
          error: 'vehicleId, startDate a endDate sú povinné'
        });
      }
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Get all rentals for the vehicle in the date range
      const rentals = await postgresDatabase.getRentals();
      const vehicleRentals = rentals.filter(rental => {
        if (rental.vehicleId !== vehicleId) return false;
        
        const rentalStart = new Date(rental.startDate);
        const rentalEnd = new Date(rental.endDate);
        
        // Check for overlap
        return (start <= rentalEnd && end >= rentalStart);
      });
      
      const isAvailable = vehicleRentals.length === 0;
      
      fastify.log.info({
        msg: '🔍 Availability check',
        vehicleId,
        startDate,
        endDate,
        isAvailable,
        conflictingRentals: vehicleRentals.length
      });
      
      return reply.send({
        success: true,
        data: {
          available: isAvailable,
          vehicleId,
          startDate,
          endDate,
          conflictingRentals: vehicleRentals.length,
          conflicts: vehicleRentals.map(r => ({
            id: r.id,
            startDate: r.startDate,
            endDate: r.endDate,
            customerName: r.customerName
          }))
        }
      });
    } catch (error) {
      fastify.log.error(error, 'Availability check error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri kontrole dostupnosti'
      });
    }
  });
  
  // GET /api/availability/calendar - Kalendárne dáta pre mesiac
  fastify.get('/api/availability/calendar', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { year, month, startDate: customStartDate, endDate: customEndDate, phase, fields, optimize } = request.query as Record<string, string>;
      
      let startDate: Date;
      let endDate: Date;
      
      if (customStartDate && customEndDate) {
        startDate = startOfDay(new Date(customStartDate));
        endDate = startOfDay(new Date(customEndDate));
      } else if (year && month) {
        const targetYear = Number(year);
        const targetMonth = Number(month) - 1;
        startDate = startOfMonth(new Date(targetYear, targetMonth));
        endDate = endOfMonth(startDate);
      } else {
        const today = startOfDay(new Date());
        const currentMonth = startOfMonth(today);
        const endOfCurrentMonth = endOfMonth(today);
        
        switch (phase) {
          case 'current':
            startDate = currentMonth;
            endDate = endOfCurrentMonth;
            break;
          case 'past':
            startDate = addDays(today, -90);
            endDate = addDays(currentMonth, -1);
            break;
          case 'future':
            startDate = addDays(endOfCurrentMonth, 1);
            endDate = addDays(today, 180);
            break;
          default:
            startDate = addDays(today, -90);
            endDate = addDays(today, 180);
        }
      }
      
      const unifiedResult = await postgresDatabase.getCalendarDataUnified(startDate, endDate);
      
      const calendarData = unifiedResult.calendar;
      const vehicles = unifiedResult.vehicles;
      const monthRentals = unifiedResult.rentals;
      const monthUnavailabilities = unifiedResult.unavailabilities;

      const requestedFields = fields ? fields.split(',').map(f => f.trim()) : [];
      const includeAllFields = requestedFields.length === 0;
      
      const responseData: Record<string, unknown> = {};
      
      if (includeAllFields || requestedFields.includes('calendar')) {
        responseData.calendar = calendarData;
      }
      if (includeAllFields || requestedFields.includes('vehicles')) {
        responseData.vehicles = vehicles;
      }
      if (includeAllFields || requestedFields.includes('rentals')) {
        responseData.rentals = monthRentals;
      }
      if (includeAllFields || requestedFields.includes('unavailabilities')) {
        responseData.unavailabilities = monthUnavailabilities;
      }
      if (includeAllFields || requestedFields.includes('period')) {
        responseData.period = {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          type: (year && month) ? 'month' : 'days',
          year: year ? Number(year) : startDate.getFullYear(),
          month: month ? Number(month) : startDate.getMonth() + 1,
          phase: phase || 'full',
          isProgressive: !!phase,
          dayCount: calculateRentalDays(startDate, endDate)
        };
      }

      const originalSize = JSON.stringify({
        calendar: calendarData,
        vehicles: vehicles,
        rentals: monthRentals,
        unavailabilities: monthUnavailabilities,
        period: responseData.period || {}
      }).length;
      
      const optimizedSize = JSON.stringify(responseData).length;
      const sizeSaved = originalSize - optimizedSize;
      const percentSaved = sizeSaved > 0 ? ((sizeSaved / originalSize) * 100).toFixed(1) : '0';

      return reply.send({
        success: true,
        data: responseData,
        _meta: {
          originalSize,
          optimizedSize,
          compressionRatio: percentSaved + '%',
          requestedFields: requestedFields.length > 0 ? requestedFields : 'all'
        }
      });
      
    } catch (error) {
      fastify.log.error(error, 'Get availability calendar error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní kalendárnych dát'
      });
    }
  });

  // GET /api/availability/test - Test endpoint
  fastify.get('/api/availability/test', async (request, reply) => {
    try {
      const vehicles = await postgresDatabase.getVehicles();
      
      return reply.send({
        success: true,
        message: 'Availability API funguje!',
        data: {
          vehicleCount: vehicles.length,
          rentalCount: 0,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      fastify.log.error(error, 'Availability test error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri testovaní availability API'
      });
    }
  });

  fastify.log.info('✅ Availability routes registered');
}

