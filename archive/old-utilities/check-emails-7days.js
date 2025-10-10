#!/usr/bin/env node

/**
 * Script na kontrolu emailov za posledných 7 dní
 * Hľadá všetky emaily s predmetom "Objednávka od zákaznika"
 */

const Imap = require('imap');
const { simpleParser } = require('mailparser');

// IMAP konfigurácia - použijem rovnakú ako v aplikácii
const imapConfig = {
  host: 'imap.m1.websupport.sk',
  port: 993,
  secure: true,
  user: 'info@blackrent.sk',
  password: process.env.IMAP_PASSWORD || '', // Potrebujeme heslo z env
  tls: true,
  tlsOptions: {
    rejectUnauthorized: false
  }
};

class EmailChecker {
  constructor() {
    this.imap = new Imap(imapConfig);
    this.foundEmails = [];
  }

  async checkEmails() {
    if (!imapConfig.password) {
      console.error('❌ IMAP_PASSWORD nie je nastavené');
      console.log('💡 Spustite: IMAP_PASSWORD="your-password" node check-emails-7days.js');
      return;
    }

    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        console.log('📧 IMAP: Pripojenie úspešné');
        this.searchEmails(resolve, reject);
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

  searchEmails(resolve, reject) {
    this.imap.openBox('INBOX', true, (err, box) => {
      if (err) {
        reject(err);
        return;
      }

      console.log('📬 IMAP: Kontrolujem emaily za posledných 7 dní...');
      
      // Vypočítaj dátum pred 7 dňami
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const sevenDaysAgoStr = sevenDaysAgo.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });

      console.log(`🔍 Hľadám emaily od ${sevenDaysAgoStr} s predmetom "Objednávka od zákaznika"`);

      // Hľadaj emaily za posledných 7 dní s predmetom "Objednávka od zákaznika"
      this.imap.search([
        ['SINCE', sevenDaysAgoStr], 
        ['SUBJECT', 'Objednávka od zákaznika']
      ], (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        if (!results || results.length === 0) {
          console.log(`📭 Žiadne objednávky za posledných 7 dní (od ${sevenDaysAgoStr})`);
          this.imap.end();
          resolve([]);
          return;
        }

        console.log(`📧 Našiel som ${results.length} emailov s objednávkami za posledných 7 dní!`);
        this.processEmails(results, resolve, reject);
      });
    });
  }

  processEmails(results, resolve, reject) {
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
              this.foundEmails.push({
                seqno,
                from: parsed.from?.text || 'Unknown',
                subject: parsed.subject || 'No subject',
                date: parsed.date || new Date(),
                text: parsed.text || '',
                html: parsed.html || ''
              });
              
              console.log(`📧 Email ${seqno}: ${parsed.from?.text} - ${parsed.subject} (${parsed.date})`);
            }
            
            processed++;
            if (processed === total) {
              this.imap.end();
              resolve(this.foundEmails);
            }
          });
        });
      });

      msg.once('attributes', (attrs) => {
        console.log(`📧 Email ${seqno} attributes:`, attrs.date);
      });
    });

    fetch.once('error', (err) => {
      console.error('❌ Fetch error:', err);
      reject(err);
    });

    fetch.once('end', () => {
      console.log('📧 Všetky emaily spracované');
    });
  }

  generateReport(emails) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 REPORT: OBJEDNÁVKY ZA POSLEDNÝCH 7 DNÍ');
    console.log('='.repeat(80));
    
    if (emails.length === 0) {
      console.log('❌ Žiadne objednávky neboli nájdené za posledných 7 dní');
      return;
    }

    console.log(`✅ Celkovo nájdených objednávok: ${emails.length}\n`);

    emails.forEach((email, index) => {
      console.log(`📧 OBJEDNÁVKA ${index + 1}:`);
      console.log(`   Od: ${email.from}`);
      console.log(`   Predmet: ${email.subject}`);
      console.log(`   Dátum: ${email.date}`);
      console.log(`   Text (prvých 200 znakov): ${email.text.substring(0, 200)}...`);
      console.log('-'.repeat(60));
    });

    // Zoskupenie podľa dní
    const byDay = {};
    emails.forEach(email => {
      const day = email.date.toDateString();
      if (!byDay[day]) byDay[day] = 0;
      byDay[day]++;
    });

    console.log('\n📅 ROZDELENIE PODĽA DNÍ:');
    Object.entries(byDay).forEach(([day, count]) => {
      console.log(`   ${day}: ${count} objednávok`);
    });
  }
}

// Spustenie
async function main() {
  const checker = new EmailChecker();
  
  try {
    const emails = await checker.checkEmails();
    checker.generateReport(emails);
  } catch (error) {
    console.error('❌ Chyba:', error);
    process.exit(1);
  }
}

main();
