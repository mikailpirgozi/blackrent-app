import archiver from 'archiver';
import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { r2OrganizationManager, type PathVariables } from '../config/r2-organization';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { postgresDatabase } from '../models/postgres-database';
import { logger } from '../utils/logger';
import { r2Storage } from '../utils/r2-storage';

// 📸 Helper: Generate meaningful media filename with organized structure
const generateMeaningfulFilename = (
  protocolInfo: Record<string, unknown>,
  mediaType: string, 
  category: string, 
  originalFilename: string,
  timestamp: number = Date.now()
): string => {
  try {
    // Extract file extension
    const extension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
    
    // Vehicle info
    const brand = String(protocolInfo.brand || 'Unknown');
    const model = String(protocolInfo.model || 'Unknown');
    const licensePlate = String(protocolInfo.license_plate || 'NoPlate');
    
    // Media type mapping to readable names
    const mediaTypeNames = {
      'vehicle': 'Vehicle',
      'damage': 'Damage',
      'document': 'Document', 
      'fuel': 'Fuel',
      'odometer': 'Odometer'
    };
    
    // Category mapping to readable names  
    const categoryNames = {
      'vehicle_photos': 'Photos',
      'documents': 'Documents',
      'damages': 'Damages',
      'signatures': 'Signatures',
      'videos': 'Videos',
      'other': 'Other'
    };
    
    const mediaTypeName = mediaTypeNames[mediaType as keyof typeof mediaTypeNames] || 'Media';
    const categoryName = categoryNames[category as keyof typeof categoryNames] || 'Other';
    
    // Generate meaningful filename
    const vehicleName = `${brand}_${model}`.replace(/[^a-zA-Z0-9]/g, '_');
    const plateClean = String(licensePlate).replace(/[^a-zA-Z0-9]/g, '_');
    const timestampStr = String(timestamp);
    
    // Different patterns based on media type
    let meaningfulName: string;
    
    if (mediaType === 'vehicle') {
      meaningfulName = `${vehicleName}_${plateClean}_${mediaTypeName}_${timestampStr}.${extension}`;
    } else if (mediaType === 'damage') {
      meaningfulName = `${vehicleName}_${plateClean}_Damage_${timestampStr}.${extension}`;
    } else if (mediaType === 'document') {
      meaningfulName = `${vehicleName}_${plateClean}_Document_${timestampStr}.${extension}`;
    } else if (mediaType === 'fuel' || mediaType === 'odometer') {
      meaningfulName = `${vehicleName}_${plateClean}_${mediaTypeName}_${timestampStr}.${extension}`;
    } else {
      // Fallback
      meaningfulName = `${vehicleName}_${plateClean}_${categoryName}_${timestampStr}.${extension}`;
    }
    
    logger.info('📸 Generated meaningful filename:', {
      original: originalFilename,
      meaningful: meaningfulName,
      vehicle: `${brand} ${model} (${licensePlate})`,
      mediaType,
      category
    });
    
    return meaningfulName;
    
  } catch (error) {
    console.error('❌ Error generating meaningful filename, using fallback:', error);
    // Fallback to timestamped version if something fails
    const timestamp = Date.now();
    const extension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
    return `${mediaType}_${category}_${timestamp}.${extension}`;
  }
};

const router: express.Router = express.Router();

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

// Upload súboru do R2
router.post('/upload', 
  authenticateToken,
  checkPermission('protocols', 'create'),
  upload.single('file'), 
  async (req, res) => {
  try {
    logger.info('🔄 Upload request received:', {
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

    const { type, entityId, mediaType } = req.body;
    
    if (!type || !entityId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Chýba type alebo entityId' 
      });
    }

    logger.info('🔍 Validating file...');

    // Validácia typu súboru
    if (!r2Storage.validateFileType(req.file.mimetype)) {
      logger.info('❌ Invalid file type:', req.file.mimetype);
      return res.status(400).json({ 
        success: false, 
        error: 'Nepodporovaný typ súboru' 
      });
    }

    // Validácia veľkosti súboru
    const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'document';
    if (!r2Storage.validateFileSize(req.file.size, fileType)) {
      logger.info('❌ File too large:', req.file.size);
      return res.status(400).json({ 
        success: false, 
        error: 'Súbor je príliš veľký' 
      });
    }

    logger.info('🔍 Generating file key...');

    // Generovanie file key
    const fileKey = r2Storage.generateFileKey(
      type as 'vehicle' | 'protocol' | 'document' | 'company-document', 
      entityId, 
      req.file.originalname,
      mediaType
    );

    logger.info('🔍 File key generated:', fileKey);

    // Kontrola R2 konfigurácie
    if (!r2Storage.isConfigured()) {
      logger.info('❌ R2 not configured');
      return res.status(500).json({
        success: false,
        error: 'R2 Storage nie je nakonfigurované'
      });
    }

    logger.info('🔍 Uploading to R2...');

    // Upload do R2
    const url = await r2Storage.uploadFile(
      fileKey,
      req.file.buffer,
      req.file.mimetype,
      {
        original_name: req.file.originalname,
        uploaded_at: new Date().toISOString(),
        entity_id: entityId,
        file_type: type
      }
    );

    logger.info('✅ File uploaded to R2:', url);

    res.json({
      success: true,
      url: url,
      key: fileKey,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

  } catch (error) {
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
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
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
    if (!r2Storage.validateFileType(contentType)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nepodporovaný typ súboru' 
      });
    }

    // Generovanie file key
    const fileKey = r2Storage.generateFileKey(
      type as 'vehicle' | 'protocol' | 'document', 
      entityId, 
      filename
    );

    // Vytvorenie presigned URL
    const presignedUrl = await r2Storage.createPresignedUploadUrl(
      fileKey,
      contentType,
      3600 // 1 hodina
    );

    res.json({
      success: true,
      presignedUrl: presignedUrl,
      key: fileKey,
      publicUrl: r2Storage.getPublicUrl(fileKey)
    });

  } catch (error) {
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

    await r2Storage.deleteFile(key);
    
    logger.info('✅ File deleted from R2:', key);
    
    res.json({ 
      success: true, 
      message: 'Súbor bol úspešne vymazaný' 
    });

  } catch (error) {
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

    logger.info('🔄 Loading image from R2 via proxy:', key);
    logger.info('🔍 Decoded key:', decodeURIComponent(key));

    // Načítanie súboru z R2
    const fileBuffer = await r2Storage.getFile(decodeURIComponent(key));
    
    if (!fileBuffer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Súbor nebol nájdený' 
      });
    }

    // Zistenie MIME typu z file key
    const mimeType = r2Storage.getMimeTypeFromKey(key);
    
    // Nastavenie headers pre obrázok
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache na 1 hodinu
    res.setHeader('Access-Control-Allow-Origin', '*'); // Povoliť CORS
    
    // Odoslanie súboru
    res.send(fileBuffer);
    
    logger.info('✅ Image served via proxy:', key);

  } catch (error) {
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

    const publicUrl = r2Storage.getPublicUrl(key);

    res.json({
      success: true,
      url: publicUrl,
      key: key
    });

  } catch (error) {
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
    const isConfigured = r2Storage.isConfigured();
    
    res.json({
      success: true,
      configured: isConfigured,
      message: isConfigured ? 'R2 Storage je nakonfigurované' : 'R2 Storage nie je nakonfigurované'
    });

  } catch (error) {
    console.error('❌ Error checking R2 status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Chyba pri kontrole R2 stavu' 
    });
  }
});

// 🚀 NOVÝ ENDPOINT: Upload obrázkov pre protokol (originál + thumbnail)
router.post('/protocol-upload', 
  authenticateToken,
  checkPermission('protocols', 'create'),
  upload.single('file'), 
  async (req, res) => {
  try {
    logger.info('🔄 Protocol upload request received:', {
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
    if (!r2Storage.validateFileType(req.file.mimetype)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nepodporovaný typ súboru' 
      });
    }

    // Validácia veľkosti súboru
    if (!r2Storage.validateFileSize(req.file.size, 'image')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Súbor je príliš veľký' 
      });
    }

    // Generovanie file key podľa typu
    let fileKey: string;
    if (type === 'original') {
      fileKey = `protocols/${protocolId}/original-images/${req.file.originalname}`;
    } else if (type === 'thumbnail') {
      fileKey = `protocols/${protocolId}/thumbnails/${req.file.originalname}`;
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Neplatný typ (musí byť original alebo thumbnail)' 
      });
    }

    // Upload do R2
    const url = await r2Storage.uploadFile(
      fileKey,
      req.file.buffer,
      req.file.mimetype,
      {
        original_name: req.file.originalname,
        uploaded_at: new Date().toISOString(),
        protocol_id: protocolId,
        file_type: type
      }
    );

    logger.info('✅ Protocol file uploaded to R2:', url);

    res.json({
      success: true,
      url: url,
      key: fileKey,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      type: type
    });

  } catch (error) {
    console.error('❌ Error uploading protocol file:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Chyba pri nahrávaní súboru protokolu',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// 🚀 NOVÝ ENDPOINT: Upload PDF protokolu
router.post('/protocol-pdf', 
  authenticateToken,
  checkPermission('protocols', 'create'),
  upload.single('file'), 
  async (req, res) => {
  try {
    logger.info('🔄 Protocol PDF upload request received:', {
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
    const url = await r2Storage.uploadFile(
      fileKey,
      req.file.buffer,
      req.file.mimetype,
      {
        original_name: 'customer-protocol.pdf',
        uploaded_at: new Date().toISOString(),
        protocol_id: protocolId,
        file_type: 'pdf'
      }
    );

    logger.info('✅ Protocol PDF uploaded to R2:', url);

    res.json({
      success: true,
      url: url,
      key: fileKey,
      filename: 'customer-protocol.pdf',
      size: req.file.size,
      mimetype: req.file.mimetype
    });

  } catch (error) {
    console.error('❌ Error uploading protocol PDF:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Chyba pri nahrávaní PDF protokolu',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
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

  } catch (error) {
    console.error('❌ Error loading protocol images:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Chyba pri načítaní obrázkov protokolu' 
    });
  }
});

// 🚀 NOVÝ ENDPOINT: Upload fotky pre protokol (podľa navrhovanej metódy)
router.post('/protocol-photo', 
  authenticateToken,
  checkPermission('protocols', 'create'),
  upload.single('file'), 
  async (req, res) => {
  try {
    logger.info('🔄 Protocol photo upload request received:', {
      hasFile: !!req.file,
      fileSize: req.file?.size,
      mimetype: req.file?.mimetype,
      protocolId: req.body.protocolId,
      protocolType: req.body.protocolType, // 'handover' alebo 'return'
      mediaType: req.body.mediaType, // 'vehicle', 'document', 'damage'
      label: req.body.label, // voliteľný label pre fotku
      category: req.body.category,
      metadata: req.body.metadata,
      allBodyKeys: Object.keys(req.body)
    });

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Žiadny súbor nebol nahraný' 
      });
    }

    const { protocolId, protocolType, mediaType, label } = req.body;
    
    // Detailná validácia parametrov
    if (!protocolId) {
      logger.error('❌ Missing protocolId');
      return res.status(400).json({ 
        success: false, 
        error: 'Chýba protocolId' 
      });
    }
    
    if (!protocolType) {
      logger.error('❌ Missing protocolType');
      return res.status(400).json({ 
        success: false, 
        error: 'Chýba protocolType' 
      });
    }
    
    if (!mediaType) {
      logger.error('❌ Missing mediaType');
      return res.status(400).json({ 
        success: false, 
        error: 'Chýba mediaType' 
      });
    }
    
    // Validácia hodnôt protocolType
    if (!['handover', 'return'].includes(protocolType)) {
      logger.error('❌ Invalid protocolType:', protocolType);
      return res.status(400).json({ 
        success: false, 
        error: `Neplatný protocolType: ${protocolType}. Povolené: handover, return` 
      });
    }
    
    // Validácia hodnôt mediaType
    if (!['vehicle', 'document', 'damage', 'fuel', 'odometer'].includes(mediaType)) {
      logger.error('❌ Invalid mediaType:', mediaType);
      return res.status(400).json({ 
        success: false, 
        error: `Neplatný mediaType: ${mediaType}. Povolené: vehicle, document, damage, fuel, odometer` 
      });
    }

    // Validácia typu súboru - len obrázky
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Len obrázky sú povolené' 
      });
    }

    // Validácia veľkosti súboru
    if (!r2Storage.validateFileSize(req.file.size, 'image')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Súbor je príliš veľký' 
      });
    }

    // Generovanie file key podľa štruktúry
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const fileKey = `protocols/${protocolType}/${today}/${protocolId}/${req.file.originalname}`;

    logger.info('🔍 Generated file key:', fileKey);

    // Upload do R2
    const url = await r2Storage.uploadFile(
      fileKey,
      req.file.buffer,
      req.file.mimetype,
      {
        original_name: req.file.originalname,
        uploaded_at: new Date().toISOString(),
        protocol_id: protocolId,
        protocol_type: protocolType,
        media_type: mediaType,
        label: label || req.file.originalname
      }
    );

    logger.info('✅ Protocol photo uploaded to R2:', url);

    // Vytvorenie objektu pre databázu
    const photoObject = {
      id: (await import('uuid')).v4(), // Generovanie UUID pre fotku
      url: url,
      type: mediaType,
      description: label || req.file.originalname,
      timestamp: new Date(),
      compressed: false,
      originalSize: req.file.size,
      compressedSize: req.file.size,
      filename: req.file.originalname
    };

    res.json({
      success: true,
      photo: photoObject,
      url: url,
      key: fileKey,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

  } catch (error) {
    console.error('❌ Error uploading protocol photo:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Chyba pri nahrávaní fotky protokolu',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// 🗂️ HELPER: Získanie informácií o protokole pre organizáciu
async function getProtocolInfo(protocolId: string, protocolType: string) {
  const client = await postgresDatabase.dbPool.connect();
  try {
    let tableName: string;
    
    if (protocolType === 'handover') {
      tableName = 'handover_protocols';
    } else if (protocolType === 'return') {
      tableName = 'return_protocols';
    } else {
      throw new Error(`Neplatný typ protokolu: ${protocolType}`);
    }
    
    // Získanie informácií o protokole, prenájme a vozidle
    const query = `
      SELECT 
        p.id as protocol_id,
        p.rental_id,
        p.created_at,
        r.vehicle_id,
        r.customer_name,
        v.brand,
        v.model,
        v.license_plate,
        v.company,
        COALESCE(c.name, v.company, 'BlackRent') as company_name
      FROM ${tableName} p
      LEFT JOIN rentals r ON p.rental_id = r.id
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN companies c ON v.company_id = c.id
      WHERE p.id = $1::uuid
    `;
    
    const result = await client.query(query, [protocolId]);
    
    if (result.rows.length === 0) {
      throw new Error(`Protokol nenájdený: ${protocolId}`);
    }
    
    return result.rows[0];
  } finally {
    client.release();
  }
}

// 🚀 NOVÝ ENDPOINT: Generovanie signed URL s pokročilou organizáciou
router.post('/presigned-upload', authenticateToken, async (req, res) => {
  try {
    const { protocolId, protocolType, mediaType, filename, contentType, category, rentalId } = req.body;
    
    logger.info('🔄 Generating organized presigned URL for:', {
      protocolId,
      rentalId,
      protocolType,
      mediaType,
      filename,
      contentType,
      category
    });

    // Validácia povinných parametrov
    if ((!protocolId && !rentalId) || !protocolType || !filename || !contentType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Chýbajú povinné parametre (protocolId alebo rentalId, protocolType, filename, contentType)' 
      });
    }

    // Rozšírená validácia typov súborov (nie len obrázky)
    const allowedTypes = [
      'image/', 'video/', 'application/pdf', 
      'application/msword', 'application/vnd.openxmlformats-officedocument'
    ];
    
    if (!allowedTypes.some(type => contentType.startsWith(type))) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nepodporovaný typ súboru. Povolené: obrázky, videá, PDF, Word dokumenty' 
      });
    }

    // Pomocné: validácia UUID
    const isValidUUID = (uuid: string): boolean => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(uuid);
    };

    // 🔍 Získanie informácií o protokole (s fallbackom na prenájom)
    let protocolInfo: Record<string, unknown>;
    try {
      if (protocolId && isValidUUID(String(protocolId))) {
        protocolInfo = await getProtocolInfo(protocolId, protocolType);
      } else {
        // Fallback: dedukcia z prenájmu
        const rentalIdValue = rentalId || protocolId; // môže prísť rental id v poli protocolId
        const parsedRentalId = parseInt(String(rentalIdValue));
        if (!parsedRentalId || Number.isNaN(parsedRentalId)) {
          throw new Error('Neplatné rentalId pre fallback');
        }

        const client = await postgresDatabase.dbPool.connect();
        try {
          const result = await client.query(
            `
            SELECT 
              r.id as rental_id,
              r.created_at,
              r.start_date,
              v.brand,
              v.model,
              v.license_plate,
              v.company,
              COALESCE(c.name, v.company, 'BlackRent') as company_name
            FROM rentals r
            LEFT JOIN vehicles v ON r.vehicle_id = v.id
            LEFT JOIN companies c ON v.company_id = c.id
            WHERE r.id = $1::integer
            `,
            [parsedRentalId]
          );

          if (result.rows.length === 0) {
            throw new Error(`Prenájom nenájdený: ${parsedRentalId}`);
          }

          protocolInfo = result.rows[0];
          logger.info('ℹ️ Using rental-based info for presigned upload organization:', protocolInfo);
        } finally {
          client.release();
        }
      }
    } catch (error) {
      console.error('❌ Error fetching protocol/rental info:', error);
      return res.status(404).json({
        success: false,
        error: 'Protokol alebo prenájom nenájdený pre organizáciu uploadu',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // 🗂️ Príprava premenných pre organizáciu
    const dateComponents = r2OrganizationManager.generateDateComponents(
      protocolInfo.start_date ? new Date(String(protocolInfo.start_date)) : (protocolInfo.created_at ? new Date(String(protocolInfo.created_at)) : new Date())
    );
    
    const companyName = r2OrganizationManager.getCompanyName(String(protocolInfo.company_name || ''));
    
    const vehicleName = r2OrganizationManager.generateVehicleName(
      String(protocolInfo.brand || 'Unknown'),
      String(protocolInfo.model || 'Unknown'), 
      String(protocolInfo.license_plate || 'NoPlate')
    );
    
    // Detekcia kategórie ak nie je zadaná
    const detectedCategory = category || r2OrganizationManager.detectCategory(filename, mediaType);
    
    if (!r2OrganizationManager.validateCategory(detectedCategory)) {
      console.warn(`⚠️ Neplatná kategória: ${detectedCategory}, používam 'other'`);
    }

    // 📸 Generovanie zmysluplného filename s unikátnym timestampom
    const timestamp = Date.now();
    const meaningfulFilename = generateMeaningfulFilename(
      protocolInfo, 
      mediaType || 'vehicle', 
      detectedCategory, 
      filename,
      timestamp // Unikátny timestamp namiesto pevného indexu
    );

    // 🛠️ Generovanie organizovanej cesty s novým filename
    const pathVariables: PathVariables = {
      year: dateComponents.year,
      month: dateComponents.month,
      company: companyName,
      vehicle: vehicleName,
      protocolType: protocolType as 'handover' | 'return',
      protocolId: (protocolId && isValidUUID(String(protocolId))) ? protocolId : String(protocolInfo.protocol_id || protocolInfo.rental_id),
      category: detectedCategory,
      filename: meaningfulFilename // ✨ POUŽÍVAM NOVÝ MEANINGFUL FILENAME
    };

    const fileKey = r2OrganizationManager.generatePath(pathVariables);

    logger.info('🗂️ Generated organized path with meaningful filename:', {
      originalFilename: filename,
      meaningfulFilename: meaningfulFilename,
      oldPath: `protocols/${protocolType}/${new Date().toISOString().split('T')[0]}/${protocolId}/${filename}`,
      newPath: fileKey,
      pathVariables
    });

    // 🔐 Vytvorenie presigned URL (platná 10 minút)
    const presignedUrl = await r2Storage.createPresignedUploadUrl(
      fileKey, 
      contentType, 
      600 // 10 minút (viac času pre upload)
    );

    // 🌐 Public URL pre neskoršie použitie
    const publicUrl = r2Storage.getPublicUrl(fileKey);

    logger.info('✅ Organized presigned URL generated:', fileKey);

    res.json({
      success: true,
      presignedUrl: presignedUrl,
      publicUrl: publicUrl,
      fileKey: fileKey,
      expiresIn: 600,
      organization: {
        company: companyName,
        vehicle: vehicleName,
        category: detectedCategory,
        path: fileKey
      }
    });

  } catch (error) {
    console.error('❌ Error generating organized presigned URL:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Chyba pri generovaní organizovanej signed URL',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// 🗜️ NOVÝ ENDPOINT: ZIP download pre viacero súborov
router.post('/download-zip', async (req, res) => {
  try {
    logger.info('🗜️ ZIP DOWNLOAD REQUEST START');
    logger.info('🗜️ Request body:', req.body);
    
    const { filePaths, zipName } = req.body;
    
    logger.info('🔄 ZIP download request:', { 
      filePathsCount: filePaths?.length, 
      zipName,
      filePaths: filePaths?.slice(0, 3) // Log len prvé 3 pre debug
    });
    
    if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
      logger.info('❌ ZIP download: Invalid filePaths');
      return res.status(400).json({ 
        success: false, 
        error: 'Chýbajú cesty k súborom' 
      });
    }

    // Nastavenie response headers pre ZIP download
    const fileName = zipName || `poistka_subory_${Date.now()}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Vytvorenie ZIP archívu
    const archive = archiver('zip', {
      zlib: { level: 9 } // Najvyššia kompresia
    });

    // Error handling pre archiver
    archive.on('error', (err) => {
      console.error('❌ ZIP archive error:', err);
      throw err;
    });

    // Pipe archívu do response
    archive.pipe(res);

    // Pridanie súborov do ZIP archívu
    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      
      try {
        logger.info(`🔄 Adding file ${i + 1}/${filePaths.length} to ZIP:`, filePath);
        
        // Extrakcia file key z URL - podporuje R2 URLs
        let fileKey: string;
        if (filePath.includes('blackrent-storage.mikailpirgozi.dev')) {
          // R2 URL format: https://blackrent-storage.mikailpirgozi.dev/path/to/file
          fileKey = filePath.replace(/^https?:\/\/blackrent-storage\.mikailpirgozi\.dev\//, '');
        } else if (filePath.includes('pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev')) {
          // Skutočný R2 URL format z databázy
          fileKey = filePath.replace(/^https?:\/\/pub-4fec120a8a6a4a0cbadfa55f54b7e8a2\.r2\.dev\//, '');
        } else if (filePath.includes('r2.cloudflarestorage.com')) {
          // Alternative R2 URL format
          fileKey = filePath.split('/').slice(3).join('/'); // Skip domain parts
        } else {
          // Fallback - remove domain
          fileKey = filePath.replace(/^https?:\/\/[^/]+\//, '');
        }
        
        logger.info(`🔍 Processing file ${i + 1}: ${filePath} -> ${fileKey}`);
        
        // Stiahnutie súboru z R2
        const fileBuffer = await r2Storage.getFile(fileKey);
        
        if (fileBuffer) {
          // Generovanie názvu súboru v ZIP
          const originalFileName = filePath.split('/').pop() || `subor_${i + 1}`;
          // const fileExtension = originalFileName.split('.').pop() || '';
          const zipFileName = `${i + 1}_${originalFileName}`;
          
          // Pridanie súboru do ZIP
          archive.append(fileBuffer, { name: zipFileName });
          logger.info(`✅ Added to ZIP: ${zipFileName}`);
        } else {
          console.warn(`⚠️ File not found, skipping: ${filePath}`);
          // Pridaj textový súbor s chybou
          archive.append(`Súbor nebol nájdený: ${filePath}`, { name: `ERROR_${i + 1}.txt` });
        }
      } catch (fileError) {
        console.error(`❌ Error adding file ${filePath} to ZIP:`, fileError);
        // Pridaj textový súbor s chybou
        archive.append(`Chyba pri načítaní súboru: ${filePath}\nChyba: ${fileError}`, { name: `ERROR_${i + 1}.txt` });
      }
    }

    // Dokončenie ZIP archívu
    await archive.finalize();
    logger.info('✅ ZIP download completed');

  } catch (error) {
    console.error('❌ Error creating ZIP:', error);
    
    // Ak response ešte nebol odoslaný
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        error: 'Chyba pri vytváraní ZIP archívu',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }
});

// 🧪 TEST ENDPOINT: Jednoduchý ZIP test
router.get('/test-zip', async (req, res) => {
  try {
    logger.info('🧪 Testing ZIP functionality...');
    
    // Nastavenie response headers pre ZIP download
    const fileName = `test_archive_${Date.now()}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Vytvorenie ZIP archívu
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    // Error handling pre archiver
    archive.on('error', (err) => {
      console.error('❌ ZIP archive error:', err);
      throw err;
    });

    // Pipe archívu do response
    archive.pipe(res);

    // Pridanie test súborov
    archive.append('Toto je test súbor 1', { name: 'test1.txt' });
    archive.append('Toto je test súbor 2', { name: 'test2.txt' });
    archive.append('Toto je test súbor 3', { name: 'test3.txt' });

    // Dokončenie ZIP archívu
    await archive.finalize();
    logger.info('✅ Test ZIP completed');

  } catch (error) {
    console.error('❌ Error creating test ZIP:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        error: 'Chyba pri vytváraní test ZIP archívu',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

// 🚀 NEW: Progressive Photo Upload with Server-Side Compression
// Upload single photo at a time, server compresses it, then uploads to R2
// This prevents mobile browser memory crashes
router.post('/progressive-upload',
  authenticateToken,
  checkPermission('protocols', 'create'),
  upload.single('file'),
  async (req, res) => {
    try {
      logger.info('🔄 Progressive upload request received:', {
        hasFile: !!req.file,
        fileSize: req.file?.size,
        mimetype: req.file?.mimetype,
        protocolId: req.body.protocolId,
        protocolType: req.body.protocolType,
        mediaType: req.body.mediaType,
        photoIndex: req.body.photoIndex,
        totalPhotos: req.body.totalPhotos,
      });

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const { protocolId, protocolType, mediaType, photoIndex, totalPhotos } = req.body;

      // Validation
      if (!protocolId || !protocolType || !mediaType) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: protocolId, protocolType, mediaType'
        });
      }

      // Validate protocolType
      if (!['handover', 'return'].includes(protocolType)) {
        return res.status(400).json({
          success: false,
          error: `Invalid protocolType: ${protocolType}. Allowed: handover, return`
        });
      }

      // Validate mediaType
      if (!['vehicle', 'document', 'damage', 'fuel', 'odometer'].includes(mediaType)) {
        return res.status(400).json({
          success: false,
          error: `Invalid mediaType: ${mediaType}. Allowed: vehicle, document, damage, fuel, odometer`
        });
      }

      // Validate file type - only images
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({
          success: false,
          error: 'Only images are allowed'
        });
      }

      const startTime = Date.now();

      // ✅ SERVER-SIDE COMPRESSION using Sharp
      // This is more reliable than browser compression on mobile devices
      logger.info('🔄 Starting server-side image compression...', {
        originalSize: req.file.size,
        originalFormat: req.file.mimetype,
      });

      // Compress to WebP (for gallery) - 100% quality, original resolution
      // Only converts format to WebP, keeps original quality and size
      const webpBuffer = await sharp(req.file.buffer)
        .webp({ quality: 100, lossless: false }) // 100% quality (not lossless to save space)
        .toBuffer();

      // Compress to JPEG (for PDF) - lower quality for smaller PDF files
      const jpegBuffer = await sharp(req.file.buffer)
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 62, progressive: true }) // Reduced from 92% to 62% (30% reduction)
        .toBuffer();

      const compressionTime = Date.now() - startTime;

      logger.info('✅ Server-side compression complete', {
        originalSize: req.file.size,
        webpSize: webpBuffer.length,
        jpegSize: jpegBuffer.length,
        webpReduction: ((1 - webpBuffer.length / req.file.size) * 100).toFixed(1) + '%',
        jpegReduction: ((1 - jpegBuffer.length / req.file.size) * 100).toFixed(1) + '%',
        compressionTime: compressionTime + 'ms',
      });

      // Generate file keys
      const timestamp = Date.now();
      const photoId = `${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      const webpKey = `protocols/${protocolType}/${today}/${protocolId}/${mediaType}/${photoId}.webp`;
      const jpegKey = `protocols/${protocolType}/${today}/${protocolId}/${mediaType}/${photoId}_pdf.jpeg`;

      logger.info('🔍 Generated file keys:', { webpKey, jpegKey });

      // Upload both versions to R2
      const uploadStartTime = Date.now();

      const [webpUrl, jpegUrl] = await Promise.all([
        r2Storage.uploadFile(
          webpKey,
          webpBuffer,
          'image/webp',
          {
            original_name: req.file.originalname,
            uploaded_at: new Date().toISOString(),
            protocol_id: protocolId,
            protocol_type: protocolType,
            media_type: mediaType,
            version: 'gallery',
            original_size: req.file.size.toString(),
            compressed_size: webpBuffer.length.toString(),
          }
        ),
        r2Storage.uploadFile(
          jpegKey,
          jpegBuffer,
          'image/jpeg',
          {
            original_name: req.file.originalname,
            uploaded_at: new Date().toISOString(),
            protocol_id: protocolId,
            protocol_type: protocolType,
            media_type: mediaType,
            version: 'pdf',
            original_size: req.file.size.toString(),
            compressed_size: jpegBuffer.length.toString(),
          }
        ),
      ]);

      const uploadTime = Date.now() - uploadStartTime;
      const totalTime = Date.now() - startTime;

      logger.info('✅ Progressive upload complete', {
        photoId,
        webpUrl: webpUrl.substring(0, 80) + '...',
        jpegUrl: jpegUrl.substring(0, 80) + '...',
        uploadTime: uploadTime + 'ms',
        totalTime: totalTime + 'ms',
        photoIndex,
        totalPhotos,
      });

      // Return photo object for frontend
      const photoObject = {
        id: photoId,
        url: webpUrl, // WebP for gallery
        pdfUrl: jpegUrl, // JPEG for PDF
        type: mediaType,
        description: req.file.originalname,
        timestamp: new Date(),
        compressed: true,
        originalSize: req.file.size,
        compressedSize: webpBuffer.length,
        filename: req.file.originalname,
        metadata: {
          compressionTime,
          uploadTime,
          totalTime,
          webpSize: webpBuffer.length,
          jpegSize: jpegBuffer.length,
        },
      };

      res.json({
        success: true,
        photo: photoObject,
        progress: {
          current: parseInt(photoIndex) || 0,
          total: parseInt(totalPhotos) || 0,
          percentage: totalPhotos ? Math.round((parseInt(photoIndex) / parseInt(totalPhotos)) * 100) : 0,
        },
        stats: {
          originalSize: req.file.size,
          webpSize: webpBuffer.length,
          jpegSize: jpegBuffer.length,
          compressionTime,
          uploadTime,
          totalTime,
        },
      });

    } catch (error) {
      console.error('❌ Error in progressive upload:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to upload photo',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }
);

export default router; 