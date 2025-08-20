"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../middleware/permissions");
const r2_storage_1 = require("../utils/r2-storage");
const router = (0, express_1.Router)();
// GET /api/vehicle-documents - Získanie všetkých dokumentov vozidiel alebo pre konkrétne vozidlo
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { vehicleId } = req.query;
        const documents = await postgres_database_1.postgresDatabase.getVehicleDocuments(vehicleId);
        res.json({
            success: true,
            data: documents
        });
    }
    catch (error) {
        console.error('Get vehicle documents error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní dokumentov vozidiel'
        });
    }
});
// POST /api/vehicle-documents - Vytvorenie nového dokumentu vozidla
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { vehicleId, documentType, validFrom, validTo, documentNumber, price, notes, filePath } = req.body;
        if (!vehicleId || !documentType || !validTo) {
            return res.status(400).json({
                success: false,
                error: 'vehicleId, documentType a validTo sú povinné polia'
            });
        }
        const createdDocument = await postgres_database_1.postgresDatabase.createVehicleDocument({
            vehicleId,
            documentType,
            validFrom: validFrom ? new Date(validFrom) : undefined,
            validTo: new Date(validTo),
            documentNumber,
            price,
            notes,
            filePath
        });
        res.status(201).json({
            success: true,
            message: 'Dokument vozidla úspešne vytvorený',
            data: createdDocument
        });
    }
    catch (error) {
        console.error('Create vehicle document error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vytváraní dokumentu vozidla'
        });
    }
});
// PUT /api/vehicle-documents/:id - Aktualizácia dokumentu vozidla
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { vehicleId, documentType, validFrom, validTo, documentNumber, price, notes, filePath } = req.body;
        if (!vehicleId || !documentType || !validTo) {
            return res.status(400).json({
                success: false,
                error: 'vehicleId, documentType a validTo sú povinné polia'
            });
        }
        const updatedDocument = await postgres_database_1.postgresDatabase.updateVehicleDocument(id, {
            vehicleId,
            documentType,
            validFrom: validFrom ? new Date(validFrom) : undefined,
            validTo: new Date(validTo),
            documentNumber,
            price,
            notes,
            filePath
        });
        res.json({
            success: true,
            message: 'Dokument vozidla úspešne aktualizovaný',
            data: updatedDocument
        });
    }
    catch (error) {
        console.error('Update vehicle document error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri aktualizácii dokumentu vozidla'
        });
    }
});
// DELETE /api/vehicle-documents/:id - Vymazanie dokumentu vozidla
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await postgres_database_1.postgresDatabase.deleteVehicleDocument(id);
        res.json({
            success: true,
            message: 'Dokument vozidla úspešne vymazaný'
        });
    }
    catch (error) {
        console.error('Delete vehicle document error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vymazávaní dokumentu vozidla'
        });
    }
});
// Multer konfigurácia pre upload súborov
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
    },
    fileFilter: (req, file, cb) => {
        if (r2_storage_1.r2Storage.validateFileType(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Nepodporovaný typ súboru'));
        }
    },
});
// 📄 Upload technického preukazu
router.post('/upload-technical-certificate', auth_1.authenticateToken, (0, permissions_1.checkPermission)('vehicles', 'update'), upload.single('file'), async (req, res) => {
    try {
        console.log('📄 Technical certificate upload request:', {
            hasFile: !!req.file,
            fileSize: req.file?.size,
            mimetype: req.file?.mimetype,
            body: req.body
        });
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Žiadny súbor nebol nahraný'
            });
        }
        const { vehicleId, documentName, notes } = req.body;
        if (!vehicleId || !documentName) {
            return res.status(400).json({
                success: false,
                error: 'Chýbajú povinné parametre: vehicleId, documentName'
            });
        }
        // Validácia typu súboru
        if (!r2_storage_1.r2Storage.validateFileType(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                error: 'Nepodporovaný typ súboru'
            });
        }
        // Validácia veľkosti súboru
        const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'document';
        if (!r2_storage_1.r2Storage.validateFileSize(req.file.size, fileType)) {
            return res.status(400).json({
                success: false,
                error: 'Súbor je príliš veľký'
            });
        }
        // Generovanie file key pre technický preukaz
        const fileKey = r2_storage_1.r2Storage.generateFileKey('vehicle', vehicleId, req.file.originalname, 'technical-certificate');
        console.log('📄 Generated file key:', fileKey);
        // Upload do R2
        const fileUrl = await r2_storage_1.r2Storage.uploadFile(fileKey, req.file.buffer, req.file.mimetype, {
            original_name: req.file.originalname,
            uploaded_at: new Date().toISOString(),
            vehicle_id: vehicleId,
            document_type: 'technical_certificate',
            document_name: documentName
        });
        console.log('✅ Technical certificate uploaded to R2:', fileUrl);
        // Uloženie do databázy - použijem existujúcu metódu
        const documentData = {
            vehicleId,
            documentType: 'technical_certificate',
            validTo: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000), // 10 rokov platnosť
            documentNumber: documentName,
            notes,
            filePath: fileUrl
        };
        const savedDocument = await postgres_database_1.postgresDatabase.createVehicleDocument(documentData);
        console.log('✅ Technical certificate saved to database:', savedDocument.id);
        res.json({
            success: true,
            data: savedDocument,
            message: 'Technický preukaz úspešne nahraný'
        });
    }
    catch (error) {
        console.error('❌ Error uploading technical certificate:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri nahrávaní technického preukazu',
            ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
    }
});
exports.default = router;
//# sourceMappingURL=vehicle-documents.js.map