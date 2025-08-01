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
              
              // Ak nie sú žiadne UNSEEN, skúsime posledných 15 emailov vôbec
              console.log('📭 IMAP: Žiadne nové emaily, skúšam posledných 15 emailov...');
              this.imap!.search(['ALL'], (err3: any, allResults: any) => {
                if (err3) {
                  reject(err3);
                  return;
                }
                
                if (!allResults || allResults.length === 0) {
                  console.log('📭 IMAP: Žiadne emaily v schránke');
                  resolve();
                  return;
                }
                
                // Vezmi posledných 15 emailov
                const last15 = allResults.slice(-15);
                console.log(`📧 IMAP: Testujem posledných ${last15.length} emailov z celkovo ${allResults.length}`);
                this.processFetchedEmails(last15, resolve, reject);
              });
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

  private async parseEmailContent(emailData: EmailData): Promise<ParsedRentalData | null> {
    try {
      // Preferujeme text, ak nie je dostupný alebo je prázdny, extrahujeme z HTML
      let content = emailData.text?.trim();
      
      if ((!content || content.length === 0) && emailData.html) {
        // Extrahuj text z HTML - odstráň HTML značky
        content = emailData.html
          .replace(/<style[^>]*>.*?<\/style>/gis, '') // Odstráň CSS
          .replace(/<script[^>]*>.*?<\/script>/gis, '') // Odstráň JS
          .replace(/<[^>]+>/g, ' ') // Odstráň HTML značky
          .replace(/&nbsp;/g, ' ') // Nahraď &nbsp; medzerami
          .replace(/&amp;/g, '&') // Dekóduj HTML entity
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, ' ') // Normalizuj medzery
          .trim();
        console.log('🔄 PARSING: Extrahujem text z HTML emailu');
      }
      
      if (!content) {
        console.log('❌ PARSING: Žiadny obsah na spracovanie');
        return null;
      }
      
      console.log('🔍 PARSING: Obsah emailu na parsovanie:', content.substring(0, 500) + '...');
      
      // NOVÝ: Skús vertikálny formát parsing (kde názov a hodnota sú na separátnych riadkoch)
      const verticalData = await this.parseVerticalFormat(content);
      if (verticalData) {
        console.log('✅ PARSING: Úspešne parsované vo vertikálnom formáte');
        return verticalData;
      }
      
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
      
      // SPZ/Kód vozidla - obmedziť na jeden riadok
      const licenseMatch = content.match(/(?:spz|license|registration|kód)\s*:?\s*([A-Z0-9\s-]+?)(?:\n|$|[^A-Z0-9\s-])/i);
      
      // Dátumy - rozšírené formáty
      let startDateMatch = content.match(/(?:od|from|začiatok)\s*:?\s*(\d{1,2}[.-\/]\d{1,2}[.-\/]\d{2,4})/i);
      let endDateMatch = content.match(/(?:do|to|koniec)\s*:?\s*(\d{1,2}[.-\/]\d{1,2}[.-\/]\d{2,4})/i);
      
      // Ak nenájdeme tradičné formáty, hľadáme "čas rezervácie" formát
      if (!startDateMatch || !endDateMatch) {
        // Formát s časom: 2025-08-10 08:00:00 - 2025-08-15 08:00:00
        const reservationTimeMatch = content.match(/(?:čas rezervácie|reservation time)\s*:?\s*(\d{4}-\d{2}-\d{2})\s+\d{2}:\d{2}:\d{2}\s*-\s*(\d{4}-\d{2}-\d{2})\s+\d{2}:\d{2}:\d{2}/i);
        if (reservationTimeMatch) {
          startDateMatch = [reservationTimeMatch[0], reservationTimeMatch[1]];
          endDateMatch = [reservationTimeMatch[0], reservationTimeMatch[2]];
          console.log('🔍 DÁTUM: Našiel som čas rezervácie s časom:', reservationTimeMatch[1], '-', reservationTimeMatch[2]);
        } else {
          // Jednoduchší formát iba s dátumom: 2025-08-10 - 2025-08-15  
          const simpleDateRangeMatch = content.match(/(?:čas rezervácie|reservation time)\s*:?\s*(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})/i);
          if (simpleDateRangeMatch) {
            startDateMatch = [simpleDateRangeMatch[0], simpleDateRangeMatch[1]];
            endDateMatch = [simpleDateRangeMatch[0], simpleDateRangeMatch[2]];
            console.log('🔍 DÁTUM: Našiel som čas rezervácie jednoduchý:', simpleDateRangeMatch[1], '-', simpleDateRangeMatch[2]);
          }
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
      console.log('- SPZ/Kód:', licenseMatch?.[1]);
      console.log('- Dátum od:', startDateMatch?.[1]);
      console.log('- Dátum do:', endDateMatch?.[1]);
      console.log('- Cena RAW:', priceMatch?.[1]);
      console.log('- Miesto:', placeMatch?.[1]);
      console.log('- KM:', kmMatch?.[1]);

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
        totalPrice: priceMatch ? parseFloat(priceMatch[1].replace(/[€\s]/g, '').replace(',', '.')) : 0,
        deposit: 0, // TODO: Pridať parsing pre depozit v horizontálnom formáte
        paymentMethod: 'Prevod', // Default pre horizontálny formát
        handoverPlace: placeMatch ? placeMatch[1].trim() : '',
        dailyKilometers: kmMatch ? parseInt(kmMatch[1]) : 0,
      };

      console.log('✅ PARSING: Úspešne parsované údaje:', rentalData.orderNumber);
      console.log('📊 FINÁLNE PARSED DATA:');
      console.log('- orderNumber:', rentalData.orderNumber);
      console.log('- customerName:', rentalData.customerName);
      console.log('- customerEmail:', rentalData.customerEmail);
      console.log('- customerPhone:', rentalData.customerPhone);
      console.log('- vehicleName:', rentalData.vehicleName);
      console.log('- vehicleCode:', rentalData.vehicleCode);
      console.log('- totalPrice:', rentalData.totalPrice);
      console.log('- startDate:', rentalData.startDate);
      console.log('- endDate:', rentalData.endDate);
      console.log('- handoverPlace:', rentalData.handoverPlace);
      console.log('- dailyKilometers:', rentalData.dailyKilometers);
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
          deposit, handover_place, daily_kilometers, approval_status, status,
          payment_method, commission, auto_processed_at, email_content, 
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', 'pending',
          $13, 0.00, CURRENT_TIMESTAMP, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
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

  // NOVÁ METÓDA: Parsing vertikálneho formátu (názov a hodnota na separátnych riadkoch)
  private async parseVerticalFormat(content: string): Promise<ParsedRentalData | null> {
    try {
      console.log('🔄 PARSING: Skúšam vertikálny formát...');
      
      // Rozdeľ obsah na riadky
      const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
      
      let orderNumber = '';
      let customerName = '';
      let customerEmail = '';
      let customerPhone = '';
      let vehicleName = '';
      let vehicleCode = '';
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      let totalPrice = 0;
      let deposit = 0;
      let paymentMethod = '';
      let handoverPlace = '';
      let dailyKilometers = 0;
      
      // Hľadaj hodnoty po kľúčových slovách
      for (let i = 0; i < lines.length - 1; i++) {
        const currentLine = lines[i].toLowerCase();
        const nextLine = lines[i + 1];
        
        // Číslo objednávky
        if (currentLine.includes('číslo objednávky') || currentLine.includes('order number')) {
          orderNumber = nextLine.replace(/^[>\s]+/, '').trim();
        }
        
        // Meno zákazníka
        if (currentLine.includes('odoberateľ') || currentLine.includes('odbetaraťeľ') || 
            currentLine.includes('zákazník') || currentLine.includes('meno')) {
          customerName = nextLine.replace(/^[>\s]+/, '').trim();
        }
        
        // Email
        if (currentLine.includes('e-mail') || currentLine.includes('email')) {
          customerEmail = nextLine.replace(/^[>\s]+/, '').trim();
        }
        
        // Telefón
        if (currentLine.includes('telefón') || currentLine.includes('phone') || currentLine.includes('tel')) {
          customerPhone = nextLine.replace(/^[>\s]+/, '').trim();
        }
        
        // Vozidlo
        if (currentLine.includes('vozidlo') || currentLine.includes('vehicle') || currentLine.includes('auto')) {
          vehicleName = nextLine;
        }
        
        // SPZ/Kód vozidla
        if (currentLine.includes('spz') || currentLine.includes('registračné') || currentLine.includes('license')) {
          vehicleCode = nextLine;
        }
        
        // Cena - vylepšené parsing
        if (currentLine.includes('suma') || currentLine.includes('cena') || currentLine.includes('price') || 
            currentLine.includes('total') || currentLine.includes('úhrada')) {
          const priceMatch = nextLine.match(/([0-9,.]+ ?€?)/);
          if (priceMatch) {
            // Správne parsovanie ceny - zachovaj desatinné miesta
            const priceStr = priceMatch[1].replace(/[€\s]/g, '').replace(',', '.');
            totalPrice = parseFloat(priceStr);
          }
        }
        
        // Depozit
        if (currentLine.includes('depozit') || currentLine.includes('deposit') || currentLine.includes('zábezpeka')) {
          const depositMatch = nextLine.match(/([0-9\s,.]+ ?€?)/);
          if (depositMatch) {
            // Odstráň medzery z čísla (napr. "3 000,00" -> "3000,00")
            const depositStr = depositMatch[1].replace(/[€\s]/g, '').replace(',', '.');
            deposit = parseFloat(depositStr);
          }
        }
        
        // Spôsob platby - čítanie explicitnej hodnoty z emailu
        if (currentLine.includes('platba') || currentLine.includes('payment') || currentLine.includes('zaplatenie') || 
            currentLine.includes('úhrada') || currentLine.includes('spôsob')) {
          const rawPayment = nextLine.replace(/^[>\s]+/, '').trim();
          
          console.log('💳 NÁJDENÝ SPÔSOB PLATBY RAW:', rawPayment);
          
          // Jednoduché mapovanie na štandardné hodnoty
          if (rawPayment.toLowerCase().includes('hotovost')) {
            paymentMethod = 'Hotovosť';
            console.log('💳 MAPOVANÉ NA: Hotovosť');
          } else if (rawPayment.toLowerCase().includes('prevod')) {
            paymentMethod = 'Prevod';
            console.log('💳 MAPOVANÉ NA: Prevod');
          } else {
            // Zachovaj originálnu hodnotu ak nie je štandardná
            paymentMethod = rawPayment;
            console.log('💳 ZACHOVANÉ ORIGINÁLNE:', rawPayment);
          }
        }
        
        // Miesto - opravené čistenie ">" znakov
        if (currentLine.includes('miesto') || currentLine.includes('location') || currentLine.includes('adresa')) {
          handoverPlace = nextLine.replace(/^[>\s]+/, '').trim();
        }
        
        // KM
        if (currentLine.includes('km') || currentLine.includes('kilometer')) {
          const kmMatch = nextLine.match(/(\d+)/);
          if (kmMatch) {
            dailyKilometers = parseInt(kmMatch[1]);
          }
        }
      }
      
      // NOVÉ: Špeciálne parsing pre tabuľky a komplexné dáta
      await this.parseTableData(content, {
        vehicleName: vehicleName,
        vehicleCode: vehicleCode,
        totalPrice: totalPrice,
        startDate: startDate,
        endDate: endDate
      }).then(tableData => {
        if (tableData.vehicleName) vehicleName = tableData.vehicleName;
        if (tableData.vehicleCode) vehicleCode = tableData.vehicleCode;  
        if (tableData.totalPrice > 0) totalPrice = tableData.totalPrice;
        if (tableData.startDate) startDate = tableData.startDate;
        if (tableData.endDate) endDate = tableData.endDate;
      });
      
      console.log('🔍 VERTIKÁLNY PARSING výsledky:');
      console.log('- Číslo objednávky:', orderNumber);
      console.log('- Meno:', customerName);
      console.log('- Email:', customerEmail);
      console.log('- Telefón:', customerPhone);
      console.log('- Vozidlo:', vehicleName);
      console.log('- SPZ/Kód:', vehicleCode);
      console.log('- Cena:', totalPrice);
      console.log('- Depozit:', deposit);
      console.log('💳 SPÔSOB PLATBY ROZPOZNANÝ:', paymentMethod);
      console.log('- Miesto:', handoverPlace);
      console.log('- KM:', dailyKilometers);
      
      // Validácia povinných polí
      if (!orderNumber || !customerName) {
        console.log('⚠️ VERTIKÁLNY PARSING: Chýbajú povinné údaje (objednávka alebo meno)');
        return null;
      }
      
      // Pre vertikálny formát môžeme mať minimálne požiadavky na dátumy
      if (!startDate) startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 dní
      if (!endDate) endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // +14 dní
      
      // Default hodnota ak nie je nájdená
      if (!paymentMethod || paymentMethod.length === 0) {
        paymentMethod = 'Prevod'; // Default pre systémové emaily
        console.log('💳 DEFAULT: Prevod (spôsob platby nebol nájdený v emaili)');
      } else {
        console.log('💳 EXPLICITNE PARSOVANÝ:', paymentMethod);
      }
      
      const rentalData: ParsedRentalData = {
        orderNumber: orderNumber.trim(),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        vehicleName: vehicleName.trim(),
        vehicleCode: vehicleCode.trim(),
        startDate: startDate,
        endDate: endDate,
        totalPrice: totalPrice,
        deposit: deposit,
        paymentMethod: paymentMethod.trim(),
        handoverPlace: handoverPlace.trim(),
        dailyKilometers: dailyKilometers,
      };
      
      console.log('✅ VERTIKÁLNY PARSING: Úspešne parsované údaje:', rentalData.orderNumber);
      return rentalData;
      
    } catch (error) {
      console.error('❌ VERTIKÁLNY PARSING: Chyba pri parsovaní:', error);
      return null;
    }
  }
  
  // NOVÁ METÓDA: Parsing tabuľkových dát a komplexných formátov
  private async parseTableData(content: string, currentData: any): Promise<any> {
    try {
      console.log('🔄 TABLE PARSING: Hľadám tabuľkové údaje...');
      
      let result = { ...currentData };
      
      // 1. HĽADAJ VOZIDLO V TABUĽKE "Položky objednávky"
      const tableVehicleMatch = content.match(/Porsche\s+Panamera\s+Turbo|BMW\s+[^,\n]+|Mercedes\s+[^,\n]+|Audi\s+[^,\n]+|Škoda\s+[^,\n]+|VW\s+[^,\n]+|Volkswagen\s+[^,\n]+|Ford\s+[^,\n]+|Opel\s+[^,\n]+/i);
      
      if (tableVehicleMatch) {
        result.vehicleName = tableVehicleMatch[0].trim();
        console.log('✅ TABLE PARSING: Našiel som vozidlo v tabuľke:', result.vehicleName);
      }
      
      // 2. HĽADAJ KÓD VOZIDLA (ALFANUMERICKÝ KÓD)
      const codeMatches = content.match(/\b[A-Z]{1,3}[0-9]{3,4}[A-Z]{1,3}\b/g);
      if (codeMatches && codeMatches.length > 0) {
        // Filtraj len realistické kódy vozidiel (nie príliš dlhé čísla)
        const vehicleCodes = codeMatches.filter(code => code.length >= 5 && code.length <= 8);
        if (vehicleCodes.length > 0) {
          result.vehicleCode = vehicleCodes[0];
          console.log('✅ TABLE PARSING: Našiel som kód vozidla:', result.vehicleCode);
        }
      }
      
      // 3. HĽADAJ PRESNÉ CENY V TABUĽKE
      const priceTableMatch = content.match(/(\d{2,4}[,.]?\d{0,2})\s*€.*?(\d{2,4}[,.]?\d{0,2})\s*€/);
      if (priceTableMatch) {
        // Vezmi druhú cenu (celková suma)
        const finalPrice = priceTableMatch[2].replace(',', '.');
        result.totalPrice = parseFloat(finalPrice);
        console.log('✅ TABLE PARSING: Našiel som cenu v tabuľke:', result.totalPrice);
      }
      
      // 4. HĽADAJ ČAS REZERVÁCIE (YYYY-MM-DD HH:MM:SS - YYYY-MM-DD HH:MM:SS) - PARSUJ LEN DÁTUM
      const dateRangeMatch = content.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/);
      
      if (dateRangeMatch) {
        // Parsuj len dátum bez času (nastavíme čas na 12:00 UTC)
        const startDateStr = `${dateRangeMatch[1]}T12:00:00.000Z`;
        const endDateStr = `${dateRangeMatch[3]}T12:00:00.000Z`;
        
        result.startDate = new Date(startDateStr);
        result.endDate = new Date(endDateStr);
        
        console.log('✅ TABLE PARSING: Našiel som dátumy rezervácie (len dátum):');
        console.log('  - Od:', dateRangeMatch[1]);
        console.log('  - Do:', dateRangeMatch[3]);
      }
      
      // 5. HĽADAJ POČET KM AK NIE JE NÁJDENÝ
      if (!result.dailyKilometers || result.dailyKilometers === 0) {
        const kmMatch = content.match(/(\d{2,4})\s*km/i);
        if (kmMatch) {
          result.dailyKilometers = parseInt(kmMatch[1]);
          console.log('✅ TABLE PARSING: Našiel som KM limit:', result.dailyKilometers);
        }
      }
      
      console.log('🔍 TABLE PARSING dokončené');
      return result;
      
    } catch (error) {
      console.error('❌ TABLE PARSING: Chyba pri parsovaní tabuľkových dát:', error);
      return currentData;
    }
  }
}

export default ImapEmailService;