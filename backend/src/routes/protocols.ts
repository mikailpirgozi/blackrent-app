import express from 'express';
import multer from 'multer';
import { postgresDatabase } from '../models/postgres-database';
import { generateHandoverPDF } from '../utils/pdf-generator';
import { authenticateToken } from '../middleware/auth';
import { r2Storage } from '../utils/r2-storage';
import { HandoverProtocol, ReturnProtocol } from '../types';
import { Request, Response } from 'express';

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

// 🎯 PDF PROXY ENDPOINT - Obídenie CORS problému
router.get('/pdf/:protocolId', async (req, res) => {
  try {
    const { protocolId } = req.params;
    console.log('📄 PDF proxy request for protocol:', protocolId);
    
    // Načítanie protokolu z databázy
    const protocol = await postgresDatabase.getHandoverProtocolById(protocolId);
    
    if (!protocol || !protocol.pdfUrl) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // 🔄 Stiahnutie PDF z R2 a forward do frontendu
    const response = await fetch(protocol.pdfUrl);
    
    if (!response.ok) {
      throw new Error(`R2 fetch failed: ${response.status}`);
    }

    const pdfBuffer = await response.arrayBuffer();
    
    // Nastavenie headers pre PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="protocol_${protocolId}.pdf"`);
    res.setHeader('Access-Control-Allow-Origin', '*'); // 🎯 CORS fix
    res.setHeader('Content-Length', pdfBuffer.byteLength);
    
    // Odoslanie PDF
    res.send(Buffer.from(pdfBuffer));
    
    console.log('✅ PDF proxy successful:', protocolId);
    
  } catch (error) {
    console.error('❌ PDF proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch PDF' });
  }
});

// Create handover protocol
router.post('/handover', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Received handover protocol request');
    
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
    
    // 2. 🎭 PDF generovanie + upload do R2
    let pdfUrl = null;
    try {
      console.log('🎭 Generating PDF for protocol:', protocol.id);
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
    }
    
    console.log('✅ Handover protocol created successfully:', protocol.id);
    res.status(201).json({ 
      message: 'Handover protocol created successfully', 
      protocol: {
        ...protocol,
        pdfUrl,
        // 🎯 FRONTEND proxy URL namiesto priameho R2 URL (bez /api prefix)
        pdfProxyUrl: pdfUrl ? `/protocols/pdf/${protocol.id}` : null
      }
    });
  } catch (error) {
    console.error('❌ Error creating handover protocol:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
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