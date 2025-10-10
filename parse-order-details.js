#!/usr/bin/env node

/**
 * Script na detailné parsovanie objednávok za posledných 7 dní
 * Extrahuje konkrétne informácie z HTML emailov
 */

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const cheerio = require('cheerio');

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

class OrderParser {
  constructor() {
    this.imap = new Imap(imapConfig);
    this.orders = [];
  }

  async parseOrders() {
    if (!imapConfig.password) {
      console.error('❌ IMAP_PASSWORD nie je nastavené');
      return;
    }

    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        console.log('📧 IMAP: Pripojenie úspešné');
        this.searchAndParseEmails(resolve, reject);
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

  searchAndParseEmails(resolve, reject) {
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

      console.log(`🔍 Parsovanie objednávok od ${sevenDaysAgoStr}`);

      this.imap.search([
        ['SINCE', sevenDaysAgoStr], 
        ['SUBJECT', 'Objednávka od zákaznika']
      ], (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        if (!results || results.length === 0) {
          console.log('📭 Žiadne objednávky');
          this.imap.end();
          resolve([]);
          return;
        }

        console.log(`📧 Parsovanie ${results.length} objednávok...`);
        this.processOrderEmails(results, resolve, reject);
      });
    });
  }

  processOrderEmails(results, resolve, reject) {
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
              const orderDetails = this.extractOrderDetails(parsed, seqno);
              if (orderDetails) {
                this.orders.push(orderDetails);
              }
            }
            
            processed++;
            if (processed === total) {
              this.imap.end();
              resolve(this.orders);
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

  extractOrderDetails(parsed, seqno) {
    try {
      const html = parsed.html || parsed.text || '';
      const $ = cheerio.load(html);
      
      // Základné informácie
      const orderDetails = {
        seqno,
        date: parsed.date,
        from: parsed.from?.text || 'Unknown',
        
        // Inicializácia polí
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        vehicleName: '',
        vehicleCode: '',
        startDate: '',
        endDate: '',
        totalPrice: '',
        deposit: '',
        handoverPlace: '',
        dailyKilometers: '',
        orderNumber: '',
        
        // Raw obsah pre debugging
        rawText: parsed.text?.substring(0, 500) || '',
        rawHtml: html.substring(0, 500) || ''
      };

      // Pokús sa extrahovať informácie z textu
      const text = parsed.text || '';
      
      // Hľadaj zákaznícke informácie
      const customerNameMatch = text.match(/Meno a priezvisko:\s*([^\n\r]+)/i) || 
                               text.match(/Zákazník:\s*([^\n\r]+)/i) ||
                               text.match(/Customer:\s*([^\n\r]+)/i);
      if (customerNameMatch) {
        orderDetails.customerName = customerNameMatch[1].trim();
      }

      const emailMatch = text.match(/E-mail:\s*([^\s\n\r]+)/i) ||
                        text.match(/Email:\s*([^\s\n\r]+)/i);
      if (emailMatch) {
        orderDetails.customerEmail = emailMatch[1].trim();
      }

      const phoneMatch = text.match(/Telefón:\s*([^\n\r]+)/i) ||
                        text.match(/Phone:\s*([^\n\r]+)/i);
      if (phoneMatch) {
        orderDetails.customerPhone = phoneMatch[1].trim();
      }

      // Hľadaj informácie o vozidle
      const vehicleMatch = text.match(/Vozidlo:\s*([^\n\r]+)/i) ||
                          text.match(/Vehicle:\s*([^\n\r]+)/i);
      if (vehicleMatch) {
        orderDetails.vehicleName = vehicleMatch[1].trim();
      }

      const codeMatch = text.match(/Kód vozidla:\s*([^\n\r]+)/i) ||
                       text.match(/ŠPZ:\s*([^\n\r]+)/i) ||
                       text.match(/License plate:\s*([^\n\r]+)/i);
      if (codeMatch) {
        orderDetails.vehicleCode = codeMatch[1].trim();
      }

      // Hľadaj dátumy
      const startDateMatch = text.match(/Začiatok prenájmu:\s*([^\n\r]+)/i) ||
                            text.match(/Od:\s*([^\n\r]+)/i) ||
                            text.match(/Start date:\s*([^\n\r]+)/i);
      if (startDateMatch) {
        orderDetails.startDate = startDateMatch[1].trim();
      }

      const endDateMatch = text.match(/Koniec prenájmu:\s*([^\n\r]+)/i) ||
                          text.match(/Do:\s*([^\n\r]+)/i) ||
                          text.match(/End date:\s*([^\n\r]+)/i);
      if (endDateMatch) {
        orderDetails.endDate = endDateMatch[1].trim();
      }

      // Hľadaj ceny
      const priceMatch = text.match(/Celková cena:\s*([^\n\r]+)/i) ||
                        text.match(/Total price:\s*([^\n\r]+)/i) ||
                        text.match(/Cena:\s*([^\n\r]+)/i);
      if (priceMatch) {
        orderDetails.totalPrice = priceMatch[1].trim();
      }

      const depositMatch = text.match(/Záloha:\s*([^\n\r]+)/i) ||
                          text.match(/Deposit:\s*([^\n\r]+)/i);
      if (depositMatch) {
        orderDetails.deposit = depositMatch[1].trim();
      }

      // Hľadaj číslo objednávky
      const orderNumberMatch = text.match(/Číslo objednávky:\s*([^\n\r]+)/i) ||
                              text.match(/Order number:\s*([^\n\r]+)/i) ||
                              text.match(/Objednávka č\.\s*([^\n\r]+)/i);
      if (orderNumberMatch) {
        orderDetails.orderNumber = orderNumberMatch[1].trim();
      }

      console.log(`📧 Email ${seqno}: ${orderDetails.customerName || 'Unknown'} - ${orderDetails.vehicleName || 'Unknown vehicle'}`);
      
      return orderDetails;
      
    } catch (error) {
      console.error(`❌ Chyba pri extrahovaní detailov z emailu ${seqno}:`, error);
      return null;
    }
  }

  generateDetailedReport(orders) {
    console.log('\n' + '='.repeat(100));
    console.log('📊 DETAILNÝ REPORT: OBJEDNÁVKY ZA POSLEDNÝCH 7 DNÍ');
    console.log('='.repeat(100));
    
    if (orders.length === 0) {
      console.log('❌ Žiadne objednávky neboli nájdené');
      return;
    }

    console.log(`✅ Celkovo spracovaných objednávok: ${orders.length}\n`);

    // Štatistiky
    const stats = {
      withCustomerName: orders.filter(o => o.customerName).length,
      withEmail: orders.filter(o => o.customerEmail).length,
      withPhone: orders.filter(o => o.customerPhone).length,
      withVehicle: orders.filter(o => o.vehicleName).length,
      withPrice: orders.filter(o => o.totalPrice).length,
      withOrderNumber: orders.filter(o => o.orderNumber).length
    };

    console.log('📈 ŠTATISTIKY PARSOVANIE:');
    console.log(`   Meno zákazníka: ${stats.withCustomerName}/${orders.length} (${Math.round(stats.withCustomerName/orders.length*100)}%)`);
    console.log(`   Email: ${stats.withEmail}/${orders.length} (${Math.round(stats.withEmail/orders.length*100)}%)`);
    console.log(`   Telefón: ${stats.withPhone}/${orders.length} (${Math.round(stats.withPhone/orders.length*100)}%)`);
    console.log(`   Vozidlo: ${stats.withVehicle}/${orders.length} (${Math.round(stats.withVehicle/orders.length*100)}%)`);
    console.log(`   Cena: ${stats.withPrice}/${orders.length} (${Math.round(stats.withPrice/orders.length*100)}%)`);
    console.log(`   Číslo objednávky: ${stats.withOrderNumber}/${orders.length} (${Math.round(stats.withOrderNumber/orders.length*100)}%)`);

    console.log('\n📋 DETAILNÉ OBJEDNÁVKY:');
    console.log('='.repeat(100));

    orders.forEach((order, index) => {
      console.log(`\n📧 OBJEDNÁVKA ${index + 1} (Email ${order.seqno}):`);
      console.log(`   📅 Dátum: ${order.date}`);
      console.log(`   👤 Zákazník: ${order.customerName || '❌ Nenájdené'}`);
      console.log(`   📧 Email: ${order.customerEmail || '❌ Nenájdené'}`);
      console.log(`   📱 Telefón: ${order.customerPhone || '❌ Nenájdené'}`);
      console.log(`   🚗 Vozidlo: ${order.vehicleName || '❌ Nenájdené'}`);
      console.log(`   🔢 Kód/ŠPZ: ${order.vehicleCode || '❌ Nenájdené'}`);
      console.log(`   📅 Od: ${order.startDate || '❌ Nenájdené'}`);
      console.log(`   📅 Do: ${order.endDate || '❌ Nenájdené'}`);
      console.log(`   💰 Cena: ${order.totalPrice || '❌ Nenájdené'}`);
      console.log(`   💳 Záloha: ${order.deposit || '❌ Nenájdené'}`);
      console.log(`   🏷️  Číslo objednávky: ${order.orderNumber || '❌ Nenájdené'}`);
      
      // Ak nie sú extrahované základné informácie, ukáž raw text
      if (!order.customerName && !order.vehicleName) {
        console.log(`   🔍 Raw text (prvých 300 znakov):`);
        console.log(`      ${order.rawText.substring(0, 300)}...`);
      }
      
      console.log('-'.repeat(80));
    });

    // Zoskupenie podľa dní
    const byDay = {};
    orders.forEach(order => {
      const day = order.date.toDateString();
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(order);
    });

    console.log('\n📅 ROZDELENIE PODĽA DNÍ:');
    Object.entries(byDay).forEach(([day, dayOrders]) => {
      console.log(`   ${day}: ${dayOrders.length} objednávok`);
      dayOrders.forEach(order => {
        console.log(`      - ${order.customerName || 'Unknown'} (${order.vehicleName || 'Unknown vehicle'})`);
      });
    });
  }
}

// Spustenie
async function main() {
  const parser = new OrderParser();
  
  try {
    const orders = await parser.parseOrders();
    parser.generateDetailedReport(orders);
  } catch (error) {
    console.error('❌ Chyba:', error);
    process.exit(1);
  }
}

main();
