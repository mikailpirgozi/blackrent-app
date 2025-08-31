import type { Request, Response } from 'express';
import express from 'express';
import multer from 'multer';
import { postgresDatabase } from '../models/postgres-database';
import { generateHandoverPDF, generateReturnPDF } from '../utils/pdf-generator';
import { authenticateToken } from '../middleware/auth';
import { r2Storage } from '../utils/r2-storage';
import type { HandoverProtocol, ReturnProtocol } from '../types';
import { r2OrganizationManager, type PathVariables } from '../config/r2-organization';
import { emailService } from '../services/email-service';
import { getWebSocketService } from '../services/websocket-service';

const router = express.Router();

// UUID validation function
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// 🗂️ Helper: Generate meaningful PDF filename with R2 organization
const generatePDFPath = (protocolData: any, protocolId: string, protocolType: 'handover' | 'return'): string => {
  try {
    const { rentalData } = protocolData;
    
    // Extract info from rental data
    const vehicle = rentalData?.vehicle || {};
    const customer = rentalData?.customer || {};
    const startDate = rentalData?.startDate ? new Date(rentalData.startDate) : new Date();
    
    // Generate date components
    const dateComponents = r2OrganizationManager.generateDateComponents(startDate);
    
    // Generate company name (from vehicle or default)
    const companyName = r2OrganizationManager.getCompanyName(
      vehicle.company || rentalData?.vehicle?.ownerCompanyId || 'BlackRent'
    );
    
    // Generate vehicle name
    const vehicleName = r2OrganizationManager.generateVehicleName(
      vehicle.brand || 'Unknown',
      vehicle.model || 'Unknown',
      vehicle.licensePlate || 'NoPlate'
    );
    
    // Generate meaningful PDF filename
    const customerName = customer.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Customer';
    const dateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const protocolTypeText = protocolType === 'handover' ? 'Odovzdavaci' : 'Preberaci';
    
    const meaningfulFilename = `${protocolTypeText}_${customerName}_${vehicle.brand || 'Auto'}_${vehicle.licensePlate || 'NoPlate'}_${dateStr}.pdf`;
    
    // Generate organized path using R2OrganizationManager
    const pathVariables: PathVariables = {
      year: dateComponents.year,
      month: dateComponents.month,
      company: companyName,
      vehicle: vehicleName,
      protocolType: protocolType,
      protocolId: protocolId,
      category: 'pdf',
      filename: meaningfulFilename
    };
    
    const organizedPath = r2OrganizationManager.generatePath(pathVariables);
    
    console.log('🗂️ Generated organized PDF path:', {
      oldPath: `protocols/${protocolType}/${protocolId}_${Date.now()}.pdf`,
      newPath: organizedPath,
      meaningfulFilename,
      pathVariables
    });
    
    return organizedPath;
    
  } catch (error) {
    console.error('❌ Error generating PDF path, using fallback:', error);
    // Fallback to old structure if something fails
    return `protocols/${protocolType}/${protocolId}_${Date.now()}.pdf`;
  }
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

// 📊 EMPLOYEE STATISTICS: Get all protocols for statistics
router.get('/all-for-stats', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Fetching all protocols for employee statistics...');
    const startTime = Date.now();
    
    // Get all protocols with employee information
    const protocols = await postgresDatabase.getAllProtocolsForStats();
    
    const loadTime = Date.now() - startTime;
    console.log(`✅ All protocols loaded for statistics in ${loadTime}ms`);
    
    res.json({
      success: true,
      data: protocols,
      metadata: {
        loadTimeMs: loadTime,
        totalProtocols: protocols.length,
        handoverCount: protocols.filter(p => p.type === 'handover').length,
        returnCount: protocols.filter(p => p.type === 'return').length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error fetching protocols for statistics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Chyba pri načítaní protokolov pre štatistiky' 
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
    const quickMode = req.query.mode === 'quick' || protocolData.quickMode === true;
    
    // Validácia povinných polí
    if (!protocolData.rentalId) {
      console.error('❌ Missing rental ID');
      return res.status(400).json({ error: 'Rental ID is required' });
    }
    
    // Rental ID validácia
    if (!protocolData.rentalId || (isNaN(Number(protocolData.rentalId)) && !isValidUUID(protocolData.rentalId))) {
      console.error('❌ Invalid rental ID format:', protocolData.rentalId);
      return res.status(400).json({ error: 'Invalid rental ID format. Must be valid integer or UUID.' });
    }
    
    // 1. Uloženie protokolu do databázy
    const originalRentalData = protocolData.rentalData;
    const protocol = await postgresDatabase.createHandoverProtocol(protocolData);
    console.log('✅ Handover protocol created in DB:', protocol.id);
    
    let pdfUrl: string | null = null;
    let emailResult = {
      sent: false,
      error: null as string | null,
      timestamp: null as string | null,
      recipient: protocolData.rentalData?.customer?.email || null
    };
    
    if (quickMode) {
      // Quick mode - PDF a email na pozadí
      console.log('⚡ QUICK MODE: Background processing...');
      
      setImmediate(async () => {
        try {
          // Generate PDF
          const protocolWithData = { ...protocol, ...protocolData };
          const pdfBuffer = await generateHandoverPDF(protocolWithData);
          const filename = generatePDFPath(protocolData, protocol.id, 'handover');
          const backgroundPdfUrl = await r2Storage.uploadFile(filename, pdfBuffer, 'application/pdf');
          
          await postgresDatabase.updateHandoverProtocol(protocol.id, { pdfUrl: backgroundPdfUrl });
          
          // Send email
          if (protocolData.rentalData?.customer?.email) {
            try {
              const emailSent = await emailService.sendHandoverProtocolEmail(
                protocolData.rentalData.customer,
                pdfBuffer,
                protocolData
              );
              
              if (emailSent) {
                await postgresDatabase.updateHandoverProtocol(protocol.id, { 
                  emailSent: true 
                });
                console.log('✅ Background email sent to', protocolData.rentalData.customer.email);
              }
            } catch (emailError) {
              console.error('❌ Background email failed:', emailError);
            }
          }
        } catch (error) {
          console.error('❌ Background processing failed:', error);
        }
      });
      
      pdfUrl = `/protocols/pdf/${protocol.id}`;
      
    } else {
      // Standard mode - synchronous processing
      try {
        // Generate and upload PDF
        const protocolWithData = { ...protocol, ...protocolData };
        const pdfBuffer = await generateHandoverPDF(protocolWithData);
        const filename = generatePDFPath(protocolData, protocol.id, 'handover');
        pdfUrl = await r2Storage.uploadFile(filename, pdfBuffer, 'application/pdf');
        
        await postgresDatabase.updateHandoverProtocol(protocol.id, { pdfUrl });
        
        // Send email
        if (originalRentalData?.customer?.email) {
          try {
            const emailSent = await emailService.sendHandoverProtocolEmail(
              originalRentalData.customer,
              pdfBuffer,
              protocolData
            );
            
            if (emailSent) {
              await postgresDatabase.updateHandoverProtocol(protocol.id, { 
                emailSent: true,
                pdfEmailUrl: pdfUrl
              });
              
              emailResult = {
                sent: true,
                error: null,
                timestamp: new Date().toISOString(),
                recipient: originalRentalData.customer.email
              };
              console.log('✅ Email sent successfully to', originalRentalData.customer.email);
            }
          } catch (emailError) {
            emailResult.error = emailError instanceof Error ? emailError.message : 'Unknown error';
            console.error('❌ Email sending failed:', emailError);
          }
        }
      } catch (error) {
        console.error('❌ Error in standard processing:', error);
      }
    }
    
    // WebSocket notification
    const websocketService = getWebSocketService();
    if (websocketService && protocolData.rentalId) {
      try {
        const userName = (req as any).user?.username || 'Neznámy užívateľ';
        websocketService.broadcastProtocolCreated(
          protocolData.rentalId, 
          'handover', 
          protocol.id, 
          userName
        );
      } catch (error) {
        console.error('❌ WebSocket broadcast failed:', error);
      }
    }

    res.status(201).json({ 
      success: true,
      message: quickMode ? 'Protokol uložený, PDF a email sa spracúvajú na pozadí' : 'Protokol úspešne vytvorený',
      protocol: {
        ...protocol,
        pdfUrl: quickMode ? null : pdfUrl,
        pdfProxyUrl: quickMode ? `/protocols/pdf/${protocol.id}` : (pdfUrl ? `/protocols/pdf/${protocol.id}` : null)
      },
      email: emailResult,
      quickMode
    });
  } catch (error) {
    console.error('❌ Error creating handover protocol:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create return protocol
router.post('/return', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Received return protocol request');
    
    const protocolData: ReturnProtocol = req.body;
    
    // Validácia povinných polí
    if (!protocolData.rentalId) {
      console.error('❌ Missing rental ID');
      return res.status(400).json({ error: 'Rental ID is required' });
    }
    
    // Rental ID validácia
    if (!protocolData.rentalId || (isNaN(Number(protocolData.rentalId)) && !isValidUUID(protocolData.rentalId))) {
      console.error('❌ Invalid rental ID format:', protocolData.rentalId);
      return res.status(400).json({ error: 'Invalid rental ID format. Must be valid integer or UUID.' });
    }
    
    // Create protocol
    const protocol = await postgresDatabase.createReturnProtocol(protocolData);
    console.log('✅ Return protocol created in DB:', protocol.id);
    
    // 🚗 AUTOMATIC UPDATE: Aktualizuj prenájom s doplatkom za km
    if (protocolData.kilometerFee && protocolData.kilometerFee > 0) {
      try {
        console.log('🔄 Updating rental with extra km charge:', {
          rentalId: protocolData.rentalId,
          kilometerFee: protocolData.kilometerFee,
          totalExtraFees: protocolData.totalExtraFees
        });
        
        // Načítaj aktuálny prenájom
        const currentRental = await postgresDatabase.getRental(protocolData.rentalId);
        if (currentRental) {
          // Vypočítaj novú celkovú cenu
          const newTotalPrice = currentRental.totalPrice + protocolData.kilometerFee;
          
          // Prepočítaj províziu z novej celkovej ceny
          let newCommission = currentRental.commission || 0;
          if (currentRental.vehicle && currentRental.vehicle.commission) {
            const commissionConfig = currentRental.vehicle.commission;
            if (commissionConfig.type === 'percentage') {
              newCommission = (newTotalPrice * commissionConfig.value) / 100;
            } else {
              newCommission = commissionConfig.value; // Fixed commission stays same
            }
          }
          
          // Aktualizuj prenájom s doplatkom za km a novou províziou
          const updatedRental: any = {
            ...currentRental,
            extraKmCharge: protocolData.kilometerFee,
            totalPrice: newTotalPrice,
            commission: newCommission,
            status: 'finished'
          };
          
          await postgresDatabase.updateRental(updatedRental);
          console.log('✅ Rental updated with extra km charge and recalculated commission:', {
            rentalId: updatedRental.id,
            extraKmCharge: protocolData.kilometerFee,
            oldTotalPrice: currentRental.totalPrice,
            newTotalPrice: newTotalPrice,
            oldCommission: currentRental.commission,
            newCommission: newCommission
          });
        }
      } catch (error) {
        console.error('❌ Error updating rental with extra km charge:', error);
        // Pokračuj aj keď sa nepodarí aktualizovať prenájom
      }
    }
    
    let pdfUrl = null;
    let emailResult = {
      sent: false,
      error: null as string | null,
      timestamp: null as string | null,
      recipient: protocolData.rentalData?.customer?.email || null
    };
    
    try {
      // Generate and upload PDF
      const pdfBuffer = await generateReturnPDF(protocolData);
      const filename = generatePDFPath(protocolData, protocol.id, 'return');
      pdfUrl = await r2Storage.uploadFile(filename, pdfBuffer, 'application/pdf');
      
      await postgresDatabase.updateReturnProtocol(protocol.id, { pdfUrl });
      
      // Send email
      if (protocolData.rentalData?.customer?.email) {
        try {
          const emailSent = await emailService.sendReturnProtocolEmail(
            protocolData.rentalData.customer,
            pdfBuffer,
            protocolData
          );
          
          if (emailSent) {
            await postgresDatabase.updateReturnProtocol(protocol.id, { 
              emailSent: true, 
              emailSentAt: new Date() 
            });
            
            emailResult = {
              sent: true,
              error: null,
              timestamp: new Date().toISOString(),
              recipient: protocolData.rentalData.customer.email
            };
          }
        } catch (emailError) {
          emailResult.error = emailError instanceof Error ? emailError.message : 'Unknown error';
          console.error('❌ Return: Email sending failed:', emailError);
        }
      }
    } catch (error) {
      console.error('❌ Error processing return protocol:', error);
    }
    
    // WebSocket notification
    const websocketService = getWebSocketService();
    if (websocketService && protocolData.rentalId) {
      try {
        const userName = (req as any).user?.username || 'Neznámy užívateľ';
        websocketService.broadcastProtocolCreated(
          protocolData.rentalId, 
          'return', 
          protocol.id, 
          userName
        );
      } catch (error) {
        console.error('❌ WebSocket broadcast failed:', error);
      }
    }

    res.status(201).json({ 
      success: true,
      message: 'Preberací protokol úspešne vytvorený',
      protocol: {
        ...protocol,
        pdfUrl,
        pdfProxyUrl: pdfUrl ? `/protocols/pdf/${protocol.id}` : null
      },
      email: emailResult
    });
  } catch (error) {
    console.error('❌ Error creating return protocol:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


// Debug endpoints
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

router.get('/debug/test-email', async (req: Request, res: Response) => {
  try {
    console.log('📧 Test email connection starting...');
    
    const connectionTest = await emailService.testConnection();
    
    if (connectionTest) {
      res.json({
        success: true,
        message: 'Email service connection successful',
        config: {
          host: process.env.SMTP_HOST || 'smtp.m1.websupport.sk',
          port: process.env.SMTP_PORT || '465',
          secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT || '465') === 465,
          user: process.env.SMTP_USER || 'info@blackrent.sk',
          enabled: process.env.EMAIL_SEND_PROTOCOLS === 'true'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Email service connection failed',
        message: 'Check SMTP credentials and configuration'
      });
    }
  } catch (error) {
    console.error('❌ Email test error:', error);
    res.status(500).json({
      success: false,
      error: 'Email test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/debug/send-test-protocol', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email address is required' 
      });
    }
    
    console.log('📧 TEST: Sending test protocol to:', email);
    
    const testCustomer = {
      id: 'test-customer-123',
      name: 'Test Customer',
      email: email,
      phone: '+421 901 123 456',
      createdAt: new Date()
    };
    
    const testProtocolData = {
      id: 'test-protocol-' + Date.now(),
      rentalId: 'test-rental-123',
      type: 'handover' as const,
      status: 'completed' as const,
      location: 'Bratislava - Test',
      createdAt: new Date(),
      completedAt: new Date(),
      vehicleCondition: {
        odometer: 50000,
        fuelLevel: 100,
        fuelType: 'gasoline' as const,
        exteriorCondition: 'Výborný',
        interiorCondition: 'Výborný',
        notes: 'Test protokol'
      },
      vehicleImages: [],
      vehicleVideos: [],
      documentImages: [],
      documentVideos: [],
      damageImages: [],
      damageVideos: [],
      damages: [],
      signatures: [
        {
          id: 'test-sig-1',
          signature: 'data:image/png;base64,test',
          signerName: 'Test Customer',
          signerRole: 'customer' as const,
          timestamp: new Date(),
          location: 'Bratislava'
        }
      ],
      rentalData: {
        orderNumber: 'TEST-' + Date.now(),
        customer: testCustomer,
        vehicle: {
          id: 'test-vehicle-123',
          brand: 'BMW',
          model: 'X5',
          licensePlate: 'TEST123',
          company: 'BlackRent Test'
        },
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        totalPrice: 350,
        deposit: 500,
        currency: 'EUR',
        allowedKilometers: 1000,
        extraKilometerRate: 0.5,
        pickupLocation: 'Bratislava - Test'
      },
      pdfUrl: '',
      emailSent: false,
      notes: 'Test protokol',
      createdBy: 'admin'
    };
    
    const pdfBuffer = await generateHandoverPDF(testProtocolData as any);
    console.log('✅ TEST: PDF generated, size:', (pdfBuffer.length / 1024).toFixed(1), 'KB');
    
    const emailSent = await emailService.sendTestProtocolEmail(
      testCustomer,
      pdfBuffer,
      testProtocolData as any
    );
    
    if (emailSent) {
      console.log('✅ TEST: Email sent successfully to:', email);
      res.json({
        success: true,
        message: `Test protocol email sent successfully to ${email}`,
        data: {
          recipient: email,
          protocolId: testProtocolData.id,
          pdfSize: `${(pdfBuffer.length / 1024).toFixed(1)} KB`,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send test email'
      });
    }
    
  } catch (error) {
    console.error('❌ TEST: Error sending test protocol:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;