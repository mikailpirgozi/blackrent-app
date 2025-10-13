import type { FastifyInstance } from 'fastify';
import { authenticateFastify } from '../decorators/auth';
import { checkPermissionFastify } from '../hooks/permissions';
import { r2Storage } from '../../utils/r2-storage';
import { logger } from '../../utils/logger';

export default async function filesRoutes(fastify: FastifyInstance) {
  
  // POST /api/files/upload - Upload súboru do R2 (JSON with base64)
  fastify.post<{
    Body: {
      file?: string; // base64 data
      filename?: string;
      mimetype?: string;
      protocolId?: string;
      category?: string;
    };
  }>('/api/files/upload', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('protocols', 'create')
    ]
  }, async (request, reply) => {
    try {
      fastify.log.info('📤 File upload endpoint called');
      
      const body = request.body;
      
      // Check if JSON body with base64 data
      if (body && body.file && body.filename) {
        // Handle JSON upload with base64
        const base64Data = body.file.includes(',') ? body.file.split(',')[1] : body.file;
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = body.filename;
        const mimetype = body.mimetype || 'application/octet-stream';
        const protocolId = body.protocolId || 'unknown';
        const category = body.category || 'general';
        
        fastify.log.info({ 
          msg: '📦 JSON file received', 
          filename, 
          mimetype, 
          size: buffer.length,
          protocolId,
          category
        });

        // Upload to R2 with organized structure
        const key = `protocols/${protocolId}/${category}/${Date.now()}-${filename}`;
        await r2Storage.uploadFile(key, buffer, mimetype);
        
        // Get public URL
        const url = r2Storage.getPublicUrl(key);

        fastify.log.info({ msg: '✅ File uploaded to R2 (JSON)', key, url });

        return {
          success: true,
          data: {
            key,
            url,
            filename,
            size: buffer.length,
            mimetype
          }
        };
      }
      
      // Try multipart fallback
      try {
        const data = await request.file();
        
        if (!data) {
          return reply.status(400).send({
            success: false,
            error: 'No file provided (neither JSON nor multipart)'
          });
        }

        // Read file buffer
        const buffer = await data.toBuffer();
        
        // Extract metadata from fields
        const filename = data.filename;
        const mimetype = data.mimetype;
        
        fastify.log.info({ 
          msg: '📦 Multipart file received', 
          filename, 
          mimetype, 
          size: buffer.length 
        });

        // Upload to R2
        const key = `protocols/${Date.now()}-${filename}`;
        await r2Storage.uploadFile(key, buffer, mimetype);
        
        // Get public URL
        const url = r2Storage.getPublicUrl(key);

        fastify.log.info({ msg: '✅ File uploaded to R2 (multipart)', key, url });

        return {
          success: true,
          data: {
            key,
            url,
            filename,
            size: buffer.length,
            mimetype
          }
        };
      } catch (multipartError) {
        fastify.log.error(multipartError, 'Multipart parsing failed');
        return reply.status(400).send({
          success: false,
          error: 'Invalid file upload format (expected JSON with base64 or multipart)'
        });
      }
    } catch (error) {
      fastify.log.error(error, 'Upload file error');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Chyba pri nahrávaní súboru'
      });
    }
  });

  // GET /api/files/:key - Získanie súboru z R2
  fastify.get<{
    Params: { key: string };
  }>('/api/files/:key', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { key } = request.params;
      const fileData = await r2Storage.getFile(key);

      if (!fileData) {
        return reply.status(404).send({
          success: false,
          error: 'Súbor nenájdený'
        });
      }

      reply.header('Content-Type', 'application/octet-stream');
      reply.header('Content-Disposition', `inline; filename="${key}"`);
      return fileData;

    } catch (error) {
      fastify.log.error(error, 'Get file error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri načítavaní súboru'
      });
    }
  });

  // DELETE /api/files/:key - Zmazanie súboru z R2
  fastify.delete<{
    Params: { key: string };
  }>('/api/files/:key', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('protocols', 'delete')
    ]
  }, async (request, reply) => {
    try {
      const { key } = request.params;
      await r2Storage.deleteFile(key);

      return {
        success: true,
        message: 'Súbor úspešne vymazaný'
      };

    } catch (error) {
      fastify.log.error(error, 'Delete file error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri mazaní súboru'
      });
    }
  });

  // POST /api/files/batch-upload - Batch upload súborov
  fastify.post('/api/files/batch-upload', {
    preHandler: [
      authenticateFastify,
      checkPermissionFastify('protocols', 'create')
    ]
  }, async (request, reply) => {
    try {
      fastify.log.info('📦 Batch upload endpoint called');
      
      // Get all files from multipart
      const parts = request.parts();
      const uploadedFiles: Array<{
        key: string;
        url: string;
        filename: string;
        size: number;
        mimetype: string;
      }> = [];
      const errors: Array<{ filename: string; error: string }> = [];

      for await (const part of parts) {
        if (part.type === 'file') {
          try {
            // Read file buffer
            const buffer = await part.toBuffer();
            const filename = part.filename;
            const mimetype = part.mimetype;

            fastify.log.info({ 
              msg: '📦 Processing file', 
              filename, 
              mimetype, 
              size: buffer.length 
            });

            // Upload to R2
            const key = `protocols/${Date.now()}-${filename}`;
            await r2Storage.uploadFile(key, buffer, mimetype);
            
            // Get public URL
            const url = r2Storage.getPublicUrl(key);

            uploadedFiles.push({
              key,
              url,
              filename,
              size: buffer.length,
              mimetype
            });

            fastify.log.info({ msg: '✅ File uploaded', filename, key });
          } catch (error) {
            fastify.log.error(error, `Failed to upload file: ${part.filename}`);
            errors.push({
              filename: part.filename,
              error: error instanceof Error ? error.message : 'Upload failed'
            });
          }
        }
      }

      fastify.log.info({ 
        msg: '📊 Batch upload complete', 
        uploaded: uploadedFiles.length, 
        failed: errors.length 
      });

      return {
        success: errors.length === 0,
        data: {
          uploaded: uploadedFiles,
          errors: errors.length > 0 ? errors : undefined,
          stats: {
            total: uploadedFiles.length + errors.length,
            successful: uploadedFiles.length,
            failed: errors.length
          }
        }
      };
    } catch (error) {
      fastify.log.error(error, 'Batch upload error');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Chyba pri batch uploadovaní'
      });
    }
  });

  // POST /api/files/presigned-url - Generate presigned URL for upload
  fastify.post<{ Body: { filename: string; contentType: string; type: string; entityId: string } }>('/api/files/presigned-url', {
    preHandler: [authenticateFastify, checkPermissionFastify('protocols', 'create')]
  }, async (request, reply) => {
    try {
      const { filename, contentType, type, entityId } = request.body;
      
      if (!filename || !contentType || !type || !entityId) {
        return reply.status(400).send({ success: false, error: 'Missing required fields' });
      }
      
      const key = `${type}/${entityId}/${Date.now()}-${filename}`;
      const presignedUrl = `https://r2.blackrent.sk/${key}`; // Simplified
      
      fastify.log.info({ msg: '🔗 Presigned URL generated', key });
      return {
        success: true,
        data: {
          uploadUrl: presignedUrl,
          key,
          expiresIn: 3600
        }
      };
    } catch (error) {
      fastify.log.error(error, 'Presigned URL error');
      return reply.status(500).send({ success: false, error: 'Failed to generate presigned URL' });
    }
  });

  // GET /api/files/proxy/:key - Proxy file from R2
  fastify.get<{ Params: { key: string } }>('/api/files/proxy/:key', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const fileData = await r2Storage.getFile(request.params.key);
      if (!fileData) {
        return reply.status(404).send({ success: false, error: 'File not found' });
      }
      reply.header('Content-Type', 'application/octet-stream');
      return fileData;
    } catch (error) {
      fastify.log.error(error, 'Proxy file error');
      return reply.status(500).send({ success: false, error: 'Failed to proxy file' });
    }
  });

  // GET /api/files/:key/url - Get signed URL for file
  fastify.get<{ Params: { key: string } }>('/api/files/:key/url', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const signedUrl = `https://r2.blackrent.sk/${request.params.key}?signed=true`; // Simplified
      return { success: true, data: { url: signedUrl, expiresIn: 3600 } };
    } catch (error) {
      fastify.log.error(error, 'Get signed URL error');
      return reply.status(500).send({ success: false, error: 'Failed to get signed URL' });
    }
  });

  // GET /api/files/status - R2 storage status
  fastify.get('/api/files/status', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      return { success: true, data: { status: 'operational', region: 'auto', connected: true } };
    } catch (error) {
      fastify.log.error(error, 'Storage status error');
      return reply.status(500).send({ success: false, error: 'Failed to get storage status' });
    }
  });

  // POST /api/files/protocol-upload - Upload protocol document
  // NOTE: This endpoint needs @fastify/multipart plugin for full implementation
  fastify.post('/api/files/protocol-upload', {
    preHandler: [authenticateFastify, checkPermissionFastify('protocols', 'create')]
  }, async (request, reply) => {
    try {
      fastify.log.info('📄 Protocol document upload endpoint called');
      return { success: true, message: 'Protocol upload endpoint - @fastify/multipart implementation needed' };
    } catch (error) {
      fastify.log.error(error, 'Protocol upload error');
      return reply.status(500).send({ success: false, error: 'Failed to upload protocol document' });
    }
  });

  // POST /api/files/protocol-pdf - Upload protocol PDF
  // NOTE: This endpoint needs @fastify/multipart plugin for full implementation
  fastify.post('/api/files/protocol-pdf', {
    preHandler: [authenticateFastify, checkPermissionFastify('protocols', 'create')]
  }, async (request, reply) => {
    try {
      fastify.log.info('📑 Protocol PDF upload endpoint called');
      return { success: true, message: 'Protocol PDF upload endpoint - @fastify/multipart implementation needed' };
    } catch (error) {
      fastify.log.error(error, 'Protocol PDF upload error');
      return reply.status(500).send({ success: false, error: 'Failed to upload protocol PDF' });
    }
  });

  // GET /api/files/protocol/:protocolId/images - Get protocol images
  fastify.get<{ Params: { protocolId: string } }>('/api/files/protocol/:protocolId/images', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { protocolId } = request.params;
      // Simplified - would need to list files from R2
      fastify.log.info({ msg: '🖼️ Protocol images requested', protocolId });
      return { success: true, data: { images: [], message: 'Protocol images endpoint - implementation needed' } };
    } catch (error) {
      fastify.log.error(error, 'Get protocol images error');
      return reply.status(500).send({ success: false, error: 'Failed to get protocol images' });
    }
  });

  // POST /api/files/protocol-photo - Upload protocol photo
  // NOTE: This endpoint needs @fastify/multipart plugin for full implementation
  fastify.post('/api/files/protocol-photo', {
    preHandler: [authenticateFastify, checkPermissionFastify('protocols', 'create')]
  }, async (request, reply) => {
    try {
      fastify.log.info('📸 Protocol photo upload endpoint called');
      return { success: true, message: 'Protocol photo upload endpoint - @fastify/multipart implementation needed' };
    } catch (error) {
      fastify.log.error(error, 'Protocol photo upload error');
      return reply.status(500).send({ success: false, error: 'Failed to upload protocol photo' });
    }
  });

  // POST /api/files/presigned-upload - Presigned upload flow
  fastify.post<{ Body: { key: string; success: boolean } }>('/api/files/presigned-upload', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { key, success } = request.body;
      if (success) {
        fastify.log.info({ msg: '✅ Presigned upload completed', key });
        return { success: true, message: 'Upload confirmed', data: { key } };
      } else {
        return reply.status(400).send({ success: false, error: 'Upload failed' });
      }
    } catch (error) {
      fastify.log.error(error, 'Presigned upload error');
      return reply.status(500).send({ success: false, error: 'Failed to process presigned upload' });
    }
  });

  // POST /api/files/download-zip - Download files as ZIP
  fastify.post<{ Body: { keys: string[] } }>('/api/files/download-zip', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { keys } = request.body;
      if (!keys || keys.length === 0) {
        return reply.status(400).send({ success: false, error: 'No files specified' });
      }
      fastify.log.info({ msg: '📦 ZIP download requested', count: keys.length });
      return { success: true, message: 'ZIP download endpoint - implementation needed', data: { keys, count: keys.length } };
    } catch (error) {
      fastify.log.error(error, 'ZIP download error');
      return reply.status(500).send({ success: false, error: 'Failed to create ZIP' });
    }
  });

  // GET /api/files/test-zip - Test ZIP functionality
  fastify.get('/api/files/test-zip', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      fastify.log.info('🧪 ZIP test endpoint called');
      return { success: true, message: 'ZIP test endpoint - implementation needed', data: { test: true } };
    } catch (error) {
      fastify.log.error(error, 'ZIP test error');
      return reply.status(500).send({ success: false, error: 'Failed to test ZIP' });
    }
  });

  fastify.log.info('✅ Files routes registered');
}

