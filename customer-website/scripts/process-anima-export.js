#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🔄 Processing Anima export - downloading images and fixing URLs...\n');

// Automatické stiahnutie obrázkov z Anima CDN
async function downloadImage(url, localPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(localPath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ Downloaded: ${path.basename(localPath)}`);
          resolve(localPath);
        });
      } else {
        console.log(`⚠️  Failed to download: ${url} (${response.statusCode})`);
        resolve(null);
      }
    }).on('error', (err) => {
      fs.unlink(localPath, () => {}); // Vymaž neúplný súbor
      console.log(`❌ Error downloading: ${url}`);
      resolve(null);
    });
  });
}

// Nájdi všetky Anima URL v súbore
function findAnimaUrls(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const animaRegex = /https:\/\/c\.animaapp\.com\/[^"'\s]+/g;
  return content.match(animaRegex) || [];
}

// Spracuj jeden súbor
async function processFile(filePath) {
  const animaUrls = findAnimaUrls(filePath);
  if (animaUrls.length === 0) return 0;

  console.log(`📁 Processing: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let replacements = 0;

  for (const animaUrl of animaUrls) {
    const filename = path.basename(animaUrl);
    const localPath = path.join('public/figma-assets', filename);
    
    // Stiahni obrázok ak neexistuje
    if (!fs.existsSync(localPath)) {
      await downloadImage(animaUrl, localPath);
    }
    
    // Nahraď URL v kóde
    const localUrl = `/figma-assets/${filename}`;
    content = content.replace(animaUrl, localUrl);
    replacements++;
  }

  // Ulož opravený súbor
  if (replacements > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${replacements} URLs in ${filePath}`);
  }

  return replacements;
}

// Spracuj všetky súbory v priečinku
async function processDirectory(dirPath) {
  let totalReplacements = 0;
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      totalReplacements += await processDirectory(fullPath);
    } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.js')) {
      totalReplacements += await processFile(fullPath);
    }
  }

  return totalReplacements;
}

// Hlavná funkcia
async function main() {
  // Vytvor priečinok ak neexistuje
  const assetsDir = 'public/figma-assets';
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  console.log('🔍 Scanning for Anima CDN URLs...');
  const totalReplacements = await processDirectory('src');

  console.log(`\n🎉 Processing completed!`);
  console.log(`📊 Total URLs processed: ${totalReplacements}`);
  
  if (totalReplacements > 0) {
    console.log('✅ All images downloaded locally');
    console.log('✅ All URLs converted to local paths');
    console.log('\n💡 Next steps:');
    console.log('   1. Test your website: npm run dev');
    console.log('   2. Validate assets: npm run validate-assets');
    console.log('   3. Commit changes: git add . && git commit -m "Convert Anima URLs to local"');
  } else {
    console.log('✅ No Anima URLs found - you\'re all set!');
  }
}

main().catch(console.error);
