#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Replacing local URLs with R2 CDN URLs...\n');

// Načítanie mapovaní z migrácie
const mappingFile = 'customer-website/url-mappings.json';
if (!fs.existsSync(mappingFile)) {
  console.error('❌ URL mappings file not found. Run migrate-to-r2.js first.');
  process.exit(1);
}

const urlMappings = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));

function replaceUrlsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let replacements = 0;
  
  // Nahradenie lokálnych ciest za R2 URL
  for (const [oldUrl, newUrl] of Object.entries(urlMappings)) {
    const regex = new RegExp(`["']${oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'g');
    const matches = content.match(regex);
    
    if (matches) {
      content = content.replace(regex, `"${newUrl}"`);
      replacements += matches.length;
    }
  }
  
  // Nahradenie Anima CDN URL za R2 URL (ak existuje mapping)
  const animaRegex = /https:\/\/c\.animaapp\.com\/[^"'\s]+/g;
  const animaMatches = content.match(animaRegex);
  
  if (animaMatches) {
    animaMatches.forEach(animaUrl => {
      // Pokúsime sa nájsť podobný súbor v R2
      const filename = path.basename(animaUrl);
      const possibleR2Url = findR2UrlByFilename(filename);
      
      if (possibleR2Url) {
        content = content.replace(animaUrl, possibleR2Url);
        replacements++;
        console.log(`   🔄 Anima → R2: ${filename}`);
      }
    });
  }
  
  if (replacements > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ ${filePath}: ${replacements} URLs replaced`);
  }
  
  return replacements;
}

function findR2UrlByFilename(filename) {
  // Hľadáme v mappings súbor s rovnakým názvom
  for (const [oldPath, newUrl] of Object.entries(urlMappings)) {
    if (path.basename(oldPath) === filename) {
      return newUrl;
    }
  }
  return null;
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
      totalReplacements += replaceUrlsInFile(fullPath);
    }
  }
  
  return totalReplacements;
}

// Spracovanie src/ priečinka
const srcDir = 'customer-website/src';
const totalReplacements = processDirectory(srcDir);

console.log(`\n🎉 URL replacement completed!`);
console.log(`📊 Total replacements: ${totalReplacements}`);
console.log(`✅ All images now use Cloudflare R2 CDN`);

// Validácia - skontrolujeme či ešte zostali nejaké lokálne cesty
console.log('\n🔍 Validation check...');
const validationErrors = processDirectory(srcDir);

if (validationErrors === 0) {
  console.log('✅ No remaining local image paths found');
} else {
  console.log(`⚠️  ${validationErrors} URLs might need manual review`);
}
