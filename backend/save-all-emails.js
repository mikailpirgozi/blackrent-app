#!/usr/bin/env node

/**
 * Script na uloženie všetkých emailov s objednávkami za posledných 7 dní
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

class AllEmailsSaver {
  constructor() {
    this.imap = new Imap(imapConfig);
    this.savedEmails = [];
  }

  async saveAllEmails() {
    if (!imapConfig.password) {
      console.error('❌ IMAP_PASSWORD nie je nastavené');
      return;
    }

    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        console.log('📧 IMAP: Pripojenie úspešné');
        this.getAllEmails(resolve, reject);
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

  getAllEmails(resolve, reject) {
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

      console.log(`🔍 Hľadám všetky emaily od ${sevenDaysAgoStr}`);

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

        console.log(`📧 Našiel som ${results.length} emailov, ukladám všetky...`);
        this.saveAllEmailsSequentially(results, 0, resolve, reject);
      });
    });
  }

  saveAllEmailsSequentially(emailIds, index, resolve, reject) {
    if (index >= emailIds.length) {
      this.imap.end();
      resolve(this.savedEmails);
      return;
    }

    const emailId = emailIds[index];
    console.log(`📧 Spracovávam email ${index + 1}/${emailIds.length} (ID: ${emailId})`);

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
              console.error(`❌ Chyba pri parsovaní emailu ${seqno}:`, err);
            } else {
              this.saveEmailToFiles(parsed, seqno);
              this.savedEmails.push({
                seqno,
                date: parsed.date,
                from: parsed.from?.text,
                subject: parsed.subject
              });
            }
            
            // Pokračuj na ďalší email
            setTimeout(() => {
              this.saveAllEmailsSequentially(emailIds, index + 1, resolve, reject);
            }, 100); // Malá pauza medzi emailmi
          });
        });
      });
    });

    fetch.once('error', (err) => {
      console.error(`❌ Fetch error pre email ${emailId}:`, err);
      // Pokračuj na ďalší email aj pri chybe
      setTimeout(() => {
        this.saveAllEmailsSequentially(emailIds, index + 1, resolve, reject);
      }, 100);
    });
  }

  saveEmailToFiles(parsed, seqno) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Ulož HTML obsah
    if (parsed.html) {
      const htmlFile = `all-emails/email-${seqno}-${timestamp}.html`;
      this.ensureDirectoryExists('all-emails');
      fs.writeFileSync(htmlFile, parsed.html);
      console.log(`💾 HTML uložené: ${htmlFile}`);
    }

    // Ulož textový obsah
    if (parsed.text) {
      const textFile = `all-emails/email-${seqno}-${timestamp}.txt`;
      this.ensureDirectoryExists('all-emails');
      fs.writeFileSync(textFile, parsed.text);
      console.log(`💾 Text uložený: ${textFile}`);
    }

    // Ulož metadata
    const metaFile = `all-emails/email-${seqno}-${timestamp}-meta.json`;
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
    
    this.ensureDirectoryExists('all-emails');
    fs.writeFileSync(metaFile, JSON.stringify(metadata, null, 2));
    console.log(`💾 Metadata uložené: ${metaFile}`);
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// Spustenie
async function main() {
  const saver = new AllEmailsSaver();
  
  try {
    const emails = await saver.saveAllEmails();
    console.log(`\n✅ Úspešne uložených ${emails.length} emailov!`);
    
    console.log('\n📊 SÚHRN ULOŽENÝCH EMAILOV:');
    emails.forEach((email, index) => {
      console.log(`${index + 1}. Email ${email.seqno} - ${email.date} - ${email.from}`);
    });
    
  } catch (error) {
    console.error('❌ Chyba:', error);
    process.exit(1);
  }
}

main();
