import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface R2Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  accountId: string;
  publicUrl: string;
}

class R2Storage {
  private client: S3Client;
  private config: R2Config;

  constructor() {
    this.config = {
      endpoint: process.env.R2_ENDPOINT || '',
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      bucketName: process.env.R2_BUCKET_NAME || 'blackrent-storage',
      accountId: process.env.R2_ACCOUNT_ID || '',
      publicUrl: process.env.R2_PUBLIC_URL || ''
    };

    this.client = new S3Client({
      region: 'auto',
      endpoint: this.config.endpoint,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
  }

  /**
   * Upload súboru do R2 storage
   */
  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata,
      });

      await this.client.send(command);
      
      // Return public URL
      return `${this.config.publicUrl}/${key}`;
    } catch (error) {
      console.error('R2 upload error:', error);
      throw new Error(`Failed to upload file: ${error}`);
    }
  }

  /**
   * Vytvorenie presigned URL pre direct upload z frontendu
   */
  async createPresignedUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
        ContentType: contentType,
      });

      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      console.error('R2 presigned URL error:', error);
      throw new Error(`Failed to create presigned URL: ${error}`);
    }
  }

  /**
   * Získanie presigned URL pre download
   */
  async createPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      console.error('R2 download URL error:', error);
      throw new Error(`Failed to create download URL: ${error}`);
    }
  }

  /**
   * Zmazanie súboru z R2
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      });

      await this.client.send(command);
    } catch (error) {
      console.error('R2 delete error:', error);
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  /**
   * Generovanie štruktúrovaného key pre súbor
   */
  generateFileKey(type: 'vehicle' | 'protocol' | 'document', entityId: string, filename: string): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    switch (type) {
      case 'vehicle':
        return `vehicles/photos/${entityId}/${sanitizedFilename}`;
      case 'protocol':
        return `protocols/${entityId}/${timestamp}/${sanitizedFilename}`;
      case 'document':
        return `documents/rentals/${entityId}/${timestamp}/${sanitizedFilename}`;
      default:
        return `temp/uploads/${timestamp}/${sanitizedFilename}`;
    }
  }

  /**
   * Validácia typu súboru
   */
  validateFileType(mimetype: string): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'image/svg+xml'
    ];

    return allowedTypes.includes(mimetype);
  }

  /**
   * Validácia veľkosti súboru
   */
  validateFileSize(size: number, type: 'image' | 'document'): boolean {
    const maxSizes = {
      image: 10 * 1024 * 1024, // 10MB
      document: 50 * 1024 * 1024, // 50MB
    };

    return size <= maxSizes[type];
  }

  /**
   * Získanie public URL pre súbor
   */
  getPublicUrl(key: string): string {
    return `${this.config.publicUrl}/${key}`;
  }

  /**
   * Kontrola či je R2 správne nakonfigurované
   */
  isConfigured(): boolean {
    return !!(
      this.config.endpoint &&
      this.config.accessKeyId &&
      this.config.secretAccessKey &&
      this.config.bucketName
    );
  }
}

// Singleton instance
export const r2Storage = new R2Storage();
export default r2Storage; 