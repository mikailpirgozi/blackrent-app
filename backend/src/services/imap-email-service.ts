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
  startDate: Date;
  endDate: Date;
  totalPrice: number;
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

        // Hľadaj nové (neprečítané) emaily od objednavky@blackrent.sk
        this.imap!.search(['UNSEEN', ['FROM', 'objednavky@blackrent.sk']], (err: any, results: any) => {
          if (err) {
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            console.log('📭 IMAP: Žiadne nové objednávky');
            resolve();
            return;
          }

          console.log(`📧 IMAP: Našiel som ${results.length} nových emailov`);
          
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
        });
      });
    });
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

          console.log(`📧 IMAP: Spracúvam email: ${emailData.subject}`);
          
          // Overíme či je to skutočne od objednavky@blackrent.sk
          if (!emailData.from.includes('objednavky@blackrent.sk')) {
            console.log('⚠️ IMAP: Email nie je od objednavky@blackrent.sk, preskakujem');
            resolve();
            return;
          }

          // Parsuj obsah emailu
          const rentalData = this.parseEmailContent(emailData);
          
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

  private parseEmailContent(emailData: EmailData): ParsedRentalData | null {
    try {
      const content = emailData.text || emailData.html;
      console.log('🔍 PARSING: Obsah emailu na parsovanie:', content.substring(0, 500) + '...');
      
      // Rozšírené parsing pre rôzne formáty emailov
      const orderNumberMatch = content.match(/(?:číslo objednávky|order number|objednávka)\s*:?\s*([A-Z0-9]+)/i);
      
      // Rozšírené hľadanie mena - "Odbetaraťeľ", "Meno", "Name", "Zákazník"
      const nameMatch = content.match(/(?:odbetaraťeľ|meno|name|zákazník|customer)\s*:?\s*([^,\n\r]+)/i);
      
      // Email parsing
      const emailMatch = content.match(/(?:e-mail|email)\s*:?\s*([^\s,\n\r]+@[^\s,\n\r]+)/i);
      
      // Telefón parsing
      const phoneMatch = content.match(/(?:telefón|phone|tel)\s*:?\s*([+\d\s-()]+)/i);
      
      // Vozidlo parsing - hľadáme v tabuľke alebo v texte
      const vehicleMatch = content.match(/(?:vozidlo|vehicle|auto)\s*:?\s*([^,\n\r]+)/i) || 
                           content.match(/([A-Za-z0-9\s]+(?:BMW|Mercedes|Audi|Porsche|Škoda|VW|Ford|Opel)[A-Za-z0-9\s]*)/i);
      
      // SPZ/Kód vozidla
      const licenseMatch = content.match(/(?:spz|license|registration|kód)\s*:?\s*([A-Z0-9\s-]+)/i);
      
      // Dátumy - rozšírené formáty
      let startDateMatch = content.match(/(?:od|from|začiatok)\s*:?\s*(\d{1,2}[.-\/]\d{1,2}[.-\/]\d{2,4})/i);
      let endDateMatch = content.match(/(?:do|to|koniec)\s*:?\s*(\d{1,2}[.-\/]\d{1,2}[.-\/]\d{2,4})/i);
      
      // Ak nenájdeme tradičné formáty, hľadáme "čas rezervácie" formát
      if (!startDateMatch || !endDateMatch) {
        const reservationTimeMatch = content.match(/(?:čas rezervácie|reservation time)\s*:?\s*(\d{4}-\d{2}-\d{2})\s+\d{2}:\d{2}:\d{2}\s*-\s*(\d{4}-\d{2}-\d{2})\s+\d{2}:\d{2}:\d{2}/i);
        if (reservationTimeMatch) {
          startDateMatch = [reservationTimeMatch[0], reservationTimeMatch[1]];
          endDateMatch = [reservationTimeMatch[0], reservationTimeMatch[2]];
        }
      }
      
      // Cena - rozšírené hľadanie
      const priceMatch = content.match(/(?:suma k úhrade|cena|price|suma|total)\s*:?\s*([0-9,.]+ ?€?)/i);
      
      // Miesto parsing
      const placeMatch = content.match(/(?:miesto vyzdvihnutia|miesto odovzdania|miesto|location|adresa)\s*:?\s*([^,\n\r]+)/i);
      
      // KM limit
      const kmMatch = content.match(/(?:počet povolených km|km|kilometer)\s*:?\s*(\d+)/i);

      console.log('🔍 PARSING výsledky:');
      console.log('- Číslo objednávky:', orderNumberMatch?.[1]);
      console.log('- Meno:', nameMatch?.[1]);
      console.log('- Email:', emailMatch?.[1]);
      console.log('- Telefón:', phoneMatch?.[1]);
      console.log('- Vozidlo:', vehicleMatch?.[1]);
      console.log('- Dátum od:', startDateMatch?.[1]);
      console.log('- Dátum do:', endDateMatch?.[1]);
      console.log('- Cena:', priceMatch?.[1]);

      // Validácia povinných polí
      if (!orderNumberMatch || !nameMatch || !startDateMatch || !endDateMatch) {
        console.log('⚠️ PARSING: Chýbajú povinné údaje v emaili');
        console.log('- Číslo objednávky nájdené:', !!orderNumberMatch);
        console.log('- Meno nájdené:', !!nameMatch);
        console.log('- Dátum od nájdený:', !!startDateMatch);
        console.log('- Dátum do nájdený:', !!endDateMatch);
        return null;
      }

      // Parsovanie dátumov - podporuje viacero formátov
      const parseDate = (dateStr: string): Date => {
        console.log('📅 PARSING DATE:', dateStr);
        
        // YYYY-MM-DD formát (z nového emailu)
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return new Date(dateStr);
        }
        
        // DD/MM/YYYY alebo DD.MM.YYYY formát (starý formát)
        if (dateStr.match(/^\d{1,2}[.\/\-]\d{1,2}[.\/\-]\d{2,4}$/)) {
          const cleanDate = dateStr.replace(/[.-]/g, '/');
          return new Date(cleanDate);
        }
        
        // Fallback - skús základný new Date()
        return new Date(dateStr);
      };

      const rentalData: ParsedRentalData = {
        orderNumber: orderNumberMatch[1].trim(),
        customerName: nameMatch[1].trim(),
        customerEmail: emailMatch ? emailMatch[1].trim() : '',
        customerPhone: phoneMatch ? phoneMatch[1].trim() : '',
        vehicleName: vehicleMatch ? vehicleMatch[1].trim() : '',
        vehicleCode: licenseMatch ? licenseMatch[1].trim() : '',
        startDate: parseDate(startDateMatch[1]),
        endDate: parseDate(endDateMatch[1]),
        totalPrice: priceMatch ? parseFloat(priceMatch[1].replace(/[€,\s]/g, '')) : 0,
        handoverPlace: placeMatch ? placeMatch[1].trim() : '',
        dailyKilometers: kmMatch ? parseInt(kmMatch[1]) : 0,
      };

      console.log('✅ PARSING: Úspešne parsované údaje:', rentalData.orderNumber);
      return rentalData;

    } catch (error) {
      console.error('❌ PARSING: Chyba pri parsovaní emailu:', error);
      return null;
    }
  }

  private async createPendingRental(rentalData: ParsedRentalData, emailData: EmailData): Promise<void> {
    try {
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
          vehicle_name, vehicle_code, start_date, end_date, total_price,
          handover_place, daily_kilometers, approval_status, status,
          auto_processed_at, email_content, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', 'pending',
          CURRENT_TIMESTAMP, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id
      `, [
        rentalData.orderNumber,
        rentalData.customerName,
        rentalData.customerEmail,
        rentalData.customerPhone,
        rentalData.vehicleName,
        rentalData.vehicleCode,
        rentalData.startDate,
        rentalData.endDate,
        rentalData.totalPrice,
        rentalData.handoverPlace,
        rentalData.dailyKilometers,
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