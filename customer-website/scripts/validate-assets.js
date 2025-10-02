#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating assets...');

// Kontrola externých URL v kóde
function checkExternalUrls(dirPath) {
  let errors = 0;
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Kontrola Anima CDN URL
        const animaUrls = content.match(/https:\/\/c\.animaapp\.com\/[^"'\s]+/g);
        if (animaUrls) {
          console.error(`❌ ${fullPath}: Found Anima CDN URLs:`);
          animaUrls.forEach(url => console.error(`   ${url}`));
          errors++;
        }
        
        // Kontrola iných externých CDN
        const externalUrls = content.match(/https:\/\/[^"'\s]+\.(jpg|jpeg|png|svg|webp|gif)/gi);
        if (externalUrls) {
          const nonLocalUrls = externalUrls.filter(url => 
            !url.includes('localhost') && 
            !url.includes('blackrent.sk') &&
            !url.includes('vercel.app')
          );
          
          if (nonLocalUrls.length > 0) {
            console.warn(`⚠️  ${fullPath}: Found external image URLs:`);
            nonLocalUrls.forEach(url => console.warn(`   ${url}`));
          }
        }
      }
    }
  }
  
  scanDirectory(dirPath);
  return errors;
}

// Kontrola chýbajúcich súborov
function checkMissingAssets(dirPath) {
  let errors = 0;
  const publicDir = path.join(__dirname, '../public');
  
  function scanForAssetReferences(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanForAssetReferences(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Nájdi všetky lokálne asset referencie
        const assetRefs = content.match(/["']\/(figma-assets|brands|images|icons|assets)\/[^"']+["']/g);
        if (assetRefs) {
          assetRefs.forEach(ref => {
            const cleanRef = ref.slice(1, -1); // Odstráň úvodzovky
            const assetPath = path.join(publicDir, cleanRef);
            
            if (!fs.existsSync(assetPath)) {
              console.error(`❌ ${fullPath}: Missing asset: ${cleanRef}`);
              errors++;
            }
          });
        }
      }
    }
  }
  
  scanForAssetReferences(dirPath);
  return errors;
}

// Spusti validáciu
const srcDir = path.join(__dirname, '../src');
let totalErrors = 0;

console.log('📋 Checking for external CDN URLs...');
totalErrors += checkExternalUrls(srcDir);

console.log('📋 Checking for missing assets...');
totalErrors += checkMissingAssets(srcDir);

if (totalErrors === 0) {
  console.log('✅ All assets are valid!');
  process.exit(0);
} else {
  console.error(`❌ Found ${totalErrors} asset errors!`);
  process.exit(1);
}
