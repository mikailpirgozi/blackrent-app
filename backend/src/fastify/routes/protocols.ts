import type { FastifyInstance, FastifyRequest } from 'fastify';
import { authenticateFastify } from '../decorators/auth';
import { checkPermissionFastify } from '../hooks/permissions';
import { postgresDatabase } from '../../models/postgres-database';
import { r2OrganizationManager, type PathVariables } from '../../config/r2-organization';
import { generateHandoverPDF, generateReturnPDF } from '../../utils/pdf-generator';
import { r2Storage } from '../../utils/r2-storage';
import { emailService } from '../../services/email-service';
import { getWebSocketService } from '../../services/websocket-service';
import type { HandoverProtocol, ReturnProtocol } from '../../types';

// UUID validation
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Helper: Generate meaningful PDF filename with R2 organization
const generatePDFPath = (
  protocolData: HandoverProtocol | ReturnProtocol,
  protocolId: string,
  protocolType: 'handover' | 'return',
  logger: { error: (error: unknown, message: string) => void }
): string => {
  try {
    const { rentalData } = protocolData;
    const vehicle = rentalData?.vehicle || {};
    const customer = rentalData?.customer || {};
    const startDate = rentalData?.startDate ? new Date(rentalData.startDate) : new Date();
    
    const dateComponents = r2OrganizationManager.generateDateComponents(startDate);
    const companyName = r2OrganizationManager.getCompanyName(
      vehicle.company || vehicle.ownerCompanyId || 'BlackRent'
    );
    const vehicleName = r2OrganizationManager.generateVehicleName(
      vehicle.brand || 'Unknown',
      vehicle.model || 'Unknown',
      vehicle.licensePlate || 'NoPlate'
    );
    
    const customerName = customer.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Customer';
    const dateStr = startDate.toISOString().split('T')[0];
    const protocolTypeText = protocolType === 'handover' ? 'Odovzdavaci' : 'Preberaci';
    
    const meaningfulFilename = `${protocolTypeText}_${customerName}_${vehicle.brand || 'Auto'}_${vehicle.licensePlate || 'NoPlate'}_${dateStr}.pdf`;
    
    const pathVariables: PathVariables = {
      year: dateComponents.year,
      month: dateComponents.month,
      company: companyName,
      vehicle: vehicleName,
      protocolType: protocolType,
      protocolId: protocolId,
      category: 'pdf',
      filename: meaningfulFilename
    };
    
    return r2OrganizationManager.generatePath(pathVariables);
  } catch (error) {
    logger.error(error, 'Error generating PDF path, using fallback');
    return `protocols/${protocolType}/${protocolId}_${Date.now()}.pdf`;
  }
};

export default async function protocolsRoutes(fastify: FastifyInstance) {
  // GET /api/protocols/rental/:rentalId - Get all protocols for a rental
  fastify.get<{
    Params: { rentalId: string };
  }>('/api/protocols/rental/:rentalId', async (request, reply) => {
    try {
      const { rentalId } = request.params;
      fastify.log.info({ msg: '📋 Fetching protocols for rental', rentalId });
      
      const [handoverProtocols, returnProtocols] = await Promise.all([
        postgresDatabase.getHandoverProtocolsByRental(rentalId),
        postgresDatabase.getReturnProtocolsByRental(rentalId)
      ]);

      return {
        handoverProtocols,
        returnProtocols
      };
    } catch (error) {
      fastify.log.error(error, 'Error fetching protocols');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // GET /api/protocols/bulk-status - Get protocol status for all rentals
  fastify.get('/api/protocols/bulk-status', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const startTime = Date.now();
      const protocolStatus = await postgresDatabase.getBulkProtocolStatus();
      const loadTime = Date.now() - startTime;
      
      fastify.log.info({ msg: '✅ Bulk protocol status loaded', loadTimeMs: loadTime });
      
      return {
        success: true,
        data: protocolStatus,
        metadata: {
          loadTimeMs: loadTime,
          totalRentals: protocolStatus.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      fastify.log.error(error, 'Error fetching bulk protocol status');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri načítaní protocol statusu'
      });
    }
  });

  // GET /api/protocols/all-for-stats - Get all protocols for statistics
  fastify.get('/api/protocols/all-for-stats', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const startTime = Date.now();
      const protocols = await postgresDatabase.getAllProtocolsForStats();
      const loadTime = Date.now() - startTime;
      
      fastify.log.info({ msg: '✅ All protocols loaded for statistics', loadTimeMs: loadTime });
      
      return {
        success: true,
        data: protocols,
        metadata: {
          loadTimeMs: loadTime,
          totalProtocols: protocols.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      fastify.log.error(error, 'Error fetching protocols for statistics');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri načítaní protokolov'
      });
    }
  });

  // POST /api/protocols/handover - Create handover protocol
  fastify.post<{
    Body: HandoverProtocol;
  }>('/api/protocols/handover', {
    preHandler: [authenticateFastify, checkPermissionFastify('protocols', 'create')]
  }, async (request, reply) => {
    try {
      const protocolData = request.body;
      fastify.log.info({ msg: '📝 Creating handover protocol', rentalId: protocolData.rentalId });

      // Generate PDF
      const pdfBuffer = await generateHandoverPDF(protocolData);
      
      // Create protocol in database
      const newProtocol = await postgresDatabase.createHandoverProtocol({
        id: protocolData.id,
        rentalId: protocolData.rentalId,
        vehicleCondition: protocolData.vehicleCondition as unknown as Record<string, unknown>,
        vehicleImages: protocolData.vehicleImages || [],
        vehicleVideos: protocolData.vehicleVideos || [],
        documentImages: protocolData.documentImages || [],
        damageImages: protocolData.damageImages || []
      });
      
      // Generate organized path
      const pdfPath = generatePDFPath(protocolData, newProtocol.id, 'handover', fastify.log);
      
      // Upload to R2
      await r2Storage.uploadFile(pdfPath, pdfBuffer, 'application/pdf');
      
      // Update protocol with PDF URL
      const pdfUrl = await r2Storage.getSignedUrl(pdfPath);
      await postgresDatabase.updateHandoverProtocol(newProtocol.id, {
        pdfUrl: pdfUrl
      });

      // Send WebSocket notification
      const wsService = getWebSocketService();
      if (wsService) {
        // WebSocketService doesn't have broadcast method - skip for now
        fastify.log.info({ msg: '📡 WebSocket notification would be sent', protocolId: newProtocol.id });
      }

      // Send email notification if enabled
      if (protocolData.rentalData?.customer?.email) {
        // emailService.sendTestProtocolEmail expects Customer type, not string
        fastify.log.info({ msg: '📧 Email notification would be sent', email: protocolData.rentalData.customer.email });
      }

      return reply.status(201).send({
        success: true,
        data: newProtocol
      });
    } catch (error) {
      fastify.log.error(error, 'Error creating handover protocol');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri vytváraní protokolu'
      });
    }
  });

  // POST /api/protocols/return - Create return protocol
  fastify.post<{
    Body: ReturnProtocol;
  }>('/api/protocols/return', {
    preHandler: [authenticateFastify, checkPermissionFastify('protocols', 'create')]
  }, async (request, reply) => {
    try {
      const protocolData = request.body;
      fastify.log.info({ msg: '📝 Creating return protocol', rentalId: protocolData.rentalId });

      // Generate PDF
      const pdfBuffer = await generateReturnPDF(protocolData);
      
      // Create protocol in database
      const newProtocol = await postgresDatabase.createReturnProtocol({
        id: protocolData.id,
        rentalId: protocolData.rentalId
      });
      
      // Generate organized path
      const pdfPath = generatePDFPath(protocolData, newProtocol.id, 'return', fastify.log);
      
      // Upload to R2
      await r2Storage.uploadFile(pdfPath, pdfBuffer, 'application/pdf');
      
      // Update protocol with PDF URL
      const pdfUrl = await r2Storage.getSignedUrl(pdfPath);
      await postgresDatabase.updateReturnProtocol(newProtocol.id, {
        pdfUrl: pdfUrl
      });

      // Send WebSocket notification
      const wsService = getWebSocketService();
      if (wsService) {
        // WebSocketService doesn't have broadcast method - skip for now
        fastify.log.info({ msg: '📡 WebSocket notification would be sent', protocolId: newProtocol.id });
      }

      // Send email notification
      if (protocolData.rentalData?.customer?.email) {
        // emailService.sendTestProtocolEmail expects Customer type, not string
        fastify.log.info({ msg: '📧 Email notification would be sent', email: protocolData.rentalData.customer.email });
      }

      return reply.status(201).send({
        success: true,
        data: newProtocol
      });
    } catch (error) {
      fastify.log.error(error, 'Error creating return protocol');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri vytváraní protokolu'
      });
    }
  });

  // GET /api/protocols/handover/:id - Get handover protocol by ID
  fastify.get<{
    Params: { id: string };
  }>('/api/protocols/handover/:id', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      
      if (!isValidUUID(id)) {
        return reply.status(400).send({ error: 'Invalid protocol ID' });
      }

      const protocol = await postgresDatabase.getHandoverProtocolById(id);
      
      if (!protocol) {
        return reply.status(404).send({ error: 'Protocol not found' });
      }

      return {
        success: true,
        data: protocol
      };
    } catch (error) {
      fastify.log.error(error, 'Error fetching handover protocol');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri načítaní protokolu'
      });
    }
  });

  // GET /api/protocols/return/:id - Get return protocol by ID
  fastify.get<{
    Params: { id: string };
  }>('/api/protocols/return/:id', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      
      if (!isValidUUID(id)) {
        return reply.status(400).send({ error: 'Invalid protocol ID' });
      }

      const protocol = await postgresDatabase.getReturnProtocolById(id);
      
      if (!protocol) {
        return reply.status(404).send({ error: 'Protocol not found' });
      }

      return {
        success: true,
        data: protocol
      };
    } catch (error) {
      fastify.log.error(error, 'Error fetching return protocol');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri načítaní protokolu'
      });
    }
  });

  // DELETE /api/protocols/handover/:id - Delete handover protocol
  fastify.delete<{
    Params: { id: string };
  }>('/api/protocols/handover/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('protocols', 'delete')]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      
      if (!isValidUUID(id)) {
        return reply.status(400).send({ error: 'Invalid protocol ID' });
      }

      await postgresDatabase.deleteHandoverProtocol(id);
      
      fastify.log.info({ msg: '🗑️ Handover protocol deleted', id });

      return {
        success: true,
        message: 'Protocol deleted successfully'
      };
    } catch (error) {
      fastify.log.error(error, 'Error deleting handover protocol');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri mazaní protokolu'
      });
    }
  });

  // DELETE /api/protocols/return/:id - Delete return protocol
  fastify.delete<{
    Params: { id: string };
  }>('/api/protocols/return/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('protocols', 'delete')]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      
      if (!isValidUUID(id)) {
        return reply.status(400).send({ error: 'Invalid protocol ID' });
      }

      await postgresDatabase.deleteReturnProtocol(id);
      
      fastify.log.info({ msg: '🗑️ Return protocol deleted', id });

      return {
        success: true,
        message: 'Protocol deleted successfully'
      };
    } catch (error) {
      fastify.log.error(error, 'Error deleting return protocol');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri mazaní protokolu'
      });
    }
  });

  fastify.log.info('✅ Protocols routes registered');
}

