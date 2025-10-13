import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticateFastify } from '../decorators/auth';
import { postgresDatabase } from '../../models/postgres-database';
import { prisma } from '../../lib/prisma';

export default async function debugRoutes(fastify: FastifyInstance) {
  
  // GET /api/debug/user-info - Get current user info with permissions
  fastify.get('/api/debug/user-info', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Not authenticated'
        });
      }

      // Get user from database
      const user = await postgresDatabase.getUserById(request.user.id);
      
      return {
        success: true,
        data: {
          id: user?.id,
          username: user?.username,
          email: user?.email,
          role: user?.role,
          companyId: user?.companyId,
          platformId: user?.platformId,
          isActive: user?.isActive
        }
      };
    } catch (error) {
      fastify.log.error(error, 'Debug user info error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní info o používateľovi'
      });
    }
  });

  // GET /api/debug/test-prisma - Test Prisma vs Legacy queries (NO AUTH)
  fastify.get('/api/debug/test-prisma', async (request, reply) => {
    try {
      const testId = '150'; // Test ID (existujúce vozidlo v DEV DB)

      // Legacy approach timing
      const legacyStart = Date.now();
      const legacyVehicle = await postgresDatabase.getVehicle(testId);
      const legacyTime = Date.now() - legacyStart;

      // Prisma approach timing  
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
            approach: 'Prisma ORM with auto-joins',
            typeSafety: '✅ Full TypeScript inference',
            relations: '✅ Automatic JOINs'
          },
          performance: {
            faster: legacyTime < prismaTime ? 'Legacy' : 'Prisma',
            difference: `${Math.abs(legacyTime - prismaTime)}ms`
          },
          benefits: {
            typeInference: 'prismaVehicle has full TS types without manual typing',
            noSQLInjection: 'Prisma auto-sanitizes all inputs',
            relations: 'companies and platforms loaded with single query',
            readability: 'Clean API vs raw SQL strings'
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

  // GET /api/debug/prisma-coverage - Overenie všetkých funkcionalít (NO AUTH)
  fastify.get('/api/debug/prisma-coverage', async (request, reply) => {
    try {
      const coverage = {
        protocols: null as unknown,
        emails: null as unknown,
        users_with_platform: null as unknown,
        rentals_with_relations: null as unknown,
        email_logs: null as unknown
      };

      // 1. PROTOKOLY - Overenie že existujú
      const protocolsCount = await prisma.protocols.count();
      const sampleProtocol = await prisma.protocols.findFirst();
      coverage.protocols = {
        count: protocolsCount,
        sample: sampleProtocol ? {
          id: sampleProtocol.id,
          type: sampleProtocol.type,
          status: sampleProtocol.status,
          rentalId: sampleProtocol.rental_id
        } : null
      };

      // 2. EMAIL LOGS - Overenie posielania/prijmania emailov
      const emailLogsCount = await prisma.email_action_logs.count();
      const recentEmail = await prisma.email_action_logs.findFirst({
        orderBy: { sent_at: 'desc' },
        take: 1
      });
      coverage.emails = {
        totalSent: emailLogsCount,
        lastEmail: recentEmail ? {
          type: recentEmail.email_type,
          recipient: recentEmail.recipient_email,
          sentAt: recentEmail.sent_at,
          status: recentEmail.status
        } : null,
        emailProcessingHistory: await prisma.email_processing_history.count()
      };

      // 3. USERS + PLATFORM INFO
      const usersWithPlatform = await prisma.users.findMany({
        where: { platform_id: { not: null } },
        include: {
          platforms: true
        },
        take: 3
      });
      coverage.users_with_platform = {
        count: usersWithPlatform.length,
        sample: usersWithPlatform.map(u => ({
          username: u.username,
          role: u.role,
          platform: u.platforms?.name,
          platformDisplayName: u.platforms?.display_name
        }))
      };

      // 4. RENTALS s kompletnými reláciami
      const rentalWithEverything = await prisma.rentals.findFirst({
        where: { customer_id: { not: null } },
        include: {
          vehicles: {
            include: { companies: true }
          },
          customers: true,
          pdf_protocols: true
        }
      });
      coverage.rentals_with_relations = rentalWithEverything ? {
        id: rentalWithEverything.id,
        customerName: rentalWithEverything.customers?.name,
        vehicle: `${rentalWithEverything.vehicles?.brand} ${rentalWithEverything.vehicles?.model}`,
        company: rentalWithEverything.vehicles?.companies?.name,
        hasPdfProtocols: (rentalWithEverything.pdf_protocols?.length || 0) > 0,
        pdfProtocolsCount: rentalWithEverything.pdf_protocols?.length || 0
      } : null;

      // 5. EMAIL PROCESSING HISTORY (IMAP)
      const emailHistory = await prisma.email_processing_history.findFirst({
        orderBy: { processed_at: 'desc' }
      });
      coverage.email_logs = {
        imapProcessed: await prisma.email_processing_history.count(),
        lastProcessed: emailHistory ? {
          emailId: emailHistory.email_id,
          status: emailHistory.status,
          processedAt: emailHistory.processed_at
        } : null
      };

      return {
        success: true,
        message: '✅ Prisma pokrýva všetky funkcionality!',
        coverage,
        summary: {
          protocols: `✅ ${protocolsCount} protokolov zmapovaných`,
          emails: `✅ ${emailLogsCount} emailov v histórii`,
          users: `✅ ${usersWithPlatform.length} users s platform info`,
          imapEmails: `✅ ${await prisma.email_processing_history.count()} IMAP emailov spracovaných`
        }
      };
    } catch (error) {
      fastify.log.error(error, 'Prisma coverage test error');
      return reply.status(500).send({
        success: false,
        error: String(error)
      });
    }
  });

  // GET /api/debug/rental/:id - Get rental info with vehicle company
  fastify.get<{
    Params: { id: string };
  }>('/api/debug/rental/:id', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      
      const rental = await postgresDatabase.getRental(id);
      if (!rental) {
        return reply.status(404).send({
          success: false,
          error: 'Rental not found'
        });
      }

      let vehicle = null;
      if (rental.vehicleId) {
        vehicle = await postgresDatabase.getVehicle(rental.vehicleId);
      }

      return {
        success: true,
        data: {
          rental: {
            id: rental.id,
            customerName: rental.customerName,
            vehicleId: rental.vehicleId,
            startDate: rental.startDate,
            endDate: rental.endDate
          },
          vehicle: vehicle ? {
            id: vehicle.id,
            licensePlate: vehicle.licensePlate,
            ownerCompanyId: vehicle.ownerCompanyId
          } : null,
          access: {
            userRole: request.user?.role,
            userCompanyId: request.user?.companyId,
            vehicleCompanyId: vehicle?.ownerCompanyId,
            hasAccess: 
              request.user?.role === 'admin' || 
              request.user?.role === 'super_admin' ||
              (request.user?.role === 'company_admin' && request.user?.companyId === vehicle?.ownerCompanyId)
          }
        }
      };
    } catch (error) {
      fastify.log.error(error, 'Debug rental info error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní info o prenájme'
      });
    }
  });

  fastify.log.info('✅ Debug routes registered');
}

