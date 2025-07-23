#!/usr/bin/env node

/**
 * 🚀 AUTOMATICKÝ PUPPETEER TEST
 * 
 * Spustí backend, otestuje Puppeteer a ukončí
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BACKEND_PORT = 5001;
const TEST_TIMEOUT = 60000; // 60 sekúnd

let backendProcess = null;

async function runAutomaticTest() {
  console.log('🚀 Spúšťam automatický Puppeteer test...\n');
  
  try {
    // 1. Spustiť backend
    console.log('1️⃣ Spúšťam backend server...');
    await startBackend();
    
    // 2. Počkať na backend
    console.log('2️⃣ Čakám na backend server...');
    await waitForBackend();
    
    // 3. Spustiť Puppeteer test
    console.log('3️⃣ Testujem Puppeteer generátor...');
    await testPuppeteer();
    
    console.log('\n✅ VŠETKY TESTY ÚSPEŠNÉ!');
    console.log('🎉 Puppeteer funguje lokálne - môžeme pushnúť na Railway!');
    
  } catch (error) {
    console.error('\n❌ TEST ZLYHAL:', error.message);
    process.exit(1);
  } finally {
    // Ukončiť backend
    if (backendProcess) {
      console.log('\n🛑 Ukončujem backend server...');
      backendProcess.kill();
    }
  }
}

function startBackend() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Backend startup timeout'));
    }, 30000);
    
    // Spustiť backend v backend adresári
    backendProcess = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: 'development',
        PDF_GENERATOR_TYPE: 'puppeteer'
      }
    });
    
    let startupOutput = '';
    
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      startupOutput += output;
      
      // Hľadaj úspešný štart
      if (output.includes('BlackRent server beží na porte')) {
        clearTimeout(timeout);
        console.log('   ✅ Backend server spustený');
        resolve();
      }
    });
    
    backendProcess.stderr.on('data', (data) => {
      console.log('   ⚠️  Backend stderr:', data.toString());
    });
    
    backendProcess.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Backend startup error: ${error.message}`));
    });
    
    backendProcess.on('exit', (code) => {
      if (code !== 0) {
        clearTimeout(timeout);
        reject(new Error(`Backend exited with code ${code}`));
      }
    });
  });
}

function waitForBackend() {
  return new Promise((resolve, reject) => {
    const maxAttempts = 20;
    let attempts = 0;
    
    const checkHealth = () => {
      attempts++;
      
      const req = http.get(`http://localhost:${BACKEND_PORT}/api/health`, (res) => {
        if (res.statusCode === 200) {
          console.log('   ✅ Backend health check OK');
          resolve();
        } else {
          if (attempts < maxAttempts) {
            setTimeout(checkHealth, 1000);
          } else {
            reject(new Error('Backend health check failed'));
          }
        }
      });
      
      req.on('error', () => {
        if (attempts < maxAttempts) {
          setTimeout(checkHealth, 1000);
        } else {
          reject(new Error('Backend not responding'));
        }
      });
      
      req.setTimeout(5000);
    };
    
    setTimeout(checkHealth, 2000); // Počkaj 2 sekundy pred prvým pokusom
  });
}

async function testPuppeteer() {
  const testData = {
    rentalData: {
      id: 'TEST-AUTO-001',
      customerName: 'Automatický Test',
      vehicleBrand: 'BMW',
      vehicleModel: 'X5 Test',
      licensePlate: 'BA-AUTO-01',
      rentalStart: new Date().toISOString(),
      rentalEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    vehicleCondition: {
      exterior: { frontBumper: 'good', rearBumper: 'good', leftSide: 'good', rightSide: 'good' },
      interior: { seats: 'good', dashboard: 'good' },
      technical: { engine: 'good', brakes: 'good' }
    },
    signatures: {
      customer: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      employee: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    },
    location: 'Automatický Test Bratislava',
    notes: 'Automatický test Puppeteer generátora'
  };
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      type: 'handover',
      data: testData
    });
    
    const options = {
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: '/api/protocols/generate-pdf?generator=puppeteer',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      console.log(`   📡 Response status: ${res.statusCode}`);
      console.log(`   📋 Content-Type: ${res.headers['content-type']}`);
      
      if (res.statusCode === 200 && res.headers['content-type'] === 'application/pdf') {
        let pdfData = Buffer.alloc(0);
        
        res.on('data', chunk => {
          pdfData = Buffer.concat([pdfData, chunk]);
        });
        
        res.on('end', () => {
          const filename = `auto-test-puppeteer-${Date.now()}.pdf`;
          fs.writeFileSync(filename, pdfData);
          
          console.log(`   ✅ PDF vygenerované: ${filename}`);
          console.log(`   📄 Veľkosť: ${(pdfData.length / 1024).toFixed(2)} KB`);
          
          // Verify PDF header
          if (pdfData.toString('ascii', 0, 4) === '%PDF') {
            console.log('   ✅ PDF header validný');
            resolve();
          } else {
            reject(new Error('Nevalidný PDF súbor'));
          }
        });
      } else {
        let errorData = '';
        res.on('data', chunk => errorData += chunk);
        res.on('end', () => {
          reject(new Error(`HTTP ${res.statusCode}: ${errorData}`));
        });
      }
    });
    
    req.on('error', (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });
    
    req.setTimeout(30000, () => {
      reject(new Error('PDF generation timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

// Spustiť automatický test
if (require.main === module) {
  runAutomaticTest();
}

module.exports = { runAutomaticTest }; 