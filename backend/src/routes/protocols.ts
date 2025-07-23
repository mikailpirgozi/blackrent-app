import express from 'express';
import multer from 'multer';
import { HandoverProtocol, ReturnProtocol } from '../types';
import { postgresDatabase } from '../models/postgres-database';
import { generateHandoverPDF, generateReturnPDF } from '../utils/pdf-generator';
import { authenticateToken } from '../middleware/auth';
import { Request, Response } from 'express';
import { r2Storage } from '../utils/r2-storage';

const router = express.Router();

// UUID validation function
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Multer config for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get all protocols for a rental
router.get('/rental/:rentalId', async (req, res) => {
  try {
    const { rentalId } = req.params;
    console.log('📋 Fetching protocols for rental:', rentalId);
    
    const [rentalHandoverProtocols, rentalReturnProtocols] = await Promise.all([
      postgresDatabase.getHandoverProtocolsByRental(rentalId),
      postgresDatabase.getReturnProtocolsByRental(rentalId)
    ]);
    
    res.json({ 
      handoverProtocols: rentalHandoverProtocols, 
      returnProtocols: rentalReturnProtocols 
    });
  } catch (error) {
    console.error('❌ Error fetching protocols:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🚀 NOVÝ ENDPOINT: Získanie médií z protokolu pre galériu - Z DATABÁZY
router.get('/media/:protocolId', async (req, res) => {
  try {
    const { protocolId } = req.params;
    const { type } = req.query; // 'handover' alebo 'return'
    
    console.log('📸 Loading media from database for protocol:', protocolId, 'type:', type);
    
    if (!protocolId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Chýba protocolId' 
      });
    }

    if (!type || (type !== 'handover' && type !== 'return')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Chýba alebo neplatný typ protokolu (handover/return)' 
      });
    }

    // ✅ NAČÍTANIE PROTOKOLU Z DATABÁZY
    let protocol;
    if (type === 'handover') {
      protocol = await postgresDatabase.getHandoverProtocolById(protocolId);
    } else {
      protocol = await postgresDatabase.getReturnProtocolById(protocolId);
    }

    if (!protocol) {
      return res.status(404).json({ 
        success: false, 
        error: 'Protokol nebol nájdený' 
      });
    }

    // Zber všetkých médií z protokolu
    const allImages: any[] = [];
    const allVideos: any[] = [];
    
    // Vehicle images
    if (protocol.vehicleImages && protocol.vehicleImages.length > 0) {
      allImages.push(...protocol.vehicleImages.map((img: any) => ({
        ...img,
        type: 'vehicle',
        category: 'Vozidlo'
      })));
    }
    
    // Vehicle videos
    if (protocol.vehicleVideos && protocol.vehicleVideos.length > 0) {
      allVideos.push(...protocol.vehicleVideos.map((video: any) => ({
        ...video,
        type: 'vehicle',
        category: 'Vozidlo'
      })));
    }
    
    // Document images
    if (protocol.documentImages && protocol.documentImages.length > 0) {
      allImages.push(...protocol.documentImages.map((img: any) => ({
        ...img,
        type: 'document',
        category: 'Doklady'
      })));
    }
    
    // Damage images
    if (protocol.damageImages && protocol.damageImages.length > 0) {
      allImages.push(...protocol.damageImages.map((img: any) => ({
        ...img,
        type: 'damage',
        category: 'Poškodenia'
      })));
    }

    console.log('📸 Database media loaded:', { 
      images: allImages.length, 
      videos: allVideos.length,
      protocolId,
      type 
    });

    res.json({
      success: true,
      images: allImages,
      videos: allVideos,
      source: 'database',
      protocol: {
        id: protocol.id,
        type: protocol.type,
        status: protocol.status,
        location: protocol.location,
        createdAt: protocol.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error loading protocol media from database:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Chyba pri načítaní médií protokolu z databázy',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create handover protocol
router.post('/handover', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Received handover protocol request');
    console.log('📝 Request body (raw):', req.body);
    console.log('📝 Request body (stringified):', JSON.stringify(req.body, null, 2));
    
    const protocolData: HandoverProtocol = req.body;
    console.log('📝 Creating handover protocol with data:', JSON.stringify(protocolData, null, 2));
    
    // Validácia povinných polí
    if (!protocolData.rentalId) {
      console.error('❌ Missing rental ID');
      return res.status(400).json({ error: 'Rental ID is required' });
    }
    
    // UUID validácia pre rental ID
    if (!isValidUUID(protocolData.rentalId)) {
      console.error('❌ Invalid rental ID format:', protocolData.rentalId);
      return res.status(400).json({ error: 'Invalid rental ID format. Must be valid UUID.' });
    }
    
    // 1. Uloženie protokolu do databázy
    const protocol = await postgresDatabase.createHandoverProtocol(protocolData);
    console.log('✅ Handover protocol created in DB:', protocol.id);
    
    // 2. 🎭 PUPPETEER: Generovanie PDF súčasne s uložením
    let pdfUrl = null;
    try {
      console.log('🎭 Generating PDF via Puppeteer for protocol:', protocol.id);
      const pdfBuffer = await generateHandoverPDF(protocolData);
      
      // 3. Uloženie PDF do R2 storage
      const filename = `protocols/handover/${protocol.id}_${Date.now()}.pdf`;
      pdfUrl = await r2Storage.uploadFile(filename, pdfBuffer, 'application/pdf');
      
      console.log('✅ PDF generated and uploaded to R2:', pdfUrl);
      
      // 4. Aktualizácia protokolu s PDF URL
      await postgresDatabase.updateHandoverProtocol(protocol.id, { pdfUrl });
      
    } catch (pdfError) {
      console.error('❌ Error generating PDF, but protocol saved:', pdfError);
      // Protokol je uložený, ale PDF sa nepodarilo vytvoriť
      // Nevracáme error, len upozornenie
    }
    
    console.log('✅ Handover protocol created successfully:', protocol.id);
    res.status(201).json({ 
      message: 'Handover protocol created successfully', 
      protocol: {
        ...protocol,
        pdfUrl  // 🎯 Toto očakáva frontend!
      }
    });
  } catch (error) {
    console.error('❌ Error creating handover protocol:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create return protocol
router.post('/return', async (req, res) => {
  try {
    const protocolData: ReturnProtocol = req.body;
    console.log('📝 Creating return protocol:', protocolData.id);
    
    const protocol = await postgresDatabase.createReturnProtocol(protocolData);
    
    res.status(201).json({ 
      message: 'Return protocol created successfully', 
      protocol 
    });
  } catch (error) {
    console.error('❌ Error creating return protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get handover protocol by ID
router.get('/handover/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Fetching handover protocol:', id);
    
    const protocol = await postgresDatabase.getHandoverProtocolById(id);
    
    if (!protocol) {
      return res.status(404).json({ error: 'Handover protocol not found' });
    }
    
    res.json(protocol);
  } catch (error) {
    console.error('❌ Error fetching handover protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get return protocol by ID
router.get('/return/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Fetching return protocol:', id);
    
    const protocol = await postgresDatabase.getReturnProtocolById(id);
    
    if (!protocol) {
      return res.status(404).json({ error: 'Return protocol not found' });
    }
    
    res.json(protocol);
  } catch (error) {
    console.error('❌ Error fetching return protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update handover protocol
router.put('/handover/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log('✏️ Updating handover protocol:', id);
    
    // For now, we don't have a specific update method for handover protocols
    // This could be implemented if needed
    res.status(501).json({ error: 'Update handover protocol not implemented yet' });
    
  } catch (error) {
    console.error('❌ Error updating handover protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update return protocol
router.put('/return/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log('✏️ Updating return protocol:', id);
    
    const protocol = await postgresDatabase.updateReturnProtocol(id, updates);
    
    if (!protocol) {
      return res.status(404).json({ error: 'Return protocol not found' });
    }
    
    res.json({ 
      message: 'Return protocol updated successfully',
      protocol 
    });
  } catch (error) {
    console.error('❌ Error updating return protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete handover protocol
router.delete('/handover/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting handover protocol:', id);
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Neplatné UUID protokolu' 
      });
    }

    // TODO: Pridať autorizáciu - len admin môže mazať
    // if (!req.user?.role || req.user.role !== 'admin') {
    //   return res.status(403).json({ 
    //     success: false, 
    //     error: 'Len administrátor môže vymazať protokoly' 
    //   });
    // }

    const deleted = await postgresDatabase.deleteHandoverProtocol(id);
    
    if (deleted) {
      res.json({
        success: true,
        message: 'Protokol prevzatia úspešne vymazaný'
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Protokol prevzatia nebol nájdený' 
      });
    }
    
  } catch (error) {
    console.error('❌ Error deleting handover protocol:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Chyba pri mazaní protokolu prevzatia' 
    });
  }
});

// Delete return protocol
router.delete('/return/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting return protocol:', id);
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Neplatné UUID protokolu' 
      });
    }

    // TODO: Pridať autorizáciu - len admin môže mazať
    // if (!req.user?.role || req.user.role !== 'admin') {
    //   return res.status(403).json({ 
    //     success: false, 
    //     error: 'Len administrátor môže vymazať protokoly' 
    //   });
    // }

    const deleted = await postgresDatabase.deleteReturnProtocol(id);
    
    if (deleted) {
      res.json({
        success: true,
        message: 'Protokol vrátenia úspešne vymazaný'
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Protokol vrátenia nebol nájdený' 
      });
    }
    
  } catch (error) {
    console.error('❌ Error deleting return protocol:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Chyba pri mazaní protokolu vrátenia' 
    });
  }
});

// Upload PDF to R2
router.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    const { protocolId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }
    
    if (!protocolId) {
      return res.status(400).json({ error: 'Protocol ID is required' });
    }

    console.log('📤 Uploading PDF to R2 for protocol:', protocolId);
    
    const url = await postgresDatabase.uploadProtocolPDF(protocolId, req.file.buffer);
    
    // Update protocol with PDF URL
    await postgresDatabase.updateReturnProtocol(protocolId, { pdfUrl: url });
    
    res.json({ 
      success: true,
      url: url,
      message: 'PDF uploaded successfully'
    });
    
  } catch (error) {
    console.error('❌ Error uploading PDF:', error);
    res.status(500).json({ error: 'Failed to upload PDF' });
  }
});

// Generate PDF for handover protocol
router.get('/handover/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const { generator } = req.query; // Query parameter pre výber generátora
    
    console.log('📄 Generating PDF for handover protocol:', id);
    console.log('🎭 Generator type from query:', generator);
    
    const protocol = await postgresDatabase.getHandoverProtocolById(id);
    
    if (!protocol) {
      return res.status(404).json({ error: 'Handover protocol not found' });
    }
    
    // Dočasne nastavenie PDF_GENERATOR_TYPE pre tento request
    if (generator && ['puppeteer', 'jspdf', 'legacy'].includes(generator as string)) {
      console.log(`🔄 Switching to ${generator} generator for this request`);
      process.env.PDF_GENERATOR_TYPE = generator as string;
    }
    
    // Generovanie PDF
    const pdfBuffer = await generateHandoverPDF(protocol);
    
    // Nastavenie headers pre PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="handover_protocol_${id.slice(-8)}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Odoslanie PDF
    res.send(pdfBuffer);
    
    console.log('✅ PDF generated and sent for handover protocol:', id);
    
  } catch (error) {
    console.error('❌ Error generating PDF for handover protocol:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Generate PDF for return protocol
router.get('/return/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📄 Generating PDF for return protocol:', id);
    
    const protocol = await postgresDatabase.getReturnProtocolById(id);
    
    if (!protocol) {
      return res.status(404).json({ error: 'Return protocol not found' });
    }
    
    // Generovanie PDF
    const pdfBuffer = await generateReturnPDF(protocol);
    
    // Nastavenie headers pre PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="return_protocol_${id.slice(-8)}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Odoslanie PDF
    res.send(pdfBuffer);
    
    console.log('✅ PDF generated and sent for return protocol:', id);
    
  } catch (error) {
    console.error('❌ Error generating PDF for return protocol:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Download PDF as file
router.get('/handover/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📥 Downloading PDF for handover protocol:', id);
    
    const protocol = await postgresDatabase.getHandoverProtocolById(id);
    
    if (!protocol) {
      return res.status(404).json({ error: 'Handover protocol not found' });
    }
    
    // Generovanie PDF
    const pdfBuffer = await generateHandoverPDF(protocol);
    
    // Nastavenie headers pre PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="handover_protocol_${id.slice(-8)}_${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Odoslanie PDF
    res.send(pdfBuffer);
    
    console.log('✅ PDF downloaded for handover protocol:', id);
    
  } catch (error) {
    console.error('❌ Error downloading PDF for handover protocol:', error);
    res.status(500).json({ error: 'Failed to download PDF' });
  }
});

// Download PDF as file
router.get('/return/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📥 Downloading PDF for return protocol:', id);
    
    const protocol = await postgresDatabase.getReturnProtocolById(id);
    
    if (!protocol) {
      return res.status(404).json({ error: 'Return protocol not found' });
    }
    
    // Generovanie PDF
    const pdfBuffer = await generateReturnPDF(protocol);
    
    // Nastavenie headers pre PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="return_protocol_${id.slice(-8)}_${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Odoslanie PDF
    res.send(pdfBuffer);
    
    console.log('✅ PDF downloaded for return protocol:', id);
    
  } catch (error) {
    console.error('❌ Error downloading PDF for return protocol:', error);
    res.status(500).json({ error: 'Failed to download PDF' });
  }
});

// Fix existing protocols endpoint
router.post('/fix-existing', async (req, res) => {
  try {
    console.log('🔧 Fixing existing protocols...');
    
    const client = await postgresDatabase.getClient();
    
    try {
      // 1. Pridanie chýbajúcich stĺpcov
      await client.query(`
        ALTER TABLE handover_protocols 
        ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(500);
      `);
      
      await client.query(`
        ALTER TABLE handover_protocols 
        ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;
      `);
      
      console.log('✅ Stĺpce pridané');
      
      // 2. Aktualizácia existujúcich protokolov s pdfUrl
      const result = await client.query(`
        SELECT id, created_at FROM handover_protocols 
        WHERE pdf_url IS NULL OR pdf_url = ''
      `);
      
      console.log(`📋 Našlo sa ${result.rows.length} protokolov bez pdfUrl`);
      
      let fixedCount = 0;
      for (const row of result.rows) {
        const date = new Date(row.created_at).toISOString().split('T')[0];
        const pdfUrl = `https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev/protocols/${row.id}/${date}/protokol_prevzatie_${row.id}_${date}.pdf`;
        
        await client.query(`
          UPDATE handover_protocols 
          SET pdf_url = $1 
          WHERE id = $2
        `, [pdfUrl, row.id]);
        
        fixedCount++;
        console.log(`✅ Protokol ${row.id} opravený s pdfUrl: ${pdfUrl}`);
      }
      
      console.log('🎉 Všetky protokoly opravené!');
      
      res.json({
        success: true,
        message: `Opravené ${fixedCount} protokolov`,
        fixedCount: fixedCount
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Chyba pri oprave protokolov:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Chyba pri oprave protokolov',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


// Delete handover protocol
router.delete("/handover/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🗑️ Deleting handover protocol:", id);
    
    const deleted = await postgresDatabase.deleteHandoverProtocol(id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Handover protocol not found" });
    }
    
    console.log("✅ Handover protocol deleted:", id);
    res.json({ message: "Handover protocol deleted successfully" });
    
  } catch (error) {
    console.error("❌ Error deleting handover protocol:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete return protocol
router.delete("/return/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🗑️ Deleting return protocol:", id);
    
    const deleted = await postgresDatabase.deleteReturnProtocol(id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Return protocol not found" });
    }
    
    console.log("✅ Return protocol deleted:", id);
    res.json({ message: "Return protocol deleted successfully" });
    
  } catch (error) {
    console.error("❌ Error deleting return protocol:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 🚀 NOVÝ ENDPOINT: Pridanie fotky do protokolu v databáze
router.post('/:protocolId/add-photo', async (req, res) => {
  try {
    const { protocolId } = req.params;
    const { photo, protocolType } = req.body; // photo je objekt z /files/protocol-photo
    
    console.log('🔄 Adding photo to protocol:', protocolId, 'type:', protocolType);
    console.log('🔄 Photo data:', photo);
    
    if (!protocolId || !photo || !protocolType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Chýba protocolId, photo alebo protocolType' 
      });
    }

    if (!isValidUUID(protocolId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Neplatný protocolId format' 
      });
    }

    let updatedProtocol;
    
    if (protocolType === 'handover') {
      // Načítanie existujúceho protokolu
      const existingProtocol = await postgresDatabase.getHandoverProtocolById(protocolId);
      if (!existingProtocol) {
        return res.status(404).json({ 
          success: false, 
          error: 'Protokol nebol nájdený' 
        });
      }

      // Pridanie fotky do príslušného poľa
      const mediaType = photo.type; // 'vehicle', 'document', 'damage'
      const fieldName = `${mediaType}Images`;
      
      const updatedImages = [...(existingProtocol[fieldName] || []), photo];
      
      // Aktualizácia protokolu v databáze
      updatedProtocol = await postgresDatabase.updateHandoverProtocol(protocolId, {
        [fieldName]: updatedImages
      });
      
    } else if (protocolType === 'return') {
      // Načítanie existujúceho protokolu
      const existingProtocol = await postgresDatabase.getReturnProtocolById(protocolId);
      if (!existingProtocol) {
        return res.status(404).json({ 
          success: false, 
          error: 'Protokol nebol nájdený' 
        });
      }

      // Pridanie fotky do príslušného poľa
      const mediaType = photo.type; // 'vehicle', 'document', 'damage'
      const fieldName = `${mediaType}Images`;
      
      const updatedImages = [...(existingProtocol[fieldName] || []), photo];
      
      // Aktualizácia protokolu v databáze
      updatedProtocol = await postgresDatabase.updateReturnProtocol(protocolId, {
        [fieldName]: updatedImages
      });
      
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Neplatný protocolType (musí byť handover alebo return)' 
      });
    }

    console.log('✅ Photo added to protocol successfully');
    
    res.json({
      success: true,
      message: 'Fotka bola úspešne pridaná do protokolu',
      protocol: updatedProtocol
    });

  } catch (error) {
    console.error('❌ Error adding photo to protocol:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Chyba pri pridávaní fotky do protokolu',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// 🚀 NOVÝ ENDPOINT: Uloženie metadát po signed URL upload
router.post('/:protocolId/save-uploaded-photo', async (req, res) => {
  try {
    const { protocolId } = req.params;
    const { fileUrl, label, type, protocolType, filename, size } = req.body;
    
    console.log('🔄 Saving uploaded photo metadata:', {
      protocolId,
      fileUrl,
      label,
      type,
      protocolType
    });

    if (!protocolId || !fileUrl || !type || !protocolType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Chýbajú povinné parametre' 
      });
    }

    if (!isValidUUID(protocolId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Neplatný protocolId format' 
      });
    }

    // Vytvorenie photo objektu
    const photoObject = {
      id: require('uuid').v4(),
      url: fileUrl,
      type: type, // 'vehicle', 'document', 'damage'
      description: label || filename || 'Uploaded photo',
      timestamp: new Date(),
      compressed: false,
      originalSize: size || 0,
      compressedSize: size || 0,
      filename: filename || 'uploaded-file'
    };

    let updatedProtocol;
    
    if (protocolType === 'handover') {
      const existingProtocol = await postgresDatabase.getHandoverProtocolById(protocolId);
      if (!existingProtocol) {
        return res.status(404).json({ 
          success: false, 
          error: 'Protokol nebol nájdený' 
        });
      }

      const fieldName = `${type}Images`;
      const updatedImages = [...(existingProtocol[fieldName] || []), photoObject];
      
      updatedProtocol = await postgresDatabase.updateHandoverProtocol(protocolId, {
        [fieldName]: updatedImages
      });
      
    } else if (protocolType === 'return') {
      const existingProtocol = await postgresDatabase.getReturnProtocolById(protocolId);
      if (!existingProtocol) {
        return res.status(404).json({ 
          success: false, 
          error: 'Protokol nebol nájdený' 
        });
      }

      const fieldName = `${type}Images`;
      const updatedImages = [...(existingProtocol[fieldName] || []), photoObject];
      
      updatedProtocol = await postgresDatabase.updateReturnProtocol(protocolId, {
        [fieldName]: updatedImages
      });
      
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Neplatný protocolType' 
      });
    }

    console.log('✅ Uploaded photo metadata saved successfully');
    
    res.json({
      success: true,
      message: 'Metadáta fotky boli úspešne uložené',
      photo: photoObject,
      protocol: updatedProtocol
    });

  } catch (error) {
    console.error('❌ Error saving uploaded photo metadata:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Chyba pri ukladaní metadát',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// 🎭 TESTOVACÍ ENDPOINT: Generate PDF with test data
router.post('/handover/generate-pdf', async (req, res) => {
  try {
    const { generator } = req.query; // Query parameter pre výber generátora
    const testData = req.body; // Test data z request body
    
    console.log('🎭 Test PDF generation with data:', JSON.stringify(testData, null, 2));
    console.log('🎭 Generator type from query:', generator);
    
    // Dočasne nastavenie PDF_GENERATOR_TYPE pre tento request
    if (generator && ['puppeteer', 'jspdf', 'legacy'].includes(generator as string)) {
      console.log(`🔄 Switching to ${generator} generator for this request`);
      process.env.PDF_GENERATOR_TYPE = generator as string;
    }
    
    // Generovanie PDF s test dátami
    const pdfBuffer = await generateHandoverPDF(testData);
    
    // Nastavenie headers pre PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="test_handover_protocol_${Date.now()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Odoslanie PDF
    res.send(pdfBuffer);
    
    console.log('✅ Test PDF generated and sent');
    
  } catch (error) {
    console.error('❌ Error generating test PDF:', error);
    res.status(500).json({ error: 'Failed to generate test PDF', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// DEBUG: Endpoint pre overenie Puppeteer konfigurácie
router.get('/debug/pdf-config', (req: Request, res: Response) => {
  const config = {
    puppeteerEnabled: process.env.PDF_GENERATOR_TYPE === 'puppeteer',
    generatorType: process.env.PDF_GENERATOR_TYPE || 'enhanced',
    chromiumPath: process.env.PUPPETEER_EXECUTABLE_PATH || 'not set',
    skipDownload: process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === 'true',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    version: '2.0'
  };
  
  console.log('🔍 PDF Config Debug:', config);
  
  res.json({
    success: true,
    config
  });
});

export default router; 