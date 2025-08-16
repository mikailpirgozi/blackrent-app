#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Cesta k assets priečinku
const ASSETS_DIR = path.join(__dirname, '../public/assets/misc');

// Zabezpečiť že assets priečinok existuje
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// Funkcia na stiahnutie súboru
function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(ASSETS_DIR, filename);
    
    // Ak súbor už existuje, preskočiť
    if (fs.existsSync(filePath)) {
      console.log(`✓ Súbor ${filename} už existuje, preskakujem...`);
      resolve(filePath);
      return;
    }

    console.log(`📥 Sťahujem: ${filename} z ${url}`);
    
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} pre ${url}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ Stiahnuté: ${filename}`);
        resolve(filePath);
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Vymazať neúplný súbor
      reject(err);
    });
  });
}

// Zoznam všetkých URL obrázkov z kódu
const imageUrls = [
  'https://c.animaapp.com/h23eak6p/img/group-989.png',
  'https://c.animaapp.com/h23eak6p/img/frame-2608587-2.png',
  'https://c.animaapp.com/h23eak6p/img/line-5-2.svg',
  'https://c.animaapp.com/h23eak6p/img/line-3-2.svg',
  'https://c.animaapp.com/h23eak6p/img/line-4.svg',
  'https://c.animaapp.com/h23eak6p/img/gradient-background.png',
  'https://c.animaapp.com/h23eak6p/img/frame-2608587-1.svg',
  'https://c.animaapp.com/h23eak6p/img/line-4-2.svg',
  'https://c.animaapp.com/h23eak6p/img/line-4-1.svg',
  'https://c.animaapp.com/h23eak6p/img/group-989-1.png',
  'https://c.animaapp.com/h23eak6p/img/obrazok-3.png',
  'https://c.animaapp.com/h23eak6p/img/obrazok-4.png',
  'https://c.animaapp.com/h23eak6p/img/obrazok-5.png',
  'https://c.animaapp.com/h23eak6p/img/n-h-ad-vozidla-42@2x.png',
  'https://c.animaapp.com/h23eak6p/img/icon-32-px-54.svg',
  'https://c.animaapp.com/h23eak6p/img/n-h-ad-vozidla-54@2x.png',
  'https://c.animaapp.com/h23eak6p/img/line-3-6.svg',
  'https://c.animaapp.com/h23eak6p/img/icon-16-px-55.svg',
  'https://c.animaapp.com/h23eak6p/img/icon-16-px-57.png',
  'https://c.animaapp.com/h23eak6p/img/vector--stroke-.svg',
  'https://c.animaapp.com/h23eak6p/img/icon-16-px-58.svg',
  'https://c.animaapp.com/h23eak6p/img/n-h-ad-vozidla-30@2x.png',
  'https://c.animaapp.com/h23eak6p/img/icon-32-px-20.svg',
  'https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-114.svg'
];

// Funkcia na získanie názvu súboru z URL
function getFilenameFromUrl(url) {
  const urlPath = new URL(url).pathname;
  return path.basename(urlPath);
}

// Hlavná funkcia
async function downloadAllImages() {
  console.log('🚀 Začínam sťahovanie externých obrázkov...\n');
  
  const downloadPromises = imageUrls.map(url => {
    const filename = getFilenameFromUrl(url);
    return downloadFile(url, filename).catch(err => {
      console.error(`❌ Chyba pri sťahovaní ${filename}:`, err.message);
      return null;
    });
  });
  
  const results = await Promise.all(downloadPromises);
  const successful = results.filter(result => result !== null);
  
  console.log(`\n📊 Výsledky:`);
  console.log(`✅ Úspešne stiahnuté: ${successful.length}`);
  console.log(`❌ Neúspešné: ${imageUrls.length - successful.length}`);
  console.log(`📁 Uložené v: ${ASSETS_DIR}`);
}

// Spustiť sťahovanie
downloadAllImages().catch(console.error);
