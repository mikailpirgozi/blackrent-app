#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Mapping Anima CDN URLs to local paths
const urlMappings = {
  // Icons
  'https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-1.svg': '/figma-assets/Icon 24 px (1).svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-2.svg': '/figma-assets/Icon 24 px.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-3.svg': '/figma-assets/Icon 24 px.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-4.svg': '/figma-assets/Icon 24 px.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-5.svg': '/figma-assets/Icon 24 px.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-6.svg': '/figma-assets/Icon 24 px.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-8.svg': '/figma-assets/Icon 24 px.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-9.svg': '/figma-assets/Icon 24 px.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-11.svg': '/figma-assets/Icon 24 px.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-14.svg': '/figma-assets/Icon 24 px.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/icon-32-px.svg': '/figma-assets/Icon 24 px.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/icon-16-px-4.svg': '/figma-assets/Icon 16 px (1).svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/union-2.svg': '/figma-assets/Vector.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/union-1.svg': '/figma-assets/Vector.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/union.png': '/figma-assets/Vector.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/line-9.svg': '/figma-assets/Line 3.svg',
  
  // Logos
  'https://c.animaapp.com/me95zzp7lVICYW/img/vector-2.svg': '/brands/blackrent-logo.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/blackrent-logo.svg': '/brands/blackrent-logo.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/vector.svg': '/figma-assets/Vector.svg',
  
  // Brand logos
  'https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut.svg': '/brands/audi.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-1.svg': '/brands/bmw.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-2.svg': '/brands/mercedes.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-3.svg': '/brands/volkswagen.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-4.svg': '/brands/skoda.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-5.svg': '/brands/ford.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-6.svg': '/brands/opel.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-7.svg': '/brands/nissan.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-8.svg': '/brands/hyundai.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-9.svg': '/brands/tesla.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-10.svg': '/brands/porsche.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-11.svg': '/brands/jaguar.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-12.svg': '/brands/mustang.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-13.svg': '/brands/chevrolet.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-14.svg': '/brands/dodge.svg',
  'https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-15.svg': '/brands/iveco.svg',
  
  // Images
  'https://c.animaapp.com/me95zzp7lVICYW/img/obrazok.png': '/figma-assets/hero-image-1.webp',
  'https://c.animaapp.com/me95zzp7lVICYW/img/obrazok-1.png': '/figma-assets/hero-image-2.webp',
  'https://c.animaapp.com/me95zzp7lVICYW/img/obrazok-2.png': '/figma-assets/hero-image-3.webp',
  'https://c.animaapp.com/me95zzp7lVICYW/img/obrazok-3.png': '/figma-assets/hero-image-4.webp',
  'https://c.animaapp.com/me95zzp7lVICYW/img/obrazok-4.png': '/figma-assets/hero-image-5.webp',
  'https://c.animaapp.com/me95zzp7lVICYW/img/obrazok-5.png': '/figma-assets/hero-image-6.webp',
  'https://c.animaapp.com/me95zzp7lVICYW/img/obrazok-6.png': '/figma-assets/hero-image-7.webp',
  'https://c.animaapp.com/me95zzp7lVICYW/img/obrazok-7.png': '/figma-assets/hero-image-8.webp',
  'https://c.animaapp.com/me95zzp7lVICYW/img/obrazok-8.png': '/figma-assets/hero-image-9.webp',
  'https://c.animaapp.com/me95zzp7lVICYW/img/obrazok-9.png': '/figma-assets/hero-image-10.webp',
  'https://c.animaapp.com/me95zzp7lVICYW/img/n-h-ad-vozidla-5.png': '/figma-assets/vehicle-placeholder.webp',
  
  // Operator avatar
  'https://c.animaapp.com/me95zzp7lVICYW/img/operator-avatar.webp': '/figma-assets/operator-avatar.webp',
  
  // Patterns
  '/assets/contact-pattern.svg': '/figma-assets/rectangle-962.svg'
};

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    for (const [oldUrl, newUrl] of Object.entries(urlMappings)) {
      if (content.includes(oldUrl)) {
        content = content.replace(new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUrl);
        changed = true;
      }
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return 1;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function processDirectory(dirPath) {
  let totalFixed = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        totalFixed += processDirectory(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.js')) {
        totalFixed += replaceInFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${dirPath}:`, error.message);
  }
  
  return totalFixed;
}

console.log('🔧 Fixing all Anima CDN URLs to local paths...');
const srcPath = path.join(__dirname, '../src');
const totalFixed = processDirectory(srcPath);
console.log(`✅ Fixed ${totalFixed} files total`);
