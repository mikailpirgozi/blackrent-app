import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
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
   * Generovanie lepšie organizovaných kľúčov pre súbory
   */
  generateFileKey(
    type: 'vehicle' | 'protocol' | 'document', 
    entityId: string, 
    filename: string,
    mediaType?: 'vehicle-images' | 'document-images' | 'damage-images' | 'vehicle-videos' | 'pdf'
  ): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    switch (type) {
      case 'vehicle':
        return `vehicles/photos/${entityId}/${sanitizedFilename}`;
      case 'protocol':
        // ✅ LEPŠIA ORGANIZÁCIA: protocols/type/date/protocol-id/filename
        if (mediaType) {
          return `protocols/${mediaType}/${timestamp}/${entityId}/${sanitizedFilename}`;
        }
        return `protocols/general/${timestamp}/${entityId}/${sanitizedFilename}`;
      case 'document':
        return `documents/rentals/${entityId}/${timestamp}/${sanitizedFilename}`;
      default:
        return `temp/uploads/${timestamp}/${sanitizedFilename}`;
    }
  }

  /**
   * Generovanie kľúča pre protokol PDF
   */
  generateProtocolPDFKey(protocolId: string, protocolType: 'handover' | 'return'): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const protocolTypeName = protocolType === 'handover' ? 'prevzatie' : 'vratenie';
    return `PDF protokoly/${timestamp}/${protocolId}/${protocolTypeName}-protokol.pdf`;
  }

  /**
   * Generovanie kľúča pre médiá protokolu
   */
  generateProtocolMediaKey(
    protocolId: string, 
    mediaType: 'vehicle-images' | 'document-images' | 'damage-images' | 'vehicle-videos',
    filename: string
  ): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Slovenské názvy pre lepšiu organizáciu
    const folderMap = {
      'vehicle-images': 'Fotky protokoly/vozidlo',
      'document-images': 'Fotky protokoly/dokumenty', 
      'damage-images': 'Fotky protokoly/poskodenia',
      'vehicle-videos': 'Fotky protokoly/videa-vozidlo'
    };
    
    const folderName = folderMap[mediaType];
    return `${folderName}/${timestamp}/${protocolId}/${sanitizedFilename}`;
  }

  /**
   * Mazanie všetkých súborov protokolu
   */
  async deleteProtocolFiles(protocolId: string): Promise<void> {
    try {
      // Zmené cesty pre slovenské názvy priečinkov
      const prefixesToDelete = [
        `PDF protokoly/*/${protocolId}/*`,
        `Fotky protokoly/vozidlo/*/${protocolId}/*`,
        `Fotky protokoly/dokumenty/*/${protocolId}/*`, 
        `Fotky protokoly/poskodenia/*/${protocolId}/*`,
        `Fotky protokoly/videa-vozidlo/*/${protocolId}/*`
      ];

      const deletePromises = prefixesToDelete.map(async (prefix) => {
        try {
          console.log(`🗑️ Mazanie súborov s prefixom: ${prefix}`);
          const listCommand = new ListObjectsV2Command({
            Bucket: this.config.bucketName,
            Prefix: prefix.replace(/\/\*\//g, '/').replace(/\/\*/g, '')
          });

          const objects = await this.client.send(listCommand);
          
          if (objects.Contents && objects.Contents.length > 0) {
            // AWS SDK v3 vyžaduje individuálne mazanie súborov
            const deleteFilePromises = objects.Contents.map((obj: any) => {
              if (obj.Key) {
                const deleteCommand = new DeleteObjectCommand({
                  Bucket: this.config.bucketName,
                  Key: obj.Key
                });
                return this.client.send(deleteCommand);
              }
              return Promise.resolve();
            });
            
            await Promise.all(deleteFilePromises);
            console.log(`✅ Vymazané ${objects.Contents.length} súborov pre prefix: ${prefix}`);
          }
        } catch (error) {
          console.error(`❌ Chyba pri mazaní súborov pre ${prefix}:`, error);
        }
      });

      await Promise.all(deletePromises);
      console.log(`✅ Všetky súbory protokolu ${protocolId} vymazané`);
    } catch (error) {
      console.error('❌ Chyba pri mazaní súborov protokolu:', error);
      throw error;
    }
  }

  /**
   * Získanie zoznamu všetkých súborov protokolu
   */
  async listProtocolFiles(protocolId: string): Promise<string[]> {
    try {
      // Hľadanie súborov v rôznych priečinkoch
      const searchPatterns = [
        `protocols/vehicle-images/*/${protocolId}/*`,
        `protocols/document-images/*/${protocolId}/*`,
        `protocols/damage-images/*/${protocolId}/*`,
        `protocols/vehicle-videos/*/${protocolId}/*`,
        `protocols/pdf/*/${protocolId}/*`,
        `protocols/general/*/${protocolId}/*`
      ];
      
      const allFiles: string[] = [];
      
      for (const pattern of searchPatterns) {
        try {
          const files = await this.listFiles(pattern);
          allFiles.push(...files);
        } catch (error) {
          console.warn(`⚠️ Error listing files with pattern ${pattern}:`, error);
        }
      }
      
      return allFiles;
    } catch (error) {
      console.error(`❌ Error listing protocol files: ${error}`);
      return [];
    }
  }

  /**
   * Získanie zoznamu súborov podľa pattern
   */
  async listFiles(prefix: string): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucketName,
        Prefix: prefix,
      });

      const response = await this.client.send(command);
      return response.Contents?.map(obj => obj.Key || '').filter(Boolean) || [];
    } catch (error) {
      console.error(`❌ Error listing files with prefix ${prefix}:`, error);
      return [];
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
    const isConfigured = !!(
      this.config.endpoint &&
      this.config.accessKeyId &&
      this.config.secretAccessKey &&
      this.config.bucketName
    );
    
    if (!isConfigured) {
      console.log('⚠️ R2 Storage not configured. Missing:');
      if (!this.config.endpoint) console.log('  - R2_ENDPOINT');
      if (!this.config.accessKeyId) console.log('  - R2_ACCESS_KEY_ID');
      if (!this.config.secretAccessKey) console.log('  - R2_SECRET_ACCESS_KEY');
      if (!this.config.bucketName) console.log('  - R2_BUCKET_NAME');
    } else {
      console.log('✅ R2 Storage configured successfully');
    }
    
    return isConfigured;
  }

  /**
   * Načítanie súboru z R2 ako Buffer
   */
  async getFile(key: string): Promise<Buffer | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      });

      const response = await this.client.send(command);
      
      if (!response.Body) {
        return null;
      }

      // Konverzia stream na Buffer
      const chunks: Uint8Array[] = [];
      const stream = response.Body as any;
      
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    } catch (error) {
      console.error('R2 getFile error:', error);
      return null;
    }
  }

  /**
   * Zistenie MIME typu z file key
   */
  getMimeTypeFromKey(key: string): string {
    const extension = key.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'gif':
        return 'image/gif';
      case 'pdf':
        return 'application/pdf';
      case 'svg':
        return 'image/svg+xml';
      default:
        return 'application/octet-stream';
    }
  }
}

// Singleton instance
export const r2Storage = new R2Storage();
export default r2Storage; 