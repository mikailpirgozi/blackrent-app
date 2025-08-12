#!/usr/bin/env node

const http = require('http');
const { exec } = require('child_process');

/**
 * Health Monitor - sleduje zdravie aplikácie a automaticky opravuje problémy
 */

const CONFIG = {
  port: 3002,
  checkInterval: 30000, // 30 sekúnd
  maxRetries: 3,
  timeout: 5000
};

let retryCount = 0;
let isRecovering = false;

function checkServerHealth() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: CONFIG.port,
      path: '/',
      method: 'GET',
      timeout: CONFIG.timeout
    }, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        reject(new Error(`Server returned ${res.statusCode}`));
      }
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function recoverServer() {
  if (isRecovering) return;
  
  isRecovering = true;
  console.log('🚨 Server nereaguje! Spúšťam obnovu...');

  try {
    // Kill existing processes
    console.log('🔄 Ukončujem existujúce procesy...');
    await execPromise('pkill -f "next dev" || true');
    
    // Clean cache
    console.log('🧹 Čistím cache...');
    await execPromise('rm -rf .next');
    await execPromise('rm -rf node_modules/.cache');
    
    // Validate SVG
    console.log('🔍 Validujem SVG...');
    await execPromise('node scripts/svg-validator.js');
    
    // Restart server
    console.log('🚀 Reštartujem server...');
    exec('npm run dev', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Chyba pri reštarte:', error);
      } else {
        console.log('✅ Server reštartovaný!');
      }
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Chyba pri obnove:', error.message);
  } finally {
    isRecovering = false;
  }
}

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function startMonitoring() {
  console.log(`🔍 Spúšťam health monitoring na porte ${CONFIG.port}...`);
  console.log(`📊 Kontrola každých ${CONFIG.checkInterval / 1000} sekúnd`);

  setInterval(async () => {
    try {
      await checkServerHealth();
      
      if (retryCount > 0) {
        console.log('✅ Server je opäť zdravý!');
        retryCount = 0;
      }
      
      process.stdout.write('💚'); // Zdravý status
      
    } catch (error) {
      retryCount++;
      console.log(`\n❌ Server check zlyhal (${retryCount}/${CONFIG.maxRetries}): ${error.message}`);
      
      if (retryCount >= CONFIG.maxRetries) {
        await recoverServer();
        retryCount = 0;
      }
    }
  }, CONFIG.checkInterval);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Ukončujem monitoring...');
  process.exit(0);
});

// Start monitoring
startMonitoring().catch(console.error);
