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
      const rentals = await postgresDatabase.getRentals();
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

  fastify.log.info('✅ Rentals routes registered');
}

