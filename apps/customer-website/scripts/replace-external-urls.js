#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Funkcia na rekurzívne vyhľadanie všetkých .tsx a .ts súborov
function findFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Preskočiť node_modules a .next priečinky
      if (!['node_modules', '.next', '.git'].includes(file)) {
        results = results.concat(findFiles(filePath, extensions));
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

// Funkcia na nahradenie URL v súbore
function replaceUrlsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Mapovanie URL na lokálne cesty
    const urlMappings = [
      // Vector súbory
      {
        from: /https:\/\/c\.animaapp\.com\/nKqGOFqD\/img\/vector-(\d+)\.svg/g,
        to: '/assets/misc/vector-$1.svg'
      },
      // Ostatné Anima URL
      {
        from: /https:\/\/c\.animaapp\.com\/[^\/]+\/img\/([^"']+)/g,
        to: '/assets/misc/$1'
      }
    ];
    
    // Aplikovať všetky nahradenia
    urlMappings.forEach(mapping => {
      const originalContent = content;
      content = content.replace(mapping.from, mapping.to);
      if (content !== originalContent) {
        hasChanges = true;
      }
    });
    
    // Ak boli zmeny, zapísať súbor
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Upravené: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.log(`❌ Chyba pri úprave ${filePath}: ${error.message}`);
    return false;
  }
}

// Hlavná funkcia
function main() {
  console.log('🚀 Začínam nahrádzanie externých URL lokálnymi cestami...\n');
  
  const srcDir = path.join(__dirname, '../src');
  const files = findFiles(srcDir);
  
  let modifiedCount = 0;
  let totalCount = 0;
  
  files.forEach(file => {
    totalCount++;
    if (replaceUrlsInFile(file)) {
      modifiedCount++;
    }
  });
  
  console.log(`\n📊 Súhrn:`);
  console.log(`📁 Skontrolované súbory: ${totalCount}`);
  console.log(`✅ Upravené súbory: ${modifiedCount}`);
  console.log(`📝 Všetky externé URL boli nahradené lokálnymi cestami`);
}

// Spustiť
main();
