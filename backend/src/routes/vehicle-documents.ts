import type { Request, Response } from 'express';
import { Router } from 'express';
import multer from 'multer';
import { postgresDatabase } from '../models/postgres-database';
import type { VehicleDocument, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { r2Storage } from '../utils/r2-storage';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/vehicle-documents - Získanie všetkých dokumentov vozidiel alebo pre konkrétne vozidlo
router.get('/', authenticateToken, async (req: Request, res: Response<ApiResponse<VehicleDocument[]>>) => {
  try {
    const { vehicleId } = req.query;
    const documents = await postgresDatabase.getVehicleDocuments(vehicleId as string);
    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Get vehicle documents error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní dokumentov vozidiel'
    });
  }
});

// POST /api/vehicle-documents - Vytvorenie nového dokumentu vozidla
router.post('/', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { vehicleId, documentType, validFrom, validTo, documentNumber, price, notes, filePath, country, isRequired } = req.body;

    if (!vehicleId || !documentType || !validTo) {
      return res.status(400).json({
        success: false,
        error: 'vehicleId, documentType a validTo sú povinné polia'
      });
    }

    const createdDocument = await postgresDatabase.createVehicleDocument({
      vehicleId,
      documentType,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validTo: new Date(validTo),
      documentNumber,
      price,
      notes,
      filePath,
      country, // 🌍 Krajina pre dialničné známky
      isRequired, // ⚠️ Povinná dialničná známka
    });

    res.status(201).json({
      success: true,
      message: 'Dokument vozidla úspešne vytvorený',
      data: createdDocument
    });

  } catch (error) {
    console.error('Create vehicle document error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vytváraní dokumentu vozidla'
    });
  }
});

// PUT /api/vehicle-documents/:id - Aktualizácia dokumentu vozidla
router.put('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { vehicleId, documentType, validFrom, validTo, documentNumber, price, notes, filePath, country, isRequired } = req.body;

    if (!vehicleId || !documentType || !validTo) {
      return res.status(400).json({
        success: false,
        error: 'vehicleId, documentType a validTo sú povinné polia'
      });
    }

    const updatedDocument = await postgresDatabase.updateVehicleDocument(id, {
      vehicleId,
      documentType,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validTo: new Date(validTo),
      documentNumber,
      price,
      notes,
      filePath,
      country, // 🌍 Krajina pre dialničné známky
      isRequired, // ⚠️ Povinná dialničná známka
    });

    res.json({
      success: true,
      message: 'Dokument vozidla úspešne aktualizovaný',
      data: updatedDocument
    });

  } catch (error) {
    console.error('Update vehicle document error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri aktualizácii dokumentu vozidla'
    });
  }
});

// DELETE /api/vehicle-documents/:id - Vymazanie dokumentu vozidla
router.delete('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;

    await postgresDatabase.deleteVehicleDocument(id);

    res.json({
      success: true,
      message: 'Dokument vozidla úspešne vymazaný'
    });

  } catch (error) {
    console.error('Delete vehicle document error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vymazávaní dokumentu vozidla'
    });
  }
});

// Multer konfigurácia pre upload súborov
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    if (r2Storage.validateFileType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nepodporovaný typ súboru'));
    }
  },
});

// 📄 Upload technického preukazu
router.post('/upload-technical-certificate', 
  authenticateToken,
  checkPermission('vehicles', 'update'),
  upload.single('file'),
  async (req: Request, res: Response<ApiResponse>) => {
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
      if (!r2Storage.validateFileType(req.file.mimetype)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nepodporovaný typ súboru' 
        });
      }

      // Validácia veľkosti súboru
      const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'document';
      if (!r2Storage.validateFileSize(req.file.size, fileType)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Súbor je príliš veľký' 
        });
      }

      // Generovanie file key pre technický preukaz
      const fileKey = r2Storage.generateFileKey(
        'vehicle',
        vehicleId,
        req.file.originalname,
        'technical-certificate'
      );

      console.log('📄 Generated file key:', fileKey);

      // Upload do R2
      const fileUrl = await r2Storage.uploadFile(
        fileKey,
        req.file.buffer,
        req.file.mimetype,
        {
          original_name: req.file.originalname,
          uploaded_at: new Date().toISOString(),
          vehicle_id: vehicleId,
          document_type: 'technical_certificate',
          document_name: documentName
        }
      );

      console.log('✅ Technical certificate uploaded to R2:', fileUrl);

      // Uloženie do databázy - použijem existujúcu metódu
      const documentData = {
        vehicleId,
        documentType: 'technical_certificate' as const,
        validTo: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000), // 10 rokov platnosť
        documentNumber: documentName,
        notes,
        filePath: fileUrl
      };

      const savedDocument = await postgresDatabase.createVehicleDocument(documentData);

      console.log('✅ Technical certificate saved to database:', savedDocument.id);

      res.json({
        success: true,
        data: savedDocument,
        message: 'Technický preukaz úspešne nahraný'
      });

    } catch (error) {
      console.error('❌ Error uploading technical certificate:', error);
      
      res.status(500).json({ 
        success: false, 
        error: 'Chyba pri nahrávaní technického preukazu',
        ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
      });
    }
  }
);

export default router; 