#!/usr/bin/env node

/**
 * KOMPLETNÝ SCRIPT NA NAPÁROVANIE VŠETKÝCH PRENÁJMOV S EMAILAMI
 * Obdobie: 20.8.2025 - 5.9.2025
 * 
 * Tento script:
 * 1. Načíta všetky prenájmy z databázy v danom období
 * 2. Stiahne všetky emaily z IMAP servera
 * 3. Naparuje všetky prenájmy s emailami (aj tie čo už majú order_number)
 * 4. Vytvorí detailný report s odporúčaniami na opravy
 */

const { Pool } = require('pg');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');

// PostgreSQL konfigurácia [[memory:8273198]]
const dbConfig = {
  host: 'trolley.proxy.rlwy.net',
  port: 13400,
  database: 'railway',
  user: 'postgres',
  password: 'nfwrpKxILRUMqunYTZJEhjudEstqLRGv',
  ssl: {
    rejectUnauthorized: false
  }
};

// IMAP konfigurácia s heslom [[memory:8273198]]
const imapConfig = {
  host: 'imap.m1.websupport.sk',
  port: 993,
  secure: true,
  user: 'info@blackrent.sk',
  password: 'Hesloheslo11',
  tls: true,
  tlsOptions: {
    rejectUnauthorized: false
  }
};

class CompleteRentalEmailMatcher {
  constructor() {
    this.pool = new Pool(dbConfig);
    this.imap = new Imap(imapConfig);
    this.rentals = [];
    this.emails = [];
    this.matches = [];
    this.startDate = new Date('2025-08-20');
    this.endDate = new Date('2025-09-05');
  }

  // 1. NAČÍTAJ VŠETKY PRENÁJMY Z DATABÁZY V DANOM OBDOBÍ
  async loadRentalsFromDatabase() {
    console.log('🗄️  Načítavam prenájmy z databázy...');
    console.log(`📅 Obdobie: ${this.startDate.toISOString().split('T')[0]} - ${this.endDate.toISOString().split('T')[0]}`);
    
    try {
      const client = await this.pool.connect();
      
      const query = `
        SELECT 
          id, customer_id, vehicle_id, start_date, end_date, 
          total_price, commission, payment_method, paid, status, 
          customer_name, created_at, order_number, deposit, 
          allowed_kilometers, daily_kilometers, handover_place,
          customer_email, customer_phone
        FROM rentals 
        WHERE (start_date::date >= $1 AND start_date::date <= $2)
           OR (end_date::date >= $1 AND end_date::date <= $2)
           OR (start_date::date <= $1 AND end_date::date >= $2)
        ORDER BY start_date ASC
      `;
      
      const result = await client.query(query, [this.startDate, this.endDate]);
      client.release();
      
      this.rentals = result.rows.map(row => ({
        id: row.id,
        customerId: row.customer_id,
        vehicleId: row.vehicle_id,
        customerName: row.customer_name || 'Neznámy zákazník',
        startDate: row.start_date,
        endDate: row.end_date,
        totalPrice: parseFloat(row.total_price) || 0,
        commission: parseFloat(row.commission) || 0,
        paymentMethod: row.payment_method || 'cash',
        paid: Boolean(row.paid),
        status: row.status || 'active',
        createdAt: row.created_at,
        orderNumber: row.order_number || null,
        deposit: row.deposit ? parseFloat(row.deposit) : null,
        allowedKilometers: row.allowed_kilometers || null,
        dailyKilometers: row.daily_kilometers || null,
        handoverPlace: row.handover_place || null,
        customerEmail: row.customer_email || null,
        customerPhone: row.customer_phone || null
      }));
      
      console.log(`✅ Načítaných ${this.rentals.length} prenájmov z databázy`);
      
      // Štatistiky
      const withOrderNumber = this.rentals.filter(r => r.orderNumber).length;
      const withoutOrderNumber = this.rentals.length - withOrderNumber;
      const withEmail = this.rentals.filter(r => r.customerEmail).length;
      const withPhone = this.rentals.filter(r => r.customerPhone).length;
      
      console.log(`📊 Štatistiky prenájmov:`);
      console.log(`   - S order_number: ${withOrderNumber}`);
      console.log(`   - Bez order_number: ${withoutOrderNumber}`);
      console.log(`   - S emailom: ${withEmail}`);
      console.log(`   - S telefónom: ${withPhone}`);
      
    } catch (error) {
      console.error('❌ Chyba pri načítaní prenájmov:', error);
      throw error;
    }
  }

  // 2. STIAHNI VŠETKY EMAILY Z IMAP SERVERA PRE DANÉ OBDOBIE
  async loadEmailsFromIMAP() {
    console.log('\n📧 Sťahujem emaily z IMAP servera...');
    
    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        console.log('📧 IMAP: Pripojenie úspešné');
        this.searchEmailsInPeriod(resolve, reject);
      });

      this.imap.once('error', (err) => {
        console.error('❌ IMAP pripojenie zlyhalo:', err);
        reject(err);
      });

      this.imap.once('end', () => {
        console.log('📧 IMAP: Pripojenie ukončené');
      });

      console.log('📧 IMAP: Pripájam sa na server...');
      this.imap.connect();
    });
  }

  searchEmailsInPeriod(resolve, reject) {
    this.imap.openBox('INBOX', true, (err, box) => {
      if (err) {
        reject(err);
        return;
      }

      // Hľadaj emaily v danom období
      const startDateStr = this.startDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });

      console.log(`🔍 Hľadám emaily od ${startDateStr} s predmetom "Objednávka od zákaznika"`);

      this.imap.search([
        ['SINCE', startDateStr], 
        ['SUBJECT', 'Objednávka od zákaznika']
      ], (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        if (!results || results.length === 0) {
          console.log('📭 Žiadne objednávky v danom období');
          this.imap.end();
          resolve([]);
          return;
        }

        console.log(`📧 Našiel som ${results.length} emailov, spracovávam všetky...`);
        this.processAllEmails(results, resolve, reject);
      });
    });
  }

  processAllEmails(emailIds, resolve, reject) {
    const fetch = this.imap.fetch(emailIds, { 
      bodies: '',
      markSeen: false 
    });

    let processed = 0;
    const total = emailIds.length;

    fetch.on('message', (msg, seqno) => {
      let buffer = '';
      
      msg.on('body', (stream, info) => {
        stream.on('data', (chunk) => {
          buffer += chunk.toString('utf8');
        });
        
        stream.once('end', () => {
          simpleParser(buffer, (err, parsed) => {
            if (err) {
              console.error(`❌ Chyba pri parsovaní emailu ${seqno}:`, err);
            } else {
              const emailData = this.parseEmailContent(parsed, seqno);
              if (emailData) {
                this.emails.push(emailData);
                console.log(`📧 Email ${seqno}: ${emailData.orderNumber} - ${emailData.customerName}`);
              }
            }
            
            processed++;
            if (processed === total) {
              this.imap.end();
              resolve(this.emails);
            }
          });
        });
      });
    });

    fetch.once('error', (err) => {
      console.error('❌ Fetch error:', err);
      reject(err);
    });
  }

  // Parsuj obsah emailu a extrahuj dôležité informácie
  parseEmailContent(parsed, seqno) {
    try {
      const content = parsed.html || parsed.text || '';

      // Extrahuj číslo objednávky
      const orderMatch = content.match(/Číslo objednávky<\/td>\s*<td[^>]*>([^<]+)<\/td>/);
      const orderNumber = orderMatch ? orderMatch[1].trim() : null;

      // Extrahuj meno zákazníka
      const customerMatch = content.match(/Odoberateľ<\/td>\s*<td[^>]*>([^<]+)<\/td>/);
      const customerName = customerMatch ? customerMatch[1].trim() : null;

      // Extrahuj email
      const emailMatch = content.match(/E-mail<\/td>\s*<td[^>]*>([^<]+)<\/td>/);
      const email = emailMatch ? emailMatch[1].trim() : null;

      // Extrahuj telefón
      const phoneMatch = content.match(/Telefon<\/td>\s*<td[^>]*>([^<]+)<\/td>/);
      const phone = phoneMatch ? phoneMatch[1].trim() : null;

      // Extrahuj čas rezervácie
      const timeMatch = content.match(/Čas rezervacie<\/td>\s*<td[^>]*>([^<]+)<\/td>/);
      const reservationTime = timeMatch ? timeMatch[1].trim() : null;

      // Extrahuj sumu
      const priceMatch = content.match(/Suma k úhrade<\/td>\s*<td[^>]*>([^<]+)<\/td>/);
      const totalPrice = priceMatch ? priceMatch[1].replace(/[^\d,]/g, '').replace(',', '.') : null;

      // Extrahuj denné kilometre
      const kmMatch = content.match(/Počet povolených km<\/td>\s*<td[^>]*>([^<]+)<\/td>/);
      const dailyKm = kmMatch ? kmMatch[1].replace(/[^\d]/g, '') : null;

      // Parsuj čas rezervácie na start a end dátumy
      let startDate = null, endDate = null;
      if (reservationTime) {
        const timeParseMatch = reservationTime.match(/(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) - (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/);
        if (timeParseMatch) {
          startDate = `${timeParseMatch[1]} ${timeParseMatch[2]}`;
          endDate = `${timeParseMatch[3]} ${timeParseMatch[4]}`;
        }
      }

      if (!orderNumber || !customerName) {
        return null; // Preskočiť neúplné emaily
      }

      return {
        seqno,
        orderNumber,
        customerName,
        email,
        phone,
        reservationTime,
        startDate,
        endDate,
        totalPrice: totalPrice ? parseFloat(totalPrice) : null,
        dailyKilometers: dailyKm ? parseInt(dailyKm) : null,
        rawContent: content,
        parsedDate: parsed.date
      };
    } catch (error) {
      console.error(`❌ Chyba pri parsovaní emailu ${seqno}:`, error.message);
      return null;
    }
  }

  // 3. NAPARUJ VŠETKY PRENÁJMY S EMAILAMI
  async matchAllRentalsWithEmails() {
    console.log('\n🔍 Začínam kompletné napárovanie...\n');

    // Najprv napáruj podľa existujúcich order_number
    this.matchByExistingOrderNumber();
    
    // Potom napáruj zvyšné podľa mena, sumy a dátumu
    this.matchByNamePriceDate();
    
    console.log(`\n✅ Napárovanie dokončené: ${this.matches.length} úspešných napárovaní`);
  }

  matchByExistingOrderNumber() {
    console.log('🔗 Napárovanie podľa existujúcich order_number...');
    
    for (const rental of this.rentals) {
      if (!rental.orderNumber) continue;
      
      const matchingEmail = this.emails.find(email => 
        email.orderNumber === rental.orderNumber
      );
      
      if (matchingEmail) {
        const match = this.createMatch(matchingEmail, rental, 'existing_order_number', 100);
        this.matches.push(match);
        console.log(`   ✅ EXISTUJÚCE: ${rental.orderNumber} - ${rental.customerName}`);
      }
    }
  }

  matchByNamePriceDate() {
    console.log('\n🔍 Napárovanie zvyšných prenájmov...');
    
    const unmatchedRentals = this.rentals.filter(rental => 
      !this.matches.some(match => match.rental.id === rental.id)
    );
    
    const unmatchedEmails = this.emails.filter(email => 
      !this.matches.some(match => match.email.seqno === email.seqno)
    );
    
    console.log(`📊 Zostáva naparovať: ${unmatchedRentals.length} prenájmov, ${unmatchedEmails.length} emailov`);

    for (const email of unmatchedEmails) {
      console.log(`\n📧 Analyzujem email ${email.seqno}: ${email.orderNumber} - ${email.customerName}`);
      
      // 1. Presné napárovanie podľa mena
      const exactMatches = unmatchedRentals.filter(rental => 
        this.normalizeString(rental.customerName) === this.normalizeString(email.customerName)
      );

      if (exactMatches.length === 1) {
        const rental = exactMatches[0];
        const match = this.createMatch(email, rental, 'exact_name', 90);
        this.matches.push(match);
        console.log(`   ✅ PRESNÉ MENO: Rental ID ${rental.id}`);
        continue;
      }

      // 2. Podobné napárovanie podľa mena
      const similarMatches = unmatchedRentals.filter(rental => 
        this.isSimilarName(rental.customerName, email.customerName)
      );

      if (similarMatches.length === 1) {
        const rental = similarMatches[0];
        const match = this.createMatch(email, rental, 'similar_name', 70);
        this.matches.push(match);
        console.log(`   🔶 PODOBNÉ MENO: Rental ID ${rental.id} (${rental.customerName})`);
        continue;
      }

      // 3. Napárovanie podľa sumy a dátumu
      const priceMatches = unmatchedRentals.filter(rental => {
        const emailStartDate = email.startDate ? email.startDate.split(' ')[0] : null;
        const rentalStartDate = rental.startDate ? new Date(rental.startDate).toISOString().split('T')[0] : null;
        
        const priceMatch = Math.abs(rental.totalPrice - email.totalPrice) < 0.01;
        const dateMatch = emailStartDate === rentalStartDate;
        
        return priceMatch && dateMatch;
      });

      if (priceMatches.length === 1) {
        const rental = priceMatches[0];
        const match = this.createMatch(email, rental, 'price_date', 60);
        this.matches.push(match);
        console.log(`   🔷 SUMA + DÁTUM: Rental ID ${rental.id} (${rental.customerName})`);
        continue;
      }

      // 4. Napárovanie len podľa sumy (ak je unikátna)
      const priceOnlyMatches = unmatchedRentals.filter(rental => 
        Math.abs(rental.totalPrice - email.totalPrice) < 0.01
      );

      if (priceOnlyMatches.length === 1) {
        const rental = priceOnlyMatches[0];
        const match = this.createMatch(email, rental, 'price_only', 40);
        this.matches.push(match);
        console.log(`   🔸 LEN SUMA: Rental ID ${rental.id} (${rental.customerName}) - KONTROLA POTREBNÁ!`);
        continue;
      }

      console.log(`   ❌ Nenašlo sa napárovanie pre ${email.customerName} (${email.totalPrice}€)`);
    }
  }

  // Vytvor match objekt s detailnými informáciami
  createMatch(email, rental, matchType, confidence) {
    return {
      email,
      rental,
      matchType,
      confidence,
      missingData: this.identifyMissingData(email, rental),
      dataDiscrepancies: this.identifyDataDiscrepancies(email, rental),
      sqlUpdates: this.generateSQLUpdates(email, rental)
    };
  }

  // Identifikuj chýbajúce dáta
  identifyMissingData(email, rental) {
    const missing = [];
    
    if (!rental.orderNumber) missing.push('order_number');
    if (!rental.customerEmail) missing.push('customer_email');
    if (!rental.customerPhone) missing.push('customer_phone');
    if (!rental.dailyKilometers && email.dailyKilometers) missing.push('daily_kilometers');
    
    return missing;
  }

  // Identifikuj rozdiely v dátach
  identifyDataDiscrepancies(email, rental) {
    const discrepancies = [];
    
    // Kontrola sumy
    if (Math.abs(rental.totalPrice - email.totalPrice) > 0.01) {
      discrepancies.push({
        field: 'total_price',
        rental_value: rental.totalPrice,
        email_value: email.totalPrice,
        difference: Math.abs(rental.totalPrice - email.totalPrice)
      });
    }
    
    // Kontrola času
    const emailTime = email.startDate ? email.startDate.split(' ')[1] : null;
    const rentalTime = rental.startDate ? new Date(rental.startDate).toTimeString().split(' ')[0] : null;
    if (emailTime && rentalTime && emailTime !== rentalTime) {
      discrepancies.push({
        field: 'start_time',
        rental_value: rentalTime,
        email_value: emailTime
      });
    }
    
    // Kontrola dátumu
    const emailDate = email.startDate ? email.startDate.split(' ')[0] : null;
    const rentalDate = rental.startDate ? new Date(rental.startDate).toISOString().split('T')[0] : null;
    if (emailDate && rentalDate && emailDate !== rentalDate) {
      discrepancies.push({
        field: 'start_date',
        rental_value: rentalDate,
        email_value: emailDate
      });
    }
    
    return discrepancies;
  }

  // Vygeneruj SQL UPDATE príkazy
  generateSQLUpdates(email, rental) {
    const updates = [];
    const setParts = [];
    
    if (!rental.orderNumber) {
      setParts.push(`order_number = '${email.orderNumber}'`);
    }
    
    if (!rental.customerEmail && email.email) {
      setParts.push(`customer_email = '${email.email}'`);
    }
    
    if (!rental.customerPhone && email.phone) {
      setParts.push(`customer_phone = '${email.phone}'`);
    }
    
    if (!rental.dailyKilometers && email.dailyKilometers) {
      setParts.push(`daily_kilometers = ${email.dailyKilometers}`);
    }
    
    // Oprav čas ak sa líši
    const emailTime = email.startDate ? email.startDate.split(' ')[1] : null;
    const rentalTime = rental.startDate ? new Date(rental.startDate).toTimeString().split(' ')[0] : null;
    if (emailTime && rentalTime && emailTime !== rentalTime) {
      setParts.push(`start_date = '${email.startDate}'`);
      if (email.endDate) {
        setParts.push(`end_date = '${email.endDate}'`);
      }
    }
    
    if (setParts.length > 0) {
      updates.push(`UPDATE rentals SET ${setParts.join(', ')} WHERE id = ${rental.id};`);
    }
    
    return updates;
  }

  // Normalizuj string pre porovnanie
  normalizeString(str) {
    return str.toLowerCase()
      .replace(/[áäâà]/g, 'a')
      .replace(/[éëêè]/g, 'e')
      .replace(/[íïîì]/g, 'i')
      .replace(/[óöôò]/g, 'o')
      .replace(/[úüûù]/g, 'u')
      .replace(/[ýÿ]/g, 'y')
      .replace(/[ň]/g, 'n')
      .replace(/[š]/g, 's')
      .replace(/[č]/g, 'c')
      .replace(/[ť]/g, 't')
      .replace(/[ž]/g, 'z')
      .replace(/[ľ]/g, 'l')
      .replace(/[ř]/g, 'r')
      .replace(/[ď]/g, 'd')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Kontrola podobnosti mien
  isSimilarName(name1, name2) {
    const norm1 = this.normalizeString(name1);
    const norm2 = this.normalizeString(name2);
    
    // Kontrola či jedno meno obsahuje druhé
    return norm1.includes(norm2) || norm2.includes(norm1);
  }

  // 4. VYGENERUJ KOMPLETNÝ REPORT
  async generateCompleteReport() {
    console.log('\n' + '='.repeat(100));
    console.log('📊 KOMPLETNÝ REPORT: NAPÁROVANIE VŠETKÝCH PRENÁJMOV S EMAILAMI');
    console.log('='.repeat(100));
    
    const reportDate = new Date().toLocaleString('sk-SK');
    console.log(`🕐 Dátum analýzy: ${reportDate}`);
    console.log(`📅 Analyzované obdobie: ${this.startDate.toISOString().split('T')[0]} - ${this.endDate.toISOString().split('T')[0]}`);
    console.log(`🗄️  Prenájmov v databáze: ${this.rentals.length}`);
    console.log(`📧 Emailov z IMAP: ${this.emails.length}`);
    console.log(`🔗 Úspešných napárovaní: ${this.matches.length}`);
    
    // Štatistiky napárovaní
    const byMatchType = {};
    this.matches.forEach(match => {
      byMatchType[match.matchType] = (byMatchType[match.matchType] || 0) + 1;
    });
    
    console.log('\n📊 ŠTATISTIKY NAPÁROVANÍ:');
    Object.entries(byMatchType).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });
    
    // Detailné napárovania
    console.log('\n' + '='.repeat(80));
    console.log('✅ ÚSPEŠNE NAPÁROVANÉ PRENÁJMY');
    console.log('='.repeat(80));
    
    this.matches.forEach((match, index) => {
      console.log(`\n${index + 1}. **${match.rental.customerName} (Rental ID: ${match.rental.id})**`);
      console.log(`   📧 Email: ${match.email.orderNumber} (seqno: ${match.email.seqno})`);
      console.log(`   🎯 Match Type: ${match.matchType} (${match.confidence}% confidence)`);
      console.log(`   💰 Suma: Email ${match.email.totalPrice}€ | DB ${match.rental.totalPrice}€`);
      console.log(`   📅 Dátum: Email ${match.email.startDate} | DB ${new Date(match.rental.startDate).toISOString().replace('T', ' ').split('.')[0]}`);
      
      if (match.missingData.length > 0) {
        console.log(`   ❌ Chýbajúce dáta: ${match.missingData.join(', ')}`);
      }
      
      if (match.dataDiscrepancies.length > 0) {
        console.log(`   ⚠️  Rozdiely v dátach:`);
        match.dataDiscrepancies.forEach(disc => {
          console.log(`      - ${disc.field}: DB="${disc.rental_value}" vs Email="${disc.email_value}"`);
        });
      }
      
      if (match.sqlUpdates.length > 0) {
        console.log(`   🔧 SQL UPDATE:`);
        match.sqlUpdates.forEach(sql => {
          console.log(`      ${sql}`);
        });
      }
      
      console.log('-'.repeat(60));
    });
    
    // Nenapárované prenájmy
    const unmatchedRentals = this.rentals.filter(rental => 
      !this.matches.some(match => match.rental.id === rental.id)
    );
    
    if (unmatchedRentals.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('❌ NENAPÁROVANÉ PRENÁJMY');
      console.log('='.repeat(80));
      
      unmatchedRentals.forEach(rental => {
        console.log(`🏢 Rental ID ${rental.id}: ${rental.customerName}`);
        console.log(`   💰 Suma: ${rental.totalPrice}€`);
        console.log(`   📅 Dátum: ${new Date(rental.startDate).toISOString().replace('T', ' ').split('.')[0]}`);
        console.log(`   📧 Order number: ${rental.orderNumber || 'CHÝBA'}`);
        console.log(`   ✉️  Email: ${rental.customerEmail || 'CHÝBA'}`);
        console.log(`   📞 Telefón: ${rental.customerPhone || 'CHÝBA'}`);
      });
    }
    
    // Nenapárované emaily
    const unmatchedEmails = this.emails.filter(email => 
      !this.matches.some(match => match.email.seqno === email.seqno)
    );
    
    if (unmatchedEmails.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('❌ NENAPÁROVANÉ EMAILY');
      console.log('='.repeat(80));
      
      unmatchedEmails.forEach(email => {
        console.log(`📧 Email ${email.seqno}: ${email.orderNumber} - ${email.customerName}`);
        console.log(`   💰 Suma: ${email.totalPrice}€`);
        console.log(`   📅 Dátum: ${email.startDate}`);
        console.log(`   ✉️  Email: ${email.email}`);
        console.log(`   📞 Telefón: ${email.phone}`);
      });
    }
    
    // Súhrn na konci
    console.log('\n' + '='.repeat(100));
    console.log('📈 FINÁLNY SÚHRN');
    console.log('='.repeat(100));
    console.log(`✅ Úspešne napárované: ${this.matches.length}/${this.rentals.length} prenájmov (${Math.round(this.matches.length/this.rentals.length*100)}%)`);
    console.log(`❌ Nenapárované prenájmy: ${unmatchedRentals.length}`);
    console.log(`❌ Nenapárované emaily: ${unmatchedEmails.length}`);
    
    const totalMissingData = this.matches.reduce((sum, match) => sum + match.missingData.length, 0);
    const totalDiscrepancies = this.matches.reduce((sum, match) => sum + match.dataDiscrepancies.length, 0);
    const totalSQLUpdates = this.matches.reduce((sum, match) => sum + match.sqlUpdates.length, 0);
    
    console.log(`🔧 Potrebných SQL UPDATE príkazov: ${totalSQLUpdates}`);
    console.log(`❌ Celkovo chýbajúcich údajov: ${totalMissingData}`);
    console.log(`⚠️  Celkovo rozdielov v dátach: ${totalDiscrepancies}`);
    
    // Ulož report do súboru
    await this.saveReportToFile();
  }

  // Ulož report do súboru
  async saveReportToFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `COMPLETE_RENTAL_EMAIL_MATCHING_REPORT_${timestamp}.md`;
    
    let reportContent = `# 📊 KOMPLETNÝ REPORT: NAPÁROVANIE VŠETKÝCH PRENÁJMOV S EMAILAMI\n\n`;
    reportContent += `**Dátum analýzy:** ${new Date().toLocaleString('sk-SK')}\n`;
    reportContent += `**Analyzované obdobie:** ${this.startDate.toISOString().split('T')[0]} - ${this.endDate.toISOString().split('T')[0]}\n`;
    reportContent += `**Prenájmov v databáze:** ${this.rentals.length}\n`;
    reportContent += `**Emailov z IMAP:** ${this.emails.length}\n`;
    reportContent += `**Úspešných napárovaní:** ${this.matches.length}\n\n`;
    
    reportContent += `---\n\n## ✅ ÚSPEŠNE NAPÁROVANÉ PRENÁJMY - SQL OPRAVY\n\n`;
    
    this.matches.forEach((match, index) => {
      reportContent += `### ${index + 1}. **${match.rental.customerName} (Rental ID: ${match.rental.id})**\n`;
      if (match.sqlUpdates.length > 0) {
        reportContent += `\`\`\`sql\n${match.sqlUpdates.join('\n')}\n\`\`\`\n`;
      }
      reportContent += `**Email info:** ${match.email.orderNumber}, Suma: ${match.email.totalPrice}€`;
      if (match.dataDiscrepancies.some(d => d.field === 'total_price')) {
        reportContent += ` (v DB: ${match.rental.totalPrice}€)`;
      } else {
        reportContent += ` ✅`;
      }
      reportContent += `, Dátum: ${match.email.startDate}\n\n`;
    });
    
    // Nenapárované
    const unmatchedRentals = this.rentals.filter(rental => 
      !this.matches.some(match => match.rental.id === rental.id)
    );
    
    if (unmatchedRentals.length > 0) {
      reportContent += `## ❌ NENAPÁROVANÉ PRENÁJMY (${unmatchedRentals.length})\n\n`;
      unmatchedRentals.forEach(rental => {
        reportContent += `- **${rental.customerName}** (ID: ${rental.id}) - ${rental.totalPrice}€, ${new Date(rental.startDate).toISOString().split('T')[0]}\n`;
      });
      reportContent += `\n`;
    }
    
    const unmatchedEmails = this.emails.filter(email => 
      !this.matches.some(match => match.email.seqno === email.seqno)
    );
    
    if (unmatchedEmails.length > 0) {
      reportContent += `## ❌ NENAPÁROVANÉ EMAILY (${unmatchedEmails.length})\n\n`;
      unmatchedEmails.forEach(email => {
        reportContent += `- **${email.customerName}** - ${email.orderNumber} (${email.totalPrice}€, ${email.startDate})\n`;
      });
      reportContent += `\n`;
    }
    
    reportContent += `---\n\n## 📊 ŠTATISTIKY\n\n`;
    reportContent += `- **Úspešnosť napárovania:** ${this.matches.length}/${this.rentals.length} prenájmov (${Math.round(this.matches.length/this.rentals.length*100)}%)\n`;
    reportContent += `- **Nenapárované prenájmy:** ${unmatchedRentals.length}\n`;
    reportContent += `- **Nenapárované emaily:** ${unmatchedEmails.length}\n`;
    
    fs.writeFileSync(filename, reportContent);
    console.log(`\n💾 Report uložený do súboru: ${filename}`);
  }

  // Hlavná metóda
  async run() {
    try {
      console.log('🚀 ŠTART: Kompletné napárovanie prenájmov s emailami');
      console.log('='.repeat(60));
      
      await this.loadRentalsFromDatabase();
      await this.loadEmailsFromIMAP();
      await this.matchAllRentalsWithEmails();
      await this.generateCompleteReport();
      
      console.log('\n✅ KOMPLETNÁ ANALÝZA DOKONČENÁ!');
      
    } catch (error) {
      console.error('❌ Kritická chyba:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }
}

// Spustenie
async function main() {
  const matcher = new CompleteRentalEmailMatcher();
  
  try {
    await matcher.run();
  } catch (error) {
    console.error('❌ Chyba:', error);
    process.exit(1);
  }
}

main();
