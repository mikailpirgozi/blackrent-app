/**
 * 🚗 VEHICLE UNAVAILABILITY ROUTES - Fastify Migration
 * 
 * Migrated from: backend/src/routes/vehicle-unavailability.ts
 * Purpose: Vehicle booking conflicts and maintenance scheduling
 */

import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticateFastify } from '../decorators/auth';
import { postgresDatabase } from '../../models/postgres-database';
import { invalidateRelatedCache } from '../../utils/cache-service';
import type { VehicleUnavailability, ApiResponse } from '../../types';

// Zod schemas for validation
const GetUnavailabilitiesQuerySchema = z.object({
  vehicleId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

const CreateUnavailabilitySchema = z.object({
  vehicleId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().min(1),
  type: z.string().optional(),
  notes: z.string().optional(),
  priority: z.string().optional(),
  recurring: z.boolean().optional(),
  recurringConfig: z.record(z.string(), z.unknown()).optional()
});

const UpdateUnavailabilitySchema = z.object({
  vehicleId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  reason: z.string().optional(),
  type: z.string().optional(),
  notes: z.string().optional(),
  priority: z.string().optional(),
  recurring: z.boolean().optional(),
  recurringConfig: z.record(z.string(), z.unknown()).optional()
});

const vehicleUnavailabilityRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/vehicle-unavailability - Get all unavailabilities
  fastify.get<{
    Querystring: z.infer<typeof GetUnavailabilitiesQuerySchema>;
  }>('/', {
    onRequest: [authenticateFastify],
    schema: {
      querystring: GetUnavailabilitiesQuerySchema
    }
  }, async (request, reply) => {
    try {
      const { vehicleId, startDate, endDate } = request.query;

      const parsedStartDate = startDate ? new Date(startDate) : undefined;
      const parsedEndDate = endDate ? new Date(endDate) : undefined;

      const unavailabilities = await postgresDatabase.getVehicleUnavailabilities(
        vehicleId,
        parsedStartDate,
        parsedEndDate
      );

      return reply.send({
        success: true,
        data: unavailabilities
      });
    } catch (error) {
      request.log.error(error, 'Get vehicle unavailabilities error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní nedostupností vozidiel'
      });
    }
  });

  // GET /api/vehicle-unavailability/:id - Get specific unavailability
  fastify.get<{
    Params: { id: string };
  }>('/:id', {
    onRequest: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const unavailability = await postgresDatabase.getVehicleUnavailability(id);

      if (!unavailability) {
        return reply.status(404).send({
          success: false,
          error: 'Nedostupnosť vozidla nenájdená'
        });
      }

      return reply.send({
        success: true,
        data: unavailability
      });
    } catch (error) {
      request.log.error(error, 'Get vehicle unavailability error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní nedostupnosti vozidla'
      });
    }
  });

  // POST /api/vehicle-unavailability - Create new unavailability
  fastify.post<{
    Body: z.infer<typeof CreateUnavailabilitySchema>;
  }>('/', {
    onRequest: [authenticateFastify],
    schema: {
      body: CreateUnavailabilitySchema
    }
  }, async (request, reply) => {
    try {
      const {
        vehicleId,
        startDate,
        endDate,
        reason,
        type,
        notes,
        priority,
        recurring,
        recurringConfig
      } = request.body;

      const createdBy = request.user?.username || 'system';

      const unavailability = await postgresDatabase.createVehicleUnavailability({
        vehicleId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        type,
        notes,
        priority: priority ? Number(priority) : undefined,
        recurring,
        recurringConfig,
        createdBy
      });

      // Invalidate calendar cache
      invalidateRelatedCache('unavailability', 'create');

      return reply.status(201).send({
        success: true,
        data: unavailability,
        message: 'Nedostupnosť vozidla úspešne vytvorená'
      });
    } catch (error: unknown) {
      request.log.error(error, 'Create vehicle unavailability error');

      // Handle duplicate constraint error
      const dbError = error as { code?: string; constraint?: string };
      if (dbError.code === '23505' && dbError.constraint === 'unique_vehicle_period') {
        return reply.status(409).send({
          success: false,
          error: 'Nedostupnosť pre toto vozidlo v danom období už existuje. Skúste iný dátumový rozsah alebo typ nedostupnosti.',
          code: 'DUPLICATE_UNAVAILABILITY'
        });
      }

      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : String(error) || 'Chyba pri vytváraní nedostupnosti vozidla'
      });
    }
  });

  // PUT /api/vehicle-unavailability/:id - Update unavailability
  fastify.put<{
    Params: { id: string };
    Body: z.infer<typeof UpdateUnavailabilitySchema>;
  }>('/:id', {
    onRequest: [authenticateFastify],
    schema: {
      body: UpdateUnavailabilitySchema
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;

      // Parse dates if provided
      if (updateData.startDate) {
        (updateData as any).startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate) {
        (updateData as any).endDate = new Date(updateData.endDate);
      }

      const unavailability = await postgresDatabase.updateVehicleUnavailability(id, updateData as any);

      // Invalidate calendar cache
      invalidateRelatedCache('unavailability', 'update');

      return reply.send({
        success: true,
        data: unavailability,
        message: 'Nedostupnosť vozidla úspešne aktualizovaná'
      });
    } catch (error: unknown) {
      request.log.error(error, 'Update vehicle unavailability error');

      if (error instanceof Error ? error.message : String(error) === 'Nedostupnosť vozidla nenájdená') {
        return reply.status(404).send({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }

      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : String(error) || 'Chyba pri aktualizácii nedostupnosti vozidla'
      });
    }
  });

  // DELETE /api/vehicle-unavailability/:id - Delete unavailability
  fastify.delete<{
    Params: { id: string };
  }>('/:id', {
    onRequest: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const deleted = await postgresDatabase.deleteVehicleUnavailability(id);

      if (!deleted) {
        return reply.status(404).send({
          success: false,
          error: 'Nedostupnosť vozidla nenájdená'
        });
      }

      // Invalidate calendar cache
      invalidateRelatedCache('unavailability', 'delete');

      return reply.send({
        success: true,
        message: 'Nedostupnosť vozidla úspešne zmazaná'
      });
    } catch (error) {
      request.log.error(error, 'Delete vehicle unavailability error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri mazaní nedostupnosti vozidla'
      });
    }
  });

  // GET /api/vehicle-unavailability/date-range/:startDate/:endDate - Unavailabilities for calendar
  fastify.get<{
    Params: { startDate: string; endDate: string };
  }>('/date-range/:startDate/:endDate', {
    onRequest: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { startDate, endDate } = request.params;

      const unavailabilities = await postgresDatabase.getUnavailabilitiesForDateRange(
        new Date(startDate),
        new Date(endDate)
      );

      return reply.send({
        success: true,
        data: unavailabilities
      });
    } catch (error) {
      request.log.error(error, 'Get unavailabilities for date range error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní nedostupností pre dátumový rozsah'
      });
    }
  });
};

export default vehicleUnavailabilityRoutes;

