/**
 * Mock R2 Storage pre testy
 * Simuluje R2/S3 funkcionalitu v pamäti
 */

interface StoredFile {
  key: string;
  buffer: Buffer;
  contentType: string;
  timestamp: Date;
}

class MockR2Storage {
  private storage: Map<string, StoredFile> = new Map();
  private bucketName = 'blackrent-test';

  constructor() {
    console.log('🧪 Using Mock R2 Storage for tests');
  }

  /**
   * Upload file to mock storage
   */
  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string = 'application/octet-stream'
  ): Promise<string> {
    const file: StoredFile = {
      key,
      buffer,
      contentType,
      timestamp: new Date()
    };
    
    this.storage.set(key, file);
    
    // Return mock URL
    return `mock://storage/${this.bucketName}/${key}`;
  }

  /**
   * Get file from mock storage
   */
  async getFile(key: string): Promise<Buffer | null> {
    const file = this.storage.get(key);
    return file ? file.buffer : null;
  }

  /**
   * Delete file from mock storage
   */
  async deleteFile(key: string): Promise<boolean> {
    return this.storage.delete(key);
  }

  /**
   * List files in mock storage
   */
  async listFiles(prefix?: string): Promise<string[]> {
    const keys = Array.from(this.storage.keys());
    
    if (prefix) {
      return keys.filter(key => key.startsWith(prefix));
    }
    
    return keys;
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
  } | null> {
    const file = this.storage.get(key);
    
    if (!file) {
      return null;
    }
    
    return {
      size: file.buffer.length,
      contentType: file.contentType,
      lastModified: file.timestamp
    };
  }

  /**
   * Check if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    return this.storage.has(key);
  }

  /**
   * Get storage stats
   */
  getStats() {
    const files = Array.from(this.storage.values());
    const totalSize = files.reduce((sum, file) => sum + file.buffer.length, 0);
    
    return {
      fileCount: files.length,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
    };
  }

  /**
   * Clear all storage (for tests)
   */
  clear() {
    this.storage.clear();
  }
}

// Export singleton instance
export const r2Storage = new MockR2Storage();
