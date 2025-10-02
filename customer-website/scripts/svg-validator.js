#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * SVG Validator - zabráni komplexným SVG filtrom ktoré crashujú Webpack
 */

const PROBLEMATIC_PATTERNS = [
  // Komplexné filtre
  /<filter[^>]*>[\s\S]*?<\/filter>/gi,
  // Viac ako 3 filter elementy
  /(<fe[A-Za-z]+[^>]*>)/g,
  // foreignObject elementy
  /<foreignObject[\s\S]*?<\/foreignObject>/gi,
  // clipPath s komplexnými path
  /<clipPath[\s\S]*?<\/clipPath>/gi,
  // Príliš veľa gradient stops
  /<stop[^>]*>/g
];

const MAX_FILTER_ELEMENTS = 3;
const MAX_GRADIENT_STOPS = 5;

function validateSVG(filePath, content) {
  const warnings = [];
  const errors = [];

  // Check for problematic filters
  const filterMatches = content.match(PROBLEMATIC_PATTERNS[0]);
  if (filterMatches && filterMatches.length > 2) {
    errors.push(`❌ Príliš veľa komplexných filtrov (${filterMatches.length}). Maximum: 2`);
  }

  // Check filter elements count
  const feMatches = content.match(PROBLEMATIC_PATTERNS[1]);
  if (feMatches && feMatches.length > MAX_FILTER_ELEMENTS) {
    errors.push(`❌ Príliš veľa filter elementov (${feMatches.length}). Maximum: ${MAX_FILTER_ELEMENTS}`);
  }

  // Check for foreignObject
  if (PROBLEMATIC_PATTERNS[2].test(content)) {
    errors.push(`❌ foreignObject elementy nie sú podporované`);
  }

  // Check gradient stops
  const stopMatches = content.match(PROBLEMATIC_PATTERNS[4]);
  if (stopMatches && stopMatches.length > MAX_GRADIENT_STOPS) {
    warnings.push(`⚠️  Veľa gradient stops (${stopMatches.length}). Odporúčané: max ${MAX_GRADIENT_STOPS}`);
  }

  return { warnings, errors };
}

function scanSVGFiles(dir) {
  let allErrors = [];
  let allWarnings = [];

  function scanDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDir(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.svg')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check if file contains SVG
        if (content.includes('<svg') || content.includes('xmlns="http://www.w3.org/2000/svg"')) {
          const { warnings, errors } = validateSVG(fullPath, content);
          
          if (errors.length > 0) {
            console.log(`\n🔴 ERRORS v ${fullPath}:`);
            errors.forEach(error => console.log(`  ${error}`));
            allErrors.push(...errors);
          }
          
          if (warnings.length > 0) {
            console.log(`\n🟡 WARNINGS v ${fullPath}:`);
            warnings.forEach(warning => console.log(`  ${warning}`));
            allWarnings.push(...warnings);
          }
        }
      }
    }
  }

  scanDir(dir);
  return { allErrors, allWarnings };
}

// Main execution
const srcDir = path.join(__dirname, '../src');
console.log('🔍 Skenujem SVG súbory...\n');

const { allErrors, allWarnings } = scanSVGFiles(srcDir);

console.log(`\n📊 SÚHRN:`);
console.log(`   Errors: ${allErrors.length}`);
console.log(`   Warnings: ${allWarnings.length}`);

if (allErrors.length > 0) {
  console.log(`\n❌ NAŠLI SA KRITICKÉ CHYBY! Build môže zlyhať.`);
  process.exit(1);
} else {
  console.log(`\n✅ Všetky SVG súbory sú v poriadku!`);
  process.exit(0);
}
