import express from 'express';
import multer from 'multer';
import { r2Storage } from '../utils/r2-storage.js';

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

    // Generovanie file key
    const fileKey = r2Storage.generateFileKey(
      type as 'vehicle' | 'protocol' | 'document', 
      entityId, 
      req.file.originalname
    );

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
    res.status(500).json({ 
      success: false, 
      error: 'Chyba pri nahrávaní súboru' 
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

export default router; 