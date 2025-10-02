#!/usr/bin/env node

/**
 * Script na porovnanie emailových objednávok s existujúcimi prenájmami
 * Zistí ktoré objednávky nie sú v databáze
 */

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { Client } = require('pg');

// IMAP konfigurácia
const imapConfig = {
  host: 'imap.m1.websupport.sk',
  port: 993,
  secure: true,
  user: 'info@blackrent.sk',
  password: process.env.IMAP_PASSWORD || '',
  tls: true,
  tlsOptions: {
    rejectUnauthorized: false
  }
};

// PostgreSQL konfigurácia
const dbConfig = {
  host: 'trolley.proxy.rlwy.net',
  port: 13400,
  database: 'railway',
  user: 'postgres',
  password: 'nfwrpKxILRUMqunYTZJEhjudEstqLRGv'
};

class OrderRentalComparator {
  constructor() {
    this.imap = new Imap(imapConfig);
    this.dbClient = new Client(dbConfig);
    this.emailOrders = [];
    this.dbRentals = [];
  }

  async compare() {
    if (!imapConfig.password) {
      console.error('❌ IMAP_PASSWORD nie je nastavené');
      return;
    }

    try {
      // 1. Získaj emaily za posledných 7 dní
      console.log('📧 Získavam emailové objednávky za posledných 7 dní...');
      await this.getEmailOrders();
      
      // 2. Získaj prenájmy z databázy za posledných 7 dní
      console.log('🗄️ Získavam prenájmy z databázy za posledných 7 dní...');
      await this.getDatabaseRentals();
      
      // 3. Porovnaj a nájdi chýbajúce
      console.log('🔍 Porovnávam objednávky s prenájmami...');
      this.findMissingRentals();
      
    } catch (error) {
      console.error('❌ Chyba:', error);
    }
  }

  async getEmailOrders() {
    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        this.searchEmailOrders(resolve, reject);
      });

      this.imap.once('error', (err) => {
        reject(err);
      });

      this.imap.once('end', () => {
        console.log('📧 IMAP: Pripojenie ukončené');
      });

      this.imap.connect();
    });
  }

  searchEmailOrders(resolve, reject) {
    this.imap.openBox('INBOX', true, (err, box) => {
      if (err) {
        reject(err);
        return;
      }

      // Vypočítaj dátum pred 7 dňami
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const sevenDaysAgoStr = sevenDaysAgo.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });

      this.imap.search([
        ['SINCE', sevenDaysAgoStr], 
        ['SUBJECT', 'Objednávka od zákaznika']
      ], (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        if (!results || results.length === 0) {
          console.log('📭 Žiadne emailové objednávky');
          this.imap.end();
          resolve([]);
          return;
        }

        console.log(`📧 Našiel som ${results.length} emailových objednávok`);
        this.processEmailOrders(results, resolve, reject);
      });
    });
  }

  processEmailOrders(results, resolve, reject) {
    const fetch = this.imap.fetch(results, { 
      bodies: '',
      markSeen: false 
    });

    let processed = 0;
    const total = results.length;

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
              const orderData = this.extractOrderData(parsed, seqno);
              if (orderData) {
                this.emailOrders.push(orderData);
              }
            }
            
            processed++;
            if (processed === total) {
              this.imap.end();
              resolve();
            }
          });
        });
      });
    });

    fetch.once('error', (err) => {
      reject(err);
    });
  }

  extractOrderData(parsed, seqno) {
    try {
      const html = parsed.html || '';
      const text = parsed.text || '';
      
      // Extrahuj dáta z HTML pomocou regex
      const orderNumberMatch = html.match(/Číslo objednávky[^>]*>([^<]+)</i);
      const customerMatch = html.match(/Odoberateľ[^>]*>([^<]+)</i);
      const emailMatch = html.match(/E-mail[^>]*>([^<]+)</i);
      const phoneMatch = html.match(/Telefon[^>]*>([^<]+)</i);
      const vehicleMatch = html.match(/Názov[^>]*>([^<]+)</i);
      const vehicleCodeMatch = html.match(/Kód[^>]*>([^<]+)</i);
      const priceMatch = html.match(/Suma k úhrade[^>]*>([^<]+)</i);
      const dateRangeMatch = html.match(/Čas rezervacie[^>]*>([^<]+)</i);
      
      const orderData = {
        seqno,
        emailDate: parsed.date,
        orderNumber: orderNumberMatch ? orderNumberMatch[1].trim() : '',
        customerName: customerMatch ? customerMatch[1].trim() : '',
        customerEmail: emailMatch ? emailMatch[1].trim() : '',
        customerPhone: phoneMatch ? phoneMatch[1].trim() : '',
        vehicleName: vehicleMatch ? vehicleMatch[1].trim() : '',
        vehicleCode: vehicleCodeMatch ? vehicleCodeMatch[1].trim() : '',
        totalPrice: priceMatch ? priceMatch[1].trim() : '',
        dateRange: dateRangeMatch ? dateRangeMatch[1].trim() : '',
        startDate: '',
        endDate: ''
      };

      // Parsuj dátumy z rozsahu
      if (orderData.dateRange) {
        const dateMatch = orderData.dateRange.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) - (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
        if (dateMatch) {
          orderData.startDate = dateMatch[1];
          orderData.endDate = dateMatch[2];
        }
      }

      return orderData;
      
    } catch (error) {
      console.error(`❌ Chyba pri extrahovaní dát z emailu ${seqno}:`, error);
      return null;
    }
  }

  async getDatabaseRentals() {
    try {
      await this.dbClient.connect();
      
      const query = `
        SELECT 
          id, 
          customer_name, 
          customer_email, 
          customer_phone,
          start_date, 
          end_date, 
          total_price,
          created_at,
          vehicle_id
        FROM rentals 
        WHERE created_at >= NOW() - INTERVAL '7 days' 
        ORDER BY created_at DESC
      `;
      
      const result = await this.dbClient.query(query);
      this.dbRentals = result.rows;
      
      console.log(`🗄️ Našiel som ${this.dbRentals.length} prenájmov v databáze`);
      
    } catch (error) {
      console.error('❌ Chyba pri získavaní prenájmov z databázy:', error);
    } finally {
      await this.dbClient.end();
    }
  }

  findMissingRentals() {
    console.log('\n' + '='.repeat(100));
    console.log('📊 POROVNANIE EMAILOVÝCH OBJEDNÁVOK S PRENÁJMAMI V DATABÁZE');
    console.log('='.repeat(100));
    
    console.log(`📧 Emailové objednávky: ${this.emailOrders.length}`);
    console.log(`🗄️ Prenájmy v databáze: ${this.dbRentals.length}`);
    
    const missingRentals = [];
    
    // Pre každú emailovú objednávku skontroluj či existuje v databáze
    this.emailOrders.forEach(order => {
      const matchingRental = this.dbRentals.find(rental => {
        // Porovnaj podľa mena zákazníka a dátumov
        const nameMatch = rental.customer_name && order.customerName && 
          rental.customer_name.toLowerCase().trim() === order.customerName.toLowerCase().trim();
        
        const emailMatch = rental.customer_email && order.customerEmail &&
          rental.customer_email.toLowerCase().trim() === order.customerEmail.toLowerCase().trim();
        
        // Porovnaj dátumy (konvertuj na rovnaký formát)
        let dateMatch = false;
        if (order.startDate && rental.start_date) {
          const orderStart = new Date(order.startDate).toDateString();
          const rentalStart = new Date(rental.start_date).toDateString();
          dateMatch = orderStart === rentalStart;
        }
        
        return (nameMatch || emailMatch) && dateMatch;
      });
      
      if (!matchingRental) {
        missingRentals.push(order);
      }
    });
    
    console.log(`\n❌ CHÝBAJÚCE PRENÁJMY: ${missingRentals.length}`);
    
    if (missingRentals.length === 0) {
      console.log('✅ Všetky emailové objednávky majú zodpovedajúce prenájmy v databáze!');
    } else {
      console.log('\n📋 ZOZNAM CHÝBAJÚCICH PRENÁJMOV:');
      console.log('='.repeat(100));
      
      missingRentals.forEach((order, index) => {
        console.log(`\n🚫 CHÝBAJÚCI PRENÁJOM ${index + 1}:`);
        console.log(`   📧 Email ID: ${order.seqno}`);
        console.log(`   📅 Dátum emailu: ${order.emailDate}`);
        console.log(`   🏷️  Číslo objednávky: ${order.orderNumber || '❌ Nenájdené'}`);
        console.log(`   👤 Zákazník: ${order.customerName || '❌ Nenájdené'}`);
        console.log(`   📧 Email: ${order.customerEmail || '❌ Nenájdené'}`);
        console.log(`   📱 Telefón: ${order.customerPhone || '❌ Nenájdené'}`);
        console.log(`   🚗 Vozidlo: ${order.vehicleName || '❌ Nenájdené'}`);
        console.log(`   🔢 Kód vozidla: ${order.vehicleCode || '❌ Nenájdené'}`);
        console.log(`   📅 Od: ${order.startDate || '❌ Nenájdené'}`);
        console.log(`   📅 Do: ${order.endDate || '❌ Nenájdené'}`);
        console.log(`   💰 Cena: ${order.totalPrice || '❌ Nenájdené'}`);
        console.log('-'.repeat(80));
      });
    }
    
    // Zoskupenie podľa dní
    if (missingRentals.length > 0) {
      const byDay = {};
      missingRentals.forEach(order => {
        const day = new Date(order.emailDate).toDateString();
        if (!byDay[day]) byDay[day] = [];
        byDay[day].push(order);
      });

      console.log('\n📅 CHÝBAJÚCE PRENÁJMY PODĽA DNÍ:');
      Object.entries(byDay).forEach(([day, orders]) => {
        console.log(`   ${day}: ${orders.length} chýbajúcich prenájmov`);
        orders.forEach(order => {
          console.log(`      - ${order.customerName || 'Unknown'} (${order.vehicleName || 'Unknown vehicle'})`);
        });
      });
    }
    
    // Existujúce prenájmy
    console.log('\n✅ EXISTUJÚCE PRENÁJMY V DATABÁZE:');
    console.log('='.repeat(100));
    
    if (this.dbRentals.length === 0) {
      console.log('❌ Žiadne prenájmy v databáze za posledných 7 dní');
    } else {
      this.dbRentals.forEach((rental, index) => {
        console.log(`\n✅ PRENÁJOM ${index + 1}:`);
        console.log(`   🆔 ID: ${rental.id}`);
        console.log(`   👤 Zákazník: ${rental.customer_name || 'N/A'}`);
        console.log(`   📧 Email: ${rental.customer_email || 'N/A'}`);
        console.log(`   📅 Od: ${rental.start_date}`);
        console.log(`   📅 Do: ${rental.end_date}`);
        console.log(`   💰 Cena: ${rental.total_price} €`);
        console.log(`   📅 Vytvorené: ${rental.created_at}`);
      });
    }
  }
}

// Spustenie
async function main() {
  const comparator = new OrderRentalComparator();
  await comparator.compare();
}

main();
