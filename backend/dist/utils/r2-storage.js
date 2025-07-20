"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.r2Storage = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class R2Storage {
    constructor() {
        this.config = {
            endpoint: process.env.R2_ENDPOINT || '',
            accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
            bucketName: process.env.R2_BUCKET_NAME || 'blackrent-storage',
            accountId: process.env.R2_ACCOUNT_ID || '',
            publicUrl: process.env.R2_PUBLIC_URL || ''
        };
        this.client = new client_s3_1.S3Client({
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
    async uploadFile(key, buffer, contentType, metadata) {
        try {
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.config.bucketName,
                Key: key,
                Body: buffer,
                ContentType: contentType,
                Metadata: metadata,
            });
            await this.client.send(command);
            // Return public URL
            return `${this.config.publicUrl}/${key}`;
        }
        catch (error) {
            console.error('R2 upload error:', error);
            throw new Error(`Failed to upload file: ${error}`);
        }
    }
    /**
     * Vytvorenie presigned URL pre direct upload z frontendu
     */
    async createPresignedUploadUrl(key, contentType, expiresIn = 3600) {
        try {
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.config.bucketName,
                Key: key,
                ContentType: contentType,
            });
            return await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
        }
        catch (error) {
            console.error('R2 presigned URL error:', error);
            throw new Error(`Failed to create presigned URL: ${error}`);
        }
    }
    /**
     * Získanie presigned URL pre download
     */
    async createPresignedDownloadUrl(key, expiresIn = 3600) {
        try {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.config.bucketName,
                Key: key,
            });
            return await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
        }
        catch (error) {
            console.error('R2 download URL error:', error);
            throw new Error(`Failed to create download URL: ${error}`);
        }
    }
    /**
     * Zmazanie súboru z R2
     */
    async deleteFile(key) {
        try {
            const command = new client_s3_1.DeleteObjectCommand({
                Bucket: this.config.bucketName,
                Key: key,
            });
            await this.client.send(command);
        }
        catch (error) {
            console.error('R2 delete error:', error);
            throw new Error(`Failed to delete file: ${error}`);
        }
    }
    /**
     * Generovanie lepšie organizovaných kľúčov pre súbory
     */
    generateFileKey(type, entityId, filename, mediaType) {
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
    generateProtocolPDFKey(protocolId, protocolType) {
        const timestamp = new Date().toISOString().split('T')[0];
        return `protocols/pdf/${timestamp}/${protocolId}/${protocolType}-protocol.pdf`;
    }
    /**
     * Generovanie kľúča pre médiá protokolu
     */
    generateProtocolMediaKey(protocolId, mediaType, filename) {
        const timestamp = new Date().toISOString().split('T')[0];
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        return `protocols/${mediaType}/${timestamp}/${protocolId}/${sanitizedFilename}`;
    }
    /**
     * Mazanie všetkých súborov protokolu
     */
    async deleteProtocolFiles(protocolId) {
        try {
            console.log(`🗑️ Deleting all files for protocol: ${protocolId}`);
            // Získanie zoznamu všetkých súborov protokolu
            const filesToDelete = await this.listProtocolFiles(protocolId);
            if (filesToDelete.length === 0) {
                console.log(`ℹ️ No files found for protocol: ${protocolId}`);
                return;
            }
            console.log(`🗑️ Found ${filesToDelete.length} files to delete`);
            // Mazanie súborov v batch
            const deletePromises = filesToDelete.map(key => this.deleteFile(key));
            await Promise.all(deletePromises);
            console.log(`✅ Successfully deleted ${filesToDelete.length} files for protocol: ${protocolId}`);
        }
        catch (error) {
            console.error(`❌ Error deleting protocol files: ${error}`);
            throw error;
        }
    }
    /**
     * Získanie zoznamu všetkých súborov protokolu
     */
    async listProtocolFiles(protocolId) {
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
            const allFiles = [];
            for (const pattern of searchPatterns) {
                try {
                    const files = await this.listFiles(pattern);
                    allFiles.push(...files);
                }
                catch (error) {
                    console.warn(`⚠️ Error listing files with pattern ${pattern}:`, error);
                }
            }
            return allFiles;
        }
        catch (error) {
            console.error(`❌ Error listing protocol files: ${error}`);
            return [];
        }
    }
    /**
     * Získanie zoznamu súborov podľa pattern
     */
    async listFiles(prefix) {
        try {
            const command = new client_s3_1.ListObjectsV2Command({
                Bucket: this.config.bucketName,
                Prefix: prefix,
            });
            const response = await this.client.send(command);
            return response.Contents?.map(obj => obj.Key || '').filter(Boolean) || [];
        }
        catch (error) {
            console.error(`❌ Error listing files with prefix ${prefix}:`, error);
            return [];
        }
    }
    /**
     * Validácia typu súboru
     */
    validateFileType(mimetype) {
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
    validateFileSize(size, type) {
        const maxSizes = {
            image: 10 * 1024 * 1024, // 10MB
            document: 50 * 1024 * 1024, // 50MB
        };
        return size <= maxSizes[type];
    }
    /**
     * Získanie public URL pre súbor
     */
    getPublicUrl(key) {
        return `${this.config.publicUrl}/${key}`;
    }
    /**
     * Kontrola či je R2 správne nakonfigurované
     */
    isConfigured() {
        const isConfigured = !!(this.config.endpoint &&
            this.config.accessKeyId &&
            this.config.secretAccessKey &&
            this.config.bucketName);
        if (!isConfigured) {
            console.log('⚠️ R2 Storage not configured. Missing:');
            if (!this.config.endpoint)
                console.log('  - R2_ENDPOINT');
            if (!this.config.accessKeyId)
                console.log('  - R2_ACCESS_KEY_ID');
            if (!this.config.secretAccessKey)
                console.log('  - R2_SECRET_ACCESS_KEY');
            if (!this.config.bucketName)
                console.log('  - R2_BUCKET_NAME');
        }
        else {
            console.log('✅ R2 Storage configured successfully');
        }
        return isConfigured;
    }
    /**
     * Načítanie súboru z R2 ako Buffer
     */
    async getFile(key) {
        try {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.config.bucketName,
                Key: key,
            });
            const response = await this.client.send(command);
            if (!response.Body) {
                return null;
            }
            // Konverzia stream na Buffer
            const chunks = [];
            const stream = response.Body;
            return new Promise((resolve, reject) => {
                stream.on('data', (chunk) => chunks.push(chunk));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
                stream.on('error', reject);
            });
        }
        catch (error) {
            console.error('R2 getFile error:', error);
            return null;
        }
    }
    /**
     * Zistenie MIME typu z file key
     */
    getMimeTypeFromKey(key) {
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
exports.r2Storage = new R2Storage();
exports.default = exports.r2Storage;
//# sourceMappingURL=r2-storage.js.map