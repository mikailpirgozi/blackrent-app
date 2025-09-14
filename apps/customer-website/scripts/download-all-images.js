#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Cesta k assets priečinku
const ASSETS_DIR = path.join(__dirname, '../public/assets/misc');

// Zabezpečiť že assets priečinok existuje
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// Všetky URL obrázky ktoré treba stiahnuť
const imagesToDownload = [
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-24.svg',
    filename: 'vector-24.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-25.svg',
    filename: 'vector-25.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-26.svg',
    filename: 'vector-26.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-27.svg',
    filename: 'vector-27.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-28.svg',
    filename: 'vector-28.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-29.svg',
    filename: 'vector-29.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-30.svg',
    filename: 'vector-30.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-31.svg',
    filename: 'vector-31.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-32.svg',
    filename: 'vector-32.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-33.svg',
    filename: 'vector-33.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-34.svg',
    filename: 'vector-34.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-35.svg',
    filename: 'vector-35.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-36.svg',
    filename: 'vector-36.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-37.svg',
    filename: 'vector-37.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-38.svg',
    filename: 'vector-38.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-39.svg',
    filename: 'vector-39.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-40.svg',
    filename: 'vector-40.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-41.svg',
    filename: 'vector-41.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-42.svg',
    filename: 'vector-42.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-43.svg',
    filename: 'vector-43.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-44.svg',
    filename: 'vector-44.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-45.svg',
    filename: 'vector-45.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-46.svg',
    filename: 'vector-46.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-47.svg',
    filename: 'vector-47.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-48.svg',
    filename: 'vector-48.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-49.svg',
    filename: 'vector-49.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-50.svg',
    filename: 'vector-50.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-51.svg',
    filename: 'vector-51.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-52.svg',
    filename: 'vector-52.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-53.svg',
    filename: 'vector-53.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-54.svg',
    filename: 'vector-54.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-55.svg',
    filename: 'vector-55.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-56.svg',
    filename: 'vector-56.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-57.svg',
    filename: 'vector-57.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-58.svg',
    filename: 'vector-58.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-59.svg',
    filename: 'vector-59.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-60.svg',
    filename: 'vector-60.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-61.svg',
    filename: 'vector-61.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-62.svg',
    filename: 'vector-62.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-63.svg',
    filename: 'vector-63.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-64.svg',
    filename: 'vector-64.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-65.svg',
    filename: 'vector-65.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-66.svg',
    filename: 'vector-66.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-67.svg',
    filename: 'vector-67.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-68.svg',
    filename: 'vector-68.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-69.svg',
    filename: 'vector-69.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-70.svg',
    filename: 'vector-70.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-71.svg',
    filename: 'vector-71.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-72.svg',
    filename: 'vector-72.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-73.svg',
    filename: 'vector-73.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-74.svg',
    filename: 'vector-74.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-75.svg',
    filename: 'vector-75.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-76.svg',
    filename: 'vector-76.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-77.svg',
    filename: 'vector-77.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-78.svg',
    filename: 'vector-78.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-79.svg',
    filename: 'vector-79.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-80.svg',
    filename: 'vector-80.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-81.svg',
    filename: 'vector-81.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-82.svg',
    filename: 'vector-82.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-83.svg',
    filename: 'vector-83.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-84.svg',
    filename: 'vector-84.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-85.svg',
    filename: 'vector-85.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-86.svg',
    filename: 'vector-86.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-87.svg',
    filename: 'vector-87.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-88.svg',
    filename: 'vector-88.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-89.svg',
    filename: 'vector-89.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-90.svg',
    filename: 'vector-90.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-91.svg',
    filename: 'vector-91.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-92.svg',
    filename: 'vector-92.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-93.svg',
    filename: 'vector-93.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-94.svg',
    filename: 'vector-94.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-95.svg',
    filename: 'vector-95.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-96.svg',
    filename: 'vector-96.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-97.svg',
    filename: 'vector-97.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-98.svg',
    filename: 'vector-98.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-99.svg',
    filename: 'vector-99.svg'
  },
  {
    url: 'https://c.animaapp.com/nKqGOFqD/img/vector-100.svg',
    filename: 'vector-100.svg'
  }
];

// Funkcia na stiahnutie súboru pomocou curl
function downloadWithCurl(url, filename) {
  const filePath = path.join(ASSETS_DIR, filename);
  
  // Ak súbor už existuje, preskočiť
  if (fs.existsSync(filePath)) {
    console.log(`✓ Súbor ${filename} už existuje, preskakujem...`);
    return true;
  }

  console.log(`📥 Sťahujem: ${filename} z ${url}`);
  
  try {
    // Použijem curl s rôznymi headers na obídenie 403 chyby
    const curlCommand = `curl -L -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" -H "Referer: https://www.figma.com/" -H "Accept: image/svg+xml,image/*,*/*;q=0.8" "${url}" -o "${filePath}"`;
    
    execSync(curlCommand, { stdio: 'pipe' });
    
    // Skontrolovať či sa súbor stiahol správne
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
      console.log(`✅ Úspešne stiahnuté: ${filename}`);
      return true;
    } else {
      console.log(`❌ Nepodarilo sa stiahnuť: ${filename}`);
      // Odstrániť prázdny súbor
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ Chyba pri sťahovaní ${filename}: ${error.message}`);
    // Odstrániť prázdny súbor
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return false;
  }
}

// Stiahnutie všetkých obrázkov
console.log('🚀 Začínam sťahovanie všetkých obrázkov...\n');

let successCount = 0;
let failCount = 0;

for (const image of imagesToDownload) {
  if (downloadWithCurl(image.url, image.filename)) {
    successCount++;
  } else {
    failCount++;
  }
}

console.log(`\n📊 Súhrn:`);
console.log(`✅ Úspešne stiahnuté: ${successCount}`);
console.log(`❌ Nepodarilo sa stiahnuť: ${failCount}`);
console.log(`📁 Všetky súbory uložené v: ${ASSETS_DIR}`);
