#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧠 BLACKRENT ESLint Smart Fix - Inteligentné opravovanie');
console.log('=========================================================');

// Pokročilé opravovanie unused imports
function smartFixUnusedImports(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Rozdelenie na riadky pre analýzu
  const lines = content.split('\n');
  const usedIdentifiers = new Set();
  const importLines = [];
  
  // 1. Nájdi všetky použité identifikátory v kóde (mimo importov)
  lines.forEach((line, index) => {
    if (!line.trim().startsWith('import ') && !line.trim().startsWith('//')) {
      // Extrahuj identifikátory (zjednodušená verzia)
      const identifiers = line.match(/\b[A-Za-z_$][A-Za-z0-9_$]*\b/g) || [];
      identifiers.forEach(id => usedIdentifiers.add(id));
    }
    
    if (line.trim().startsWith('import ')) {
      importLines.push({ line, index });
    }
  });
  
  // 2. Analyzuj import riadky a odstráň nepoužívané
  importLines.forEach(({ line, index }) => {
    // Named imports: import { A, B, C } from 'module'
    const namedImportMatch = line.match(/import\s*{\s*([^}]+)\s*}\s*from/);
    if (namedImportMatch) {
      const imports = namedImportMatch[1].split(',').map(imp => imp.trim());
      const usedImports = imports.filter(imp => {
        const cleanImport = imp.replace(/\s+as\s+\w+/, '').trim();
        return usedIdentifiers.has(cleanImport);
      });
      
      if (usedImports.length === 0) {
        // Odstráň celý import riadok
        lines[index] = '';
        changed = true;
      } else if (usedImports.length < imports.length) {
        // Aktualizuj import s len používanými
        const newImportLine = line.replace(
          /{\s*[^}]+\s*}/,
          `{ ${usedImports.join(', ')} }`
        );
        lines[index] = newImportLine;
        changed = true;
      }
    }
    
    // Default imports: import Something from 'module'
    const defaultImportMatch = line.match(/import\s+(\w+)\s+from/);
    if (defaultImportMatch) {
      const importName = defaultImportMatch[1];
      if (!usedIdentifiers.has(importName)) {
        lines[index] = '';
        changed = true;
      }
    }
  });
  
  if (changed) {
    // Odstráň prázdne riadky po importoch
    const newContent = lines.join('\n').replace(/\n\s*\n\s*\n/g, '\n\n');
    fs.writeFileSync(filePath, newContent);
    return true;
  }
  
  return false;
}

// Pokročilé opravovanie any typov s kontextom
function smartFixAnyTypes(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Inteligentné replacements na základe kontextu
  const contextualReplacements = [
    // API responses
    { 
      pattern: /(\w+):\s*any\s*=.*\.json\(\)/g,
      replacement: '$1: unknown = await response.json()'
    },
    
    // Event handlers
    { 
      pattern: /\(.*event:\s*any.*\)\s*=>/g,
      replacement: (match) => match.replace('any', 'Event')
    },
    
    // Array types
    { 
      pattern: /:\s*any\[\]/g,
      replacement: ': unknown[]'
    },
    
    // Object types
    { 
      pattern: /:\s*any\s*=/g,
      replacement: ': unknown ='
    },
    
    // Function parameters
    { 
      pattern: /\(\s*(\w+):\s*any\s*\)/g,
      replacement: '($1: unknown)'
    },
    
    // Type assertions
    { 
      pattern: /as\s+any(?!\w)/g,
      replacement: 'as unknown'
    },
    
    // Record types
    { 
      pattern: /Record<string,\s*any>/g,
      replacement: 'Record<string, unknown>'
    }
  ];
  
  contextualReplacements.forEach(({ pattern, replacement }) => {
    if (typeof replacement === 'function') {
      content = content.replace(pattern, replacement);
    } else {
      content = content.replace(pattern, replacement);
    }
    changed = true;
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  
  return false;
}

// Opravovanie React hooks dependencies
function smartFixReactHooks(filePath) {
  if (!fs.existsSync(filePath) || !filePath.endsWith('.tsx')) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Nájdi useEffect/useCallback/useMemo hooks s chýbajúcimi dependencies
  const hookPatterns = [
    /useEffect\s*\(\s*\(\s*\)\s*=>\s*{[^}]*},\s*\[\s*\]\s*\)/g,
    /useCallback\s*\(\s*\([^)]*\)\s*=>\s*{[^}]*},\s*\[\s*\]\s*\)/g,
    /useMemo\s*\(\s*\(\s*\)\s*=>\s*{[^}]*},\s*\[\s*\]\s*\)/g
  ];
  
  // Toto je zjednodušená verzia - v praxi by sme potrebovali AST
  // Pre teraz použijeme ESLint --fix na konkrétny súbor
  try {
    execSync(`npx eslint "${filePath}" --fix --rule "react-hooks/exhaustive-deps: error"`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Opravovanie case declarations
function smartFixCaseDeclarations(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Nájdi case bloky s deklaráciami a wrap ich do {}
  content = content.replace(
    /(case\s+[^:]+:\s*)(const\s+|let\s+|var\s+)([^;]+;)/g,
    '$1{\n      $2$3\n      break;\n    }'
  );
  
  if (content !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, content);
    changed = true;
  }
  
  return changed;
}

// Prioritizácia súborov na základe impact/effort ratio
function prioritizeFiles(fileAnalysis) {
  return fileAnalysis.map(file => {
    // Impact score: viac chýb = vyšší impact
    const impactScore = file.errors;
    
    // Effort score: zložitosť opráv na základe typov chýb
    let effortScore = 0;
    Object.entries(file.rules).forEach(([rule, count]) => {
      switch (rule) {
        case '@typescript-eslint/no-unused-vars':
          effortScore += count * 1; // Ľahké
          break;
        case '@typescript-eslint/no-explicit-any':
          effortScore += count * 2; // Stredné
          break;
        case 'react-hooks/exhaustive-deps':
          effortScore += count * 3; // Ťažké
          break;
        case '@typescript-eslint/ban-types':
          effortScore += count * 2; // Stredné
          break;
        default:
          effortScore += count * 1.5; // Default
      }
    });
    
    // Impact/Effort ratio - vyšší je lepší
    const priority = impactScore / Math.max(effortScore, 1);
    
    return {
      ...file,
      impactScore,
      effortScore,
      priority
    };
  }).sort((a, b) => b.priority - a.priority);
}

// Hlavná smart fix funkcia
async function smartFix() {
  try {
    // 1. Získaj a analyzuj chyby
    const eslintResults = JSON.parse(
      execSync('npx eslint . --ext .ts,.tsx --format json', { encoding: 'utf8' })
    );
    
    const fileAnalysis = eslintResults
      .filter(result => result.messages.length > 0)
      .map(result => ({
        file: path.basename(result.filePath),
        path: result.filePath,
        errors: result.messages.length,
        rules: result.messages.reduce((acc, msg) => {
          const rule = msg.ruleId || 'unknown';
          acc[rule] = (acc[rule] || 0) + 1;
          return acc;
        }, {})
      }));
    
    // 2. Prioritizuj súbory
    const prioritizedFiles = prioritizeFiles(fileAnalysis);
    
    console.log(`\n🎯 SMART PRIORITY SÚBORY (top 20):`);
    prioritizedFiles.slice(0, 20).forEach((file, index) => {
      console.log(`${index + 1}. ${file.file} (${file.errors} chýb, priority: ${file.priority.toFixed(2)})`);
    });
    
    // 3. Aplikuj smart fixes
    let totalFixed = 0;
    const fixResults = [];
    
    for (const file of prioritizedFiles.slice(0, 30)) { // Top 30 súborov
      console.log(`\n🔧 Opravujem ${file.file}...`);
      
      let fileFixed = 0;
      
      // Unused imports
      if (file.rules['@typescript-eslint/no-unused-vars']) {
        if (smartFixUnusedImports(file.path)) {
          fileFixed++;
          console.log(`  ✅ Unused imports opravené`);
        }
      }
      
      // Any types
      if (file.rules['@typescript-eslint/no-explicit-any']) {
        if (smartFixAnyTypes(file.path)) {
          fileFixed++;
          console.log(`  ✅ Any types opravené`);
        }
      }
      
      // React hooks
      if (file.rules['react-hooks/exhaustive-deps']) {
        if (smartFixReactHooks(file.path)) {
          fileFixed++;
          console.log(`  ✅ React hooks opravené`);
        }
      }
      
      // Case declarations
      if (file.rules['no-case-declarations']) {
        if (smartFixCaseDeclarations(file.path)) {
          fileFixed++;
          console.log(`  ✅ Case declarations opravené`);
        }
      }
      
      totalFixed += fileFixed;
      fixResults.push({
        file: file.file,
        originalErrors: file.errors,
        fixesApplied: fileFixed
      });
    }
    
    console.log(`\n🎉 SMART FIX DOKONČENÝ:`);
    console.log(`   Spracované súbory: ${fixResults.length}`);
    console.log(`   Aplikované opravy: ${totalFixed}`);
    
    // 4. Finálna validácia
    console.log(`\n🔍 Finálna validácia...`);
    try {
      execSync('npx eslint . --ext .ts,.tsx --format json', { stdio: 'pipe' });
      console.log(`✅ Všetky chyby opravené!`);
    } catch (error) {
      const remainingErrors = JSON.parse(error.stdout);
      const totalRemaining = remainingErrors.reduce((sum, file) => sum + file.messages.length, 0);
      console.log(`⚠️ Zostáva ${totalRemaining} chýb na manuálne opravenie`);
    }
    
  } catch (error) {
    console.error('❌ Chyba pri smart fix:', error.message);
  }
}

// Spusti ak je volaný priamo
if (require.main === module) {
  smartFix();
}

module.exports = { smartFix, prioritizeFiles };
