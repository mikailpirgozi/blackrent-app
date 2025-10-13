import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticateFastify, requireRoleFastify } from '../decorators/auth';
import { checkPermissionFastify } from '../hooks/permissions';
import { postgresDatabase } from '../../models/postgres-database';
import type { Vehicle } from '../../types';
import { prisma } from '../../lib/prisma';

interface VehiclesQuerystring {
  includeRemoved?: string;
  includePrivate?: string;
}

interface VehicleParams {
  id: string;
}

export default async function vehiclesRoutes(fastify: FastifyInstance) {
  
  // GET /api/vehicles - Get all vehicles with filtering
  fastify.get<{
    Querystring: VehiclesQuerystring;
  }>('/api/vehicles', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('vehicles', 'read')
    ]
  }, async (request, reply) => {
    try {
      const { includeRemoved, includePrivate } = request.query;
      let vehicles = await postgresDatabase.getVehicles(
        includeRemoved === 'true',
        includePrivate === 'true'
      );

      const user = request.user!;

      fastify.log.info({
        msg: '🚗 Vehicles GET - user',
        role: user.role,
        userId: user.id,
        username: user.username,
        platformId: user.platformId,
        totalVehicles: vehicles.length
      });

      // Platform filtering
      if (user.platformId && user.role !== 'super_admin') {
        const originalCount = vehicles.length;
        fastify.log.info({
          msg: '🌐 VEHICLES: Platform filtering',
          username: user.username,
          role: user.role,
          platformId: user.platformId
        });
        
        vehicles = vehicles.filter(v => v.platformId === user.platformId);
        
        fastify.log.info({
          msg: '🌐 VEHICLES: Platform filter applied',
          originalCount,
          filteredCount: vehicles.length
        });
      } else if (user.role !== 'admin' && user.role !== 'super_admin') {
        // Company permission filtering
        const originalCount = vehicles.length;
        const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(user.id);
        const allowedCompanyIds = userCompanyAccess.map(a => a.companyId);

        vehicles = vehicles.filter(v => 
          v.ownerCompanyId && allowedCompanyIds.includes(v.ownerCompanyId)
        );

        fastify.log.info({
          msg: '🔐 Company Permission Filter',
          userId: user.id,
          allowedCompanyIds,
          originalCount,
          filteredCount: vehicles.length
        });
      }

      return {
        success: true,
        data: vehicles
      };
    } catch (error) {
      fastify.log.error(error, 'Get vehicles error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní vozidiel'
      });
    }
  });

  // GET /api/vehicles/test-csv - Test endpoint
  fastify.get('/api/vehicles/test-csv', {
    preHandler: [authenticateFastify]
  }, async () => {
    return {
      success: true,
      message: 'CSV endpointy sú dostupné',
      timestamp: new Date().toISOString()
    };
  });

  // 🧪 TEST ENDPOINT: Porovnanie Prisma vs Legacy queries
  fastify.get('/api/vehicles/test-prisma', async (request, reply) => {
    try {
      const testId = '1'; // Test ID

      // ⏱️ Legacy approach timing
      const legacyStart = Date.now();
      const legacyVehicle = await postgresDatabase.getVehicle(testId);
      const legacyTime = Date.now() - legacyStart;

      // ⏱️ Prisma approach timing
      const prismaStart = Date.now();
      const prismaVehicle = await prisma.vehicles.findUnique({
        where: { id: parseInt(testId) },
        include: {
          companies: true, // Automatický JOIN!
          platforms: true
        }
      });
      const prismaTime = Date.now() - prismaStart;

      return {
        success: true,
        comparison: {
          legacy: {
            time: `${legacyTime}ms`,
            data: legacyVehicle,
            approach: 'Custom SQL queries'
          },
          prisma: {
            time: `${prismaTime}ms`,
            data: prismaVehicle,
            approach: 'Prisma ORM with auto-joins'
          },
          performance: {
            faster: legacyTime < prismaTime ? 'Legacy' : 'Prisma',
            difference: `${Math.abs(legacyTime - prismaTime)}ms`
          }
        }
      };
    } catch (error) {
      fastify.log.error(error, 'Prisma test error');
      return reply.status(500).send({
        success: false,
        error: String(error)
      });
    }
  });

  // GET /api/vehicles/:id - Get single vehicle
  fastify.get<{
    Params: VehicleParams;
  }>('/api/vehicles/:id', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('vehicles', 'read')
    ]
  }, async (request, reply) => {
    try {
      const vehicle = await postgresDatabase.getVehicle(request.params.id);
      
      if (!vehicle) {
        return reply.status(404).send({
          success: false,
          error: 'Vozidlo nenájdené'
        });
      }

      return {
        success: true,
        data: vehicle
      };
    } catch (error) {
      fastify.log.error(error, 'Get vehicle error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní vozidla'
      });
    }
  });

  // POST /api/vehicles - Create new vehicle
  fastify.post<{
    Body: any;
  }>('/api/vehicles', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('vehicles', 'create')
    ]
  }, async (request, reply) => {
    try {
      const vehicleData = request.body as Record<string, unknown>;
      
      fastify.log.info({
        msg: '📝 Creating vehicle',
        brand: vehicleData.brand,
        licensePlate: vehicleData.licensePlate,
        userId: request.user!.id
      });

      // Ensure required fields for createVehicle
      const vehicleToCreate = {
        brand: String(vehicleData.brand || 'Unknown'),
        model: String(vehicleData.model || 'Unknown'),
        licensePlate: String(vehicleData.licensePlate || ''),
        vin: vehicleData.vin ? String(vehicleData.vin) : undefined,
        company: String(vehicleData.company || vehicleData.ownerCompanyId || 'Unknown'),
        pricing: (vehicleData.pricing as []) || [],
        commission: (vehicleData.commission as { type: 'percentage' | 'fixed'; value: number }) || { value: 20, type: 'percentage' as const },
        status: String(vehicleData.status || 'available') as 'available' | 'rented' | 'maintenance' | 'temporarily_removed' | 'removed' | 'stolen' | 'private',
        year: vehicleData.year ? Number(vehicleData.year) : undefined,
        extraKilometerRate: vehicleData.extraKilometerRate ? Number(vehicleData.extraKilometerRate) : undefined
      };

      const newVehicle = await postgresDatabase.createVehicle(vehicleToCreate);

      fastify.log.info({
        msg: '✅ Vehicle created',
        id: newVehicle.id,
        licensePlate: newVehicle.licensePlate
      });

      return reply.status(201).send({
        success: true,
        data: newVehicle
      });
    } catch (error) {
      fastify.log.error(error, 'Create vehicle error');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Chyba pri vytváraní vozidla'
      });
    }
  });

  // PUT /api/vehicles/:id - Update vehicle
  fastify.put<{
    Params: VehicleParams;
    Body: Vehicle;
  }>('/api/vehicles/:id', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('vehicles', 'update')
    ]
  }, async (request, reply) => {
    try {
      fastify.log.info({
        msg: '📝 Updating vehicle',
        id: request.params.id,
        userId: request.user!.id
      });

      // Get existing vehicle first
      const existingVehicle = await postgresDatabase.getVehicle(request.params.id);
      
      if (!existingVehicle) {
        return reply.status(404).send({
          success: false,
          error: 'Vozidlo nenájdené'
        });
      }

      // Merge updates with existing data
      const vehicleData = { 
        ...existingVehicle, 
        ...request.body, 
        id: request.params.id 
      } as Vehicle;
      
      await postgresDatabase.updateVehicle(vehicleData);
      
      // Get updated vehicle
      const updatedVehicle = await postgresDatabase.getVehicle(request.params.id);

      fastify.log.info({
        msg: '✅ Vehicle updated',
        id: updatedVehicle?.id,
        licensePlate: updatedVehicle?.licensePlate
      });

      return {
        success: true,
        data: updatedVehicle
      };
    } catch (error) {
      fastify.log.error(error, 'Update vehicle error');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Chyba pri aktualizácii vozidla'
      });
    }
  });

  // DELETE /api/vehicles/:id - Delete vehicle
  fastify.delete<{
    Params: VehicleParams;
  }>('/api/vehicles/:id', {
    preHandler: [
      authenticateFastify,
      requireRoleFastify(['admin', 'super_admin'])
    ]
  }, async (request, reply) => {
    try {
      await postgresDatabase.deleteVehicle(request.params.id);

      fastify.log.info({
        msg: '🗑️ Vehicle deleted',
        id: request.params.id,
        userId: request.user!.id
      });

      return {
        success: true,
        message: 'Vozidlo bolo odstránené'
      };
    } catch (error) {
      fastify.log.error(error, 'Delete vehicle error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri mazaní vozidla'
      });
    }
  });

  fastify.log.info('✅ Vehicles routes registered');
}

