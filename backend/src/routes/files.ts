import express from 'express';
import multer from 'multer';
import archiver from 'archiver';
import { r2Storage } from '../utils/r2-storage';
import { postgresDatabase } from '../models/postgres-database';
import { authenticateToken } from '../middleware/auth';
import { r2OrganizationManager, type PathVariables } from '../config/r2-organization';

// 📸 Helper: Generate meaningful media filename with organized structure
const generateMeaningfulFilename = (
  protocolInfo: any, 
  mediaType: string, 
  category: string, 
  originalFilename: string,
  index: number = 1
): string => {
  try {
    // Extract file extension
    const extension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
    
    // Vehicle info
    const brand = protocolInfo.brand || 'Unknown';
    const model = protocolInfo.model || 'Unknown';
    const licensePlate = protocolInfo.license_plate || 'NoPlate';
    
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
    const plateClean = licensePlate.replace(/[^a-zA-Z0-9]/g, '_');
    const indexPadded = String(index).padStart(2, '0');
    
    // Different patterns based on media type
    let meaningfulName: string;
    
    if (mediaType === 'vehicle') {
      meaningfulName = `${vehicleName}_${plateClean}_${mediaTypeName}_${indexPadded}.${extension}`;
    } else if (mediaType === 'damage') {
      meaningfulName = `${vehicleName}_${plateClean}_Damage_${indexPadded}.${extension}`;
    } else if (mediaType === 'document') {
      meaningfulName = `${vehicleName}_${plateClean}_Document_${indexPadded}.${extension}`;
    } else if (mediaType === 'fuel' || mediaType === 'odometer') {
      meaningfulName = `${vehicleName}_${plateClean}_${mediaTypeName}_${indexPadded}.${extension}`;
    } else {
      // Fallback
      meaningfulName = `${vehicleName}_${plateClean}_${categoryName}_${indexPadded}.${extension}`;
    }
    
    console.log('📸 Generated meaningful filename:', {
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

const router = express.Router();

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

    const { type, entityId, mediaType } = req.body;
    
    if (!type || !entityId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Chýba type alebo entityId' 
      });
    }

    console.log('🔍 Validating file...');

    // Validácia typu súboru
    if (!r2Storage.validateFileType(req.file.mimetype)) {
      console.log('❌ Invalid file type:', req.file.mimetype);
      return res.status(400).json({ 
        success: false, 
        error: 'Nepodporovaný typ súboru' 
      });
    }

    // Validácia veľkosti súboru
    const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'document';
    if (!r2Storage.validateFileSize(req.file.size, fileType)) {
      console.log('❌ File too large:', req.file.size);
      return res.status(400).json({ 
        success: false, 
        error: 'Súbor je príliš veľký' 
      });
    }

    console.log('🔍 Generating file key...');

    // Generovanie file key
    const fileKey = r2Storage.generateFileKey(
      type as 'vehicle' | 'protocol' | 'document' | 'company-document', 
      entityId, 
      req.file.originalname,
      mediaType
    );

    console.log('🔍 File key generated:', fileKey);

    // Kontrola R2 konfigurácie
    if (!r2Storage.isConfigured()) {
      console.log('❌ R2 not configured');
      return res.status(500).json({
        success: false,
        error: 'R2 Storage nie je nakonfigurované'
      });
    }

    console.log('🔍 Uploading to R2...');

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

    console.log('✅ File uploaded to R2:', url);

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
    
    console.log('✅ File deleted from R2:', key);
    
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

    console.log('🔄 Loading image from R2 via proxy:', key);

    // Načítanie súboru z R2
    const fileBuffer = await r2Storage.getFile(key);
    
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
    
    console.log('✅ Image served via proxy:', key);

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

    console.log('✅ Protocol PDF uploaded to R2:', url);

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
router.post('/protocol-photo', upload.single('file'), async (req, res) => {
  try {
    console.log('🔄 Protocol photo upload request received:', {
      hasFile: !!req.file,
      fileSize: req.file?.size,
      mimetype: req.file?.mimetype,
      protocolId: req.body.protocolId,
      protocolType: req.body.protocolType, // 'handover' alebo 'return'
      mediaType: req.body.mediaType, // 'vehicle', 'document', 'damage'
      label: req.body.label // voliteľný label pre fotku
    });

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Žiadny súbor nebol nahraný' 
      });
    }

    const { protocolId, protocolType, mediaType, label } = req.body;
    
    if (!protocolId || !protocolType || !mediaType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Chýba protocolId, protocolType alebo mediaType' 
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

    console.log('🔍 Generated file key:', fileKey);

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

    console.log('✅ Protocol photo uploaded to R2:', url);

    // Vytvorenie objektu pre databázu
    const photoObject = {
      id: require('uuid').v4(), // Generovanie UUID pre fotku
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
    let query: string;
    let tableName: string;
    
    if (protocolType === 'handover') {
      tableName = 'handover_protocols';
    } else if (protocolType === 'return') {
      tableName = 'return_protocols';
    } else {
      throw new Error(`Neplatný typ protokolu: ${protocolType}`);
    }
    
    // Získanie informácií o protokole, prenájme a vozidle
    query = `
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
      LEFT JOIN companies c ON v.owner_company_id = c.id
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
    
    console.log('🔄 Generating organized presigned URL for:', {
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
    let protocolInfo: any;
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
            LEFT JOIN companies c ON v.owner_company_id = c.id
            WHERE r.id = $1::integer
            `,
            [parsedRentalId]
          );

          if (result.rows.length === 0) {
            throw new Error(`Prenájom nenájdený: ${parsedRentalId}`);
          }

          protocolInfo = result.rows[0];
          console.log('ℹ️ Using rental-based info for presigned upload organization:', protocolInfo);
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
      protocolInfo.start_date ? new Date(protocolInfo.start_date) : (protocolInfo.created_at ? new Date(protocolInfo.created_at) : new Date())
    );
    
    const companyName = r2OrganizationManager.getCompanyName(protocolInfo.company_name);
    
    const vehicleName = r2OrganizationManager.generateVehicleName(
      protocolInfo.brand || 'Unknown',
      protocolInfo.model || 'Unknown', 
      protocolInfo.license_plate || 'NoPlate'
    );
    
    // Detekcia kategórie ak nie je zadaná
    const detectedCategory = category || r2OrganizationManager.detectCategory(filename, mediaType);
    
    if (!r2OrganizationManager.validateCategory(detectedCategory)) {
      console.warn(`⚠️ Neplatná kategória: ${detectedCategory}, používam 'other'`);
    }

    // 📸 Generovanie zmysluplného filename (namiesto pôvodného)
    const meaningfulFilename = generateMeaningfulFilename(
      protocolInfo, 
      mediaType || 'vehicle', 
      detectedCategory, 
      filename,
      1 // Môžeme neskôr implementovať counter pre duplicates
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

    console.log('🗂️ Generated organized path with meaningful filename:', {
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

    console.log('✅ Organized presigned URL generated:', fileKey);

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
    console.log('🗜️ ZIP DOWNLOAD REQUEST START');
    console.log('🗜️ Request body:', req.body);
    
    const { filePaths, zipName } = req.body;
    
    console.log('🔄 ZIP download request:', { 
      filePathsCount: filePaths?.length, 
      zipName,
      filePaths: filePaths?.slice(0, 3) // Log len prvé 3 pre debug
    });
    
    if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
      console.log('❌ ZIP download: Invalid filePaths');
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
        console.log(`🔄 Adding file ${i + 1}/${filePaths.length} to ZIP:`, filePath);
        
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
          fileKey = filePath.replace(/^https?:\/\/[^\/]+\//, '');
        }
        
        console.log(`🔍 Processing file ${i + 1}: ${filePath} -> ${fileKey}`);
        
        // Stiahnutie súboru z R2
        const fileBuffer = await r2Storage.getFile(fileKey);
        
        if (fileBuffer) {
          // Generovanie názvu súboru v ZIP
          const originalFileName = filePath.split('/').pop() || `subor_${i + 1}`;
          const fileExtension = originalFileName.split('.').pop() || '';
          const zipFileName = `${i + 1}_${originalFileName}`;
          
          // Pridanie súboru do ZIP
          archive.append(fileBuffer, { name: zipFileName });
          console.log(`✅ Added to ZIP: ${zipFileName}`);
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
    console.log('✅ ZIP download completed');

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
    console.log('🧪 Testing ZIP functionality...');
    
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
    console.log('✅ Test ZIP completed');

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

export default router; 