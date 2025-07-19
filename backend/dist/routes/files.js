"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const r2_storage_1 = require("../utils/r2-storage");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Multer konfigurácia pre memory storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
    }
});
/**
 * Upload súboru do R2 storage
 * POST /api/files/upload
 */
router.post('/upload', auth_1.authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }
        // Kontrola či je R2 nakonfigurované
        if (!r2_storage_1.r2Storage.isConfigured()) {
            return res.status(503).json({
                error: 'File storage not configured. Using local storage fallback.'
            });
        }
        // Validácia typu súboru
        if (!r2_storage_1.r2Storage.validateFileType(req.file.mimetype)) {
            return res.status(400).json({
                error: 'Invalid file type. Allowed: JPEG, PNG, WebP, PDF, SVG'
            });
        }
        // Validácia veľkosti súboru
        const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'document';
        if (!r2_storage_1.r2Storage.validateFileSize(req.file.size, fileType)) {
            const maxSize = fileType === 'image' ? '10MB' : '50MB';
            return res.status(400).json({
                error: `File too large. Maximum size for ${fileType}s: ${maxSize}`
            });
        }
        // Získanie parametrov z query/body
        const { type = 'temp', entityId = 'unknown' } = req.body;
        // Generovanie key pre R2
        const fileKey = r2_storage_1.r2Storage.generateFileKey(type, entityId, req.file.originalname);
        // Upload do R2
        const publicUrl = await r2_storage_1.r2Storage.uploadFile(fileKey, req.file.buffer, req.file.mimetype, {
            originalName: req.file.originalname,
            uploadedBy: req.user?.id?.toString() || 'unknown',
            uploadedAt: new Date().toISOString(),
        });
        // Úspešná odpoveď
        res.json({
            success: true,
            data: {
                url: publicUrl,
                key: fileKey,
                filename: req.file.originalname,
                size: req.file.size,
                type: req.file.mimetype,
            }
        });
    }
    catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({
            error: 'Failed to upload file',
            details: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
/**
 * Vytvorenie presigned URL pre direct upload z frontendu
 * POST /api/files/presigned-upload-url
 */
router.post('/presigned-upload-url', auth_1.authenticateToken, async (req, res) => {
    try {
        const { filename, contentType, type = 'temp', entityId = 'unknown' } = req.body;
        if (!filename || !contentType) {
            return res.status(400).json({
                error: 'Filename and contentType are required'
            });
        }
        // Kontrola či je R2 nakonfigurované
        if (!r2_storage_1.r2Storage.isConfigured()) {
            return res.status(503).json({
                error: 'File storage not configured'
            });
        }
        // Validácia typu súboru
        if (!r2_storage_1.r2Storage.validateFileType(contentType)) {
            return res.status(400).json({
                error: 'Invalid file type. Allowed: JPEG, PNG, WebP, PDF, SVG'
            });
        }
        // Generovanie key pre R2
        const fileKey = r2_storage_1.r2Storage.generateFileKey(type, entityId, filename);
        // Vytvorenie presigned URL
        const uploadUrl = await r2_storage_1.r2Storage.createPresignedUploadUrl(fileKey, contentType);
        const publicUrl = r2_storage_1.r2Storage.getPublicUrl(fileKey);
        res.json({
            success: true,
            data: {
                uploadUrl,
                publicUrl,
                key: fileKey,
                expiresIn: 3600, // 1 hodina
            }
        });
    }
    catch (error) {
        console.error('Presigned URL error:', error);
        res.status(500).json({
            error: 'Failed to create upload URL',
            details: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
/**
 * Vytvorenie presigned URL pre download
 * GET /api/files/:key/download-url
 */
router.get('/:key/download-url', auth_1.authenticateToken, async (req, res) => {
    try {
        const { key } = req.params;
        // Dekódovanie key (môže obsahovať slashes)
        const decodedKey = decodeURIComponent(key);
        // Kontrola či je R2 nakonfigurované
        if (!r2_storage_1.r2Storage.isConfigured()) {
            return res.status(503).json({
                error: 'File storage not configured'
            });
        }
        // Vytvorenie presigned download URL
        const downloadUrl = await r2_storage_1.r2Storage.createPresignedDownloadUrl(decodedKey);
        res.json({
            success: true,
            data: {
                downloadUrl,
                expiresIn: 3600,
            }
        });
    }
    catch (error) {
        console.error('Download URL error:', error);
        res.status(500).json({
            error: 'Failed to create download URL',
            details: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
/**
 * Zmazanie súboru z R2
 * DELETE /api/files/:key
 */
router.delete('/:key', auth_1.authenticateToken, async (req, res) => {
    try {
        const { key } = req.params;
        // Dekódovanie key
        const decodedKey = decodeURIComponent(key);
        // Kontrola či je R2 nakonfigurované
        if (!r2_storage_1.r2Storage.isConfigured()) {
            return res.status(503).json({
                error: 'File storage not configured'
            });
        }
        // Zmazanie súboru
        await r2_storage_1.r2Storage.deleteFile(decodedKey);
        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    }
    catch (error) {
        console.error('File delete error:', error);
        res.status(500).json({
            error: 'Failed to delete file',
            details: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
/**
 * Health check pre file storage
 * GET /api/files/health
 */
router.get('/health', (req, res) => {
    const isConfigured = r2_storage_1.r2Storage.isConfigured();
    res.json({
        success: true,
        r2Storage: {
            configured: isConfigured,
            status: isConfigured ? 'ready' : 'not configured'
        }
    });
});
exports.default = router;
//# sourceMappingURL=files.js.map