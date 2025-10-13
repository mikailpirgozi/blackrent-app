import type { FastifyInstance } from 'fastify';
import { authenticateFastify } from '../decorators/auth';
import { checkPermissionFastifyFull } from '../hooks/permissions';
import { postgresDatabase } from '../../models/postgres-database';
import { r2Storage } from '../../utils/r2-storage';
import { v4 as uuidv4 } from 'uuid';
import type { VehicleDocument } from '../../types';

/**
 * Vehicle Documents Routes - Document management for vehicles
 * 100% Express equivalent from backend/src/routes/vehicle-documents.ts
 * Uses Fastify multipart for file uploads (recommended approach)
 */
export default async function vehicleDocumentsRoutes(fastify: FastifyInstance) {

  // GET /api/vehicle-documents - Get all vehicle documents or for specific vehicle
  fastify.get<{
    Querystring: { vehicleId?: string };
  }>('/api/vehicle-documents', {
    preHandler: [authenticateFastify, checkPermissionFastifyFull('vehicles', 'read')]
  }, async (request, reply) => {
    try {
      const { vehicleId } = request.query;
      const documents = await postgresDatabase.getVehicleDocuments(vehicleId);
      
      return reply.send({
        success: true,
        data: documents
      });
    } catch (error) {
      request.log.error(error, 'Get vehicle documents error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní dokumentov vozidiel'
      });
    }
  });

  // POST /api/vehicle-documents - Create new vehicle document
  fastify.post<{
    Body: Partial<VehicleDocument & { country?: string; isRequired?: boolean }>;
  }>('/api/vehicle-documents', {
    preHandler: [authenticateFastify, checkPermissionFastifyFull('vehicles', 'update')]
  }, async (request, reply) => {
    try {
      const { vehicleId, documentType, validFrom, validTo, documentNumber, price, notes, filePath, country, isRequired } = request.body;

      if (!vehicleId || !documentType || !validTo) {
        return reply.status(400).send({
          success: false,
          error: 'vehicleId, documentType a validTo sú povinné polia'
        });
      }

      // 🌍 VALIDATION: Vignette must have valid country
      if (documentType === 'vignette') {
        const validCountries = ['SK', 'CZ', 'AT', 'HU', 'SI'];
        if (!country || !validCountries.includes(country)) {
          return reply.status(400).send({
            success: false,
            error: 'Pre dialničnú známku je povinná platná krajina (SK, CZ, AT, HU, SI)'
          });
        }
      }

      const createdDocument = await postgresDatabase.createVehicleDocument({
        vehicleId,
        documentType,
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validTo: new Date(validTo),
        documentNumber,
        price,
        notes,
        filePath,
        country,
        isRequired
      });

      return reply.status(201).send({
        success: true,
        message: 'Dokument vozidla úspešne vytvorený',
        data: createdDocument
      });

    } catch (error) {
      request.log.error(error, 'Create vehicle document error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri vytváraní dokumentu vozidla'
      });
    }
  });

  // PUT /api/vehicle-documents/:id - Update vehicle document
  fastify.put<{
    Params: { id: string };
    Body: Partial<VehicleDocument & { country?: string; isRequired?: boolean }>;
  }>('/api/vehicle-documents/:id', {
    preHandler: [authenticateFastify, checkPermissionFastifyFull('vehicles', 'update')]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { vehicleId, documentType, validFrom, validTo, documentNumber, price, notes, filePath, country, isRequired } = request.body;

      request.log.info({
        id,
        vehicleId,
        documentType,
        country,
        isRequired
      }, '🔍 UPDATE VEHICLE DOCUMENT REQUEST');

      if (!vehicleId || !documentType || !validTo) {
        return reply.status(400).send({
          success: false,
          error: 'vehicleId, documentType a validTo sú povinné polia'
        });
      }

      // 🌍 VALIDATION: Vignette must have valid country
      if (documentType === 'vignette') {
        const validCountries = ['SK', 'CZ', 'AT', 'HU', 'SI'];
        if (!country || !validCountries.includes(country)) {
          return reply.status(400).send({
            success: false,
            error: 'Pre dialničnú známku je povinná platná krajina (SK, CZ, AT, HU, SI)'
          });
        }
      }

      const updatedDocument = await postgresDatabase.updateVehicleDocument(id, {
        vehicleId,
        documentType,
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validTo: new Date(validTo),
        documentNumber,
        price,
        notes,
        filePath,
        country,
        isRequired
      });

      request.log.info(updatedDocument, '✅ UPDATE VEHICLE DOCUMENT RESPONSE');

      return reply.send({
        success: true,
        message: 'Dokument vozidla úspešne aktualizovaný',
        data: updatedDocument
      });

    } catch (error) {
      request.log.error(error, 'Update vehicle document error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri aktualizácii dokumentu vozidla'
      });
    }
  });

  // DELETE /api/vehicle-documents/:id - Delete vehicle document
  fastify.delete<{
    Params: { id: string };
  }>('/api/vehicle-documents/:id', {
    preHandler: [authenticateFastify, checkPermissionFastifyFull('vehicles', 'delete')]
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      await postgresDatabase.deleteVehicleDocument(id);

      return reply.send({
        success: true,
        message: 'Dokument vozidla úspešne vymazaný'
      });

    } catch (error) {
      request.log.error(error, 'Delete vehicle document error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri vymazávaní dokumentu vozidla'
      });
    }
  });

  // 📄 Upload technical certificate (Fastify multipart)
  fastify.post('/api/vehicle-documents/upload-technical-certificate', {
    preHandler: [authenticateFastify, checkPermissionFastifyFull('vehicles', 'update')]
  }, async (request, reply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({
          success: false,
          error: 'Súbor je povinný'
        });
      }

      // Validate file type
      if (!r2Storage.validateFileType(data.mimetype)) {
        return reply.status(400).send({
          success: false,
          error: 'Nepodporovaný typ súboru'
        });
      }

      // Read file buffer
      const buffer = await data.toBuffer();

      // Generate unique filename
      const fileExtension = data.filename.split('.').pop();
      const fileName = `technical-certificate-${uuidv4()}.${fileExtension}`;

      // Upload to R2
      const result = await r2Storage.uploadFile(fileName, buffer, data.mimetype);

      request.log.info({ key: fileName }, '✅ Technical certificate uploaded');

      return reply.send({
        success: true,
        message: 'Technický preukaz úspešne nahraný',
        data: {
          fileKey: fileName,
          url: result,
          fileName: data.filename
        }
      });

    } catch (error) {
      request.log.error(error, 'Upload technical certificate error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri nahrávaní technického preukazu'
      });
    }
  });

  // 📄 Upload general document
  fastify.post('/api/vehicle-documents/upload', {
    preHandler: [authenticateFastify, checkPermissionFastifyFull('vehicles', 'update')]
  }, async (request, reply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({
          success: false,
          error: 'Súbor je povinný'
        });
      }

      // Validate file type
      if (!r2Storage.validateFileType(data.mimetype)) {
        return reply.status(400).send({
          success: false,
          error: 'Nepodporovaný typ súboru'
        });
      }

      // Read file buffer
      const buffer = await data.toBuffer();

      // Generate unique filename
      const fileExtension = data.filename.split('.').pop();
      const fileName = `vehicle-document-${uuidv4()}.${fileExtension}`;

      // Upload to R2
      const result = await r2Storage.uploadFile(fileName, buffer, data.mimetype);

      request.log.info({ key: fileName }, '✅ Vehicle document uploaded');

      return reply.send({
        success: true,
        message: 'Dokument úspešne nahraný',
        data: {
          fileKey: fileName,
          url: result,
          fileName: data.filename
        }
      });

    } catch (error) {
      request.log.error(error, 'Upload vehicle document error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri nahrávaní dokumentu'
      });
    }
  });

  fastify.log.info('✅ Vehicle documents routes registered');
}


