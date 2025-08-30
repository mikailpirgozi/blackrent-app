#!/usr/bin/env node

// 🛡️ Vite Config Guard - Prevents dangerous MUI chunking
// This script monitors vite.config.ts and prevents MUI chunks

const fs = require('fs');
const path = require('path');

const VITE_CONFIG_PATH = path.join(process.cwd(), 'vite.config.ts');

function checkViteConfig() {
  console.log('🛡️ Vite Config Guard - Checking for dangerous MUI chunking...');
  
  if (!fs.existsSync(VITE_CONFIG_PATH)) {
    console.log('❌ vite.config.ts not found!');
    return false;
  }
  
  const config = fs.readFileSync(VITE_CONFIG_PATH, 'utf8');
  
  // Check for dangerous patterns
  const dangerousPatterns = [
    /@mui.*return\s+['"`]mui['"`]/,
    /mui.*return\s+['"`]mui/,
    /date-fns.*return\s+['"`]date/,
    /dayjs.*return\s+['"`]date/
  ];
  
  let hasDangerousChunking = false;
  
  dangerousPatterns.forEach((pattern, index) => {
    if (pattern.test(config)) {
      console.log(`❌ DANGER: Found dangerous MUI chunking pattern ${index + 1}`);
      hasDangerousChunking = true;
    }
  });
  
  // Check for safe nuclear option
  if (config.includes('manualChunks: undefined')) {
    console.log('✅ SAFE: Nuclear option detected (manualChunks: undefined)');
    return true;
  }
  
  if (hasDangerousChunking) {
    console.log('');
    console.log('🔧 FIXING: Applying nuclear option...');
    
    // Apply nuclear option
    const fixedConfig = config.replace(
      /manualChunks:\s*\([^}]+\}/gs,
      'manualChunks: undefined'
    );
    
    fs.writeFileSync(VITE_CONFIG_PATH, fixedConfig);
    console.log('✅ FIXED: Applied nuclear option to vite.config.ts');
    return true;
  }
  
  console.log('✅ SAFE: No dangerous MUI chunking detected');
  return true;
}

// Run check
const isConfigSafe = checkViteConfig();

if (!isConfigSafe) {
  console.log('❌ Vite Config Guard FAILED!');
  process.exit(1);
} else {
  console.log('🎉 Vite Config Guard PASSED!');
}
