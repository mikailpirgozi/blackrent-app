/**
 * 📁 R2 FILES ROUTES - Fastify Migration
 * 
 * Migrated from: backend/src/routes/r2-files.ts
 * Purpose: R2 file manager - list, delete, bulk operations
 */

import { DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticateFastify } from '../decorators/auth';
import { r2Storage } from '../../utils/r2-storage';

// Zod schemas
const ListFilesQuerySchema = z.object({
  prefix: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).default(100),
  continuationToken: z.string().optional(),
  sortBy: z.enum(['name', 'size', 'date']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const DeleteFileSchema = z.object({
  key: z.string().min(1),
});

const BulkDeleteSchema = z.object({
  keys: z.array(z.string().min(1)).min(1).max(100),
});

const DeleteByPrefixSchema = z.object({
  prefix: z.string().min(1),
  confirm: z.literal(true),
});

// Types
interface R2File {
  key: string;
  size: number;
  lastModified: string;
  etag: string;
  url: string;
}

interface R2ListResponse {
  files: R2File[];
  totalCount: number;
  totalSize: number;
  continuationToken?: string;
  isTruncated: boolean;
}

interface R2StatsResponse {
  totalFiles: number;
  totalSize: number;
  byFolder: Record<string, { count: number; size: number }>;
}

// Helper functions
function sortFiles(
  files: R2File[],
  sortBy: 'name' | 'size' | 'date',
  sortOrder: 'asc' | 'desc'
): R2File[] {
  const sorted = [...files].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.key.localeCompare(b.key);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'date':
        comparison = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

function filterFiles(files: R2File[], search?: string): R2File[] {
  if (!search) return files;

  const searchLower = search.toLowerCase();
  return files.filter((file) =>
    file.key.toLowerCase().includes(searchLower)
  );
}

function getFolderStats(files: R2File[]): Record<string, { count: number; size: number }> {
  const stats: Record<string, { count: number; size: number }> = {};

  for (const file of files) {
    const folder = file.key.split('/')[0] || 'root';

    if (!stats[folder]) {
      stats[folder] = { count: 0, size: 0 };
    }

    stats[folder].count++;
    stats[folder].size += file.size;
  }

  return stats;
}

// Middleware: Check if user is admin
const checkAdminAccess = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const user = request.user;

  if (!user || (user.username !== 'admin' && user.role !== 'super_admin')) {
    reply.status(403).send({
      error: 'Access denied',
      message: 'Only admin or super_admin can access R2 File Manager'
    });
  }
};

const r2FilesRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/r2-files/list - List files with filtering, search, and pagination
  fastify.get<{
    Querystring: z.infer<typeof ListFilesQuerySchema>;
  }>('/list', {
    onRequest: [authenticateFastify, checkAdminAccess],
    schema: {
      querystring: ListFilesQuerySchema
    }
  }, async (request, reply) => {
    try {
      const query = request.query;

      const client = (r2Storage as any).client;
      if (!client) {
        return reply.status(500).send({ error: 'R2 client not initialized' });
      }

      const listCommand = new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME || 'blackrent-storage',
        Prefix: query.prefix || '',
        MaxKeys: query.limit,
        ContinuationToken: query.continuationToken,
      });

      const response = await (client as { send: (cmd: ListObjectsV2Command) => Promise<{ Contents?: Array<{ Key?: string; Size?: number; LastModified?: Date; ETag?: string }>; NextContinuationToken?: string; IsTruncated?: boolean }> }).send(listCommand);

      let files: R2File[] = (response.Contents || [])
        .filter((obj) => obj.Key && obj.Size !== undefined && obj.LastModified)
        .map((obj) => ({
          key: obj.Key!,
          size: obj.Size!,
          lastModified: obj.LastModified!.toISOString(),
          etag: obj.ETag || '',
          url: r2Storage.getPublicUrl(obj.Key!),
        }));

      files = filterFiles(files, query.search);
      files = sortFiles(files, query.sortBy, query.sortOrder);

      const totalCount = files.length;
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);

      const result: R2ListResponse = {
        files,
        totalCount,
        totalSize,
        continuationToken: response.NextContinuationToken,
        isTruncated: response.IsTruncated || false,
      };

      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid query parameters', details: error.issues });
      }
      request.log.error(error, '❌ R2 list files error');
      return reply.status(500).send({ error: 'Failed to list files' });
    }
  });

  // GET /api/r2-files/stats - Get storage statistics
  fastify.get('/stats', {
    onRequest: [authenticateFastify, checkAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const client = (r2Storage as any).client;
      if (!client) {
        return reply.status(500).send({ error: 'R2 client not initialized' });
      }

      const listCommand = new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME || 'blackrent-storage',
      });

      const response = await (client as { send: (cmd: ListObjectsV2Command) => Promise<{ Contents?: Array<{ Key?: string; Size?: number; LastModified?: Date; ETag?: string }> }> }).send(listCommand);

      const files: R2File[] = (response.Contents || [])
        .filter((obj) => obj.Key && obj.Size !== undefined && obj.LastModified)
        .map((obj) => ({
          key: obj.Key!,
          size: obj.Size!,
          lastModified: obj.LastModified!.toISOString(),
          etag: obj.ETag || '',
          url: r2Storage.getPublicUrl(obj.Key!),
        }));

      const totalFiles = files.length;
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const byFolder = getFolderStats(files);

      const stats: R2StatsResponse = {
        totalFiles,
        totalSize,
        byFolder,
      };

      return reply.send(stats);
    } catch (error) {
      request.log.error(error, '❌ R2 stats error');
      return reply.status(500).send({ error: 'Failed to get storage stats' });
    }
  });

  // DELETE /api/r2-files/delete - Delete a single file
  fastify.delete<{
    Body: z.infer<typeof DeleteFileSchema>;
  }>('/delete', {
    onRequest: [authenticateFastify, checkAdminAccess],
    schema: {
      body: DeleteFileSchema
    }
  }, async (request, reply) => {
    try {
      const body = request.body;

      await r2Storage.deleteFile(body.key);

      return reply.send({ success: true, message: 'File deleted successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid request body', details: error.issues });
      }
      request.log.error(error, '❌ R2 delete file error');
      return reply.status(500).send({ error: 'Failed to delete file' });
    }
  });

  // POST /api/r2-files/bulk-delete - Delete multiple files
  fastify.post<{
    Body: z.infer<typeof BulkDeleteSchema>;
  }>('/bulk-delete', {
    onRequest: [authenticateFastify, checkAdminAccess],
    schema: {
      body: BulkDeleteSchema
    }
  }, async (request, reply) => {
    try {
      const body = request.body;

      const results = await Promise.allSettled(
        body.keys.map((key) => r2Storage.deleteFile(key))
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      return reply.send({
        success: true,
        deleted: successful,
        failed,
        total: body.keys.length,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid request body', details: error.issues });
      }
      request.log.error(error, '❌ R2 bulk delete error');
      return reply.status(500).send({ error: 'Failed to delete files' });
    }
  });

  // POST /api/r2-files/delete-by-prefix - Delete all files matching a prefix
  fastify.post<{
    Body: z.infer<typeof DeleteByPrefixSchema>;
  }>('/delete-by-prefix', {
    onRequest: [authenticateFastify, checkAdminAccess],
    schema: {
      body: DeleteByPrefixSchema
    }
  }, async (request, reply) => {
    try {
      const body = request.body;

      const client = (r2Storage as any).client;
      if (!client) {
        return reply.status(500).send({ error: 'R2 client not initialized' });
      }

      const listCommand = new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME || 'blackrent-storage',
        Prefix: body.prefix,
      });

      const response = await (client as { send: (cmd: ListObjectsV2Command) => Promise<{ Contents?: Array<{ Key?: string }> }> }).send(listCommand);

      const keys = (response.Contents || [])
        .filter((obj) => obj.Key)
        .map((obj) => obj.Key!);

      if (keys.length === 0) {
        return reply.send({ success: true, deleted: 0, message: 'No files found with that prefix' });
      }

      const results = await Promise.allSettled(
        keys.map((key) => r2Storage.deleteFile(key))
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      return reply.send({
        success: true,
        deleted: successful,
        failed,
        total: keys.length,
        prefix: body.prefix,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid request body', details: error.issues });
      }
      request.log.error(error, '❌ R2 delete by prefix error');
      return reply.status(500).send({ error: 'Failed to delete files by prefix' });
    }
  });
};

export default r2FilesRoutes;

