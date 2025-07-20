"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const r2_storage_js_1 = require("../utils/r2-storage.js");
const router = express_1.default.Router();
// Multer konfigurácia pre upload súborov
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
    },
    fileFilter: (req, file, cb) => {
        if (r2_storage_js_1.r2Storage.validateFileType(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Nepodporovaný typ súboru'));
        }
    },
});
// Upload súboru do R2
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        console.log('🔄 Upload request received:', {
            hasFile: !!req.file,
            fileSize: req.file?.size,
            mimetype: req.file?.mimetype,
            type: req.body.type,
            entityId: req.body.entityId
        });
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Žiadny súbor nebol nahraný'
            });
        }
        const { type, entityId } = req.body;
        if (!type || !entityId) {
            return res.status(400).json({
                success: false,
                error: 'Chýba type alebo entityId'
            });
        }
        console.log('🔍 Validating file...');
        // Validácia typu súboru
        if (!r2_storage_js_1.r2Storage.validateFileType(req.file.mimetype)) {
            console.log('❌ Invalid file type:', req.file.mimetype);
            return res.status(400).json({
                success: false,
                error: 'Nepodporovaný typ súboru'
            });
        }
        // Validácia veľkosti súboru
        const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'document';
        if (!r2_storage_js_1.r2Storage.validateFileSize(req.file.size, fileType)) {
            console.log('❌ File too large:', req.file.size);
            return res.status(400).json({
                success: false,
                error: 'Súbor je príliš veľký'
            });
        }
        console.log('🔍 Generating file key...');
        // Generovanie file key
        const fileKey = r2_storage_js_1.r2Storage.generateFileKey(type, entityId, req.file.originalname);
        console.log('🔍 File key generated:', fileKey);
        // Kontrola R2 konfigurácie
        if (!r2_storage_js_1.r2Storage.isConfigured()) {
            console.log('❌ R2 not configured');
            return res.status(500).json({
                success: false,
                error: 'R2 Storage nie je nakonfigurované'
            });
        }
        console.log('🔍 Uploading to R2...');
        // Upload do R2
        const url = await r2_storage_js_1.r2Storage.uploadFile(fileKey, req.file.buffer, req.file.mimetype, {
            original_name: req.file.originalname,
            uploaded_at: new Date().toISOString(),
            entity_id: entityId,
            file_type: type
        });
        console.log('✅ File uploaded to R2:', url);
        res.json({
            success: true,
            url: url,
            key: fileKey,
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    }
    catch (error) {
        console.error('❌ Error uploading file:', error);
        // Detailnejšie error logging
        if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
        }
        res.status(500).json({
            success: false,
            error: 'Chyba pri nahrávaní súboru',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// Vytvorenie presigned URL pre direct upload
router.post('/presigned-url', async (req, res) => {
    try {
        const { type, entityId, filename, contentType } = req.body;
        if (!type || !entityId || !filename || !contentType) {
            return res.status(400).json({
                success: false,
                error: 'Chýbajú povinné parametre'
            });
        }
        // Validácia typu súboru
        if (!r2_storage_js_1.r2Storage.validateFileType(contentType)) {
            return res.status(400).json({
                success: false,
                error: 'Nepodporovaný typ súboru'
            });
        }
        // Generovanie file key
        const fileKey = r2_storage_js_1.r2Storage.generateFileKey(type, entityId, filename);
        // Vytvorenie presigned URL
        const presignedUrl = await r2_storage_js_1.r2Storage.createPresignedUploadUrl(fileKey, contentType, 3600 // 1 hodina
        );
        res.json({
            success: true,
            presignedUrl: presignedUrl,
            key: fileKey,
            publicUrl: r2_storage_js_1.r2Storage.getPublicUrl(fileKey)
        });
    }
    catch (error) {
        console.error('❌ Error creating presigned URL:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vytváraní presigned URL'
        });
    }
});
// Zmazanie súboru z R2
router.delete('/:key', async (req, res) => {
    try {
        const { key } = req.params;
        if (!key) {
            return res.status(400).json({
                success: false,
                error: 'Chýba file key'
            });
        }
        await r2_storage_js_1.r2Storage.deleteFile(key);
        console.log('✅ File deleted from R2:', key);
        res.json({
            success: true,
            message: 'Súbor bol úspešne vymazaný'
        });
    }
    catch (error) {
        console.error('❌ Error deleting file:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri mazaní súboru'
        });
    }
});
// Proxy endpoint pre načítanie obrázkov z R2 (pre PDF generovanie)
router.get('/proxy/:key', async (req, res) => {
    try {
        const { key } = req.params;
        if (!key) {
            return res.status(400).json({
                success: false,
                error: 'Chýba file key'
            });
        }
        console.log('🔄 Loading image from R2 via proxy:', key);
        // Načítanie súboru z R2
        const fileBuffer = await r2_storage_js_1.r2Storage.getFile(key);
        if (!fileBuffer) {
            return res.status(404).json({
                success: false,
                error: 'Súbor nebol nájdený'
            });
        }
        // Zistenie MIME typu z file key
        const mimeType = r2_storage_js_1.r2Storage.getMimeTypeFromKey(key);
        // Nastavenie headers pre obrázok
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', fileBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache na 1 hodinu
        res.setHeader('Access-Control-Allow-Origin', '*'); // Povoliť CORS
        // Odoslanie súboru
        res.send(fileBuffer);
        console.log('✅ Image served via proxy:', key);
    }
    catch (error) {
        console.error('❌ Error serving image via proxy:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri načítaní obrázka'
        });
    }
});
// Získanie public URL pre súbor
router.get('/:key/url', async (req, res) => {
    try {
        const { key } = req.params;
        if (!key) {
            return res.status(400).json({
                success: false,
                error: 'Chýba file key'
            });
        }
        const publicUrl = r2_storage_js_1.r2Storage.getPublicUrl(key);
        res.json({
            success: true,
            url: publicUrl,
            key: key
        });
    }
    catch (error) {
        console.error('❌ Error getting file URL:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní URL'
        });
    }
});
// Kontrola R2 konfigurácie
router.get('/status', async (req, res) => {
    try {
        const isConfigured = r2_storage_js_1.r2Storage.isConfigured();
        res.json({
            success: true,
            configured: isConfigured,
            message: isConfigured ? 'R2 Storage je nakonfigurované' : 'R2 Storage nie je nakonfigurované'
        });
    }
    catch (error) {
        console.error('❌ Error checking R2 status:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri kontrole R2 stavu'
        });
    }
});
// 🚀 NOVÝ ENDPOINT: Upload obrázkov pre protokol (originál + thumbnail)
router.post('/protocol-upload', upload.single('file'), async (req, res) => {
    try {
        console.log('🔄 Protocol upload request received:', {
            hasFile: !!req.file,
            fileSize: req.file?.size,
            mimetype: req.file?.mimetype,
            protocolId: req.body.protocolId,
            type: req.body.type
        });
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Žiadny súbor nebol nahraný'
            });
        }
        const { protocolId, type } = req.body;
        if (!protocolId || !type) {
            return res.status(400).json({
                success: false,
                error: 'Chýba protocolId alebo type'
            });
        }
        // Validácia typu súboru
        if (!r2_storage_js_1.r2Storage.validateFileType(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                error: 'Nepodporovaný typ súboru'
            });
        }
        // Validácia veľkosti súboru
        if (!r2_storage_js_1.r2Storage.validateFileSize(req.file.size, 'image')) {
            return res.status(400).json({
                success: false,
                error: 'Súbor je príliš veľký'
            });
        }
        // Generovanie file key podľa typu
        let fileKey;
        if (type === 'original') {
            fileKey = `protocols/${protocolId}/original-images/${req.file.originalname}`;
        }
        else if (type === 'thumbnail') {
            fileKey = `protocols/${protocolId}/thumbnails/${req.file.originalname}`;
        }
        else {
            return res.status(400).json({
                success: false,
                error: 'Neplatný typ (musí byť original alebo thumbnail)'
            });
        }
        // Upload do R2
        const url = await r2_storage_js_1.r2Storage.uploadFile(fileKey, req.file.buffer, req.file.mimetype, {
            original_name: req.file.originalname,
            uploaded_at: new Date().toISOString(),
            protocol_id: protocolId,
            file_type: type
        });
        console.log('✅ Protocol file uploaded to R2:', url);
        res.json({
            success: true,
            url: url,
            key: fileKey,
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            type: type
        });
    }
    catch (error) {
        console.error('❌ Error uploading protocol file:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri nahrávaní súboru protokolu',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// 🚀 NOVÝ ENDPOINT: Upload PDF protokolu
router.post('/protocol-pdf', upload.single('file'), async (req, res) => {
    try {
        console.log('🔄 Protocol PDF upload request received:', {
            hasFile: !!req.file,
            fileSize: req.file?.size,
            protocolId: req.body.protocolId
        });
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Žiadny PDF súbor nebol nahraný'
            });
        }
        const { protocolId } = req.body;
        if (!protocolId) {
            return res.status(400).json({
                success: false,
                error: 'Chýba protocolId'
            });
        }
        // Validácia - len PDF súbory
        if (req.file.mimetype !== 'application/pdf') {
            return res.status(400).json({
                success: false,
                error: 'Len PDF súbory sú povolené'
            });
        }
        // Generovanie file key pre PDF
        const fileKey = `protocols/${protocolId}/customer-protocol.pdf`;
        // Upload do R2
        const url = await r2_storage_js_1.r2Storage.uploadFile(fileKey, req.file.buffer, req.file.mimetype, {
            original_name: 'customer-protocol.pdf',
            uploaded_at: new Date().toISOString(),
            protocol_id: protocolId,
            file_type: 'pdf'
        });
        console.log('✅ Protocol PDF uploaded to R2:', url);
        res.json({
            success: true,
            url: url,
            key: fileKey,
            filename: 'customer-protocol.pdf',
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    }
    catch (error) {
        console.error('❌ Error uploading protocol PDF:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri nahrávaní PDF protokolu',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// 🚀 NOVÝ ENDPOINT: Získanie obrázkov protokolu
router.get('/protocol/:protocolId/images', async (req, res) => {
    try {
        const { protocolId } = req.params;
        if (!protocolId) {
            return res.status(400).json({
                success: false,
                error: 'Chýba protocolId'
            });
        }
        // TODO: Implementovať načítanie obrázkov z databázy
        // Pre teraz vrátime prázdny array
        res.json({
            success: true,
            images: []
        });
    }
    catch (error) {
        console.error('❌ Error loading protocol images:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri načítaní obrázkov protokolu'
        });
    }
});
exports.default = router;
//# sourceMappingURL=files.js.map