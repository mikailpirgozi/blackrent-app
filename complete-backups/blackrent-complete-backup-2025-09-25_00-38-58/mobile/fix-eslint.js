#!/usr/bin/env node

/**
 * Script na automatické opravy najčastejších ESLint chýb
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Najčastejšie chyby a ich opravy
const commonFixes = [
  // Odstránenie nepotrebných importov
  {
    pattern: /import.*'useEffect'.*from 'react';\n/g,
    replacement: '',
    condition: (content) => !content.includes('useEffect(')
  },
  {
    pattern: /import.*'useState'.*from 'react';\n/g,
    replacement: '',
    condition: (content) => !content.includes('useState(')
  },
  // Odstránenie nepotrebných premenných
  {
    pattern: /const t = useTranslation\(\);\n/g,
    replacement: '',
    condition: (content) => !content.includes('t(')
  },
  // Odstránenie console.log v produkčných súboroch
  {
    pattern: /console\.log\([^)]*\);\n/g,
    replacement: '',
    condition: (content) => !content.includes('src/__tests__/') && !content.includes('src/utils/logger')
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    commonFixes.forEach(fix => {
      if (!fix.condition || fix.condition(content)) {
        const newContent = content.replace(fix.pattern, fix.replacement);
        if (newContent !== content) {
          content = newContent;
          changed = true;
        }
      }
    });
    
    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// Nájdi všetky .ts a .tsx súbory
function findFiles(dir, extensions = ['.ts', '.tsx']) {
  const files = [];
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walk(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// Spusti opravy
const srcDir = path.join(__dirname, 'src');
const files = findFiles(srcDir);

console.log(`Fixing ${files.length} files...`);
files.forEach(fixFile);

console.log('Done! Running ESLint to check remaining issues...');

try {
  execSync('npm run lint', { stdio: 'inherit' });
} catch (error) {
  console.log('Some ESLint issues remain - will need manual fixes');
}
