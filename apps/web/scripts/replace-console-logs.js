#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Count console statements
async function countConsole(dir) {
  try {
    const { stdout } = await execAsync(`grep -r "console\\.log\\|console\\.debug\\|console\\.info" "${dir}" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l`);
    return parseInt(stdout.trim()) || 0;
  } catch {
    return 0;
  }
}

// Replace console statements in a file
function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if logger import exists
  const hasLoggerImport = content.includes('smartLogger') || content.includes('@/utils/logger');
  
  // Add import if needed and file has console statements
  if (!hasLoggerImport && /console\.(log|debug|info)/.test(content)) {
    // Find last import
    const importMatch = content.match(/^import\s+.+from.+;$/gm);
    if (importMatch && importMatch.length > 0) {
      const lastImport = importMatch[importMatch.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertPos = lastImportIndex + lastImport.length;
      
      content = content.slice(0, insertPos) + 
                "\nimport { logger } from '@/utils/smartLogger';" +
                content.slice(insertPos);
      modified = true;
    }
  }
  
  // Replace console statements
  const originalContent = content;
  content = content
    .replace(/console\.log\(/g, 'logger.debug(')
    .replace(/console\.debug\(/g, 'logger.debug(')
    .replace(/console\.info\(/g, 'logger.info(');
    
  if (content !== originalContent) {
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Find all TS/TSX files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'build') {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      // Skip logger files
      if (!filePath.includes('smartLogger.ts') && !filePath.includes('logger.ts') && !filePath.includes('setupTests.ts')) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

async function main() {
  const srcDir = path.join(__dirname, '../src');
  
  console.log('🧹 Starting console.log replacement...\n');
  
  const before = await countConsole(srcDir);
  console.log(`📊 Before: ${before} console statements\n`);
  
  const files = findFiles(srcDir);
  let modifiedCount = 0;
  
  files.forEach(file => {
    if (replaceInFile(file)) {
      modifiedCount++;
      console.log(`  ✅ ${path.relative(srcDir, file)}`);
    }
  });
  
  const after = await countConsole(srcDir);
  const removed = before - after;
  
  console.log(`\n📊 RESULTS:`);
  console.log(`  Files modified: ${modifiedCount}`);
  console.log(`  Before:  ${before} console statements`);
  console.log(`  After:   ${after} console statements`);
  console.log(`  Removed: ${removed} statements (-${((removed/before)*100).toFixed(1)}%)`);
  console.log('\n✅ Cleanup complete!');
}

main().catch(console.error);
