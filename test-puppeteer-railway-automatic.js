#!/usr/bin/env node

/**
 * 🧪 AUTOMATICKÝ TEST PUPPETEER NA RAILWAY
 * 
 * Tento script automaticky testuje či Railway používa Puppeteer
 * namiesto starého PDF generátora.
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const RAILWAY_API_BASE = 'https://blackrent-app-production-4d6f.up.railway.app/api';
const TEST_OUTPUT_DIR = './puppeteer-test-results';

// Ensure output directory exists
if (!fs.existsSync(TEST_OUTPUT_DIR)) {
  fs.mkdirSync(TEST_OUTPUT_DIR);
}

console.log('🧪 AUTOMATICKÝ TEST PUPPETEER NA RAILWAY');
console.log('=========================================');

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testPuppeteerConfig() {
  console.log('\n🔍 KROK 1: Testovanie Puppeteer konfigurácie...');
  
  try {
    const response = await makeRequest(`${RAILWAY_API_BASE}/debug/puppeteer-config`);
    
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.data}`);
    }
    
    const config = JSON.parse(response.data);
    
    console.log('📋 Puppeteer config response:', JSON.stringify(config, null, 2));
    
    if (config.success && config.config.puppeteerEnabled === true) {
      console.log('✅ Puppeteer je AKTÍVNY na Railway');
      console.log(`   - Generator Type: ${config.config.generatorType}`);
      console.log(`   - Chrome Path: ${config.config.chromiumPath}`);
      return true;
    } else {
      console.log('❌ Puppeteer NIE JE aktívny na Railway');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Chyba pri testovaní config:', error.message);
    return false;
  }
}

async function createTestProtocol() {
  console.log('\n🧪 KROK 2: Vytváranie testovacieho protokolu...');
  
  const testProtocolData = {
    id: `test-${Date.now()}`,
    rentalId: 'test-rental-id',
    type: 'handover',
    location: 'Automatický Test Location',
    vehicleCondition: {
      odometer: 12345,
      fuelLevel: 100,
      fuelType: 'gasoline',
      exteriorCondition: 'Excellent',
      interiorCondition: 'Good',
      notes: 'Automatický test protokol'
    },
    vehicleImages: [],
    vehicleVideos: [],
    documentImages: [],
    documentVideos: [],
    damageImages: [],
    damageVideos: [],
    damages: [],
    signatures: [{
      id: 'test-signature',
      signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      signerName: 'Test User',
      signerRole: 'employee',
      timestamp: new Date().toISOString(),
      location: 'Test Location',
      ipAddress: '127.0.0.1'
    }],
    rentalData: {
      orderNumber: 'TEST-' + Date.now(),
      vehicle: {
        id: 'test-vehicle-id',
        brand: 'Test',
        model: 'Vehicle',
        licensePlate: 'TEST-123',
        company: 'Test Company'
      },
      customer: {
        id: 'test-customer-id',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+421900000000'
      },
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      totalPrice: 100,
      deposit: 50,
      currency: 'EUR',
      allowedKilometers: 1000,
      extraKilometerRate: 0.5
    },
    notes: 'Automatický test protokol pre Puppeteer',
    createdBy: 'test-user',
    status: 'completed',
    completedAt: new Date().toISOString()
  };
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Puppeteer-Test-Script/1.0'
    },
    body: JSON.stringify(testProtocolData)
  };
  
  try {
    console.log('🔄 Volám backend API pre vytvorenie protokolu...');
    const response = await makeRequest(`${RAILWAY_API_BASE}/protocols/handover`, options);
    
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response headers:`, response.headers);
    
    if (response.status === 401) {
      console.log('⚠️  401 Unauthorized - to je očakávané pre test bez auth token');
      console.log('   Testujeme alternatívny debug endpoint...');
      return await testDebugPDFEndpoint();
    }
    
    if (response.status !== 200 && response.status !== 201) {
      console.log('❌ Unexpected status code:', response.status);
      console.log('❌ Response:', response.data);
      return false;
    }
    
    const result = JSON.parse(response.data);
    console.log('✅ Protocol creation response:', JSON.stringify(result, null, 2));
    
    if (result.protocol && result.protocol.pdfUrl) {
      return await downloadAndAnalyzePDF(result.protocol.pdfUrl);
    } else {
      console.log('❌ Response neobsahuje PDF URL');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Chyba pri vytváraní protokolu:', error.message);
    return false;
  }
}

async function testDebugPDFEndpoint() {
  console.log('\n🧪 KROK 2b: Testovanie debug PDF endpoint...');
  
  try {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(`${RAILWAY_API_BASE}/debug/test-puppeteer-pdf`, options);
    
    console.log(`📊 Debug endpoint status: ${response.status}`);
    
    if (response.status === 404) {
      console.log('❌ Debug endpoint neexistuje (404)');
      return false;
    }
    
    if (response.status === 200) {
      const result = JSON.parse(response.data);
      console.log('✅ Debug PDF test response:', JSON.stringify(result, null, 2));
      
      if (result.success && result.size) {
        console.log(`✅ Puppeteer PDF úspešne vygenerované!`);
        console.log(`📊 Veľkosť PDF: ${result.size} bytes (${result.sizeKB} KB)`);
        
        if (result.size > 200000) { // > 200KB
          console.log('🎉 PDF má správnu veľkosť pre Puppeteer (>200KB)');
          return true;
        } else if (result.size < 50000) { // < 50KB  
          console.log('❌ PDF je príliš malé - pravdepodobne fallback generátor');
          return false;
        } else {
          console.log('⚠️  PDF má strednú veľkosť - potrebná ďalšia analýza');
          return true;
        }
      }
    }
    
    console.log('❌ Debug endpoint zlyhal:', response.data);
    return false;
    
  } catch (error) {
    console.error('❌ Chyba pri debug teste:', error.message);
    return false;
  }
}

async function downloadAndAnalyzePDF(pdfUrl) {
  console.log('\n📥 KROK 3: Sťahovanie a analýza PDF...');
  console.log(`📎 PDF URL: ${pdfUrl}`);
  
  try {
    const response = await makeRequest(pdfUrl);
    
    if (response.status !== 200) {
      throw new Error(`Failed to download PDF: ${response.status}`);
    }
    
    const pdfSize = Buffer.byteLength(response.data);
    const pdfSizeKB = Math.round(pdfSize / 1024);
    
    console.log(`📊 PDF stiahnuté: ${pdfSize} bytes (${pdfSizeKB} KB)`);
    
    // Save PDF for inspection
    const filename = `puppeteer-test-${Date.now()}.pdf`;
    const filepath = path.join(TEST_OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, response.data);
    console.log(`💾 PDF uložené: ${filepath}`);
    
    // Analyze PDF size
    if (pdfSize > 200000) { // > 200KB
      console.log('🎉 ÚSPECH: PDF má veľkosť typickú pre Puppeteer (>200KB)');
      console.log('   Toto naznačuje že sa používa HTML/CSS generátor s obrázkami');
      return true;
    } else if (pdfSize < 50000) { // < 50KB
      console.log('❌ PROBLÉM: PDF je príliš malé (<50KB)');
      console.log('   Toto naznačuje že sa používa fallback generátor');
      return false;
    } else {
      console.log('⚠️  STREDNÁ VEĽKOSŤ: PDF má 50KB-200KB');
      console.log('   Možno enhanced jsPDF generátor, nie Puppeteer');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Chyba pri sťahovaní PDF:', error.message);
    return false;
  }
}

async function runFullTest() {
  console.log(`🕐 Test spustený: ${new Date().toISOString()}\n`);
  
  const results = {
    configTest: false,
    pdfTest: false,
    overall: false
  };
  
  // Test 1: Puppeteer config
  results.configTest = await testPuppeteerConfig();
  
  // Test 2: PDF generation
  if (results.configTest) {
    results.pdfTest = await createTestProtocol();
  } else {
    console.log('⏭️  Preskakujem PDF test lebo config test zlyhal');
  }
  
  // Overall result
  results.overall = results.configTest && results.pdfTest;
  
  console.log('\n📋 VÝSLEDKY TESTU');
  console.log('==================');
  console.log(`✅ Puppeteer Config: ${results.configTest ? 'PASS' : 'FAIL'}`);
  console.log(`✅ PDF Generation:   ${results.pdfTest ? 'PASS' : 'FAIL'}`);
  console.log(`🎯 Overall Result:   ${results.overall ? '🎉 SUCCESS' : '❌ FAILED'}`);
  
  if (results.overall) {
    console.log('\n🎉 PUPPETEER JE ÚSPEŠNE AKTÍVNY NA RAILWAY!');
    console.log('   Frontend by mal teraz generovať veľké, kvalitné PDF súbory.');
  } else {
    console.log('\n❌ PUPPETEER PROBLÉM NA RAILWAY');
    console.log('   Skontrolujte konfiguráciu a environment variables.');
  }
  
  return results.overall;
}

// Run the test
runFullTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Fatal test error:', error);
    process.exit(1);
  }); 