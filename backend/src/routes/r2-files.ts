import { DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import express, { Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermissions } from '../middleware/permissions.js';
import { r2Storage } from '../utils/r2-storage.js';

const router = express.Router();

// ===== ZOD SCHEMAS =====

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
  confirm: z.literal(true), // Require explicit confirmation
});

// ===== TYPES =====

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

// ===== HELPER FUNCTIONS =====

/**
 * Sort files based on criteria
 */
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

/**
 * Filter files by search term
 */
function filterFiles(files: R2File[], search?: string): R2File[] {
  if (!search) return files;

  const searchLower = search.toLowerCase();
  return files.filter((file) =>
    file.key.toLowerCase().includes(searchLower)
  );
}

/**
 * Get folder stats from files
 */
function getFolderStats(files: R2File[]): Record<string, { count: number; size: number }> {
  const stats: Record<string, { count: number; size: number }> = {};

  for (const file of files) {
    // Extract top-level folder from key
    const folder = file.key.split('/')[0] || 'root';

    if (!stats[folder]) {
      stats[folder] = { count: 0, size: 0 };
    }

    stats[folder].count++;
    stats[folder].size += file.size;
  }

  return stats;
}

// ===== ROUTES =====

/**
 * GET /api/r2-files/list
 * List files with filtering, search, and pagination
 */
router.get('/list', authenticateToken, checkPermissions(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const query = ListFilesQuerySchema.parse(req.query);

    // Get R2 client
    const client = (r2Storage as { client: unknown }).client;
    if (!client) {
      res.status(500).json({ error: 'R2 client not initialized' });
      return;
    }

    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME || 'blackrent-storage',
      Prefix: query.prefix || '',
      MaxKeys: query.limit,
      ContinuationToken: query.continuationToken,
    });

    const response = await (client as { send: (cmd: ListObjectsV2Command) => Promise<{ Contents?: Array<{ Key?: string; Size?: number; LastModified?: Date; ETag?: string }>; NextContinuationToken?: string; IsTruncated?: boolean }> }).send(listCommand);

    // Map to R2File format
    let files: R2File[] = (response.Contents || [])
      .filter((obj) => obj.Key && obj.Size !== undefined && obj.LastModified)
      .map((obj) => ({
        key: obj.Key!,
        size: obj.Size!,
        lastModified: obj.LastModified!.toISOString(),
        etag: obj.ETag || '',
        url: r2Storage.getPublicUrl(obj.Key!),
      }));

    // Apply search filter
    files = filterFiles(files, query.search);

    // Apply sorting
    files = sortFiles(files, query.sortBy, query.sortOrder);

    // Calculate totals
    const totalCount = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    const result: R2ListResponse = {
      files,
      totalCount,
      totalSize,
      continuationToken: response.NextContinuationToken,
      isTruncated: response.IsTruncated || false,
    };

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
      return;
    }
    console.error('❌ R2 list files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

/**
 * GET /api/r2-files/stats
 * Get storage statistics
 */
router.get('/stats', authenticateToken, checkPermissions(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    // Get R2 client
    const client = (r2Storage as { client: unknown }).client;
    if (!client) {
      res.status(500).json({ error: 'R2 client not initialized' });
      return;
    }

    // List ALL files (no limit) to get accurate stats
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME || 'blackrent-storage',
    });

    const response = await (client as { send: (cmd: ListObjectsV2Command) => Promise<{ Contents?: Array<{ Key?: string; Size?: number; LastModified?: Date; ETag?: string }> }> }).send(listCommand);

    // Map to R2File format
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

    res.json(stats);
  } catch (error) {
    console.error('❌ R2 stats error:', error);
    res.status(500).json({ error: 'Failed to get storage stats' });
  }
});

/**
 * DELETE /api/r2-files/delete
 * Delete a single file
 */
router.delete('/delete', authenticateToken, checkPermissions(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const body = DeleteFileSchema.parse(req.body);

    await r2Storage.deleteFile(body.key);

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request body', details: error.errors });
      return;
    }
    console.error('❌ R2 delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

/**
 * POST /api/r2-files/bulk-delete
 * Delete multiple files
 */
router.post('/bulk-delete', authenticateToken, checkPermissions(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const body = BulkDeleteSchema.parse(req.body);

    const results = await Promise.allSettled(
      body.keys.map((key) => r2Storage.deleteFile(key))
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    res.json({
      success: true,
      deleted: successful,
      failed,
      total: body.keys.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request body', details: error.errors });
      return;
    }
    console.error('❌ R2 bulk delete error:', error);
    res.status(500).json({ error: 'Failed to delete files' });
  }
});

/**
 * POST /api/r2-files/delete-by-prefix
 * Delete all files matching a prefix (dangerous!)
 */
router.post('/delete-by-prefix', authenticateToken, checkPermissions(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const body = DeleteByPrefixSchema.parse(req.body);

    // Get R2 client
    const client = (r2Storage as { client: unknown }).client;
    if (!client) {
      res.status(500).json({ error: 'R2 client not initialized' });
      return;
    }

    // List all files with prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME || 'blackrent-storage',
      Prefix: body.prefix,
    });

    const response = await (client as { send: (cmd: ListObjectsV2Command) => Promise<{ Contents?: Array<{ Key?: string }> }> }).send(listCommand);

    const keys = (response.Contents || [])
      .filter((obj) => obj.Key)
      .map((obj) => obj.Key!);

    if (keys.length === 0) {
      res.json({ success: true, deleted: 0, message: 'No files found with that prefix' });
      return;
    }

    // Delete all files
    const results = await Promise.allSettled(
      keys.map((key) => r2Storage.deleteFile(key))
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    res.json({
      success: true,
      deleted: successful,
      failed,
      total: keys.length,
      prefix: body.prefix,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request body', details: error.errors });
      return;
    }
    console.error('❌ R2 delete by prefix error:', error);
    res.status(500).json({ error: 'Failed to delete files by prefix' });
  }
});

export default router;

