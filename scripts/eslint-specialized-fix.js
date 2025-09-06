#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎯 BLACKRENT ESLint Specialized Fix - Špecializované opravy');
console.log('===========================================================');

// Špecializované opravy pre React komponenty
function fixReactComponentIssues(filePath) {
  if (!fs.existsSync(filePath) || !filePath.endsWith('.tsx')) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // 1. Oprava event handlerov
  const eventHandlerFixes = [
    { from: /\(event:\s*any\)/g, to: '(event: React.ChangeEvent<HTMLInputElement>)' },
    { from: /\(e:\s*any\)/g, to: '(e: React.MouseEvent)' },
    { from: /onClick=\{.*\(.*:\s*any.*\).*\}/g, to: (match) => match.replace('any', 'React.MouseEvent') }
  ];
  
  eventHandlerFixes.forEach(({ from, to }) => {
    if (content.match(from)) {
      content = content.replace(from, to);
      changed = true;
    }
  });
  
  // 2. Oprava props typov
  content = content.replace(
    /interface\s+(\w+)Props\s*{[^}]*(\w+):\s*any[^}]*}/g,
    (match, componentName, propName) => {
      // Inteligentné určenie typu na základe názvu prop
      let propType = 'unknown';
      if (propName.includes('handler') || propName.includes('onClick')) {
        propType = '() => void';
      } else if (propName.includes('data') || propName.includes('items')) {
        propType = 'unknown[]';
      } else if (propName.includes('config') || propName.includes('options')) {
        propType = 'Record<string, unknown>';
      }
      
      return match.replace(/:\s*any/, `: ${propType}`);
    }
  );
  
  // 3. Oprava useState typov
  content = content.replace(
    /useState<any>\(/g,
    'useState<unknown>('
  );
  
  content = content.replace(
    /useState\(.*as\s+any.*\)/g,
    (match) => match.replace('as any', 'as unknown')
  );
  
  if (changed || content !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  
  return false;
}

// Špecializované opravy pre utility súbory
function fixUtilityIssues(filePath) {
  if (!fs.existsSync(filePath) || !filePath.endsWith('.ts')) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // 1. API response typy
  content = content.replace(
    /:\s*any\s*=.*\.json\(\)/g,
    ': unknown = await response.json()'
  );
  
  // 2. Error handling
  content = content.replace(
    /catch\s*\(\s*error:\s*any\s*\)/g,
    'catch (error: unknown)'
  );
  
  // 3. Generic funkcie
  content = content.replace(
    /function\s+(\w+)\s*\([^)]*:\s*any[^)]*\)/g,
    (match, funcName) => match.replace('any', 'unknown')
  );
  
  // 4. Export typy
  content = content.replace(
    /export\s+(interface|type)\s+\w+\s*=\s*any/g,
    (match) => match.replace('any', 'unknown')
  );
  
  if (content !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, content);
    changed = true;
  }
  
  return changed;
}

// Špecializované opravy pre backend súbory
function fixBackendIssues(filePath) {
  if (!fs.existsSync(filePath) || !filePath.includes('backend/')) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // 1. Database query results
  content = content.replace(
    /\.rows\[\d+\]\s*as\s*any/g,
    '.rows[0] as Record<string, unknown>'
  );
  
  // 2. Request/Response typy
  content = content.replace(
    /(req|res):\s*any/g,
    '$1: Request | Response'
  );
  
  // 3. Database connection typy
  content = content.replace(
    /client:\s*any/g,
    'client: PoolClient'
  );
  
  // 4. API endpoint responses
  content = content.replace(
    /res\.json\(.*as\s*any.*\)/g,
    (match) => match.replace('as any', 'as Record<string, unknown>')
  );
  
  if (content !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, content);
    changed = true;
  }
  
  return changed;
}

// Oprava komplexných unused imports s AST-like analýzou
function advancedUnusedImportsFix(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let changed = false;
  
  // Zbieranie všetkých identifikátorov použitých v kóde
  const usedIdentifiers = new Set();
  const importMap = new Map(); // import name -> line index
  
  lines.forEach((line, index) => {
    // Skip import lines pre analýzu použitia
    if (line.trim().startsWith('import ')) {
      // Parse import line
      const namedImports = line.match(/import\s*{\s*([^}]+)\s*}/);
      const defaultImport = line.match(/import\s+(\w+)\s+from/);
      
      if (namedImports) {
        namedImports[1].split(',').forEach(imp => {
          const cleanImport = imp.trim().split(' as ')[0].trim();
          importMap.set(cleanImport, index);
        });
      }
      
      if (defaultImport) {
        importMap.set(defaultImport[1], index);
      }
      
      return;
    }
    
    // Nájdi všetky identifikátory v non-import riadkoch
    const identifiers = line.match(/\b[A-Za-z_$][A-Za-z0-9_$]*\b/g) || [];
    identifiers.forEach(id => {
      // Ignoruj common keywords
      if (!['const', 'let', 'var', 'function', 'class', 'interface', 'type', 'export', 'import'].includes(id)) {
        usedIdentifiers.add(id);
      }
    });
  });
  
  // Odstráň nepoužívané importy
  importMap.forEach((lineIndex, importName) => {
    if (!usedIdentifiers.has(importName)) {
      const line = lines[lineIndex];
      
      // Ak je to jediný import v riadku, odstráň celý riadok
      const namedImports = line.match(/import\s*{\s*([^}]+)\s*}/);
      if (namedImports) {
        const imports = namedImports[1].split(',').map(imp => imp.trim());
        const usedImports = imports.filter(imp => {
          const cleanImport = imp.split(' as ')[0].trim();
          return usedIdentifiers.has(cleanImport);
        });
        
        if (usedImports.length === 0) {
          lines[lineIndex] = ''; // Odstráň celý riadok
          changed = true;
        } else if (usedImports.length < imports.length) {
          // Aktualizuj import s len používanými
          lines[lineIndex] = line.replace(
            /{\s*[^}]+\s*}/,
            `{ ${usedImports.join(', ')} }`
          );
          changed = true;
        }
      } else {
        // Default import - odstráň celý riadok
        lines[lineIndex] = '';
        changed = true;
      }
    }
  });
  
  if (changed) {
    // Vyčisti prázdne riadky
    const cleanContent = lines
      .filter(line => line.trim() !== '' || lines.indexOf(line) === 0)
      .join('\n')
      .replace(/\n\s*\n\s*\n/g, '\n\n');
    
    fs.writeFileSync(filePath, cleanContent);
    return true;
  }
  
  return false;
}

// Hlavná funkcia pre špecializované opravy
async function specializedFix() {
  try {
    console.log('🔍 Analyzujem súbory pre špecializované opravy...');
    
    // Získaj súbory s chybami
    const eslintResults = JSON.parse(
      execSync('npx eslint . --ext .ts,.tsx --format json 2>/dev/null || echo "[]"', { encoding: 'utf8' })
    );
    
    const problemFiles = eslintResults
      .filter(result => result.messages.length > 0)
      .map(result => result.filePath);
    
    console.log(`📁 Našiel som ${problemFiles.length} súborov s chybami`);
    
    let totalFixed = 0;
    const results = {
      reactComponents: 0,
      utilityFiles: 0,
      backendFiles: 0,
      unusedImports: 0
    };
    
    // Aplikuj špecializované opravy
    for (const filePath of problemFiles) {
      const fileName = path.basename(filePath);
      console.log(`🔧 Spracúvam ${fileName}...`);
      
      // React komponenty
      if (filePath.endsWith('.tsx')) {
        if (fixReactComponentIssues(filePath)) {
          results.reactComponents++;
          totalFixed++;
          console.log(`  ✅ React component fixes applied`);
        }
      }
      
      // Utility súbory
      if (filePath.endsWith('.ts') && !filePath.includes('backend/')) {
        if (fixUtilityIssues(filePath)) {
          results.utilityFiles++;
          totalFixed++;
          console.log(`  ✅ Utility fixes applied`);
        }
      }
      
      // Backend súbory
      if (filePath.includes('backend/')) {
        if (fixBackendIssues(filePath)) {
          results.backendFiles++;
          totalFixed++;
          console.log(`  ✅ Backend fixes applied`);
        }
      }
      
      // Advanced unused imports
      if (advancedUnusedImportsFix(filePath)) {
        results.unusedImports++;
        totalFixed++;
        console.log(`  ✅ Advanced unused imports fixed`);
      }
    }
    
    console.log(`\n🎉 ŠPECIALIZOVANÉ OPRAVY DOKONČENÉ:`);
    console.log(`   React komponenty: ${results.reactComponents} súborov`);
    console.log(`   Utility súbory: ${results.utilityFiles} súborov`);
    console.log(`   Backend súbory: ${results.backendFiles} súborov`);
    console.log(`   Unused imports: ${results.unusedImports} súborov`);
    console.log(`   Celkovo opravené: ${totalFixed} súborov`);
    
    // Finálna validácia
    console.log(`\n🔍 Finálna validácia...`);
    try {
      execSync('npx eslint . --ext .ts,.tsx --format json', { stdio: 'pipe' });
      console.log(`✅ Všetky chyby opravené!`);
    } catch (error) {
      const remainingErrors = JSON.parse(error.stdout || '[]');
      const totalRemaining = remainingErrors.reduce((sum, file) => sum + file.messages.length, 0);
      console.log(`⚠️ Zostáva ${totalRemaining} chýb na manuálne opravenie`);
      
      // Ukáž top 5 zostávajúcich súborov
      const topRemaining = remainingErrors
        .filter(f => f.messages.length > 0)
        .sort((a, b) => b.messages.length - a.messages.length)
        .slice(0, 5);
      
      console.log(`\n📋 Top 5 zostávajúcich súborov:`);
      topRemaining.forEach(file => {
        console.log(`   ${file.messages.length}\t${path.basename(file.filePath)}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Chyba pri špecializovaných opravách:', error.message);
  }
}

// Spusti ak je volaný priamo
if (require.main === module) {
  specializedFix();
}

module.exports = { specializedFix };
