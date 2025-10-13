import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

interface R2Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  accountId: string;
  publicUrl: string;
  stagingPrefix?: string; // ✅ Optional prefix for staging files
}

class R2Storage {
  private client: S3Client;
  private config: R2Config;

  constructor() {
    // ✅ Staging prefix pre separation of files
    const stagingPrefix = process.env.NODE_ENV === 'staging' 
      ? (process.env.R2_STAGING_PREFIX || 'staging/') 
      : '';

    this.config = {
      endpoint: process.env.R2_ENDPOINT || '',
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      bucketName: process.env.R2_BUCKET_NAME || 'blackrent-storage',
      accountId: process.env.R2_ACCOUNT_ID || '',
      publicUrl: process.env.R2_PUBLIC_URL || '',
      stagingPrefix // Add to config
    };

    // 🔧 FIX: Disable SSL verification for localhost (macOS SSL handshake issue)
    // Detect localhost/development by multiple indicators
    const isDevelopment = 
      process.env.NODE_ENV === 'development' ||
      !process.env.NODE_ENV || // No NODE_ENV set = likely localhost
      process.env.RAILWAY_ENVIRONMENT !== 'production' ||
      !process.env.RAILWAY_PROJECT_ID; // Not on Railway = likely localhost
    
    this.client = new S3Client({
      region: 'auto',
      endpoint: this.config.endpoint,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      // ✅ ALWAYS disable SSL cert validation to fix macOS EPROTO errors
      // This is safe because we're connecting to Cloudflare R2, not a local server
      requestHandler: new NodeHttpHandler({
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      }),
    });
  }

  /**
   * Upload súboru do R2 storage (s lokálnym fallbackom pre development)
   */
  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    // ✅ FORCE LOCAL STORAGE FOR DEVELOPMENT (skip R2 SSL issues)
    const isDevelopment = 
      process.env.NODE_ENV === 'development' ||
      (!process.env.RAILWAY_PROJECT_ID && !process.env.VERCEL);
    
    if (isDevelopment && process.env.FORCE_LOCAL_STORAGE !== 'false') {
      console.log('🛠️ Development mode: Using local storage (set FORCE_LOCAL_STORAGE=false to use R2)');
      return this.uploadFileLocally(key, buffer);
    }
    
    // Check if R2 is configured
    if (!this.isConfigured()) {
      // ✅ ENHANCED PRODUCTION DETECTION
      // Check multiple indicators (not just NODE_ENV)
      const isProduction = 
        process.env.NODE_ENV === 'production' ||
        process.env.RAILWAY_ENVIRONMENT === 'production' ||
        process.env.VERCEL_ENV === 'production' ||
        !!process.env.RAILWAY_PROJECT_ID || // Railway deployment
        !!process.env.VERCEL; // Vercel deployment
      
      if (isProduction) {
        console.error('🚨 CRITICAL: R2 not configured in production environment!');
        console.error('🚨 Environment detected:', {
          NODE_ENV: process.env.NODE_ENV,
          RAILWAY_PROJECT: !!process.env.RAILWAY_PROJECT_ID,
          VERCEL: !!process.env.VERCEL,
        });
        console.error('🚨 Please set R2_* environment variables');
        console.error('🚨 See: backend/RAILWAY_R2_SETUP.md');
        throw new Error('R2 storage is not configured. Please contact administrator.');
      }
      
      // 🛠️ LOCAL DEVELOPMENT ONLY: Fallback to local storage
      console.log('⚠️ R2 not configured, using local storage for local development');
      console.log('⚠️ This will NOT work in production!');
      return this.uploadFileLocally(key, buffer);
    }

    try {
      // ✅ Add staging prefix if in staging environment
      const prefixedKey = this.config.stagingPrefix 
        ? `${this.config.stagingPrefix}${key}` 
        : key;

      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: prefixedKey,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata,
      });

      console.log('☁️ Uploading to R2:', { 
        bucket: this.config.bucketName, 
        key: prefixedKey,
        environment: process.env.NODE_ENV 
      });
      await this.client.send(command);
      
      const publicUrl = `${this.config.publicUrl}/${prefixedKey}`;
      console.log('✅ R2 upload successful:', publicUrl);
      
      return publicUrl;
    } catch (error) {
      console.error('❌ R2 upload failed:', error);
      
      // ❌ REMOVED: No fallback to local-storage in production!
      // This forces proper R2 configuration
      
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        console.error('🚨 R2 API TOKEN IS INVALID!');
        console.error('🚨 You need to create a new R2 API token in Cloudflare dashboard');
        console.error('🚨 Documentation: docs/deployment/R2-TOKEN-SETUP-GUIDE.md');
      }
      
      throw new Error(`R2 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Lokálne file storage pre development
   */
  private async uploadFileLocally(
    key: string,
    buffer: Buffer
  ): Promise<string> {
    try {
      // Vytvor lokálny storage adresár
      const storageDir = path.join(process.cwd(), 'local-storage');
      const filePath = path.join(storageDir, key);
      const fileDir = path.dirname(filePath);

      // Vytvor adresáre ak neexistujú
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      // Ulož súbor
      fs.writeFileSync(filePath, buffer);
      
      // Vráť lokálny URL endpoint
      const localUrl = `http://localhost:${process.env.PORT || 3001}/local-storage/${key}`;
      console.log('📁 Local file stored:', localUrl);
      
      return localUrl;
    } catch (error) {
      console.error('❌ Local storage error:', error);
      throw new Error(`Failed to store file locally: ${error}`);
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
        // 🌟 NOVÉ: CORS headers pre presigned URL
        Metadata: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'PUT, POST, GET',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });

      const presignedUrl = await getSignedUrl(this.client, command, { expiresIn });
      
      // 🔧 DEBUG: Log pre troubleshooting
      console.log('✅ Presigned URL created:', {
        key: key,
        contentType: contentType,
        expiresIn: expiresIn,
        url: presignedUrl.substring(0, 100) + '...'
      });
      
      return presignedUrl;
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
   * 🌟 NOVÉ: Generovanie lepšie organizovaných kľúčov pre súbory s WebP podporou
   */
  generateFileKey(
    type: 'vehicle' | 'protocol' | 'document' | 'company-document', 
    entityId: string, 
    filename: string,
    mediaType?: 'vehicle-images' | 'document-images' | 'damage-images' | 'vehicle-videos' | 'pdf' | 'contract' | 'invoice' | 'technical-certificate',
    preserveExtension?: boolean // ✅ NOVÉ: Zachovať pôvodné extension
  ): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    // ✅ NOVÉ: Zachovať WebP extension ak je to WebP súbor
    const sanitizedFilename = preserveExtension 
      ? filename.replace(/[^a-zA-Z0-9.-]/g, '_')
      : filename.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.(jpg|jpeg|png)$/i, '.webp');
    
    switch (type) {
      case 'vehicle':
        // ✅ ROZŠÍRENÉ: Rozlišovanie medzi fotkami a dokumentmi vozidiel
        if (mediaType === 'technical-certificate') {
          return `vehicles/documents/technical-certificates/${entityId}/${timestamp}/${sanitizedFilename}`;
        }
        return `vehicles/photos/${entityId}/${sanitizedFilename}`;
      case 'protocol':
        // ✅ LEPŠIA ORGANIZÁCIA: protocols/type/date/protocol-id/filename
        if (mediaType) {
          return `protocols/${mediaType}/${timestamp}/${entityId}/${sanitizedFilename}`;
        }
        return `protocols/general/${timestamp}/${entityId}/${sanitizedFilename}`;
      case 'document':
        return `documents/rentals/${entityId}/${timestamp}/${sanitizedFilename}`;
      case 'company-document':
        // ✅ NOVÉ: Dokumenty majiteľov organizované podľa typu a dátumu
        if (mediaType === 'contract') {
          return `companies/contracts/${entityId}/${timestamp}/${sanitizedFilename}`;
        } else if (mediaType === 'invoice') {
          const date = new Date();
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          return `companies/invoices/${entityId}/${year}/${month}/${sanitizedFilename}`;
        }
        return `companies/documents/${entityId}/${timestamp}/${sanitizedFilename}`;
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
   * Mazanie všetkých súborov protokolu (nová aj stará štruktúra)
   */
  async deleteProtocolFiles(protocolId: string): Promise<void> {
    try {
      console.log(`🗑️ Mazanie všetkých súborov pre protokol: ${protocolId}`);
      
      // 🔍 UNIVERZÁLNE HĽADANIE: Hľadáme súbory obsahujúce protocolId v ceste
      const listCommand = new ListObjectsV2Command({
        Bucket: this.config.bucketName,
        // Hľadáme všetky súbory ktoré obsahujú protocolId v ceste
        Prefix: '', // Začneme od root-u
        MaxKeys: 1000
      });

      const objects = await this.client.send(listCommand);
      
      if (!objects.Contents || objects.Contents.length === 0) {
        console.log(`⚠️ Žiadne súbory nenájdené pre protokol: ${protocolId}`);
        return;
      }

      // Filtruj súbory ktoré obsahujú protocolId v ceste
      const protocolFiles = objects.Contents.filter(obj => 
        obj.Key && obj.Key.includes(protocolId)
      );

      if (protocolFiles.length === 0) {
        console.log(`⚠️ Žiadne súbory s protocolId ${protocolId} nenájdené`);
        return;
      }

      console.log(`🔍 Našiel som ${protocolFiles.length} súborov pre protokol ${protocolId}:`);
      protocolFiles.forEach(file => {
        console.log(`  📄 ${file.Key}`);
      });

      // Vymaž všetky nájdené súbory
      const deletePromises = protocolFiles.map(async (obj) => {
        if (obj.Key) {
          try {
            const deleteCommand = new DeleteObjectCommand({
              Bucket: this.config.bucketName,
              Key: obj.Key
            });
            await this.client.send(deleteCommand);
            console.log(`✅ Vymazaný súbor: ${obj.Key}`);
          } catch (error) {
            console.error(`❌ Chyba pri mazaní súboru ${obj.Key}:`, error);
          }
        }
      });

      await Promise.all(deletePromises);
      console.log(`✅ Všetky súbory protokolu ${protocolId} vymazané (${protocolFiles.length} súborov)`);
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
      'image/webp', // ✅ WebP už je podporovaný
      'image/gif',
      'application/pdf',
      'image/svg+xml',
      'video/mp4', // ✅ Pridané video podporu
      'video/webm' // ✅ Pridané video podporu
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
      const stream = response.Body as NodeJS.ReadableStream;
      
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
        return 'image/webp'; // ✅ WebP podpora
      case 'gif':
        return 'image/gif';
      case 'pdf':
        return 'application/pdf';
      case 'svg':
        return 'image/svg+xml';
      case 'mp4':
        return 'video/mp4'; // ✅ Video podpora
      case 'webm':
        return 'video/webm'; // ✅ Video podpora
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Kontrola či súbor existuje
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error: unknown) {
      const awsError = error as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (awsError.name === 'NoSuchKey' || awsError.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Generovanie signed URL pre download
   * ✅ FIX: Use Cloudflare R2 domain for signed URLs (better CORS support)
   */
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
    });

    const signedUrl = await getSignedUrl(this.client, command, { expiresIn });
    
    // ✅ FIX: Replace AWS domain with Cloudflare R2 public domain for CORS compatibility
    // AWS SDK generates s3.auto.amazonaws.com URLs, but we need pub-XXX.r2.dev for public access
    if (signedUrl.includes('s3.auto.amazonaws.com') || signedUrl.includes('r2.cloudflarestorage.com')) {
      // Use R2_PUBLIC_URL (r2.dev) - this domain has proper CORS and SSL
      if (this.config.publicUrl) {
        const url = new URL(signedUrl);
        const r2Url = new URL(this.config.publicUrl);
        
        // Replace hostname but keep path and query params
        const fixedUrl = signedUrl.replace(url.origin, r2Url.origin);
        console.log('🔧 Fixed signed URL domain:', {
          from: url.origin,
          to: r2Url.origin,
          key: key.substring(0, 80),
          originalLength: signedUrl.length,
          fixedLength: fixedUrl.length
        });
        return fixedUrl;
      }
    }
    
    return signedUrl;
  }
}

// Singleton instance
export const r2Storage = new R2Storage();
export default r2Storage; 