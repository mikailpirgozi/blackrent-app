#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Consolidating all assets to local paths...\n');

// Mapovanie existujúcich assets na štandardizované lokálne cesty
const ASSET_CONSOLIDATION = {
  // Brands/Logos
  'public/brands/blackrent-logo.svg': 'public/assets/logos/blackrent-logo.svg',
  'public/brands/audi.svg': 'public/assets/brands/audi.svg',
  'public/brands/bmw.svg': 'public/assets/brands/bmw.svg',
  'public/brands/mercedes.svg': 'public/assets/brands/mercedes.svg',
  'public/brands/volkswagen.svg': 'public/assets/brands/volkswagen.svg',
  'public/brands/skoda.svg': 'public/assets/brands/skoda.svg',
  'public/brands/tesla.svg': 'public/assets/brands/tesla.svg',
  'public/brands/ford.svg': 'public/assets/brands/ford.svg',
  'public/brands/hyundai.svg': 'public/assets/brands/hyundai.svg',
  'public/brands/kia.svg': 'public/assets/brands/kia.svg',
  'public/brands/nissan.svg': 'public/assets/brands/nissan.svg',
  'public/brands/opel.svg': 'public/assets/brands/opel.svg',
  'public/brands/peugeot.svg': 'public/assets/brands/peugeot.svg',
  'public/brands/renault.svg': 'public/assets/brands/renault.svg',
  'public/brands/seat.svg': 'public/assets/brands/seat.svg',
  'public/brands/toyota.svg': 'public/assets/brands/toyota.svg',
  'public/brands/volvo.svg': 'public/assets/brands/volvo.svg',
  
  // Icons
  'public/icons/arrow-32.svg': 'public/assets/icons/arrow-32.svg',
  'public/icons/arrow-down-16.svg': 'public/assets/icons/arrow-down-16.svg',
  
  // Images
  'public/images/hero-image-1.jpg': 'public/assets/images/hero-image-1.jpg',
  'public/images/hero-image-1.webp': 'public/assets/images/hero-image-1.webp',
  'public/images/hero-image-10.jpg': 'public/assets/images/hero-image-10.jpg',
  'public/images/hero-image-10.webp': 'public/assets/images/hero-image-10.webp',
  'public/images/hero-image-2.jpg': 'public/assets/images/hero-image-2.jpg',
  'public/images/hero-image-2.webp': 'public/assets/images/hero-image-2.webp',
  'public/images/hero-image-3.jpg': 'public/assets/images/hero-image-3.jpg',
  'public/images/hero-image-3.webp': 'public/assets/images/hero-image-3.webp',
  'public/images/hero-image-4.jpg': 'public/assets/images/hero-image-4.jpg',
  'public/images/hero-image-4.webp': 'public/assets/images/hero-image-4.webp',
  'public/images/hero-image-5.jpg': 'public/assets/images/hero-image-5.jpg',
  'public/images/hero-image-5.webp': 'public/assets/images/hero-image-5.webp',
  'public/images/hero-image-6.jpg': 'public/assets/images/hero-image-6.jpg',
  'public/images/hero-image-6.webp': 'public/assets/images/hero-image-6.webp',
  'public/images/hero-image-7.jpg': 'public/assets/images/hero-image-7.jpg',
  'public/images/hero-image-7.webp': 'public/assets/images/hero-image-7.webp',
  'public/images/hero-image-8.jpg': 'public/assets/images/hero-image-8.jpg',
  'public/images/hero-image-8.webp': 'public/assets/images/hero-image-8.webp',
  'public/images/hero-image-9.jpg': 'public/assets/images/hero-image-9.jpg',
  'public/images/hero-image-9.webp': 'public/assets/images/hero-image-9.webp',
  
  // Vehicle images
  'public/tesla-model-s-42bc2b.jpg': 'public/assets/vehicles/tesla-model-s.jpg',
  'public/tesla-model-s-42bc2b.webp': 'public/assets/vehicles/tesla-model-s.webp',
  
  // Operator avatar
  'public/operator-avatar-728c4b.jpg': 'public/assets/avatars/operator-avatar.jpg',
  'public/operator-avatar-728c4b.webp': 'public/assets/avatars/operator-avatar.webp',
  
  // Background assets
  'public/assets/background-2.jpeg': 'public/assets/backgrounds/background-2.jpeg',
  'public/assets/background-2.webp': 'public/assets/backgrounds/background-2.webp',
  'public/assets/background-4.jpeg': 'public/assets/backgrounds/background-4.jpeg',
};

// Figma assets - skopírujeme len tie ktoré existujú a nie sú prázdne
const FIGMA_ASSETS_MAPPING = {};

function copyFile(source, destination) {
  try {
    // Vytvor cieľový priečinok ak neexistuje
    const destDir = path.dirname(destination);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Skopíruj súbor ak existuje a nie je prázdny
    if (fs.existsSync(source)) {
      const stats = fs.statSync(source);
      if (stats.size > 0) {
        fs.copyFileSync(source, destination);
        console.log(`✅ Copied: ${source} → ${destination}`);
        return true;
      } else {
        console.log(`⚠️  Skipped empty file: ${source}`);
        return false;
      }
    } else {
      console.log(`⚠️  Source not found: ${source}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error copying ${source}: ${error.message}`);
    return false;
  }
}

function consolidateAssets() {
  let successCount = 0;
  let totalCount = 0;
  
  console.log('📁 Consolidating standard assets...');
  
  // Konsolidácia štandardných assets
  for (const [source, destination] of Object.entries(ASSET_CONSOLIDATION)) {
    totalCount++;
    if (copyFile(source, destination)) {
      successCount++;
    }
  }
  
  console.log('\n📁 Processing Figma assets...');
  
  // Spracovanie Figma assets - len tie ktoré existujú a nie sú prázdne
  const figmaAssetsDir = 'public/figma-assets';
  if (fs.existsSync(figmaAssetsDir)) {
    const figmaFiles = fs.readdirSync(figmaAssetsDir);
    
    for (const file of figmaFiles) {
      const sourcePath = path.join(figmaAssetsDir, file);
      const stats = fs.statSync(sourcePath);
      
      if (stats.isFile() && stats.size > 0) {
        const ext = path.extname(file);
        let category = 'misc';
        
        if (file.includes('icon') || file.includes('typ-')) {
          category = 'icons';
        } else if (file.includes('logo') || file.includes('brand')) {
          category = 'logos';
        } else if (file.includes('frame') || file.includes('obrazok')) {
          category = 'images';
        } else if (file.includes('vector') || file.includes('line')) {
          category = 'graphics';
        }
        
        const destination = `public/assets/${category}/${file}`;
        totalCount++;
        if (copyFile(sourcePath, destination)) {
          successCount++;
          // Pridaj do mapingu pre neskoršie nahradenie v kóde
          FIGMA_ASSETS_MAPPING[`/figma-assets/${file}`] = `/assets/${category}/${file}`;
        }
      }
    }
  }
  
  console.log(`\n📊 Consolidation completed!`);
  console.log(`✅ Successfully copied: ${successCount}/${totalCount} files`);
  
  return FIGMA_ASSETS_MAPPING;
}

function updateCodeReferences(figmaMapping) {
  console.log('\n🔄 Updating code references...');
  
  let totalReplacements = 0;
  
  function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileReplacements = 0;
    
    // Nahraď figma-assets cesty
    for (const [oldPath, newPath] of Object.entries(figmaMapping)) {
      const regex = new RegExp(oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, newPath);
        fileReplacements += matches.length;
      }
    }
    
    // Nahraď ostatné cesty na štandardizované
    const pathReplacements = {
      '/brands/': '/assets/brands/',
      '/icons/': '/assets/icons/',
      '/images/': '/assets/images/',
    };
    
    for (const [oldPath, newPath] of Object.entries(pathReplacements)) {
      const regex = new RegExp(oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, newPath);
        fileReplacements += matches.length;
      }
    }
    
    if (fileReplacements > 0) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated ${fileReplacements} references in ${filePath}`);
    }
    
    return fileReplacements;
  }
  
  function processDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        totalReplacements += processDirectory(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.js')) {
        totalReplacements += processFile(fullPath);
      }
    }
    
    return totalReplacements;
  }
  
  totalReplacements = processDirectory('src');
  
  console.log(`✅ Updated ${totalReplacements} code references`);
  return totalReplacements;
}

// Hlavná funkcia
function main() {
  console.log('🚀 Starting asset consolidation...\n');
  
  // Konsolidácia assets
  const figmaMapping = consolidateAssets();
  
  // Aktualizácia kódu
  const codeUpdates = updateCodeReferences(figmaMapping);
  
  console.log('\n🎉 Asset consolidation completed!');
  console.log('📁 All assets are now organized in /public/assets/');
  console.log('✅ All code references updated to use local paths');
  console.log('\n💡 Next steps:');
  console.log('   1. Test your website: npm run dev');
  console.log('   2. Validate all images load correctly');
  console.log('   3. Commit changes: git add . && git commit -m "Consolidate all assets to local paths"');
}

main().catch(console.error);
