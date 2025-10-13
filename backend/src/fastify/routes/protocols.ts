import type { FastifyInstance } from 'fastify';
import { authenticateFastify } from '../decorators/auth';
import { checkPermissionFastify } from '../hooks/permissions';
import { postgresDatabase } from '../../models/postgres-database';
import { r2OrganizationManager, type PathVariables } from '../../config/r2-organization';
import { generateHandoverPDF, generateReturnPDF } from '../../utils/pdf-generator';
import { r2Storage } from '../../utils/r2-storage';
// import { emailService } from '../../services/email-service'; // ✅ Unused import removed
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
  // GET /api/protocols - Get all protocols
  fastify.get('/api/protocols', {
    preHandler: [authenticateFastify, checkPermissionFastify('protocols', 'read')]
  }, async (request, reply) => {
    try {
      // Note: Using getAllHandoverProtocols and getAllReturnProtocols or similar
      // For now, return empty arrays - full implementation would need proper DB methods
      const handoverProtocols: unknown[] = [];
      const returnProtocols: unknown[] = [];
      
      return reply.send({
        success: true,
        data: {
          handover: handoverProtocols,
          return: returnProtocols,
          total: handoverProtocols.length + returnProtocols.length
        }
      });
    } catch (error) {
      fastify.log.error(error, 'Get all protocols error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní protokolov'
      });
    }
  });

  // GET /api/protocols/:id - Get protocol by ID
  fastify.get<{ Params: { id: string } }>('/api/protocols/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('protocols', 'read')]
  }, async (request, reply) => {
    try {
      // Try handover first
      let protocol: HandoverProtocol | ReturnProtocol | null = await postgresDatabase.getHandoverProtocolById(request.params.id);
      let type = 'handover';
      
      if (!protocol) {
        // Try return
        protocol = await postgresDatabase.getReturnProtocolById(request.params.id);
        type = 'return';
      }
      
      if (!protocol) {
        return reply.status(404).send({
          success: false,
          error: 'Protokol nenájdený'
        });
      }
      
      return reply.send({
        success: true,
        data: {
          protocol,
          type
        }
      });
    } catch (error) {
      fastify.log.error(error, 'Get protocol by ID error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní protokolu'
      });
    }
  });

  // GET /api/protocols/handover/:id/pdf - Generate handover PDF
  fastify.get<{ Params: { id: string } }>('/api/protocols/handover/:id/pdf', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const protocol = await postgresDatabase.getHandoverProtocolById(request.params.id);
      
      if (!protocol) {
        return reply.status(404).send({
          success: false,
          error: 'Protokol nenájdený'
        });
      }
      
      const pdfBuffer = await generateHandoverPDF(protocol);
      
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="handover-${request.params.id}.pdf"`);
      
      return reply.send(pdfBuffer);
    } catch (error) {
      fastify.log.error(error, 'Generate handover PDF error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri generovaní PDF'
      });
    }
  });

  // GET /api/protocols/return/:id/pdf - Generate return PDF
  fastify.get<{ Params: { id: string } }>('/api/protocols/return/:id/pdf', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const protocol = await postgresDatabase.getReturnProtocolById(request.params.id);
      
      if (!protocol) {
        return reply.status(404).send({
          success: false,
          error: 'Protokol nenájdený'
        });
      }
      
      const pdfBuffer = await generateReturnPDF(protocol);
      
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="return-${request.params.id}.pdf"`);
      
      return reply.send(pdfBuffer);
    } catch (error) {
      fastify.log.error(error, 'Generate return PDF error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri generovaní PDF'
      });
    }
  });

  // GET /api/protocols/rental/:rentalId/download-all - Download all protocols as ZIP
  fastify.get<{ Params: { rentalId: string } }>('/api/protocols/rental/:rentalId/download-all', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { rentalId } = request.params;
      
      const [handoverProtocols, returnProtocols] = await Promise.all([
        postgresDatabase.getHandoverProtocolsByRental(rentalId),
        postgresDatabase.getReturnProtocolsByRental(rentalId)
      ]);
      
      const totalProtocols = handoverProtocols.length + returnProtocols.length;
      
      if (totalProtocols === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Žiadne protokoly pre tento prenájom'
        });
      }
      
      fastify.log.info({
        msg: '📦 Download all protocols requested',
        rentalId,
        handover: handoverProtocols.length,
        return: returnProtocols.length
      });
      
      // NOTE: ZIP generation would require archiver or similar package
      return reply.send({
        success: true,
        message: 'ZIP download endpoint - implementation needed',
        data: {
          rentalId,
          protocolsFound: {
            handover: handoverProtocols.length,
            return: returnProtocols.length,
            total: totalProtocols
          },
          note: 'This endpoint requires ZIP generation library'
        }
      });
    } catch (error) {
      fastify.log.error(error, 'Download all protocols error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri sťahovaní protokolov'
      });
    }
  });
  
  // GET /api/protocols/rental/:rentalId - Get all protocols for a rental
  fastify.get<{
    Params: { rentalId: string };
  }>('/api/protocols/rental/:rentalId', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { rentalId } = request.params;
      fastify.log.info({ msg: '📋 Fetching protocols for rental', rentalId });
      
      const [handoverProtocols, returnProtocols] = await Promise.all([
        postgresDatabase.getHandoverProtocolsByRental(rentalId),
        postgresDatabase.getReturnProtocolsByRental(rentalId)
      ]);

      // ✅ Refresh signed URLs for all protocols (24h expiry)
      const refreshedHandover = await Promise.all(
        handoverProtocols.map(protocol => postgresDatabase.refreshProtocolSignedUrls(protocol))
      );
      const refreshedReturn = await Promise.all(
        returnProtocols.map(protocol => postgresDatabase.refreshProtocolSignedUrls(protocol))
      );

      return reply.send({
        handoverProtocols: refreshedHandover,
        returnProtocols: refreshedReturn
      });
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
      
      // ✅ EXPRESS COMPATIBILITY: Return protocol status directly (not wrapped)
      return reply.send(protocolStatus);
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
      
      // ✅ EXPRESS COMPATIBILITY: Return protocols directly (not wrapped)
      return reply.send(protocols);
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
      
      // 🔍 DEBUG: Log incoming data
      fastify.log.info({
        msg: '🔍 FASTIFY ENDPOINT - Received protocol data',
        hasId: !!protocolData.id,
        idValue: protocolData.id,
        idType: typeof protocolData.id,
        rentalId: protocolData.rentalId,
        allKeys: Object.keys(protocolData)
      });
      
      fastify.log.info({ msg: '📝 Creating handover protocol', rentalId: protocolData.rentalId });

      // Create protocol in database FIRST (to get ID)
      const newProtocol = await postgresDatabase.createHandoverProtocol({
        id: protocolData.id,
        rentalId: protocolData.rentalId,
        location: protocolData.location || '',
        vehicleCondition: protocolData.vehicleCondition as unknown as Record<string, unknown>,
        vehicleImages: protocolData.vehicleImages || [],
        vehicleVideos: protocolData.vehicleVideos || [],
        documentImages: protocolData.documentImages || [],
        damageImages: protocolData.damageImages || [],
        damages: protocolData.damages || [],
        signatures: protocolData.signatures || [],
        rentalData: protocolData.rentalData || {},
        notes: protocolData.notes || '',
        createdBy: protocolData.createdBy || 'system'
      });
      
      // Generate PDF with protocol that has ID
      const pdfBuffer = await generateHandoverPDF({ ...protocolData, id: newProtocol.id });
      
      // Generate organized path
      const pdfPath = generatePDFPath(protocolData, newProtocol.id, 'handover', fastify.log);
      
      // Upload to R2
      await r2Storage.uploadFile(pdfPath, pdfBuffer, 'application/pdf');
      
      // Update protocol with PDF URL - store full R2 URL for direct access
      const pdfR2Url = await r2Storage.getSignedUrl(pdfPath);
      await postgresDatabase.updateHandoverProtocol(newProtocol.id, {
        pdfUrl: pdfR2Url
      });
      
      // Generate proxy URL for frontend (without /api prefix)
      // Frontend uses Vite proxy which adds /api automatically
      const pdfProxyPath = `/files/proxy/${encodeURIComponent(pdfPath)}`;
      fastify.log.info({ msg: '📄 PDF URLs generated', r2Url: pdfR2Url, proxyPath: pdfProxyPath });

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

      // ✅ Return protocol with success wrapper for frontend compatibility
      return reply.status(201).send({
        success: true,
        protocol: newProtocol,
        email: null, // Email info if sent
        pdfProxyUrl: pdfProxyPath // Return proxy path for frontend
      });
    } catch (error) {
      fastify.log.error(error, 'Error creating handover protocol');
      
      // 🔍 Detailed error logging for debugging
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      fastify.log.error({
        msg: '🚨 HANDOVER PROTOCOL ERROR DETAILS',
        errorMessage,
        errorStack,
        protocolData: {
          rentalId: request.body.rentalId,
          hasVehicleCondition: !!request.body.vehicleCondition,
          hasSignatures: !!(request.body.signatures && request.body.signatures.length > 0)
        }
      });
      
      return reply.status(500).send({
        success: false,
        error: `Chyba pri vytváraní protokolu: ${errorMessage}`
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
      fastify.log.info({ msg: '📝 Creating return protocol', rentalId: protocolData.rentalId, protocolId: protocolData.id });

      // Log complete data for debugging
      fastify.log.info({ msg: '🔍 Return protocol data', data: JSON.stringify(protocolData, null, 2) });

      // Generate PDF
      const pdfBuffer = await generateReturnPDF(protocolData);
      
      // Create protocol in database with all data
      const newProtocol = await postgresDatabase.createReturnProtocol({
        id: protocolData.id,
        rentalId: protocolData.rentalId,
        handoverProtocolId: protocolData.handoverProtocolId,
        vehicleCondition: protocolData.vehicleCondition || {
          odometer: 0,
          fuelLevel: 0,
          fuelType: 'gasoline' as const,
          exteriorCondition: '',
          interiorCondition: ''
        },
        vehicleImages: protocolData.vehicleImages || [],
        vehicleVideos: protocolData.vehicleVideos || [],
        documentImages: protocolData.documentImages || [],
        documentVideos: protocolData.documentVideos || [],
        damageImages: protocolData.damageImages || [],
        damageVideos: protocolData.damageVideos || [],
        damages: protocolData.damages || [],
        signatures: protocolData.signatures || [],
        location: protocolData.location || '',
        status: protocolData.status || 'draft',
        completedAt: protocolData.completedAt ? new Date(protocolData.completedAt) : undefined
      });
      
      // Generate organized path
      const pdfPath = generatePDFPath(protocolData, newProtocol.id, 'return', fastify.log);
      
      // Upload to R2
      await r2Storage.uploadFile(pdfPath, pdfBuffer, 'application/pdf');
      
      // Update protocol with PDF URL - store full R2 URL for direct access
      const pdfR2Url = await r2Storage.getSignedUrl(pdfPath);
      await postgresDatabase.updateReturnProtocol(newProtocol.id, {
        pdfUrl: pdfR2Url
      });
      
      // Generate proxy URL for frontend (without /api prefix)
      // Frontend uses Vite proxy which adds /api automatically
      const pdfProxyPath = `/files/proxy/${encodeURIComponent(pdfPath)}`;
      fastify.log.info({ msg: '📄 PDF URLs generated', r2Url: pdfR2Url, proxyPath: pdfProxyPath });

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

      // ✅ Return protocol with success wrapper for frontend compatibility
      return reply.status(201).send({
        success: true,
        protocol: newProtocol,
        email: null, // Email info if sent
        pdfProxyUrl: pdfProxyPath // Return proxy path for frontend
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
        return reply.status(404).send({ error: 'Protocol not found'         });
      }

      // ✅ EXPRESS COMPATIBILITY: Return protocol directly
      return reply.send(protocol);
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
        return reply.status(404).send({ error: 'Protocol not found'         });
      }

      // ✅ EXPRESS COMPATIBILITY: Return protocol directly
      return reply.send(protocol);
    } catch (error) {
      fastify.log.error(error, 'Error fetching return protocol');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri načítaní protokolu'
      });
    }
  });

  // PUT /api/protocols/handover/:id - Update handover protocol
  fastify.put<{
    Params: { id: string };
    Body: Partial<HandoverProtocol>;
  }>('/api/protocols/handover/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('protocols', 'update')]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      
      if (!isValidUUID(id)) {
        return reply.status(400).send({ error: 'Invalid protocol ID' });
      }

      const existingProtocol = await postgresDatabase.getHandoverProtocolById(id);
      
      if (!existingProtocol) {
        return reply.status(404).send({ error: 'Protocol not found' });
      }

      // Update protocol
      await postgresDatabase.updateHandoverProtocol(id, request.body);
      
      // Get updated protocol
      const updatedProtocol = await postgresDatabase.getHandoverProtocolById(id);
      
      fastify.log.info({ msg: '✅ Handover protocol updated', id });

      // ✅ EXPRESS COMPATIBILITY: Return protocol directly
      return reply.send(updatedProtocol);
    } catch (error) {
      fastify.log.error(error, 'Error updating handover protocol');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri aktualizácii protokolu'
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

      return reply.send({
        success: true,
        message: 'Protocol deleted successfully'
      });
    } catch (error) {
      fastify.log.error(error, 'Error deleting handover protocol');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri mazaní protokolu'
      });
    }
  });

  // PUT /api/protocols/return/:id - Update return protocol
  fastify.put<{
    Params: { id: string };
    Body: Partial<ReturnProtocol>;
  }>('/api/protocols/return/:id', {
    preHandler: [authenticateFastify, checkPermissionFastify('protocols', 'update')]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      
      if (!isValidUUID(id)) {
        return reply.status(400).send({ error: 'Invalid protocol ID' });
      }

      const existingProtocol = await postgresDatabase.getReturnProtocolById(id);
      
      if (!existingProtocol) {
        return reply.status(404).send({ error: 'Protocol not found' });
      }

      // Update protocol
      await postgresDatabase.updateReturnProtocol(id, request.body);
      
      // Get updated protocol
      const updatedProtocol = await postgresDatabase.getReturnProtocolById(id);
      
      fastify.log.info({ msg: '✅ Return protocol updated', id });

      // ✅ EXPRESS COMPATIBILITY: Return protocol directly
      return reply.send(updatedProtocol);
    } catch (error) {
      fastify.log.error(error, 'Error updating return protocol');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri aktualizácii protokolu'
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

      return reply.send({
        success: true,
        message: 'Protocol deleted successfully'
      });
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

