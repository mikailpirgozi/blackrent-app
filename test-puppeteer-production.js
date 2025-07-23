#!/usr/bin/env node

/**
 * 🧪 TEST PUPPETEER NA RAILWAY PRODUKCII
 * 
 * Testuje Puppeteer PDF generátor na produkčnom Railway serveri
 */

const https = require('https');
const fs = require('fs');

const RAILWAY_URL = 'https://blackrent-beta-2-production.up.railway.app';

// Test data pre handover protokol
const testHandoverData = {
  rentalData: {
    id: 'TEST-001',
    customerName: 'Ján Novák',
    vehicleBrand: 'BMW',
    vehicleModel: 'X5',
    licensePlate: 'BA123AB',
    rentalStart: new Date().toISOString(),
    rentalEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  vehicleCondition: {
    exterior: {
      frontBumper: 'good',
      rearBumper: 'good',
      leftSide: 'good',
      rightSide: 'good',
      roof: 'good',
      hood: 'good',
      trunk: 'good'
    },
    interior: {
      seats: 'good',
      dashboard: 'good',
      steering: 'good',
      electronics: 'good'
    },
    technical: {
      engine: 'good',
      brakes: 'good',
      lights: 'good',
      tires: 'good'
    }
  },
  signatures: {
    customer: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    employee: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  },
  vehicleImages: [],
  location: 'Bratislava',
  notes: 'Test protokol pre Puppeteer na Railway'
};

async function testPuppeteerOnRailway() {
  console.log('🧪 Testujem Puppeteer na Railway produkcii...');
  console.log(`🌐 URL: ${RAILWAY_URL}`);
  
  try {
    // Test 1: Health check
    console.log('\n1️⃣ Health check...');
    await testHealthCheck();
    
    // Test 2: Puppeteer PDF generation
    console.log('\n2️⃣ Puppeteer PDF generácia...');
    await testPuppeteerPDF();
    
    console.log('\n✅ Všetky testy úspešné! Puppeteer funguje na Railway.');
    
  } catch (error) {
    console.error('\n❌ Test zlyhal:', error.message);
    process.exit(1);
  }
}

function testHealthCheck() {
  return new Promise((resolve, reject) => {
    const req = https.get(`${RAILWAY_URL}/api/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          console.log(`   ✅ Server status: ${health.status}`);
          console.log(`   📊 Environment: ${health.environment}`);
          console.log(`   🗄️  Database: ${health.database}`);
          resolve();
        } catch (err) {
          reject(new Error(`Health check parsing error: ${err.message}`));
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => reject(new Error('Health check timeout')));
  });
}

function testPuppeteerPDF() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      type: 'handover',
      data: testHandoverData,
      generator: 'puppeteer'
    });
    
    const options = {
      hostname: 'blackrent-beta-2-production.up.railway.app',
      port: 443,
      path: '/api/protocols/generate-pdf?generator=puppeteer',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      console.log(`   📡 Response status: ${res.statusCode}`);
      console.log(`   📋 Content-Type: ${res.headers['content-type']}`);
      
      if (res.statusCode === 200 && res.headers['content-type'] === 'application/pdf') {
        let pdfData = Buffer.alloc(0);
        
        res.on('data', chunk => {
          pdfData = Buffer.concat([pdfData, chunk]);
        });
        
        res.on('end', () => {
          const filename = `test-puppeteer-railway-${Date.now()}.pdf`;
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
    
    req.on('error', reject);
    req.setTimeout(30000, () => reject(new Error('PDF generation timeout')));
    req.write(postData);
    req.end();
  });
}

// Spustiť test
if (require.main === module) {
  testPuppeteerOnRailway();
}

module.exports = { testPuppeteerOnRailway }; 