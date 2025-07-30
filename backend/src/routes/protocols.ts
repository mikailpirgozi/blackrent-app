import express from 'express';
import multer from 'multer';
import { postgresDatabase } from '../models/postgres-database';
import { generateHandoverPDF, generateReturnPDF } from '../utils/pdf-generator';
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

// ⚡ BULK PROTOCOL STATUS - Get protocol status for all rentals at once
router.get('/bulk-status', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Fetching bulk protocol status for all rentals...');
    const startTime = Date.now();
    
    // Single efficient query to get protocol status for all rentals
    const protocolStatus = await postgresDatabase.getBulkProtocolStatus();
    
    const loadTime = Date.now() - startTime;
    console.log(`✅ Bulk protocol status loaded in ${loadTime}ms`);
    
    res.json({
      success: true,
      data: protocolStatus,
      metadata: {
        loadTimeMs: loadTime,
        totalRentals: protocolStatus.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error fetching bulk protocol status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Chyba pri načítaní protocol statusu' 
    });
  }
});

// PDF Proxy endpoint
router.get('/pdf/:protocolId', authenticateToken, async (req, res) => {
  try {
    const { protocolId } = req.params;
    console.log('📄 PDF proxy request for protocol:', protocolId);
    
    // Pokús sa najskôr nájsť handover protokol
    let protocol = await postgresDatabase.getHandoverProtocolById(protocolId);
    let protocolType = 'handover';
    
    // Ak nie je handover, skús return
    if (!protocol) {
      protocol = await postgresDatabase.getReturnProtocolById(protocolId);
      protocolType = 'return';
    }
    
    if (!protocol) {
      console.error('❌ Protocol not found:', protocolId);
      return res.status(404).json({ error: 'Protocol not found' });
    }
    
    let pdfBuffer: ArrayBuffer;
    
    if (!protocol.pdfUrl) {
      console.log('⚡ No PDF URL found, generating PDF on demand for protocol:', protocolId);
      
      // Generuj PDF na požiadanie
      try {
        let generatedPdfBuffer: Buffer;
        if (protocolType === 'handover') {
          generatedPdfBuffer = await generateHandoverPDF(protocol);
        } else {
          generatedPdfBuffer = await generateReturnPDF(protocol);
        }
        
        pdfBuffer = generatedPdfBuffer.buffer.slice(
          generatedPdfBuffer.byteOffset,
          generatedPdfBuffer.byteOffset + generatedPdfBuffer.byteLength
        );
        
        console.log('✅ PDF generated on demand successfully');
      } catch (error) {
        console.error('❌ Error generating PDF on demand:', error);
        return res.status(500).json({ error: 'Failed to generate PDF' });
      }
    } else {
      console.log('📄 Fetching PDF from R2:', protocol.pdfUrl);
      
      // Fetch PDF z R2
      const pdfResponse = await fetch(protocol.pdfUrl);
      
      if (!pdfResponse.ok) {
        console.error('❌ Failed to fetch PDF from R2:', pdfResponse.status);
        return res.status(404).json({ error: 'PDF file not found in storage' });
      }
      
      // Stream PDF do response
      pdfBuffer = await pdfResponse.arrayBuffer();
    }
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${protocolType}-protocol-${protocolId}.pdf"`,
      'Content-Length': pdfBuffer.byteLength.toString()
    });
    
    res.send(Buffer.from(pdfBuffer));
    console.log('✅ PDF successfully served via proxy');
    
  } catch (error) {
    console.error('❌ PDF proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create handover protocol
router.post('/handover', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Received handover protocol request');
    
    const protocolData: HandoverProtocol = req.body;
    const quickMode = req.query.mode === 'quick'; // 🚀 QUICK MODE detection
    
    console.log(`📝 Creating handover protocol${quickMode ? ' (QUICK MODE)' : ''} with data:`, JSON.stringify(protocolData, null, 2));
    
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
    
    let pdfUrl = null;
    
    if (quickMode) {
      // 🚀 QUICK MODE: Len uloženie do DB, PDF na pozadí
      console.log('⚡ QUICK MODE: Skipping immediate PDF generation');
      
      // Background PDF generation (fire and forget)
      setImmediate(async () => {
        try {
          console.log('🎭 Background: Starting PDF generation for protocol:', protocol.id);
          const pdfBuffer = await generateHandoverPDF(protocolData);
          
          // Uloženie PDF do R2 storage
          const filename = `protocols/handover/${protocol.id}_${Date.now()}.pdf`;
          const backgroundPdfUrl = await r2Storage.uploadFile(filename, pdfBuffer, 'application/pdf');
          
          // Aktualizácia protokolu s PDF URL
          await postgresDatabase.updateHandoverProtocol(protocol.id, { pdfUrl: backgroundPdfUrl });
          
          console.log('✅ Background: PDF generated and uploaded:', backgroundPdfUrl);
        } catch (pdfError) {
          console.error('❌ Background PDF generation failed:', pdfError);
          // V prípade chyby, protokol zostane bez PDF
        }
      });
      
      // Pre quick mode, vráti proxy URL hneď (aj keď PDF ešte nie je ready)
      pdfUrl = `/protocols/pdf/${protocol.id}`;
      
    } else {
      // 2. 🎭 STANDARD MODE: PDF generovanie + upload do R2 (blocking)
      try {
        console.log('🎭 Standard: Generating PDF for protocol:', protocol.id);
        const pdfBuffer = await generateHandoverPDF(protocolData);
        
        // 3. Uloženie PDF do R2 storage
        const filename = `protocols/handover/${protocol.id}_${Date.now()}.pdf`;
        pdfUrl = await r2Storage.uploadFile(filename, pdfBuffer, 'application/pdf');
        
        console.log('✅ Standard: PDF generated and uploaded to R2:', pdfUrl);
        
        // 4. Aktualizácia protokolu s PDF URL
        await postgresDatabase.updateHandoverProtocol(protocol.id, { pdfUrl });
        
      } catch (pdfError) {
        console.error('❌ Error generating PDF, but protocol saved:', pdfError);
        // Protokol je uložený, ale PDF sa nepodarilo vytvoriť
      }
    }
    
    console.log(`✅ Handover protocol created successfully${quickMode ? ' (QUICK)' : ''}:`, protocol.id);
    res.status(201).json({ 
      success: true,
      message: quickMode ? 'Odovzdávací protokol rýchlo uložený, PDF sa generuje na pozadí' : 'Odovzdávací protokol úspešne vytvorený', 
      protocol: {
        ...protocol,
        pdfUrl: quickMode ? null : pdfUrl, // V quick mode PDF URL nie je hneď dostupné 
        // 🎯 FRONTEND proxy URL namiesto priameho R2 URL (bez /api prefix)
        pdfProxyUrl: quickMode ? `/protocols/pdf/${protocol.id}` : (pdfUrl ? `/protocols/pdf/${protocol.id}` : null)
      },
      quickMode // Inform frontend about the mode
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

// Delete handover protocol
router.delete('/handover/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting handover protocol:', id);
    
    const deleted = await postgresDatabase.deleteHandoverProtocol(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Handover protocol not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Protokol úspešne vymazaný' 
    });
  } catch (error) {
    console.error('❌ Error deleting handover protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create return protocol
router.post('/return', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Received return protocol request');
    
    const protocolData: ReturnProtocol = req.body;
    console.log('📝 Creating return protocol with data:', JSON.stringify(protocolData, null, 2));
    
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
    const protocol = await postgresDatabase.createReturnProtocol(protocolData);
    console.log('✅ Return protocol created in DB:', protocol.id);
    
    // 2. 🎭 PDF generovanie + upload do R2
    let pdfUrl = null;
    try {
      console.log('🎭 Generating Return PDF for protocol:', protocol.id);
      const pdfBuffer = await generateReturnPDF(protocolData);
      
      // 3. Uloženie PDF do R2 storage
      const filename = `protocols/return/${protocol.id}_${Date.now()}.pdf`;
      pdfUrl = await r2Storage.uploadFile(filename, pdfBuffer, 'application/pdf');
      
      console.log('✅ Return PDF generated and uploaded to R2:', pdfUrl);
      
      // 4. Aktualizácia protokolu s PDF URL
      await postgresDatabase.updateReturnProtocol(protocol.id, { pdfUrl });
      
    } catch (pdfError) {
      console.error('❌ Error generating Return PDF, but protocol saved:', pdfError);
      // Protokol je uložený, ale PDF sa nepodarilo vytvoriť
    }
    
    console.log('✅ Return protocol created successfully:', protocol.id);
    res.status(201).json({ 
      success: true, 
      message: 'Preberací protokol úspešne vytvorený',
      protocol: {
        ...protocol,
        pdfUrl,
        // 🎯 FRONTEND proxy URL namiesto priameho R2 URL
        pdfProxyUrl: pdfUrl ? `/protocols/pdf/${protocol.id}` : null
      }
    });
  } catch (error) {
    console.error('❌ Error creating return protocol:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DEBUG: Endpoint pre overenie Puppeteer konfigurácie
router.get('/debug/pdf-config', (req: Request, res: Response) => {
  const config = {
    puppeteerEnabled: process.env.PDF_GENERATOR_TYPE === 'puppeteer',
    generatorType: process.env.PDF_GENERATOR_TYPE || 'enhanced',
    customFontName: process.env.CUSTOM_FONT_NAME || 'not_set',
    customFontEnabled: process.env.PDF_GENERATOR_TYPE === 'custom-font',
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

// 🧪 TEST: Endpoint pre testovanie PDF generátora bez autentifikácie
router.get('/debug/test-pdf', async (req: Request, res: Response) => {
  try {
    console.log('🧪 Test PDF generovanie začína...');
    
    // Test data pre handover protokol s Aeonik fontom (as any aby sme obišli TypeScript chyby)
    const testData: any = {
      id: 'test-debug-' + Date.now(),
      rentalId: 'test-rental-debug',
      type: 'handover',
      status: 'completed',
      createdAt: new Date(),
      completedAt: new Date(),
      customerName: 'Ján Testovací Čáčo',
      customerEmail: 'test@aeonik.sk',
      customerPhone: '+421 901 123 456',
      customerLicenseNumber: 'SK987654321',
      customerAddress: 'Testovacia 123, 010 01 Žilina',
      vehicleBrand: 'Škoda',
      vehicleModel: 'Octavia',
      vehicleYear: 2023,
      vehicleLicensePlate: 'ZA 999 XY',
      vehicleVin: 'TEST1234567890123',
      vehicleCondition: {
        odometer: 15000,
        fuelLevel: 80,
        fuelType: 'gasoline' as const,
        exteriorCondition: 'Výborný stav bez škrabancov a poškodení',
        interiorCondition: 'Čistý, voňavý interiér bez opotrebovania'
      },
      vehicleColor: 'Červená metalíza',
      rentalStartDate: new Date().toISOString(),
      rentalEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      rentalTotalPrice: 300.00,
      rentalDeposit: 400.00,
      rentalDailyRate: 45.00,
      rentalNotes: 'Test prenájom pre Aeonik font - obsahuje slovenské diakritiky: čšťžýáíéúňôľ',
      companyName: 'AutoRent Test s.r.o.',
      companyAddress: 'Hlavná 999, 811 01 Bratislava',
      companyPhone: '+421 2 999 888 777',
      companyEmail: 'test@autorent.sk',
      companyIco: '99999999',
      exteriorCondition: 'Výborný stav bez škrabancov a poškodení',
      interiorCondition: 'Čistý, voňavý interiér bez opotrebovania',
      documentsComplete: true,
      keysCount: 2,
      fuelCardIncluded: true,
      additionalEquipment: ['GPS navigácia', 'Zimné pneumatiky', 'Detská autosedačka'],
      location: 'Bratislava - testovacie centrum',
      vehicleImages: [],
      vehicleVideos: [],
      documentImages: [],
      documentVideos: [],
      damageImages: [],
      damageVideos: [],
      signatures: [],
      createdBy: 'test-system',
      damages: [
        {
          id: 'damage-1',
          description: 'Test škrabance na pravom boku',
          severity: 'low' as const,
          location: 'Pravý bok vozidla',
          images: [],
          timestamp: new Date()
        }
      ]
    };
    
    console.log('🎨 Generujem PDF s Aeonik fontom...');
    
    // Vygeneruj PDF
    const pdfBuffer = await generateHandoverPDF(testData);
    
    console.log(`✅ PDF vygenerované! Veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
    
    // Nastavenie správnych headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="aeonik-test-' + Date.now() + '.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Pošli PDF
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('❌ Chyba pri test PDF generovaní:', error);
    res.status(500).json({ 
      error: 'Test PDF generation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      generatorType: process.env.PDF_GENERATOR_TYPE,
      customFontName: process.env.CUSTOM_FONT_NAME
    });
  }
});

export default router; 