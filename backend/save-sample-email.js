#!/usr/bin/env node

/**
 * Script na uloženie vzorového emailu do súboru pre analýzu
 */

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs');

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

class EmailSaver {
  constructor() {
    this.imap = new Imap(imapConfig);
  }

  async saveLatestEmail() {
    if (!imapConfig.password) {
      console.error('❌ IMAP_PASSWORD nie je nastavené');
      return;
    }

    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        console.log('📧 IMAP: Pripojenie úspešné');
        this.getLatestEmail(resolve, reject);
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

  getLatestEmail(resolve, reject) {
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

      console.log(`🔍 Hľadám najnovší email od ${sevenDaysAgoStr}`);

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
          resolve();
          return;
        }

        console.log(`📧 Našiel som ${results.length} emailov, beriem posledný...`);
        
        // Vezmi posledný email (najnovší)
        const latestEmailId = results[results.length - 1];
        this.saveEmail(latestEmailId, resolve, reject);
      });
    });
  }

  saveEmail(emailId, resolve, reject) {
    const fetch = this.imap.fetch([emailId], { 
      bodies: '',
      markSeen: false 
    });

    fetch.on('message', (msg, seqno) => {
      let buffer = '';
      
      msg.on('body', (stream, info) => {
        stream.on('data', (chunk) => {
          buffer += chunk.toString('utf8');
        });
        
        stream.once('end', () => {
          simpleParser(buffer, (err, parsed) => {
            if (err) {
              console.error(`❌ Chyba pri parsovaní emailu:`, err);
              reject(err);
            } else {
              this.saveToFiles(parsed, seqno);
              this.imap.end();
              resolve();
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

  saveToFiles(parsed, seqno) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Ulož HTML obsah
    if (parsed.html) {
      const htmlFile = `sample-email-${seqno}-${timestamp}.html`;
      fs.writeFileSync(htmlFile, parsed.html);
      console.log(`💾 HTML uložené do: ${htmlFile}`);
    }

    // Ulož textový obsah
    if (parsed.text) {
      const textFile = `sample-email-${seqno}-${timestamp}.txt`;
      fs.writeFileSync(textFile, parsed.text);
      console.log(`💾 Text uložený do: ${textFile}`);
    }

    // Ulož metadata
    const metaFile = `sample-email-${seqno}-${timestamp}-meta.json`;
    const metadata = {
      seqno,
      from: parsed.from,
      to: parsed.to,
      subject: parsed.subject,
      date: parsed.date,
      messageId: parsed.messageId,
      headers: parsed.headers,
      textLength: parsed.text?.length || 0,
      htmlLength: parsed.html?.length || 0
    };
    
    fs.writeFileSync(metaFile, JSON.stringify(metadata, null, 2));
    console.log(`💾 Metadata uložené do: ${metaFile}`);

    console.log('\n📊 SÚHRN EMAILU:');
    console.log(`   Od: ${parsed.from?.text || 'Unknown'}`);
    console.log(`   Predmet: ${parsed.subject || 'No subject'}`);
    console.log(`   Dátum: ${parsed.date || 'Unknown'}`);
    console.log(`   Text dĺžka: ${parsed.text?.length || 0} znakov`);
    console.log(`   HTML dĺžka: ${parsed.html?.length || 0} znakov`);
    
    if (parsed.text && parsed.text.length > 0) {
      console.log(`\n📝 PRVÝCH 500 ZNAKOV TEXTU:`);
      console.log(parsed.text.substring(0, 500));
    }
  }
}

// Spustenie
async function main() {
  const saver = new EmailSaver();
  
  try {
    await saver.saveLatestEmail();
    console.log('\n✅ Email úspešne uložený!');
  } catch (error) {
    console.error('❌ Chyba:', error);
    process.exit(1);
  }
}

main();
