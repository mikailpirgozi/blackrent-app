"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../middleware/permissions");
const postgres_database_1 = require("../models/postgres-database");
const r2_storage_1 = require("../utils/r2-storage");
const router = express_1.default.Router();
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
// 📄 Upload dokumentu majiteľa
router.post('/upload', auth_1.authenticateToken, (0, permissions_1.checkPermission)('companies', 'update'), upload.single('file'), async (req, res) => {
    try {
        console.log('📄 Company document upload request:', {
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
        const { companyId, documentType, documentName, description, documentMonth, documentYear } = req.body;
        if (!companyId || !documentType || !documentName) {
            return res.status(400).json({
                success: false,
                error: 'Chýbajú povinné parametre: companyId, documentType, documentName'
            });
        }
        // Validácia typu dokumentu
        if (!['contract', 'invoice'].includes(documentType)) {
            return res.status(400).json({
                success: false,
                error: 'Neplatný typ dokumentu. Povolené: contract, invoice'
            });
        }
        // Pre faktúry vyžaduj mesiac a rok
        if (documentType === 'invoice') {
            if (!documentMonth || !documentYear) {
                return res.status(400).json({
                    success: false,
                    error: 'Pre faktúry sú povinné parametre: documentMonth, documentYear'
                });
            }
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
        // Generovanie file key
        const mediaType = documentType === 'contract' ? 'contract' : 'invoice';
        const fileKey = r2_storage_1.r2Storage.generateFileKey('company-document', companyId, req.file.originalname, mediaType);
        console.log('📄 Generated file key:', fileKey);
        // Upload do R2
        const fileUrl = await r2_storage_1.r2Storage.uploadFile(fileKey, req.file.buffer, req.file.mimetype, {
            original_name: req.file.originalname,
            uploaded_at: new Date().toISOString(),
            company_id: companyId,
            document_type: documentType,
            document_name: documentName
        });
        console.log('✅ File uploaded to R2:', fileUrl);
        // Uloženie do databázy
        const documentData = {
            companyId: parseInt(companyId),
            documentType: documentType,
            documentName,
            description,
            filePath: fileUrl,
            fileSize: req.file.size,
            fileType: req.file.mimetype,
            originalFilename: req.file.originalname,
            createdBy: req.user?.id
        };
        // Pridaj mesiac a rok pre faktúry
        if (documentType === 'invoice') {
            documentData.documentMonth = parseInt(documentMonth);
            documentData.documentYear = parseInt(documentYear);
        }
        const savedDocument = await postgres_database_1.postgresDatabase.createCompanyDocument(documentData);
        console.log('✅ Document saved to database:', savedDocument.id);
        res.json({
            success: true,
            data: savedDocument,
            message: 'Dokument úspešne nahraný'
        });
    }
    catch (error) {
        console.error('❌ Error uploading company document:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri nahrávaní dokumentu',
            ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
    }
});
// 📄 Získanie dokumentov firmy
router.get('/:companyId', auth_1.authenticateToken, (0, permissions_1.checkPermission)('companies', 'read'), async (req, res) => {
    try {
        const { companyId } = req.params;
        const { documentType, year, month } = req.query;
        console.log('📄 Getting company documents:', { companyId, documentType, year, month });
        const documents = await postgres_database_1.postgresDatabase.getCompanyDocuments(parseInt(companyId), documentType, year ? parseInt(year) : undefined, month ? parseInt(month) : undefined);
        console.log(`✅ Found ${documents.length} documents for company ${companyId}`);
        res.json({
            success: true,
            data: documents
        });
    }
    catch (error) {
        console.error('❌ Error getting company documents:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri načítaní dokumentov',
            ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
    }
});
// 📄 Zmazanie dokumentu
router.delete('/:documentId', auth_1.authenticateToken, (0, permissions_1.checkPermission)('companies', 'delete'), async (req, res) => {
    try {
        const { documentId } = req.params;
        console.log('📄 Deleting company document:', documentId);
        // Získaj dokument pre file path
        const document = await postgres_database_1.postgresDatabase.getCompanyDocumentById(documentId);
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Dokument nenájdený'
            });
        }
        // Zmaž súbor z R2 (ak nie je lokálny)
        if (document.filePath && !document.filePath.startsWith('http://localhost')) {
            try {
                const fileKey = document.filePath.replace(r2_storage_1.r2Storage.getPublicUrl(''), '');
                await r2_storage_1.r2Storage.deleteFile(fileKey);
                console.log('✅ File deleted from R2:', fileKey);
            }
            catch (error) {
                console.warn('⚠️ Could not delete file from R2:', error);
            }
        }
        // Zmaž záznam z databázy
        await postgres_database_1.postgresDatabase.deleteCompanyDocument(documentId);
        console.log('✅ Company document deleted:', documentId);
        res.json({
            success: true,
            message: 'Dokument úspešne zmazaný'
        });
    }
    catch (error) {
        console.error('❌ Error deleting company document:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri mazaní dokumentu',
            ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
    }
});
// 📄 Uloženie metadata pre už nahraný súbor
router.post('/save-metadata', auth_1.authenticateToken, (0, permissions_1.checkPermission)('companies', 'update'), async (req, res) => {
    try {
        console.log('📄 Save document metadata request:', req.body);
        const { companyId, documentType, documentName, description, documentMonth, documentYear, filePath } = req.body;
        if (!companyId || !documentType || !documentName || !filePath) {
            return res.status(400).json({
                success: false,
                error: 'Chýbajú povinné parametre: companyId, documentType, documentName, filePath'
            });
        }
        // Validácia typu dokumentu
        if (!['contract', 'invoice'].includes(documentType)) {
            return res.status(400).json({
                success: false,
                error: 'Neplatný typ dokumentu. Povolené: contract, invoice'
            });
        }
        // Pre faktúry vyžaduj mesiac a rok
        if (documentType === 'invoice') {
            if (!documentMonth || !documentYear) {
                return res.status(400).json({
                    success: false,
                    error: 'Pre faktúry sú povinné parametre: documentMonth, documentYear'
                });
            }
        }
        // Uloženie do databázy
        const documentData = {
            companyId: parseInt(companyId),
            documentType: documentType,
            documentName,
            description,
            filePath,
            createdBy: req.user?.id
        };
        // Pridaj mesiac a rok pre faktúry
        if (documentType === 'invoice') {
            documentData.documentMonth = parseInt(documentMonth);
            documentData.documentYear = parseInt(documentYear);
        }
        const savedDocument = await postgres_database_1.postgresDatabase.createCompanyDocument(documentData);
        console.log('✅ Document metadata saved to database:', savedDocument.id);
        res.json({
            success: true,
            data: savedDocument,
            message: 'Dokument úspešne uložený'
        });
    }
    catch (error) {
        console.error('❌ Error saving document metadata:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri ukladaní dokumentu',
            ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
    }
});
exports.default = router;
//# sourceMappingURL=company-documents.js.map