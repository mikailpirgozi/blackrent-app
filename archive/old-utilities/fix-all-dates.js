#!/usr/bin/env node

/**
 * 🚨 DRASTICKÁ OPRAVA VŠETKÝCH TIMEZONE PROBLÉMOV
 * 
 * Tento script automaticky nahradí všetky problematické new Date() volania
 * v celej aplikácii timezone-safe verziami.
 */

const fs = require('fs');
const path = require('path');

// Súbory ktoré treba opraviť (najdôležitejšie)
const CRITICAL_FILES = [
  'src/components/rentals/EditRentalDialog.tsx',
  'src/components/rentals/RentalForm.tsx', 
  'src/components/rentals/RentalList.tsx',
  'src/components/rentals/components/RentalTable.tsx',
  'src/components/rentals/MobileRentalRow.tsx',
  'src/utils/formatters.ts'
];

// Patterns na nahradenie
const REPLACEMENTS = [
  // DateTimePicker value props
  {
    pattern: /value=\{formData\.(\w+) \? new Date\(formData\.\1\) : null\}/g,
    replacement: 'value={formData.$1 ? parseTimezoneFreeDateString(formData.$1) : null}'
  },
  {
    pattern: /value=\{\s*formData\.(\w+)\s*\?\s*new Date\(formData\.\1\)\s*:\s*null\s*\}/g,
    replacement: 'value={formData.$1 ? parseTimezoneFreeDateString(formData.$1) : null}'
  },
  // Multiline DateTimePicker values
  {
    pattern: /value=\{\s*formData\.(\w+)\s*\?\s*new Date\(formData\.\1\)\s*:\s*null\s*\}/gm,
    replacement: 'value={formData.$1 ? parseTimezoneFreeDateString(formData.$1) : null}'
  },
  // Calculation contexts
  {
    pattern: /const (\w+) = formData\.(\w+) instanceof Date \? formData\.\2 : new Date\(formData\.\2 \|\| ''\);/g,
    replacement: 'const $1 = formData.$2 instanceof Date ? formData.$2 : parseTimezoneFreeDateString(formData.$2) || new Date();'
  }
];

function addImportIfNeeded(content, filePath) {
  // Ak už má import, nič nerobíme
  if (content.includes('parseTimezoneFreeDateString')) {
    return content;
  }
  
  // Nájdi existujúci import z formatters
  const formattersImportMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]\.\.?\/\.\.?\/utils\/formatters['"];?/);
  
  if (formattersImportMatch) {
    // Pridaj do existujúceho importu
    const existingImports = formattersImportMatch[1];
    const newImports = existingImports.includes('parseTimezoneFreeDateString') 
      ? existingImports 
      : existingImports + ', parseTimezoneFreeDateString';
    
    return content.replace(formattersImportMatch[0], 
      `import { ${newImports} } from '../../utils/formatters';`);
  }
  
  // Pridaj nový import
  const importLines = content.split('\\n');
  let insertIndex = 0;
  
  // Nájdi posledný import
  for (let i = 0; i < importLines.length; i++) {
    if (importLines[i].startsWith('import ')) {
      insertIndex = i + 1;
    }
  }
  
  importLines.splice(insertIndex, 0, "import { parseTimezoneFreeDateString } from '../../utils/formatters';");
  return importLines.join('\\n');
}

function fixFile(filePath) {
  console.log(`🔧 Opravujem ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Súbor ${filePath} neexistuje`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Aplikuj všetky náhrady
  REPLACEMENTS.forEach(({ pattern, replacement }) => {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  });
  
  // Pridaj import ak je potrebný
  if (changed) {
    content = addImportIfNeeded(content, filePath);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${filePath} opravený`);
  } else {
    console.log(`ℹ️  ${filePath} nepotrebuje opravu`);
  }
}

// Spusti opravu
console.log('🚨 SPÚŠŤAM DRASTICKÚ OPRAVU TIMEZONE PROBLÉMOV...');
console.log('');

CRITICAL_FILES.forEach(fixFile);

console.log('');
console.log('✅ OPRAVA DOKONČENÁ!');
console.log('');
console.log('🔄 Teraz spusti:');
console.log('npm run build');
console.log('git add .');
console.log('git commit -m "🕐 Automatická oprava všetkých timezone problémov"');
console.log('git push');
