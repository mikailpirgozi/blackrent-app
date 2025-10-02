#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Anima CDN URLs to local paths...\n');

// Mapovanie Anima súborov na lokálne cesty
const ANIMA_TO_LOCAL = {
  // Ikony
  'icon-24-px-filled-136.svg': '/figma-assets/Icon 24 px filled.svg',
  'icon-24-px.svg': '/figma-assets/Icon 24 px.svg',
  'icon-24-px-91.svg': '/figma-assets/Icon 24 px (1).svg',
  'icon-24-px-92.svg': '/figma-assets/Icon 24 px.svg',
  'icon-16-px.svg': '/figma-assets/Icon 16 px (1).svg',
  'vector-30.svg': '/figma-assets/Vector.svg',
  'line-9-8.svg': '/figma-assets/Line.svg',
  'line-3.svg': '/figma-assets/Line 3.svg',
  
  // Logá
  'blackrent-logo.svg': '/brands/blackrent-logo.svg',
  'blackrent-logo-9.svg': '/brands/blackrent-logo.svg',
  'blackrent-logo-10.svg': '/brands/blackrent-logo.svg',
  'blackrent-logo-11.svg': '/brands/blackrent-logo.svg',
  
  // Operátor fotky
  'fotka-oper-tora-11@2x.png': '/figma-assets/operator-avatar.png',
  'operator-avatar-728c4b.png': '/figma-assets/operator-avatar-728c4b.png',
  'operator-avatar-728c4b.webp': '/figma-assets/operator-avatar-728c4b.webp',
  
  // Hero obrázky
  'frame-968.png': '/figma-assets/hero-image-1.jpg',
  'group-996.png': '/figma-assets/hero-image-2.jpg',
  'tla--tko.png': '/figma-assets/tesla-banner-bg.png',
  
  // Vozidlá
  'n-h-ad-vozidla-42@2x.png': '/images/vehicle-default.jpg',
  'n-h-ad-vozidla-54@2x.png': '/images/vehicle-default.jpg',
  'n-h-ad-vozidla-30@2x.png': '/images/vehicle-default.jpg',
  'n-h-ad-vozidla-18@2x.png': '/images/vehicle-default.jpg',
  'n-h-ad-vozidla-14@2x.png': '/images/vehicle-default.jpg',
  
  // Ostatné
  'frame-2608626-1.svg': '/figma-assets/Frame.svg',
  'frame-2608626-2.svg': '/figma-assets/Frame.svg',
  'union-3.svg': '/figma-assets/Vector.svg',
  'vector-3.svg': '/figma-assets/Vector.svg'
};

function replaceAnimaUrls(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let replacements = 0;
  
  // Nahradenie Anima CDN URL
  const animaRegex = /https:\/\/c\.animaapp\.com\/[^"'\s]+/g;
  const matches = content.match(animaRegex);
  
  if (matches) {
    matches.forEach(animaUrl => {
      const filename = path.basename(animaUrl);
      const localPath = ANIMA_TO_LOCAL[filename];
      
      if (localPath) {
        content = content.replace(animaUrl, localPath);
        replacements++;
      } else {
        // Fallback - použijeme placeholder
        const ext = path.extname(filename);
        let fallbackPath = '/figma-assets/vehicle-placeholder.jpg';
        
        if (ext === '.svg') {
          fallbackPath = '/figma-assets/Icon 24 px.svg';
        } else if (filename.includes('logo')) {
          fallbackPath = '/brands/blackrent-logo.svg';
        } else if (filename.includes('vozidla') || filename.includes('vehicle')) {
          fallbackPath = '/images/vehicle-default.jpg';
        }
        
        content = content.replace(animaUrl, fallbackPath);
        replacements++;
        console.log(`   ⚠️  Fallback: ${filename} → ${fallbackPath}`);
      }
    });
  }
  
  if (replacements > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ ${filePath}: ${replacements} Anima URLs fixed`);
  }
  
  return replacements;
}

function processDirectory(dirPath) {
  let totalReplacements = 0;
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      totalReplacements += processDirectory(fullPath);
    } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.js')) {
      totalReplacements += replaceAnimaUrls(fullPath);
    }
  }
  
  return totalReplacements;
}

// Spracovanie src/ priečinka
const srcDir = 'src';
const totalReplacements = processDirectory(srcDir);

console.log(`\n🎉 Anima URL fixing completed!`);
console.log(`📊 Total replacements: ${totalReplacements}`);
console.log(`✅ All Anima URLs now use local paths`);

// Validácia
console.log('\n🔍 Final validation...');
const remainingAnima = processDirectory(srcDir);

if (remainingAnima === 0) {
  console.log('✅ No remaining Anima URLs found');
} else {
  console.log(`⚠️  ${remainingAnima} Anima URLs might need manual review`);
}
