import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { postgresDatabase } from '../models/postgres-database';

interface EmailData {
  from: string;
  subject: string;
  text: string;
  html: string;
  date: Date;
  messageId: string;
}

interface ParsedRentalData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleName: string;
  vehicleCode: string;
  vehicleId?: string; // NOVÉ: ID vozidla z databázy
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  deposit: number;
  paymentMethod: string;
  handoverPlace: string;
  dailyKilometers: number;
}

class ImapEmailService {
  private imap: Imap | null = null;
  private isConnected = false;
  private processingEmails = false;
  private isEnabled = false;

  constructor() {
    // Kontrola či je IMAP povolené
    this.isEnabled = process.env.IMAP_ENABLED !== 'false' && !!process.env.IMAP_PASSWORD;
    
    if (!this.isEnabled) {
      console.log('📧 IMAP: Služba je vypnutá (IMAP_ENABLED=false alebo chýba IMAP_PASSWORD)');
      return;
    }

    this.imap = new Imap({
      user: process.env.IMAP_USER || 'info@blackrent.sk',
      password: process.env.IMAP_PASSWORD || '',
      host: process.env.IMAP_HOST || 'imap.m1.websupport.sk',
      port: parseInt(process.env.IMAP_PORT || '993'),
      tls: true,
      tlsOptions: { 
        rejectUnauthorized: false,
        servername: 'imap.m1.websupport.sk'
      },
      keepalive: true,
      connTimeout: 60000,
      authTimeout: 30000,
      autotls: 'always',
      // Plain text authentication is handled by default
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.imap) return;
    
    this.imap.once('ready', () => {
      console.log('📧 IMAP: Pripojenie úspešné');
      this.isConnected = true;
    });

    this.imap.once('error', (err: Error) => {
      console.error('❌ IMAP Error:', err);
      this.isConnected = false;
    });

    this.imap.once('end', () => {
      console.log('📧 IMAP: Pripojenie ukončené');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isEnabled || !this.imap) {
      throw new Error('IMAP služba je vypnutá');
    }
    
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve();
        return;
      }

      this.imap!.once('ready', () => resolve());
      this.imap!.once('error', reject);
      
      console.log('📧 IMAP: Pripájam sa na server...');
      this.imap!.connect();
    });
  }

  async disconnect(): Promise<void> {
    if (this.isConnected && this.imap) {
      this.imap.end();
    }
  }

  async checkForNewEmails(): Promise<void> {
    if (!this.isEnabled) {
      console.log('📧 IMAP: Služba je vypnutá, preskakujem kontrolu emailov');
      return;
    }
    
    if (this.processingEmails) {
      console.log('⏳ IMAP: Už spracúvam emaily, preskakujem...');
      return;
    }

    try {
      this.processingEmails = true;
      await this.connect();
      
      console.log('📬 IMAP: Kontrolujem nové emaily...');
      
      await this.processInbox();
    } catch (error) {
      console.error('❌ IMAP: Chyba pri kontrole emailov:', error);
    } finally {
      this.processingEmails = false;
    }
  }

  private async processInbox(): Promise<void> {
    if (!this.imap) {
      throw new Error('IMAP nie je inicializovaný');
    }
    
    return new Promise((resolve, reject) => {
      this.imap!.openBox('INBOX', false, (err: any, box: any) => {
        if (err) {
          reject(err);
          return;
        }

        // Najprv hľadaj od objednavky@blackrent.sk
        this.imap!.search(['UNSEEN', ['FROM', 'objednavky@blackrent.sk']], (err: any, results: any) => {
          if (err) {
            reject(err);
            return;
          }

          // Ak nenájdeme od objednavky@, skúsime všetky nové emaily
          if (!results || results.length === 0) {
            console.log('📭 IMAP: Žiadne nové objednávky od objednavky@blackrent.sk, skúšam všetky nové emaily...');
            
            // Skúsime všetky nové emaily
            this.imap!.search(['UNSEEN'], (err2: any, unseenResults: any) => {
              if (err2) {
                reject(err2);
                return;
              }
              
              if (unseenResults && unseenResults.length > 0) {
                console.log(`📧 IMAP: Našiel som ${unseenResults.length} nových emailov (všetky adresy)`);
                this.processFetchedEmails(unseenResults, resolve, reject);
                return;
              }
              
              // ✅ OPRAVENÉ: Ak nie sú UNSEEN emaily, KONČÍME (nehľadáme staré)
              console.log('📭 IMAP: Žiadne nové emaily, končím (nehľadám staré emaily)');
              resolve();
            });
            return;
          }

          console.log(`📧 IMAP: Našiel som ${results.length} nových emailov`);
          this.processFetchedEmails(results, resolve, reject);
        });
      });
    });
  }

  private processFetchedEmails(results: any[], resolve: Function, reject: Function): void {
    const fetch = this.imap!.fetch(results, { 
      bodies: '',
      markSeen: false // Neoznačuj ako prečítané hneď
    });

    let processed = 0;
    const total = results.length;

    fetch.on('message', (msg: any, seqno: number) => {
      this.processMessage(msg, seqno)
        .then(() => {
          processed++;
          if (processed === total) {
            resolve();
          }
        })
        .catch((error) => {
          console.error(`❌ IMAP: Chyba pri spracovaní emailu ${seqno}:`, error);
          processed++;
          if (processed === total) {
            resolve();
          }
        });
    });

    fetch.once('error', reject);
  }

  private async processMessage(msg: any, seqno: number): Promise<void> {
    return new Promise((resolve, reject) => {
      let buffer = '';

      msg.on('body', (stream: any) => {
        stream.on('data', (chunk: any) => {
          buffer += chunk.toString('utf8');
        });
      });

      msg.once('end', async () => {
        try {
          const parsed = await simpleParser(buffer);
          const emailData: EmailData = {
            from: parsed.from?.text || '',
            subject: parsed.subject || '',
            text: parsed.text || '',
            html: parsed.html?.toString() || '',
            date: parsed.date || new Date(),
            messageId: parsed.messageId || `${seqno}-${Date.now()}`
          };

          console.log(`📧 IMAP: Spracúvam email: "${emailData.subject}" od: ${emailData.from}`);
          console.log(`📄 EMAIL OBSAH DEBUG:`);
          console.log(`- Text dĺžka: ${emailData.text.length}`);
          console.log(`- HTML dĺžka: ${emailData.html.length}`);
          console.log(`- Text preview:`, emailData.text.substring(0, 200));
          console.log(`- HTML preview:`, emailData.html.substring(0, 200));
          
          // Skontroluj prílohy
          if (parsed.attachments && parsed.attachments.length > 0) {
            console.log(`📎 EMAIL PRÍLOHY: ${parsed.attachments.length}`);
            parsed.attachments.forEach((att: any, index: number) => {
              console.log(`📎 Príloha ${index + 1}: ${att.filename} (${att.contentType})`);
            });
          }
          
          // Ak nie je od objednavky@blackrent.sk, stále ho spracujeme ale s upozornením
          if (!emailData.from.includes('objednavky@blackrent.sk')) {
            console.log(`⚠️ IMAP: Email nie je od objednavky@blackrent.sk (je od: ${emailData.from}), ale pokúsim sa ho spracovať...`);
          }

          // Parsuj obsah emailu
          const rentalData = await this.parseEmailContent(emailData);
          
          if (rentalData) {
            // Vytvor pending rental
            await this.createPendingRental(rentalData, emailData);
            
            // Označ email ako prečítaný
            this.imap!.addFlags(seqno, ['\\Seen'], (err: any) => {
              if (err) {
                console.error('❌ IMAP: Nepodarilo sa označiť email ako prečítaný:', err);
              } else {
                console.log(`✅ IMAP: Email ${seqno} označený ako spracovaný`);
              }
            });
          } else {
            console.log('⚠️ IMAP: Nepodarilo sa parsovať obsah emailu');
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  // 🎯 NOVÝ: Používa zdieľanú parsing logiku z frontend EmailParser
  private async parseEmailContent(emailData: EmailData): Promise<ParsedRentalData | null> {
    try {
      // Import zdieľanej parsing funkcie z frontend
      const { parseEmailText, convertToRentalData } = require('../../../src/utils/emailParsingUtils');
      
      // Získaj text obsah s fallback na HTML
      let content = emailData.text?.trim();
      
      if ((!content || content.length === 0) && emailData.html) {
        // Extrahuj text z HTML - odstráň HTML značky (rovnaký ako v EmailParser)
        content = emailData.html
          .replace(/<style[^>]*>.*?<\/style>/gis, '') // Odstráň CSS
          .replace(/<script[^>]*>.*?<\/script>/gis, '') // Odstráň JS
          .replace(/<br\s*\/?>/gi, '\n') // <br> → nový riadok
          .replace(/<\/?(div|p|tr|td|th)[^>]*>/gi, '\n') // Bloky → nový riadok
          .replace(/<[^>]+>/g, ' ') // Ostatné tagy → medzera
          .replace(/&nbsp;/g, ' ') // &nbsp; → medzera
          .replace(/&amp;/g, '&') // HTML entity
          .replace(/&lt;/g, '<') // HTML entity
          .replace(/&gt;/g, '>') // HTML entity
          .replace(/&quot;/g, '"') // HTML entity
          .replace(/&#39;/g, "'") // HTML entity
          .replace(/\s+/g, ' ') // Viacnásobné medzery → jedna
          .trim();
        console.log('🔄 FRONTEND PARSING: Extrahujem text z HTML emailu');
      }
      
      if (!content) {
        console.log('❌ FRONTEND PARSING: Žiadny obsah na spracovanie');
        return null;
      }
      
      console.log('🎯 FRONTEND PARSING: Používam EmailParser logiku z frontend...');
      console.log('📧 EMAIL TEXT pre parsing:', content.substring(0, 300) + '...');
      
      // 🎯 POUŽIŤ ZDIEĽANÚ PARSING LOGIKU Z FRONTEND (identická s manuálnym parsovaním)
      const parsedData = parseEmailText(content);
      console.log('📊 PARSED DATA (frontend EmailParser logic):', parsedData);
      
      // Konvertuj na backend formát
      const rentalData = convertToRentalData(parsedData);
      console.log('🔄 CONVERTED to backend rental format:', rentalData);
      
      // Validácia povinných údajov
      if (!rentalData.orderNumber || !rentalData.customerName) {
        console.log('⚠️ FRONTEND PARSING: Chýbajú povinné údaje (objednávka alebo meno)');
        console.log('- Číslo objednávky:', rentalData.orderNumber || 'CHÝBA');
        console.log('- Meno zákazníka:', rentalData.customerName || 'CHÝBA');
        return null;
      }
      
      // AUTOMATICKÉ NAPÁROVANIE VOZIDLA PODĽA SPZ (ako v manuálnom parsovaní)
      if (rentalData.vehicleCode) {
        const vehicleData = await this.findVehicleByCode(rentalData.vehicleCode);
        if (vehicleData) {
          rentalData.vehicleName = vehicleData.name;
          rentalData.vehicleId = vehicleData.id;
          console.log(`🚗 AUTO-NAPÁROVANIE: ${rentalData.vehicleCode} → ${vehicleData.name} (ID: ${vehicleData.id})`);
        }
      }
      
      // Finálny formát pre databázu (identický s manuálnym)
      const finalRentalData: ParsedRentalData = {
        orderNumber: rentalData.orderNumber,
        customerName: rentalData.customerName,
        customerEmail: rentalData.customerEmail || '',
        customerPhone: rentalData.customerPhone || '',
        vehicleName: rentalData.vehicleName || '',
        vehicleCode: rentalData.vehicleCode || '',
        vehicleId: rentalData.vehicleId || undefined,
        startDate: rentalData.startDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: rentalData.endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        totalPrice: rentalData.totalPrice || 0,
        deposit: rentalData.deposit || 0,
        paymentMethod: rentalData.paymentMethod || 'Prevod',
        handoverPlace: rentalData.handoverPlace || '',
        dailyKilometers: rentalData.dailyKilometers || 0,
      };

      console.log('✅ FRONTEND PARSING: Úspešne parsované údaje s EmailParser logikou!');
      console.log('🎯 FINÁLNE PARSING RESULTS (identické s manuálnym):');
      console.log('- Order Number:', finalRentalData.orderNumber);
      console.log('- Customer:', finalRentalData.customerName);  
      console.log('- Email:', finalRentalData.customerEmail);
      console.log('- Phone:', finalRentalData.customerPhone);
      console.log('- Vehicle:', finalRentalData.vehicleName);
      console.log('- SPZ:', finalRentalData.vehicleCode);
      console.log('- Vehicle ID:', finalRentalData.vehicleId);
      console.log('- Price:', finalRentalData.totalPrice);
      console.log('- Daily KM:', finalRentalData.dailyKilometers);
      console.log('- Payment:', finalRentalData.paymentMethod);
      console.log('- Place:', finalRentalData.handoverPlace);
      console.log('- Dates:', finalRentalData.startDate, '→', finalRentalData.endDate);
      console.log('- Deposit:', finalRentalData.deposit);
      
      return finalRentalData;


    } catch (error) {
      console.error('❌ PARSING: Chyba pri parsovaní emailu:', error);
      return null;
    }
  }

  // NOVÉ: Vyhľadá vozidlo v databáze podľa SPZ/kódu
  private async findVehicleByCode(vehicleCode: string): Promise<{id: string, name: string} | null> {
    try {
      console.log(`🔍 HĽADÁM VOZIDLO: ${vehicleCode}`);
      
      const result = await postgresDatabase.query(`
        SELECT id, COALESCE(model, brand, 'Unknown') as name, license_plate
        FROM vehicles 
        WHERE UPPER(license_plate) = UPPER($1) 
           OR UPPER(COALESCE(model, brand, '')) LIKE UPPER('%' || $1 || '%')
        LIMIT 1
      `, [vehicleCode.trim()]);
      
      if (result.rows.length > 0) {
        const vehicle = result.rows[0];
        console.log(`✅ VOZIDLO NÁJDENÉ: ${vehicleCode} → ${vehicle.name} (${vehicle.id})`);
        return { id: vehicle.id, name: vehicle.name };
      } else {
        console.log(`❌ VOZIDLO NENÁJDENÉ: ${vehicleCode}`);
        return null;
      }
    } catch (error) {
      console.log(`❌ CHYBA pri hľadaní vozidla ${vehicleCode}:`, error);
      return null;
    }
  }

  private async createPendingRental(rentalData: ParsedRentalData, emailData: EmailData): Promise<void> {
    try {
      // 🚫 KONTROLA BLACKLISTU - ZABLOKOVANÉ OBJEDNÁVKY
      const blacklistCheck = await postgresDatabase.query(
        'SELECT id, reason FROM email_blacklist WHERE order_number = $1',
        [rentalData.orderNumber]
      );

      if (blacklistCheck.rows.length > 0) {
        const reason = blacklistCheck.rows[0].reason;
        console.log(`🚫 BLACKLIST: Objednávka ${rentalData.orderNumber} je zablokovaná (${reason}), preskakujem`);
        return;
      }

      // Overíme či objednávka už neexistuje
      const existingRental = await postgresDatabase.query(
        'SELECT id FROM rentals WHERE order_number = $1',
        [rentalData.orderNumber]
      );

      if (existingRental.rows.length > 0) {
        console.log(`⚠️ DB: Objednávka ${rentalData.orderNumber} už existuje, preskakujem`);
        return;
      }

      // Parsovanie mena na firstName a lastName
      const nameParts = rentalData.customerName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || firstName;

      // Vytvor pending rental
      const result = await postgresDatabase.query(`
        INSERT INTO rentals (
          order_number, customer_name, customer_email, customer_phone,
          vehicle_name, vehicle_code, vehicle_id, start_date, end_date, total_price,
          deposit, handover_place, daily_kilometers, approval_status, status,
          payment_method, commission, auto_processed_at, email_content, 
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending', 'pending',
          $14, 0.00, CURRENT_TIMESTAMP, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id
      `, [
        rentalData.orderNumber,
        rentalData.customerName,
        rentalData.customerEmail,
        rentalData.customerPhone,
        rentalData.vehicleName,
        rentalData.vehicleCode,
        rentalData.vehicleId || null, // NOVÉ: vehicle_id pre automatické napárovanie
        rentalData.startDate,
        rentalData.endDate,
        rentalData.totalPrice,
        rentalData.deposit,
        rentalData.handoverPlace,
        rentalData.dailyKilometers,
        rentalData.paymentMethod || 'Prevod',
        JSON.stringify({
          subject: emailData.subject,
          from: emailData.from,
          text: emailData.text,
          receivedAt: emailData.date
        })
      ]);

      console.log(`✅ DB: Vytvorený pending rental ${rentalData.orderNumber} (ID: ${result.rows[0].id})`);

      // Log do konzoly (TODO: implement audit table later)
      console.log('📊 AUTO-PROCESSING:', {
        rentalId: result.rows[0].id,
        orderNumber: rentalData.orderNumber,
        customerName: rentalData.customerName,
        processedAt: new Date().toISOString(),
        source: 'IMAP'
      });

    } catch (error) {
      console.error('❌ DB: Chyba pri vytváraní pending rental:', error);
      throw error;
    }
  }

  // Verejná metóda pre manuálne spustenie
  async startMonitoring(intervalMinutes: number = 0.5): Promise<void> {
    if (!this.isEnabled) {
      console.log('📧 IMAP: Služba je vypnutá, monitoring sa nespustí');
      throw new Error('IMAP služba je vypnutá');
    }
    
    console.log(`🚀 IMAP: Spúšťam monitoring emailov (interval: ${intervalMinutes} min)`);
    
    // Prvá kontrola hneď
    await this.checkForNewEmails();
    
    // Nastavenie intervalu
    setInterval(async () => {
      await this.checkForNewEmails();
    }, intervalMinutes * 60 * 1000);
  }

  // Test pripojenia
  async testConnection(): Promise<boolean> {
    if (!this.isEnabled) {
      console.log('📧 IMAP: Služba je vypnutá, test pripojenia preskočený');
      return false;
    }
    
    try {
      await this.connect();
      console.log('✅ IMAP: Test pripojenia úspešný');
      await this.disconnect();
      return true;
    } catch (error) {
      console.error('❌ IMAP: Test pripojenia neúspešný:', error);
      return false;
    }
  }

}

export default ImapEmailService;