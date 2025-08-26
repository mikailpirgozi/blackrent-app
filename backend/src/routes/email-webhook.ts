import { Router, Request, Response } from 'express';
import { PostgresDatabase } from '../models/postgres-database';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const router = Router();
const postgresDatabase = new PostgresDatabase();

// =====================================================
// TYPY A INTERFACY
// =====================================================

interface ParsedEmailData {
  orderNumber?: string;
  orderDate?: string;
  paymentMethod?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  pickupPlace?: string;
  returnPlace?: string;
  reservationTime?: string;
  // Nové polia pre presné časové údaje
  handoverDate?: string; // DD.MM.YYYY HH:MM:SS
  returnDate?: string;   // DD.MM.YYYY HH:MM:SS
  handoverLocation?: string;
  deposit?: number;
  totalAmount?: number;
  vehicleName?: string;
  vehicleCode?: string;
  vehiclePrice?: number;
  dailyKilometers?: number;
  allowedKilometers?: number;
  extraKilometerRate?: number;
  fuelLevel?: number;
  returnConditions?: string;
  startOdometer?: number;
  notes?: string;
  insuranceInfo?: string;
  additionalServices?: string[];
}

interface EmailWebhookPayload {
  from: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  attachments?: any[];
  headers?: Record<string, string>;
  timestamp?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// =====================================================
// EMAIL PARSING SERVICE
// =====================================================

class EmailParsingService {
  parseEmailText(text: string): ParsedEmailData {
    const data: ParsedEmailData = {};
    
    try {
      // Parsovanie čísla objednávky
      const orderNumberMatch = text.match(/Číslo objednávky\s+([A-Z]+\d+)/i);
      if (orderNumberMatch) {
        data.orderNumber = orderNumberMatch[1];
      }

      // Parsovanie dátumu objednávky
      const orderDateMatch = text.match(/Objednávka prijatá\s+(\d{2}\.\d{2}\.\d{4})/);
      if (orderDateMatch) {
        data.orderDate = orderDateMatch[1];
      }

      // Parsovanie spôsobu úhrady
      const paymentMethodMatch = text.match(/Spôsob úhrady\s+(.+)/);
      if (paymentMethodMatch) {
        data.paymentMethod = paymentMethodMatch[1].trim();
      }

      // Parsovanie odoberateľa (zákazníka)
      const customerMatch = text.match(/Odoberateľ\s+(.+)/);
      if (customerMatch) {
        data.customerName = customerMatch[1].trim();
      }

      // Parsovanie emailu
      const emailMatch = text.match(/E-mail\s+(.+)/);
      if (emailMatch) {
        data.customerEmail = emailMatch[1].trim();
      }

      // Parsovanie telefónu
      const phoneMatch = text.match(/Telefon\s+(.+)/);
      if (phoneMatch) {
        data.customerPhone = phoneMatch[1].trim();
      }

      // Parsovanie kontaktnej adresy
      const addressMatch = text.match(/Kontaktná adresa\s+(.+)/);
      if (addressMatch) {
        data.customerAddress = addressMatch[1].trim();
      }

      // Parsovanie miesta vyzdvihnutia
      const pickupMatch = text.match(/Miesto vyzdvihnutia\s+(.+)/);
      if (pickupMatch) {
        data.pickupPlace = pickupMatch[1].trim();
      }

      // Parsovanie miesta odovzdania
      const returnMatch = text.match(/Miesto odovzdania\s+(.+)/);
      if (returnMatch) {
        data.returnPlace = returnMatch[1].trim();
      }

      // Parsovanie času rezervácie (komplex formát) - IDENTICKÉ s emailParsingUtils.ts
      const reservationMatch = text.match(/Čas rezervacie\s+(.+)/);
      if (reservationMatch) {
        const timeStr = reservationMatch[1].trim();
        data.reservationTime = timeStr; // Zachovaj pôvodné pole pre kompatibilitu
        
        // Pattern: "DD.MM.YYYY HH:MM:SS - DD.MM.YYYY HH:MM:SS"
        const dateRangePattern = /(\d{1,2}\.\d{1,2}\.\d{4})\s+(\d{1,2}:\d{2}:\d{2})\s*-\s*(\d{1,2}\.\d{1,2}\.\d{4})\s+(\d{1,2}:\d{2}:\d{2})/;
        const dateRangeMatch = timeStr.match(dateRangePattern);
        
        if (dateRangeMatch) {
          data.handoverDate = `${dateRangeMatch[1]} ${dateRangeMatch[2]}`;
          data.returnDate = `${dateRangeMatch[3]} ${dateRangeMatch[4]}`;
        } else {
          // Alternatívny pattern: "YYYY-MM-DD HH:MM:SS - YYYY-MM-DD HH:MM:SS"
          const isoDateRangePattern = /(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/;
          const isoDateRangeMatch = timeStr.match(isoDateRangePattern);
          
          if (isoDateRangeMatch) {
            data.handoverDate = `${isoDateRangeMatch[1]} ${isoDateRangeMatch[2]}`;
            data.returnDate = `${isoDateRangeMatch[3]} ${isoDateRangeMatch[4]}`;
          }
        }
      }

      // Parsovanie depozitu
      const depositMatch = text.match(/Depozit\s+([\d\s,]+)\s*€/);
      if (depositMatch) {
        const depositStr = depositMatch[1].replace(/\s/g, '').replace(',', '.');
        data.deposit = parseFloat(depositStr);
      }

      // Parsovanie sumy k úhrade
      const totalMatch = text.match(/Suma k úhrade\s+([\d\s,]+)\s*€/);
      if (totalMatch) {
        const totalStr = totalMatch[1].replace(/\s/g, '').replace(',', '.');
        data.totalAmount = parseFloat(totalStr);
      }

      // Parsovanie vozidla z položiek objednávky
      const vehicleMatch = text.match(/Položky objednávky\s*\n\s*Názov\s+Kód\s+Cena\s+Spolu\s*\n([^\n]+)/);
      if (vehicleMatch) {
        const vehicleLine = vehicleMatch[1].trim();
        logger.info('🔍 Parsing vehicle line:', vehicleLine);
        
        const parts = vehicleLine.split(/\s+/).filter(part => part.trim());
        
        // Nájdi ŠPZ (6-7 znakov, len písmená a čísla)
        const spzIndex = parts.findIndex(part => /^[A-Z0-9]{6,7}$/.test(part.trim()));
        
        if (spzIndex > 0) {
          data.vehicleName = parts.slice(0, spzIndex).join(' ');
          data.vehicleCode = parts[spzIndex];
          
          if (parts.length > spzIndex + 2) {
            const priceStr = parts[spzIndex + 1].replace(',', '.').replace('€', '').trim();
            data.vehiclePrice = parseFloat(priceStr);
          }
        }
      }

      // Parsovanie kilometrov - VŠETKY sa považujú za denné km
      const specificKmMatch = text.match(/Počet povolených km\s+(\d+)\s*km/i);
      if (specificKmMatch) {
        data.dailyKilometers = parseInt(specificKmMatch[1]);
      } else {
        // Fallback patterny
        const generalKmMatch = text.match(/Povolené\s+km[:\s]+(\d+)/i) || 
                              text.match(/Kilometrov[:\s]+(\d+)/i) ||
                              text.match(/Limit\s+km[:\s]+(\d+)/i) ||
                              text.match(/(\d+)\s*km/i);
        if (generalKmMatch) {
          data.dailyKilometers = parseInt(generalKmMatch[1]);
        }
      }

      // Parsovanie ceny za extra km
      const extraKmMatch = text.match(/Cena\s+za\s+km[:\s]+([\d,]+)\s*€/i) ||
                          text.match(/Extra\s+km[:\s]+([\d,]+)\s*€/i) ||
                          text.match(/Nadlimitn[ý]\s+km[:\s]+([\d,]+)\s*€/i);
      if (extraKmMatch) {
        const extraKmStr = extraKmMatch[1].replace(',', '.');
        data.extraKilometerRate = parseFloat(extraKmStr);
      }

      // Parsovanie úrovne paliva
      const fuelMatch = text.match(/Palivo[:\s]+(\d+)%/i) ||
                       text.match(/Fuel[:\s]+(\d+)%/i) ||
                       text.match(/Nádrž[:\s]+(\d+)%/i);
      if (fuelMatch) {
        data.fuelLevel = parseInt(fuelMatch[1]);
      }

      logger.info('📧 Parsed email data:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Email parsing error:', error);
      throw new Error('Chyba pri parsovaní emailu');
    }
  }

  // Spam filter logika
  isSpamEmail(from: string, subject: string, body: string): boolean {
    const spamKeywords = [
      'spam', 'viagra', 'casino', 'lottery', 'winner', 'congratulations',
      'click here', 'free money', 'urgent', 'nigerian prince'
    ];
    
    const suspiciousDomains = [
      'suspicious-domain.com',
      'spam-source.net'
    ];
    
    // Kontrola domény
    const emailDomain = from.split('@')[1]?.toLowerCase();
    if (emailDomain && suspiciousDomains.includes(emailDomain)) {
      return true;
    }
    
    // Kontrola kľúčových slov
    const content = (subject + ' ' + body).toLowerCase();
    const foundSpamWords = spamKeywords.filter(keyword => 
      content.includes(keyword.toLowerCase())
    );
    
    if (foundSpamWords.length > 0) {
      logger.info('🚫 Spam detected, keywords found:', foundSpamWords);
      return true;
    }
    
    // Kontrola či obsahuje základné polia prenájmu
    if (!body.includes('Číslo objednávky') && 
        !body.includes('Odoberateľ') && 
        !body.includes('vozidlo')) {
      logger.info('🚫 Spam detected: missing essential rental fields');
      return true;
    }
    
    return false;
  }
}

// =====================================================
// WEBHOOK ENDPOINTS
// =====================================================

const emailParsingService = new EmailParsingService();

// GET /api/email-webhook/test - Test endpoint pre debugging
router.get('/test', async (req: Request, res: Response<ApiResponse>) => {
  try {
    logger.info('🧪 Test endpoint called');
    
    // Test 1: Základný response
    const testResult = {
      message: 'Email webhook test endpoint',
      timestamp: new Date().toISOString(),
      databaseConnected: false,
      vehiclesCount: 0,
      customersCount: 0
    };
    
    // Test 2: Database connection
    try {
      const testQuery = await postgresDatabase.query('SELECT NOW() as current_time');
      testResult.databaseConnected = true;
      logger.info('✅ Database connection OK');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
    }
    
    // Test 3: Get vehicles count (where the error likely happens)
    try {
      const vehicles = await postgresDatabase.getVehicles();
      testResult.vehiclesCount = vehicles.length;
      logger.info('✅ Got vehicles count:', vehicles.length);
    } catch (vehicleError) {
      console.error('❌ Vehicle query failed:', vehicleError);
    }
    
    // Test 4: Get customers count
    try {
      const customers = await postgresDatabase.getCustomers();
      testResult.customersCount = customers.length;
      logger.info('✅ Got customers count:', customers.length);
    } catch (customerError) {
      console.error('❌ Customer query failed:', customerError);
    }
    
    res.json({
      success: true,
      data: testResult
    });
    
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Test endpoint failed'
    });
  }
});

// POST /api/email-webhook/debug - Postupný debug webhook endpoint  
router.post('/debug', async (req: Request, res: Response<ApiResponse>) => {
  try {
    logger.info('🔧 DEBUG WEBHOOK: Starting step-by-step test');
    
    const result = {
      step1_received: false,
      step2_validation: false,
      step3_spam_check: false,
      step4_parsing: false,
      step5_vehicle_lookup: false,
      step6_customer_lookup: false,
      step7_rental_creation: false,
      error: null as string | null,
      parsedData: null as ParsedEmailData | null
    };
    
    // Step 1: Request received
    logger.info('🔍 STEP 1: Request received');
    result.step1_received = true;
    
    // Step 2: Validation
    logger.info('🔍 STEP 2: Validating payload...');
    const payload: EmailWebhookPayload = req.body;
    if (!payload.from || !payload.subject || !payload.body) {
      result.error = 'Missing required fields';
      return res.status(400).json({ success: false, data: result });
    }
    result.step2_validation = true;
    
    // Step 3: Spam check
    logger.info('🔍 STEP 3: Spam check...');
    const isSpam = emailParsingService.isSpamEmail(payload.from, payload.subject, payload.body);
    if (isSpam) {
      result.step3_spam_check = false;
      result.error = 'Marked as spam';
      return res.json({ success: true, data: result });
    }
    result.step3_spam_check = true;
    
    // Step 4: Email parsing
    logger.info('🔍 STEP 4: Email parsing...');
    let parsedData: ParsedEmailData;
    try {
      parsedData = emailParsingService.parseEmailText(payload.body);
      result.step4_parsing = true;
      result.parsedData = parsedData;
      logger.info('✅ STEP 4: Parsed data:', parsedData);
    } catch (parseError) {
      result.error = `Parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`;
      return res.status(422).json({ success: false, data: result });
    }
    
    // Step 5: Vehicle lookup
    logger.info('🔍 STEP 5: Vehicle lookup...');
    let vehicleId = '';
    if (parsedData.vehicleCode) {
      try {
        const vehicles = await postgresDatabase.getVehicles();
        const vehicle = vehicles.find(v => 
          v.licensePlate?.toUpperCase().replace(/\s/g, '') === 
          parsedData.vehicleCode?.toUpperCase().replace(/\s/g, '')
        );
        if (vehicle) {
          vehicleId = vehicle.id;
        }
        result.step5_vehicle_lookup = true;
        logger.info('✅ STEP 5: Vehicle lookup completed, found:', !!vehicle);
      } catch (vehicleError) {
        result.error = `Vehicle lookup failed: ${vehicleError instanceof Error ? vehicleError.message : 'Unknown error'}`;
        return res.status(500).json({ success: false, data: result });
      }
    } else {
      result.step5_vehicle_lookup = true; // No vehicle code to lookup
    }
    
    // Step 6: Customer lookup
    logger.info('🔍 STEP 6: Customer lookup...');
    let customerId = '';
    if (parsedData.customerName) {
      try {
        const customers = await postgresDatabase.getCustomers();
        const customer = customers.find(c => 
          c.name?.toLowerCase() === parsedData.customerName?.toLowerCase() ||
          c.email === parsedData.customerEmail
        );
        if (customer) {
          customerId = customer.id;
        }
        result.step6_customer_lookup = true;
        logger.info('✅ STEP 6: Customer lookup completed, found:', !!customer);
      } catch (customerError) {
        result.error = `Customer lookup failed: ${customerError instanceof Error ? customerError.message : 'Unknown error'}`;
        return res.status(500).json({ success: false, data: result });
      }
    } else {
      result.step6_customer_lookup = true; // No customer to lookup
    }
    
    // STOP HERE - don't create rental yet, just return success
    logger.info('✅ DEBUG WEBHOOK: All steps completed successfully');
    
    return res.json({
      success: true,
      data: {
        ...result,
        vehicleId,
        customerId,
        message: 'Debug webhook completed all steps successfully'
      }
    });
    
  } catch (error) {
    console.error('❌ DEBUG WEBHOOK error:', error);
    res.status(500).json({
      success: false,
      error: 'Debug webhook failed'
    });
  }
});

// POST /api/email-webhook/webhook - Hlavný webhook endpoint pre príjem emailov
router.post('/webhook', async (req: Request, res: Response<ApiResponse>) => {
  try {
    logger.info('📧 Email webhook received:', {
      from: req.body.from,
      subject: req.body.subject,
      bodyLength: req.body.body?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    logger.info('🔍 DEBUG: Full request body:', JSON.stringify(req.body, null, 2));

    const payload: EmailWebhookPayload = req.body;
    
    // Validácia payload
    if (!payload.from || !payload.subject || !payload.body) {
      return res.status(400).json({
        success: false,
        error: 'Chýbajúce povinné polia: from, subject, body'
      });
    }

    // Spam filter
    logger.info('🔍 DEBUG: Checking spam filter...');
    if (emailParsingService.isSpamEmail(payload.from, payload.subject, payload.body)) {
      logger.info('🚫 Email marked as spam and ignored');
      
      // Log spam attempt
      logger.info('🚫 SPAM FILTERED:', {
        from: payload.from,
        subject: payload.subject,
        reason: 'spam_filter'
      });
      
      return res.json({
        success: true,
        data: { status: 'spam_filtered' }
      });
    }

    // Parse email content
    logger.info('🔍 DEBUG: Starting email parsing...');
    let parsedData: ParsedEmailData;
    try {
      parsedData = emailParsingService.parseEmailText(payload.body);
      logger.info('✅ DEBUG: Email parsed successfully:', parsedData);
    } catch (parseError) {
      console.error('❌ Email parsing failed:', parseError);
      
      // Log parsing failure
      logger.info('❌ PARSE FAILED:', {
        from: payload.from,
        subject: payload.subject,
        error: parseError instanceof Error ? parseError.message : 'Unknown error'
      });
      
      return res.status(422).json({
        success: false,
        error: 'Nepodarilo sa spracovať obsah emailu'
      });
    }

    // Nájdi vozidlo podľa ŠPZ
    logger.info('🔍 DEBUG: Looking for vehicle with code:', parsedData.vehicleCode);
    let vehicleId = '';
    if (parsedData.vehicleCode) {
      try {
        const vehicles = await postgresDatabase.getVehicles();
        logger.info('✅ DEBUG: Got vehicles from database, count:', vehicles.length);
        const vehicle = vehicles.find(v => 
          v.licensePlate?.toUpperCase().replace(/\s/g, '') === 
          parsedData.vehicleCode?.toUpperCase().replace(/\s/g, '')
        );
        if (vehicle) {
          vehicleId = vehicle.id;
          logger.info('✅ DEBUG: Vehicle found:', vehicle.id);
        } else {
          logger.info('⚠️ Vehicle not found:', parsedData.vehicleCode);
        }
      } catch (vehicleError) {
        console.error('❌ Error getting vehicles:', vehicleError);
        // Pokračujeme bez vehicle ID
      }
    }

    // Vytvor alebo nájdi zákazníka
    let customerId = '';
    if (parsedData.customerName) {
      const customers = await postgresDatabase.getCustomers();
      let customer = customers.find(c => 
        c.name?.toLowerCase() === parsedData.customerName?.toLowerCase() ||
        c.email === parsedData.customerEmail
      );

      if (!customer && parsedData.customerName) {
        // Vytvor nového zákazníka - rozdeľ meno na first_name a last_name
        const nameParts = parsedData.customerName.split(' ');
        const firstName = nameParts[0] || 'Neznámy';
        const lastName = nameParts.slice(1).join(' ') || 'Zákazník';
        
        customer = {
          id: uuidv4(),
          name: parsedData.customerName,
          firstName: firstName,
          lastName: lastName,
          email: parsedData.customerEmail || '',
          phone: parsedData.customerPhone || '',
          createdAt: new Date(),
        };
        await postgresDatabase.createCustomer(customer);
        logger.info('✅ New customer created:', customer.name);
      }
      
      if (customer) {
        customerId = customer.id;
      }
    }

    // Parsovanie dátumov z rezervačného času
    let startDate = new Date();
    let endDate = new Date();
    
    // Preferuj handoverDate a returnDate ak sú dostupné (z emailParsingUtils.ts)
    if (parsedData.handoverDate && parsedData.returnDate) {
      try {
        // Formát: "DD.MM.YYYY HH:MM:SS" - interpretuj ako slovenský čas (Europe/Bratislava)
        const parseDate = (dateStr: string) => {
          const [datePart, timePart] = dateStr.split(' ');
          const [day, month, year] = datePart.split('.');
          // Vytvor dátum explicitne v slovenskom timezone
          // Pridaj +01:00 pre CET alebo +02:00 pre CEST
          const now = new Date();
          const isWinter = now.getMonth() < 2 || now.getMonth() > 9; // Zjednodušené DST
          const timezone = isWinter ? '+01:00' : '+02:00';
          return new Date(`${year}-${month}-${day}T${timePart}${timezone}`);
        };
        
        startDate = parseDate(parsedData.handoverDate);
        endDate = parseDate(parsedData.returnDate);
        
        logger.info('✅ Parsed dates from handoverDate/returnDate:', {
          handoverDate: parsedData.handoverDate,
          returnDate: parsedData.returnDate,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      } catch (error) {
        console.error('❌ Error parsing handoverDate/returnDate:', error);
      }
    } else if (parsedData.reservationTime) {
      // Fallback na starý formát
      const timeMatch = parsedData.reservationTime.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) - (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
      if (timeMatch) {
        startDate = new Date(timeMatch[1]);
        endDate = new Date(timeMatch[2]);
        logger.info('✅ Parsed dates from reservationTime (legacy):', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      }
    }
    
    // Fallback ak sa nepodarilo parsovať žiadne dátumy
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      logger.info('⚠️ Using fallback dates (tomorrow + 3 days)');
      startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(10, 0, 0, 0); // 10:00 ráno
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 3);
      endDate.setHours(18, 0, 0, 0); // 18:00 večer
    }

    // Vytvor pending rental
    const rentalData = {
      vehicleId: vehicleId || '',
      customerId,
      customerName: parsedData.customerName || 'Neznámy zákazník',
      startDate,
      endDate,
      totalPrice: parsedData.totalAmount || 0,
      commission: 0, // Bude prepočítané neskôr
      paymentMethod: parsedData.paymentMethod?.toLowerCase().includes('bank') ? 'bank_transfer' : 'cash',
      handoverPlace: parsedData.pickupPlace || '',
      orderNumber: parsedData.orderNumber || '',
      deposit: parsedData.deposit || 0,
      dailyKilometers: parsedData.dailyKilometers || 0,
      allowedKilometers: parsedData.allowedKilometers || 0,
      extraKilometerRate: parsedData.extraKilometerRate || 0,
      fuelLevel: parsedData.fuelLevel || 100,
      returnConditions: parsedData.returnConditions || '',
      // Nové polia pre automatické spracovanie
      sourceType: 'email_auto' as const,
      approvalStatus: 'pending' as const,
      emailContent: payload.body,
      autoProcessedAt: new Date(),
    };

    const createdRental = await postgresDatabase.createRental(rentalData);
    
    // Log successful processing
    logger.info('✅ RENTAL PROCESSED:', {
      rentalId: createdRental.id,
      from: payload.from,
      subject: payload.subject,
      orderNumber: parsedData.orderNumber,
      customerName: parsedData.customerName,
      vehicleCode: parsedData.vehicleCode,
      vehicleFound: !!vehicleId
    });

    logger.info('✅ Automatic rental created:', {
      id: createdRental.id,
      orderNumber: parsedData.orderNumber,
      customer: parsedData.customerName,
      vehicle: parsedData.vehicleCode
    });

    // TODO: Pošli notifikáciu adminom (implementujeme v ďalšom kroku)
    
    res.json({
      success: true,
      data: {
        status: 'processed',
        rentalId: createdRental.id,
        orderNumber: parsedData.orderNumber,
        customerName: parsedData.customerName,
        vehicleCode: parsedData.vehicleCode,
        vehicleFound: !!vehicleId
      }
    });

  } catch (error) {
    console.error('❌ Email webhook error - DETAILED:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      fullError: error
    });
    
    // Log system error
    logger.info('❌ SYSTEM ERROR:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      from: req.body?.from || 'unknown',
      subject: req.body?.subject || 'unknown'
    });
    
    res.status(500).json({
      success: false,
      error: 'Chyba pri spracovaní emailu'
    });
  }
});

// GET /api/email-webhook/pending - Zoznam pending automatických prenájmov
router.get('/pending', 
  authenticateToken,
  checkPermission('rentals', 'read'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const result = await postgresDatabase.query(`
        SELECT * FROM rentals 
        WHERE auto_processed_at IS NOT NULL 
        AND approval_status = 'pending'
        ORDER BY auto_processed_at DESC
      `);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Get pending rentals error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní čakajúcich prenájmov'
      });
    }
  }
);

// POST /api/email-webhook/approve/:id - Schváliť pending rental
router.post('/approve/:id',
  authenticateToken,
  checkPermission('rentals', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      // Schváliť rental - presun do hlavnej tabuľky s active status
      await postgresDatabase.query(`
        UPDATE rentals 
        SET 
          approval_status = 'approved',
          status = 'active',
          approved_by = $2,
          approved_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND approval_status = 'pending'
      `, [id, userId]);
      
      // Log approval
      logger.info('✅ RENTAL APPROVED:', {
        rentalId: id,
        approvedBy: userId
      });
      
      res.json({
        success: true,
        data: { status: 'approved' }
      });
    } catch (error) {
      console.error('Approve rental error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri schvaľovaní prenájmu'
      });
    }
  }
);

// POST /api/email-webhook/reject/:id - Zamietnuť pending rental
router.post('/reject/:id',
  authenticateToken,
  checkPermission('rentals', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;
      
      // Získaj order_number pred zmazaním
      const rentalData = await postgresDatabase.query(`
        SELECT order_number, customer_name 
        FROM rentals 
        WHERE id = $1 AND approval_status = 'pending'
      `, [id]);
      
      if (rentalData.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Prenájom nenájdený alebo už nie je pending'
        });
      }
      
      const { order_number, customer_name } = rentalData.rows[0];
      
      // 🚫 BLACKLIST: Pridaj do blacklistu aby sa už nikdy nevytvorila automaticky
      if (order_number) {
        try {
          await postgresDatabase.query(`
            INSERT INTO email_blacklist (order_number, reason, notes, created_by) 
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (order_number) DO NOTHING
          `, [order_number, 'rejected', reason || 'Zamietnuté používateľom', userId]);
          
          logger.info(`🚫 BLACKLIST: ${order_number} pridaný do blacklistu`);
        } catch (blacklistError) {
          console.error('❌ Chyba pri pridávaní do blacklistu:', blacklistError);
        }
      }
      
      // Zamietnuť rental - ZMAZAŤ z databázy
      const deleteResult = await postgresDatabase.query(`
        DELETE FROM rentals 
        WHERE id = $1 AND approval_status = 'pending'
        RETURNING id
      `, [id]);
      
      // Log rejection
      logger.info('❌ RENTAL REJECTED & BLACKLISTED:', {
        rentalId: id,
        orderNumber: order_number,
        customerName: customer_name,
        rejectedBy: userId,
        reason: reason,
        blacklisted: true
      });
      
      res.json({
        success: true,
        data: { status: 'rejected' }
      });
    } catch (error) {
      console.error('Reject rental error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri zamietaní prenájmu'
      });
    }
  }
);

// PUT /api/email-webhook/rentals/:id - Upraviť pending rental
router.put('/rentals/:id',
  authenticateToken,
  checkPermission('rentals', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Build dynamic SET clause
      const setFields = [];
      const values = [];
      let paramIndex = 1;
      
      const allowedFields = [
        'customer_name', 'customer_email', 'customer_phone',
        'vehicle_id', 'vehicle_name', 'vehicle_code',
        'start_date', 'end_date', 'total_price', 'deposit',
        'handover_place', 'daily_kilometers', 'payment_method', 'notes'
      ];
      
      // Convert camelCase to snake_case and build query
      for (const [key, value] of Object.entries(updates)) {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (allowedFields.includes(snakeKey)) {
          setFields.push(`${snakeKey} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }
      
      if (setFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Žiadne platné polia na aktualizáciu'
        });
      }
      
      // Add updated_at
      setFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);
      
      const query = `
        UPDATE rentals 
        SET ${setFields.join(', ')}
        WHERE id = $${paramIndex} AND approval_status = 'pending'
        RETURNING *
      `;
      
      const result = await postgresDatabase.query(query, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Prenájom nenájdený alebo už nie je pending'
        });
      }
      
      logger.info('✅ Rental updated:', id);
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Update pending rental error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri aktualizácii prenájmu'
      });
    }
  }
);

// GET /api/email-webhook/stats - Štatistiky automatického spracovania
router.get('/stats',
  authenticateToken,
  checkPermission('rentals', 'read'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const statsResult = await postgresDatabase.query(`
        SELECT * FROM automatic_rentals_stats
      `);
      
  
      const logResult = { rows: [] };
      
      res.json({
        success: true,
        data: {
          stats: statsResult.rows,
          recentLog: logResult.rows
        }
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní štatistík'
      });
    }
  }
);

// 🚫 BLACKLIST: Zablokuj objednávku aby sa už nikdy nevytvorila z emailu
router.post('/blacklist/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { reason = 'rejected', notes = '' } = req.body;

    logger.info(`🚫 BLACKLIST: Blokujem objednávku ${orderNumber}`);

    // Pridaj do blacklistu
    await postgresDatabase.query(`
      INSERT INTO email_blacklist (order_number, reason, notes, created_by) 
      VALUES ($1, $2, $3, 'system')
      ON CONFLICT (order_number) DO NOTHING
    `, [orderNumber, reason, notes]);

    // Zmaž z čakajúcich prenájmov ak existuje
    const deleteResult = await postgresDatabase.query(`
      DELETE FROM rentals 
      WHERE order_number = $1 AND approval_status = 'pending'
      RETURNING id
    `, [orderNumber]);

    const deletedCount = deleteResult.rows.length;

    logger.info(`✅ BLACKLIST: ${orderNumber} zablokovaný, zmazaných ${deletedCount} pending záznamov`);

    res.json({
      success: true,
      data: {
        orderNumber,
        reason,
        deletedPendingRentals: deletedCount,
        message: 'Objednávka je permanentne zablokovaná'
      }
    });

  } catch (error) {
    console.error('❌ BLACKLIST chyba:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri blokovaní objednávky'
    });
  }
});

export default router;