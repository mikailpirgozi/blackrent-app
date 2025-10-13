import type { FastifyInstance } from 'fastify';
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

      // ✅ FIX: Ensure proper JSON response with Content-Type header
      return reply
        .header('Content-Type', 'application/json')
        .send({
          success: true,
          data: vehicles
        });
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
  }, async (request, reply) => {
    return reply.send({
      success: true,
      message: 'CSV endpointy sú dostupné',
      timestamp: new Date().toISOString()
    });
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

      return reply.send({
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
      });
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

      return reply.send({
        success: true,
        data: vehicle
      });
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
    Body: Record<string, unknown>;
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

      return reply.send({
        success: true,
        data: updatedVehicle
      });
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

      return reply.send({
        success: true,
        message: 'Vozidlo bolo odstránené'
      });
    } catch (error) {
      fastify.log.error(error, 'Delete vehicle error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri mazaní vozidla'
      });
    }
  });

  // GET /api/vehicles/bulk-ownership-history - Bulk ownership history for all vehicles
  fastify.get('/api/vehicles/bulk-ownership-history', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      fastify.log.info('🚀 BULK: Loading ownership history for all vehicles...');
      const startTime = Date.now();

      const dbPool = (postgresDatabase as Record<string, unknown>).dbPool as { connect: () => Promise<Record<string, unknown>> };
      const client = await dbPool.connect();
      
      try {
        // 1. Get all vehicles
        const vehiclesResult = await client.query(`
          SELECT id, brand, model, license_plate, company_id 
          FROM vehicles 
          ORDER BY brand, model
        `);
        const vehicles = vehiclesResult.rows;
        
        fastify.log.info(`📊 Loading history for ${vehicles.length} vehicles...`);
        
        // 2. Get all ownership histories in one query
        const historiesResult = await client.query(`
          SELECT 
            vehicle_id,
            id,
            company_id,
            owner_company_name,
            valid_from,
            valid_to,
            transfer_reason,
            transfer_notes
          FROM vehicle_ownership_history
          ORDER BY vehicle_id, valid_from DESC
        `);
        
        // 3. Group histories by vehicle_id
        const historiesByVehicle = new Map<string, Record<string, unknown>[]>();
        historiesResult.rows.forEach((row: Record<string, unknown>) => {
          const vehicleId = String(row.vehicle_id || '');
          if (!historiesByVehicle.has(vehicleId)) {
            historiesByVehicle.set(vehicleId, []);
          }
          historiesByVehicle.get(vehicleId)!.push({
            id: row.id,
            ownerCompanyId: row.company_id,
            ownerCompanyName: row.owner_company_name,
            validFrom: row.valid_from,
            validTo: row.valid_to,
            transferReason: row.transfer_reason,
            transferNotes: row.transfer_notes
          });
        });
        
        // 4. Combine vehicle data with histories
        const allHistories = vehicles.map((vehicle: Record<string, unknown>) => {
          const vehicleId = String(vehicle.id || '');
          return {
            vehicleId,
            vehicle: {
              id: vehicleId,
              brand: vehicle.brand,
              model: vehicle.model,
              licensePlate: vehicle.license_plate,
              ownerCompanyId: vehicle.company_id
            },
            history: historiesByVehicle.get(vehicleId) || []
          };
        });
        
        const loadTime = Date.now() - startTime;
        fastify.log.info(`✅ BULK: Loaded ownership history for ${vehicles.length} vehicles in ${loadTime}ms`);

        return reply.send({
          success: true,
          data: {
            vehicleHistories: allHistories,
            totalVehicles: vehicles.length,
            loadTimeMs: loadTime
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Bulk ownership history error');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? `Failed to load bulk ownership history: ${error.message}` : 'Unknown error'
      });
    }
  });

  // GET /api/vehicles/check-duplicate/:licensePlate - Check for duplicate license plate
  fastify.get<{
    Params: { licensePlate: string };
  }>('/api/vehicles/check-duplicate/:licensePlate', {
    preHandler: [authenticateFastify, checkPermissionFastify('vehicles', 'read')]
  }, async (request, reply) => {
    try {
      const { licensePlate } = request.params;
      const allVehicles = await postgresDatabase.getVehicles(false, false);
      
      const duplicates = allVehicles.filter(v => 
        v.licensePlate?.toLowerCase() === licensePlate.toLowerCase()
      );

      fastify.log.info({
        msg: '🔍 Duplicate check',
        licensePlate,
        found: duplicates.length,
        userId: request.user!.id
      });

      return reply.send({
        success: true,
        data: {
          licensePlate,
          isDuplicate: duplicates.length > 0,
          count: duplicates.length,
          vehicles: duplicates.length > 0 ? duplicates : undefined
        }
      });
    } catch (error) {
      fastify.log.error(error, 'Check duplicate error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri kontrole duplikátov'
      });
    }
  });

  // POST /api/vehicles/assign-to-company - Assign vehicles to company
  fastify.post<{
    Body: { vehicleIds: string[]; companyId: string };
  }>('/api/vehicles/assign-to-company', {
    preHandler: [authenticateFastify, requireRoleFastify(['admin', 'super_admin'])]
  }, async (request, reply) => {
    try {
      const { vehicleIds, companyId } = request.body;
      
      if (!vehicleIds || !Array.isArray(vehicleIds) || vehicleIds.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'Vehicle IDs are required'
        });
      }

      if (!companyId) {
        return reply.status(400).send({
          success: false,
          error: 'Company ID is required'
        });
      }

      const dbPool = (postgresDatabase as Record<string, unknown>).dbPool as { connect: () => Promise<Record<string, unknown>> };
      const client = await dbPool.connect();
      try {
        const updated: string[] = [];
        
        for (const vehicleId of vehicleIds) {
          await client.query(
            'UPDATE vehicles SET company_id = $1 WHERE id = $2',
            [companyId, vehicleId]
          );
          updated.push(vehicleId);
        }

        fastify.log.info({
          msg: '🔄 Vehicles assigned to company',
          count: updated.length,
          companyId,
          userId: request.user!.id
        });

        return reply.send({
          success: true,
          message: `Assigned ${updated.length} vehicles to company`,
          data: { updated: updated.length, vehicleIds: updated }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error, 'Assign to company error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri priraďovaní vozidiel'
      });
    }
  });

  // GET /api/vehicles/export/csv - CSV Export
  fastify.get('/api/vehicles/export/csv', {
    preHandler: [authenticateFastify, checkPermissionFastify('vehicles', 'read')]
  }, async (request, reply) => {
    try {
      let vehicles = await postgresDatabase.getVehicles();
      
      // Platform/Company filtering (same as GET /api/vehicles)
      const user = request.user!;
      
      if (user.platformId && user.role !== 'super_admin') {
        vehicles = vehicles.filter(v => v.platformId === user.platformId);
      } else if (user.role !== 'admin' && user.role !== 'super_admin') {
        const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(user.id);
        const allowedCompanyIds = userCompanyAccess.map(a => a.companyId);
        vehicles = vehicles.filter(v => 
          v.ownerCompanyId && allowedCompanyIds.includes(v.ownerCompanyId)
        );
      }

      // Create CSV
      const csvHeaders = ['ID', 'Značka', 'Model', 'ŠPZ', 'VIN', 'Rok', 'Stav', 'Firma', 'Vytvorené'];
      const csvRows = vehicles.map(v => [
        v.id,
        v.brand,
        v.model,
        v.licensePlate || '',
        v.vin || '',
        v.year || '',
        v.status || '',
        v.company || '',
        v.createdAt ? v.createdAt.toISOString().split('T')[0] : ''
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      reply.header('Content-Type', 'text/csv; charset=utf-8');
      reply.header('Content-Disposition', `attachment; filename="vozidla-${new Date().toISOString().split('T')[0]}.csv"`);
      reply.header('Cache-Control', 'no-cache');
      
      fastify.log.info({ msg: '📊 CSV Export vehicles', count: vehicles.length, user: user.username });
      return reply.send('\ufeff' + csvContent);
    } catch (error) {
      fastify.log.error(error, 'CSV export error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri exporte CSV'
      });
    }
  });

  // POST /api/vehicles/import/csv - CSV Import
  fastify.post<{
    Body: { csvData: string };
  }>('/api/vehicles/import/csv', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { csvData } = request.body;
      
      if (!csvData) {
        return reply.status(400).send({
          success: false,
          error: 'CSV data is required'
        });
      }

      const lines = csvData.trim().split('\n');
      if (lines.length < 2) {
        return reply.status(400).send({
          success: false,
          error: 'CSV must contain header and at least one data row'
        });
      }

      const dataLines = lines.slice(1);
      const results: Record<string, unknown>[] = [];
      const errors: Record<string, unknown>[] = [];

      for (let i = 0; i < dataLines.length; i++) {
        try {
          const line = dataLines[i].trim();
          if (!line) continue;

          const fields = line.split(',').map(field => field.replace(/^"|"$/g, '').trim());
          
          if (fields.length < 4) {
            errors.push({ row: i + 2, error: 'Insufficient columns' });
            continue;
          }

          const [, brand, model, licensePlate, vin, year, status, company] = fields;

          if (!brand || !model || !licensePlate) {
            errors.push({ row: i + 2, error: 'Brand, model and license plate are required' });
            continue;
          }

          const vehicleData = {
            brand: brand.trim(),
            model: model.trim(),
            licensePlate: licensePlate.trim(),
            vin: vin?.trim() || undefined,
            company: company?.trim() || 'Unknown',
            year: year ? parseInt(year) : undefined,
            status: (status?.trim() as 'available' | 'rented' | 'maintenance' | 'temporarily_removed' | 'removed' | 'stolen' | 'private') || 'available',
            pricing: [],
            commission: { type: 'percentage' as const, value: 15 }
          };

          const createdVehicle = await postgresDatabase.createVehicle(vehicleData);
          results.push({ row: i + 2, vehicle: createdVehicle });
        } catch (error: unknown) {
          errors.push({ 
            row: i + 2, 
            error: error instanceof Error ? error.message : 'Error creating vehicle' 
          });
        }
      }

      fastify.log.info({ msg: '📥 CSV Import vehicles', imported: results.length, errors: errors.length });

      return reply.send({
        success: true,
        message: `CSV import completed: ${results.length} successful, ${errors.length} errors`,
        data: {
          imported: results.length,
          errorsCount: errors.length,
          results,
          errors: errors.slice(0, 10)
        }
      });
    } catch (error) {
      fastify.log.error(error, 'CSV import error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri importe CSV'
      });
    }
  });

  // GET /api/vehicles/paginated - Paginated vehicle search
  fastify.get<{
    Querystring: {
      page?: number;
      limit?: number;
      search?: string;
      brand?: string;
      status?: string;
      companyId?: string;
    };
  }>('/api/vehicles/paginated', {
    preHandler: [authenticateFastify, checkPermissionFastify('vehicles', 'read')]
  }, async (request, reply) => {
    try {
      const { page = 1, limit = 50, search = '', brand = 'all', status = 'all', companyId = 'all' } = request.query;

      fastify.log.info({ 
        msg: '🚗 Vehicles paginated', 
        page, limit, search, brand, status, companyId,
        userId: request.user!.id
      });

      const pageNum = Number(page);
      const limitNum = Number(limit);
      const offset = (pageNum - 1) * limitNum;

      // Simple implementation - get all and filter (for now)
      let vehicles = await postgresDatabase.getVehicles();
      const user = request.user!;

      // Apply filters
      if (user.platformId && user.role !== 'super_admin') {
        vehicles = vehicles.filter(v => v.platformId === user.platformId);
      } else if (user.role !== 'admin' && user.role !== 'super_admin') {
        const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(user.id);
        const allowedCompanyIds = userCompanyAccess.map(a => a.companyId);
        vehicles = vehicles.filter(v => v.ownerCompanyId && allowedCompanyIds.includes(v.ownerCompanyId));
      }

      if (search) {
        const searchLower = String(search).toLowerCase();
        vehicles = vehicles.filter(v =>
          v.brand?.toLowerCase().includes(searchLower) ||
          v.model?.toLowerCase().includes(searchLower) ||
          v.licensePlate?.toLowerCase().includes(searchLower)
        );
      }

      if (brand && brand !== 'all') {
        vehicles = vehicles.filter(v => v.brand === brand);
      }

      if (status && status !== 'all') {
        vehicles = vehicles.filter(v => v.status === status);
      }

      if (companyId && companyId !== 'all') {
        vehicles = vehicles.filter(v => v.ownerCompanyId === companyId);
      }

      const total = vehicles.length;
      const paginatedVehicles = vehicles.slice(offset, offset + limitNum);

      return reply.send({
        success: true,
        data: {
          vehicles: paginatedVehicles,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalItems: total,
            hasMore: (pageNum * limitNum) < total,
            itemsPerPage: limitNum
          }
        }
      });
    } catch (error) {
      fastify.log.error(error, 'Get paginated vehicles error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní vozidiel'
      });
    }
  });

  // POST /api/vehicles/batch-import - Batch import vehicles
  fastify.post<{
    Body: { vehicles: Record<string, unknown>[] };
  }>('/api/vehicles/batch-import', {
    preHandler: [authenticateFastify, checkPermissionFastify('vehicles', 'create')]
  }, async (request, reply) => {
    try {
      const { vehicles } = request.body;
      
      if (!vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'Vehicles array is required'
        });
      }

      const results: Record<string, unknown>[] = [];
      const errors: Record<string, unknown>[] = [];

      for (let i = 0; i < vehicles.length; i++) {
        try {
          const vehicleData = vehicles[i];
          
          if (!vehicleData.brand || !vehicleData.model || !vehicleData.licensePlate) {
            errors.push({ index: i, error: 'Missing required fields (brand, model, licensePlate)' });
            continue;
          }

          const vehicleToCreate = {
            brand: String(vehicleData.brand),
            model: String(vehicleData.model),
            licensePlate: String(vehicleData.licensePlate),
            vin: vehicleData.vin ? String(vehicleData.vin) : undefined,
            company: String(vehicleData.company || 'Unknown'),
            year: vehicleData.year ? Number(vehicleData.year) : undefined,
            status: String(vehicleData.status || 'available') as 'available' | 'rented' | 'maintenance' | 'temporarily_removed' | 'removed' | 'stolen' | 'private',
            pricing: (vehicleData.pricing as Record<string, unknown>[]) || [],
            commission: (vehicleData.commission as Record<string, unknown>) || { type: 'percentage', value: 15 }
          };

          const created = await postgresDatabase.createVehicle(vehicleToCreate);
          results.push({ index: i, vehicle: created });
        } catch (error: unknown) {
          errors.push({ 
            index: i, 
            error: error instanceof Error ? error.message : 'Error creating vehicle' 
          });
        }
      }

      fastify.log.info({ msg: '📥 Batch import vehicles', imported: results.length, errors: errors.length });

      return reply.send({
        success: true,
        message: `Batch import completed: ${results.length} successful, ${errors.length} errors`,
        data: {
          imported: results.length,
          errorsCount: errors.length,
          results,
          errors: errors.slice(0, 10)
        }
      });
    } catch (error) {
      fastify.log.error(error, 'Batch import error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri batch importe'
      });
    }
  });

  fastify.log.info('✅ Vehicles routes registered');
}

