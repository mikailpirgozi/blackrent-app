const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface R2File {
  key: string;
  size: number;
  lastModified: string;
  etag: string;
  url: string;
}

export interface R2ListResponse {
  files: R2File[];
  totalCount: number;
  totalSize: number;
  continuationToken?: string;
  isTruncated: boolean;
}

export interface R2StatsResponse {
  totalFiles: number;
  totalSize: number;
  byFolder: Record<string, { count: number; size: number }>;
}

export interface R2ListParams {
  prefix?: string;
  search?: string;
  limit?: number;
  continuationToken?: string;
  sortBy?: 'name' | 'size' | 'date';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Helper to build query string from params
 */
function buildQueryString(params: R2ListParams): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}

/**
 * List R2 files with filtering and pagination
 */
export async function listR2Files(
  params: R2ListParams = {}
): Promise<R2ListResponse> {
  const token = localStorage.getItem('blackrent_token');
  const queryString = buildQueryString(params);

  const response = await fetch(`${API_URL}/api/r2-files/list?${queryString}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to list R2 files');
  }

  return response.json();
}

/**
 * Get R2 storage statistics
 */
export async function getR2Stats(): Promise<R2StatsResponse> {
  const token = localStorage.getItem('blackrent_token');

  const response = await fetch(`${API_URL}/api/r2-files/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get R2 stats');
  }

  return response.json();
}

/**
 * Delete a single R2 file
 */
export async function deleteR2File(key: string): Promise<void> {
  const token = localStorage.getItem('blackrent_token');

  const response = await fetch(`${API_URL}/api/r2-files/delete`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete R2 file');
  }
}

/**
 * Delete multiple R2 files
 */
export async function bulkDeleteR2Files(keys: string[]): Promise<{
  deleted: number;
  failed: number;
  total: number;
}> {
  const token = localStorage.getItem('blackrent_token');

  const response = await fetch(`${API_URL}/api/r2-files/bulk-delete`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ keys }),
  });

  if (!response.ok) {
    throw new Error('Failed to bulk delete R2 files');
  }

  return response.json();
}

/**
 * Delete all files matching a prefix
 */
export async function deleteByPrefix(prefix: string): Promise<{
  deleted: number;
  failed: number;
  total: number;
  prefix: string;
}> {
  const token = localStorage.getItem('blackrent_token');

  const response = await fetch(`${API_URL}/api/r2-files/delete-by-prefix`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefix, confirm: true }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete by prefix');
  }

  return response.json();
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Extract folder name from file key
 */
export function getFolderFromKey(key: string | undefined): string {
  if (!key) return 'root';
  const parts = key.split('/');
  return parts.length > 1 && parts[0] ? parts[0] : 'root';
}

/**
 * Extract filename from file key
 */
export function getFilenameFromKey(key: string): string {
  const parts = key.split('/');
  return parts[parts.length - 1] || key;
}
