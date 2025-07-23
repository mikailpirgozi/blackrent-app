const https = require('https');
const http = require('http');

console.log('🔍 AUTOMATICKÁ DIAGNOSTIKA PROTOKOLOV');
console.log('=====================================');

const API_BASE = 'https://blackrent-app-production-4d6f.up.railway.app';
const FRONTEND_BASE = 'https://blackrent-app.vercel.app';

// Test data
const testProtocolData = {
  rentalId: 'test-rental-123',
  location: 'Košice',
  vehicleCondition: {
    odometer: 50000,
    fuelLevel: 75,
    fuelType: 'Benzín',
    exteriorCondition: 'Dobrý',
    interiorCondition: 'Dobrý',
    notes: 'Test protocol'
  },
  vehicleImages: [{
    id: 'test-img-1',
    url: 'https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev/test.jpg',
    type: 'vehicle',
    description: 'Test image',
    timestamp: new Date().toISOString(),
    compressed: true,
    originalSize: 100000,
    compressedSize: 50000
  }],
  vehicleVideos: [],
  documentImages: [],
  damageImages: [],
  damages: [],
  signatures: [{
    id: 'test-sig-1',
    signerName: 'Test User',
    signerRole: 'employee',
    timestamp: new Date().toISOString(),
    location: 'Košice',
    ipAddress: '127.0.0.1'
  }],
  rentalData: {
    orderNumber: 'TEST-001',
    vehicle: {
      id: 'test-vehicle-1',
      brand: 'BMW',
      model: 'X5',
      licensePlate: 'BA123AB',
      company: 'Test Rent',
      pricing: [],
      commission: { type: 'percentage', value: 20 },
      status: 'available'
    },
    customer: { name: 'Test Customer' },
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    totalPrice: 500,
    deposit: 100,
    currency: 'EUR',
    allowedKilometers: 1000,
    extraKilometerRate: 0.5
  },
  pdfUrl: 'https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev/test-protocol.pdf',
  emailSent: false,
  notes: 'Automatický test protokolu',
  createdBy: 'diagnostic-script'
};

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.request(url, {
      method: 'GET',
      timeout: 10000,
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testEndpoint(name, url, options = {}) {
  console.log(`\n🧪 ${name}:`);
  console.log(`   URL: ${url}`);
  
  try {
    const result = await makeRequest(url, options);
    console.log(`   ✅ Status: ${result.status}`);
    
    if (result.status >= 200 && result.status < 300) {
      console.log(`   ✅ Response: OK`);
      if (typeof result.data === 'object' && result.data.message) {
        console.log(`   📝 Message: ${result.data.message}`);
      }
      return { success: true, data: result.data, status: result.status };
    } else {
      console.log(`   ❌ Error: HTTP ${result.status}`);
      console.log(`   📝 Response: ${JSON.stringify(result.data).substring(0, 200)}...`);
      return { success: false, error: result.data, status: result.status };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testProtocolCreation() {
  console.log(`\n🧪 Test vytvorenia protokolu:`);
  
  try {
    const result = await makeRequest(`${API_BASE}/api/protocols/handover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Možno potrebujeme skutočný token
      },
      body: testProtocolData
    });
    
    console.log(`   Status: ${result.status}`);
    
    if (result.status === 201) {
      console.log(`   ✅ Protokol úspešne vytvorený!`);
      console.log(`   📋 ID: ${result.data.id}`);
      return { success: true, data: result.data };
    } else if (result.status === 401) {
      console.log(`   ⚠️ Unauthorized - potrebujeme sa prihlásiť`);
      return { success: false, error: 'Unauthorized', needsAuth: true };
    } else {
      console.log(`   ❌ Chyba: ${result.status}`);
      console.log(`   📝 Detail: ${JSON.stringify(result.data, null, 2)}`);
      return { success: false, error: result.data, status: result.status };
    }
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runDiagnostics() {
  console.log('\n📊 ZÁKLADNÉ TESTY:');
  
  // Test základných endpointov
  const healthTest = await testEndpoint('Health Check', `${API_BASE}/api/health`);
  const frontendTest = await testEndpoint('Frontend', FRONTEND_BASE);
  
  // Test databázových endpointov
  const vehiclesTest = await testEndpoint('Vozidlá API', `${API_BASE}/api/vehicles`);
  const rentalsTest = await testEndpoint('Prenájmy API', `${API_BASE}/api/rentals`);
  
  console.log('\n📋 PROTOKOLY TESTY:');
  
  // Test protokolov endpointov
  const protocolsTest = await testEndpoint('Protokoly API', `${API_BASE}/api/protocols/handover`);
  
  // Test vytvorenia protokolu
  const createTest = await testProtocolCreation();
  
  console.log('\n📊 SÚHRN DIAGNOSTIKY:');
  console.log('===================');
  
  const tests = [
    { name: 'Backend Health', result: healthTest },
    { name: 'Frontend', result: frontendTest },
    { name: 'Vozidlá API', result: vehiclesTest },
    { name: 'Prenájmy API', result: rentalsTest },
    { name: 'Protokoly API', result: protocolsTest },
    { name: 'Vytvorenie protokolu', result: createTest }
  ];
  
  let passed = 0;
  let failed = 0;
  
  tests.forEach(test => {
    if (test.result.success) {
      console.log(`✅ ${test.name}: OK`);
      passed++;
    } else {
      console.log(`❌ ${test.name}: ${test.result.error || 'Failed'}`);
      failed++;
      
      // Detailná analýza chýb
      if (test.result.status === 500) {
        console.log(`   🔍 Pravdepodobne problém s PostgreSQL databázou`);
      } else if (test.result.status === 401) {
        console.log(`   🔍 Problém s autentifikáciou`);
      } else if (test.result.status === 404) {
        console.log(`   🔍 Endpoint neexistuje alebo routing problém`);
      }
    }
  });
  
  console.log(`\n📈 Výsledky: ${passed} ✅ | ${failed} ❌`);
  
  // Odporúčania
  console.log('\n💡 ODPORÚČANIA:');
  
  if (failed > 0) {
    console.log('🔧 Možné riešenia:');
    console.log('1. Skontrolujte Railway deployment logy');
    console.log('2. Overte PostgreSQL connection string');
    console.log('3. Skontrolujte databázové tabuľky');
    console.log('4. Overte environment variables');
    console.log('5. Reštartujte Railway service');
  } else {
    console.log('🎉 Všetky testy prešli úspešne!');
  }
  
  return { passed, failed, tests };
}

// Spustenie diagnostiky
if (require.main === module) {
  runDiagnostics()
    .then((results) => {
      console.log('\n✅ Diagnostika dokončená!');
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('\n❌ Chyba pri diagnostike:', error);
      process.exit(1);
    });
}

module.exports = { runDiagnostics, testProtocolCreation }; 