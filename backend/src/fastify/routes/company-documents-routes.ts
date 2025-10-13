/**
 * 📄 COMPANY DOCUMENTS ROUTES - Fastify Migration
 * 
 * Migrated from: backend/src/routes/company-documents.ts
 * Purpose: Company document uploads (contracts, invoices)
 */

import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticateFastify } from '../decorators/auth';
import { checkPermissionFastifyFull } from '../hooks/permissions';
import { postgresDatabase } from '../../models/postgres-database';
import { r2Storage } from '../../utils/r2-storage';
import type { CompanyDocument } from '../../types';

// Zod schemas
const UploadDocumentSchema = z.object({
  companyId: z.string().transform(val => parseInt(val)),
  documentType: z.enum(['contract', 'invoice']),
  documentName: z.string().min(1),
  description: z.string().optional(),
  documentMonth: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  documentYear: z.string().optional().transform(val => val ? parseInt(val) : undefined)
});

const GetDocumentsQuerySchema = z.object({
  documentType: z.enum(['contract', 'invoice']).optional(),
  year: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  month: z.string().optional().transform(val => val ? parseInt(val) : undefined)
});

const SaveMetadataSchema = z.object({
  companyId: z.number(),
  documentType: z.enum(['contract', 'invoice']),
  documentName: z.string().min(1),
  description: z.string().optional(),
  documentMonth: z.number().optional(),
  documentYear: z.number().optional(),
  filePath: z.string().min(1)
});

const companyDocumentsRoutes: FastifyPluginAsync = async (fastify) => {
  // 📄 Upload company document
  fastify.post('/upload', {
    onRequest: [authenticateFastify, checkPermissionFastifyFull('companies', 'update')]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({
          success: false,
          error: 'Žiadny súbor nebol nahraný'
        });
      }

      // Get form fields
      const fields: Record<string, any> = {};
      for (const field of Object.keys(data.fields)) {
        fields[field] = (data.fields as any)[field].value;
      }

      const validatedFields = UploadDocumentSchema.parse(fields);

      // Validate document type specific requirements
      if (validatedFields.documentType === 'invoice') {
        if (!validatedFields.documentMonth || !validatedFields.documentYear) {
          return reply.status(400).send({
            success: false,
            error: 'Pre faktúry sú povinné parametre: documentMonth, documentYear'
          });
        }
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

      // Validate file size
      const fileType = data.mimetype.startsWith('image/') ? 'image' : 'document';
      if (!r2Storage.validateFileSize(buffer.length, fileType)) {
        return reply.status(400).send({
          success: false,
          error: 'Súbor je príliš veľký'
        });
      }

      // Generate file key
      const mediaType = validatedFields.documentType === 'contract' ? 'contract' : 'invoice';
      const fileKey = r2Storage.generateFileKey(
        'company-document',
        validatedFields.companyId.toString(),
        data.filename,
        mediaType
      );

      request.log.info({ fileKey }, '📄 Generated file key');

      // Upload to R2
      const fileUrl = await r2Storage.uploadFile(
        fileKey,
        buffer,
        data.mimetype,
        {
          original_name: data.filename,
          uploaded_at: new Date().toISOString(),
          company_id: validatedFields.companyId.toString(),
          document_type: validatedFields.documentType,
          document_name: validatedFields.documentName
        }
      );

      request.log.info({ fileUrl }, '✅ File uploaded to R2');

      // Save to database
      const documentData: Partial<CompanyDocument> = {
        companyId: validatedFields.companyId,
        documentType: validatedFields.documentType,
        documentName: validatedFields.documentName,
        description: validatedFields.description,
        filePath: fileUrl,
        fileSize: buffer.length,
        fileType: data.mimetype,
        originalFilename: data.filename,
        createdBy: request.user?.id
      };

      if (validatedFields.documentType === 'invoice') {
        documentData.documentMonth = validatedFields.documentMonth;
        documentData.documentYear = validatedFields.documentYear;
      }

      const savedDocument = await postgresDatabase.createCompanyDocument(documentData as CompanyDocument);

      request.log.info({ documentId: savedDocument.id }, '✅ Document saved to database');

      return reply.send({
        success: true,
        data: savedDocument,
        message: 'Dokument úspešne nahraný'
      });

    } catch (error) {
      request.log.error(error, '❌ Error uploading company document');

      return reply.status(500).send({
        success: false,
        error: 'Chyba pri nahrávaní dokumentu',
        ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
      });
    }
  });

  // 📄 Get company documents
  fastify.get<{
    Params: { companyId: string };
    Querystring: z.infer<typeof GetDocumentsQuerySchema>;
  }>('/:companyId', {
    onRequest: [authenticateFastify, checkPermissionFastifyFull('companies', 'read')],
    schema: {
      querystring: GetDocumentsQuerySchema
    }
  }, async (request, reply) => {
    try {
      const { companyId } = request.params;
      const { documentType, year, month } = request.query;

      request.log.info({ companyId, documentType, year, month }, '📄 Getting company documents');

      const documents = await postgresDatabase.getCompanyDocuments(
        parseInt(companyId),
        documentType,
        year,
        month
      );

      request.log.info({ count: documents.length, companyId }, `✅ Found documents for company`);

      return reply.send({
        success: true,
        data: documents
      });

    } catch (error) {
      request.log.error(error, '❌ Error getting company documents');

      return reply.status(500).send({
        success: false,
        error: 'Chyba pri načítaní dokumentov',
        ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
      });
    }
  });

  // 📄 Delete company document
  fastify.delete<{
    Params: { documentId: string };
  }>('/:documentId', {
    onRequest: [authenticateFastify, checkPermissionFastifyFull('companies', 'delete')]
  }, async (request, reply) => {
    try {
      const { documentId } = request.params;

      request.log.info({ documentId }, '📄 Deleting company document');

      // Get document for file path
      const document = await postgresDatabase.getCompanyDocumentById(documentId);

      if (!document) {
        return reply.status(404).send({
          success: false,
          error: 'Dokument nenájdený'
        });
      }

      // Delete file from R2 (if not local)
      if (document.filePath && !document.filePath.startsWith('http://localhost')) {
        try {
          const fileKey = document.filePath.replace(r2Storage.getPublicUrl(''), '');
          await r2Storage.deleteFile(fileKey);
          request.log.info({ fileKey }, '✅ File deleted from R2');
        } catch (error) {
          request.log.warn(error, '⚠️ Could not delete file from R2');
        }
      }

      // Delete from database
      await postgresDatabase.deleteCompanyDocument(documentId);

      request.log.info({ documentId }, '✅ Company document deleted');

      return reply.send({
        success: true,
        message: 'Dokument úspešne zmazaný'
      });

    } catch (error) {
      request.log.error(error, '❌ Error deleting company document');

      return reply.status(500).send({
        success: false,
        error: 'Chyba pri mazaní dokumentu',
        ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
      });
    }
  });

  // 📄 Save metadata for already uploaded file
  fastify.post<{
    Body: z.infer<typeof SaveMetadataSchema>;
  }>('/save-metadata', {
    onRequest: [authenticateFastify, checkPermissionFastifyFull('companies', 'update')],
    schema: {
      body: SaveMetadataSchema
    }
  }, async (request, reply) => {
    try {
      const body = request.body;

      request.log.info(body, '📄 Save document metadata request');

      // Validate requirements for invoices
      if (body.documentType === 'invoice') {
        if (!body.documentMonth || !body.documentYear) {
          return reply.status(400).send({
            success: false,
            error: 'Pre faktúry sú povinné parametre: documentMonth, documentYear'
          });
        }
      }

      // Save to database
      const documentData: Partial<CompanyDocument> = {
        companyId: body.companyId,
        documentType: body.documentType,
        documentName: body.documentName,
        description: body.description,
        filePath: body.filePath,
        createdBy: request.user?.id
      };

      if (body.documentType === 'invoice') {
        documentData.documentMonth = body.documentMonth;
        documentData.documentYear = body.documentYear;
      }

      const savedDocument = await postgresDatabase.createCompanyDocument(documentData as CompanyDocument);

      request.log.info({ documentId: savedDocument.id }, '✅ Document metadata saved to database');

      return reply.send({
        success: true,
        data: savedDocument,
        message: 'Dokument úspešne uložený'
      });

    } catch (error) {
      request.log.error(error, '❌ Error saving document metadata');

      return reply.status(500).send({
        success: false,
        error: 'Chyba pri ukladaní dokumentu',
        ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
      });
    }
  });
};

export default companyDocumentsRoutes;

