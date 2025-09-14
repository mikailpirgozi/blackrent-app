#!/usr/bin/env node

/**
 * Script na analýzu a napárovanie emailov s prenájmami
 */

const fs = require('fs');
const path = require('path');

class EmailRentalAnalyzer {
  constructor() {
    this.emails = [];
    this.rentals = [];
    this.matches = [];
  }

  // Načítaj všetky emaily z all-emails priečinka
  loadEmails() {
    console.log('📧 Načítavam emaily...');
    const emailDir = 'all-emails';
    
    if (!fs.existsSync(emailDir)) {
      console.error('❌ Priečinok all-emails neexistuje');
      return;
    }

    const files = fs.readdirSync(emailDir).filter(f => f.endsWith('.html'));
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(emailDir, file), 'utf8');
        const emailData = this.parseEmailContent(content, file);
        if (emailData) {
          this.emails.push(emailData);
        }
      } catch (error) {
        console.error(`❌ Chyba pri načítaní ${file}:`, error.message);
      }
    }

    console.log(`✅ Načítaných ${this.emails.length} emailov`);
  }

  // Parsuj obsah emailu a extrahuj dôležité informácie
  parseEmailContent(content, filename) {
    try {
      // Extrahuj seqno z názvu súboru
      const seqnoMatch = filename.match(/email-(\d+)-/);
      const seqno = seqnoMatch ? seqnoMatch[1] : 'unknown';

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

      // Extrahuj dátum prijatia
      const dateMatch = content.match(/Objednávka prijatá<\/td>\s*<td[^>]*>([^<]+)<\/td>/);
      const orderDate = dateMatch ? dateMatch[1].trim() : null;

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
        orderDate,
        filename
      };
    } catch (error) {
      console.error(`❌ Chyba pri parsovaní ${filename}:`, error.message);
      return null;
    }
  }

  // Načítaj prenájmy z databázy (simulácia - v reálnosti by to bolo z DB)
  loadRentals() {
    // Tieto dáta by sa načítali z databázy
    this.rentals = [
      { id: 9, customer_name: 'Tromex house s.r.o.', order_number: null, start_date: '2025-09-04 08:00:00', end_date: '2025-09-07 08:00:00', total_price: 960.00, customer_email: null, customer_phone: null },
      { id: 50, customer_name: 'Valko', order_number: null, start_date: '2025-09-05 08:00:00', end_date: '2025-10-03 08:00:00', total_price: 700.00, customer_email: null, customer_phone: null },
      { id: 11, customer_name: 'Luculus', order_number: null, start_date: '2025-09-05 08:00:00', end_date: '2025-10-05 08:00:00', total_price: 2926.83, customer_email: null, customer_phone: null },
      { id: 49, customer_name: 'Zurbola', order_number: null, start_date: '2025-09-05 08:00:00', end_date: '2025-09-08 08:00:00', total_price: 900.00, customer_email: null, customer_phone: null },
      { id: 10, customer_name: 'Daniel Mutnansky', order_number: null, start_date: '2025-09-04 08:00:00', end_date: '2025-09-05 08:00:00', total_price: 100.00, customer_email: null, customer_phone: null },
      { id: 17, customer_name: 'EUROCOVER Slovakia, s.r.o.', order_number: null, start_date: '2025-09-04 08:00:00', end_date: '2025-09-08 08:00:00', total_price: 1080.00, customer_email: null, customer_phone: null },
      { id: 51, customer_name: 'Baťa', order_number: null, start_date: '2025-09-03 08:00:00', end_date: '2025-09-07 08:00:00', total_price: 1000.00, customer_email: null, customer_phone: null },
      { id: 14, customer_name: 'Lucas Trans Group s. r. o.', order_number: null, start_date: '2025-09-03 08:00:00', end_date: '2025-09-08 08:00:00', total_price: 225.00, customer_email: null, customer_phone: null },
      { id: 15, customer_name: 'Tomáš Horváth', order_number: null, start_date: '2025-09-03 08:00:00', end_date: '2025-09-05 08:00:00', total_price: 360.00, customer_email: null, customer_phone: null },
      { id: 21, customer_name: 'Vladimir Brodzianovsky', order_number: null, start_date: '2025-09-03 08:00:00', end_date: '2025-09-12 08:00:00', total_price: 315.00, customer_email: null, customer_phone: null },
      { id: 13, customer_name: 'Lukáš Slávka', order_number: null, start_date: '2025-09-03 08:00:00', end_date: '2025-09-05 08:00:00', total_price: 150.00, customer_email: null, customer_phone: null },
      { id: 18, customer_name: 'Michal Rakovan', order_number: null, start_date: '2025-09-02 08:00:00', end_date: '2025-09-05 08:00:00', total_price: 585.00, customer_email: null, customer_phone: null },
      { id: 16, customer_name: 'Tomáš Horváth', order_number: null, start_date: '2025-09-02 08:00:00', end_date: '2025-09-03 08:00:00', total_price: 150.00, customer_email: null, customer_phone: null },
      { id: 22, customer_name: 'Vladimir Brodzianovsky', order_number: null, start_date: '2025-09-01 08:00:00', end_date: '2025-09-03 08:00:00', total_price: 126.00, customer_email: null, customer_phone: null },
      { id: 24, customer_name: 'David Hano', order_number: null, start_date: '2025-08-31 08:00:00', end_date: '2025-09-04 08:00:00', total_price: 380.00, customer_email: null, customer_phone: null },
      { id: 23, customer_name: 'Mikail Pirgozi', order_number: null, start_date: '2025-08-31 08:00:00', end_date: '2025-08-31 08:00:00', total_price: 100.00, customer_email: null, customer_phone: null },
      { id: 25, customer_name: 'Damián Minárik', order_number: null, start_date: '2025-08-30 08:00:00', end_date: '2025-08-31 08:00:00', total_price: 310.00, customer_email: null, customer_phone: null }
    ];
    
    console.log(`✅ Načítaných ${this.rentals.length} prenájmov bez order_number`);
  }

  // Napáruj emaily s prenájmami
  matchEmailsWithRentals() {
    console.log('\n🔍 Začínam napárovanie...\n');

    for (const email of this.emails) {
      console.log(`📧 Analyzujem email ${email.seqno}: ${email.orderNumber} - ${email.customerName}`);
      
      // Hľadaj presné napárovanie podľa mena
      const exactMatches = this.rentals.filter(rental => 
        this.normalizeString(rental.customer_name) === this.normalizeString(email.customerName)
      );

      if (exactMatches.length === 1) {
        const rental = exactMatches[0];
        const match = this.createMatch(email, rental, 'exact_name');
        this.matches.push(match);
        console.log(`   ✅ PRESNÉ NAPÁROVANIE: Rental ID ${rental.id}`);
        continue;
      }

      // Hľadaj napárovanie podľa podobného mena
      const similarMatches = this.rentals.filter(rental => 
        this.isSimilarName(rental.customer_name, email.customerName)
      );

      if (similarMatches.length === 1) {
        const rental = similarMatches[0];
        const match = this.createMatch(email, rental, 'similar_name');
        this.matches.push(match);
        console.log(`   🔶 PODOBNÉ NAPÁROVANIE: Rental ID ${rental.id} (${rental.customer_name})`);
        continue;
      }

      // Hľadaj napárovanie podľa sumy a dátumu
      const priceMatches = this.rentals.filter(rental => {
        const emailStartDate = email.startDate ? email.startDate.split(' ')[0] : null;
        const rentalStartDate = rental.start_date ? rental.start_date.split(' ')[0] : null;
        
        return Math.abs(rental.total_price - email.totalPrice) < 0.01 && 
               emailStartDate === rentalStartDate;
      });

      if (priceMatches.length === 1) {
        const rental = priceMatches[0];
        const match = this.createMatch(email, rental, 'price_date');
        this.matches.push(match);
        console.log(`   🔷 NAPÁROVANIE PODĽA SUMY A DÁTUMU: Rental ID ${rental.id} (${rental.customer_name})`);
        continue;
      }

      console.log(`   ❌ Nenašlo sa napárovanie pre ${email.customerName}`);
    }
  }

  // Vytvor match objekt
  createMatch(email, rental, matchType) {
    return {
      email,
      rental,
      matchType,
      confidence: this.calculateConfidence(email, rental, matchType),
      missingData: this.identifyMissingData(email, rental)
    };
  }

  // Vypočítaj confidence score
  calculateConfidence(email, rental, matchType) {
    let score = 0;
    
    switch (matchType) {
      case 'exact_name': score = 90; break;
      case 'similar_name': score = 70; break;
      case 'price_date': score = 60; break;
    }

    // Bonus za zhodné sumy
    if (Math.abs(rental.total_price - email.totalPrice) < 0.01) {
      score += 10;
    }

    // Bonus za zhodné dátumy
    const emailStartDate = email.startDate ? email.startDate.split(' ')[0] : null;
    const rentalStartDate = rental.start_date ? rental.start_date.split(' ')[0] : null;
    if (emailStartDate === rentalStartDate) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  // Identifikuj chýbajúce dáta
  identifyMissingData(email, rental) {
    const missing = [];
    
    if (!rental.order_number) missing.push('order_number');
    if (!rental.customer_email) missing.push('customer_email');
    if (!rental.customer_phone) missing.push('customer_phone');
    
    // Kontrola času
    const emailTime = email.startDate ? email.startDate.split(' ')[1] : null;
    const rentalTime = rental.start_date ? rental.start_date.split(' ')[1] : null;
    if (emailTime && rentalTime && emailTime !== rentalTime) {
      missing.push('start_time');
    }

    return missing;
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

  // Vygeneruj report
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 REPORT: NAPÁROVANIE EMAILOV S PRENÁJMAMI');
    console.log('='.repeat(80));
    
    console.log(`✅ Celkovo nájdených napárovaní: ${this.matches.length}`);
    console.log(`📧 Analyzovaných emailov: ${this.emails.length}`);
    console.log(`🏢 Prenájmov bez order_number: ${this.rentals.length}`);
    
    console.log('\n📋 DETAILNÉ NAPÁROVANIA:\n');
    
    this.matches.forEach((match, index) => {
      console.log(`${index + 1}. 📧 Email ${match.email.seqno}: ${match.email.orderNumber}`);
      console.log(`   👤 Zákazník: ${match.email.customerName}`);
      console.log(`   🏢 Rental ID: ${match.rental.id} (${match.rental.customer_name})`);
      console.log(`   🎯 Match Type: ${match.matchType} (${match.confidence}% confidence)`);
      console.log(`   💰 Suma: Email ${match.email.totalPrice}€ | Rental ${match.rental.total_price}€`);
      console.log(`   📅 Dátum: Email ${match.email.startDate} | Rental ${match.rental.start_date}`);
      console.log(`   ❌ Chýbajúce dáta: ${match.missingData.join(', ') || 'žiadne'}`);
      
      if (match.missingData.length > 0) {
        console.log(`   🔧 POTREBNÉ OPRAVY:`);
        if (match.missingData.includes('order_number')) {
          console.log(`      - Pridať order_number: ${match.email.orderNumber}`);
        }
        if (match.missingData.includes('customer_email')) {
          console.log(`      - Pridať email: ${match.email.email}`);
        }
        if (match.missingData.includes('customer_phone')) {
          console.log(`      - Pridať telefón: ${match.email.phone}`);
        }
        if (match.missingData.includes('start_time')) {
          console.log(`      - Opraviť čas: z ${match.rental.start_date} na ${match.email.startDate}`);
        }
      }
      
      console.log('-'.repeat(60));
    });

    // Nenájdené emaily
    const unmatchedEmails = this.emails.filter(email => 
      !this.matches.some(match => match.email.seqno === email.seqno)
    );

    if (unmatchedEmails.length > 0) {
      console.log('\n❌ NENÁJDENÉ NAPÁROVANIA:\n');
      unmatchedEmails.forEach(email => {
        console.log(`📧 Email ${email.seqno}: ${email.orderNumber} - ${email.customerName}`);
        console.log(`   💰 Suma: ${email.totalPrice}€`);
        console.log(`   📅 Dátum: ${email.startDate}`);
      });
    }
  }

  // Hlavná metóda
  async analyze() {
    console.log('🚀 Začínam analýzu emailov a prenájmov...\n');
    
    this.loadEmails();
    this.loadRentals();
    this.matchEmailsWithRentals();
    this.generateReport();
    
    console.log('\n✅ Analýza dokončená!');
  }
}

// Spustenie
async function main() {
  const analyzer = new EmailRentalAnalyzer();
  
  try {
    await analyzer.analyze();
  } catch (error) {
    console.error('❌ Chyba:', error);
    process.exit(1);
  }
}

main();
