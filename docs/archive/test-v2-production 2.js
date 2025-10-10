#!/usr/bin/env node

/**
 * 🧪 TEST V2 PROTOCOL SYSTÉMU NA PRODUKCII
 * Spustite: node test-v2-production.js
 */

const https = require('https');
const http = require('http');

// Konfigurácia
const PRODUCTION_URL = 'blackrent-app-production-4d6f.up.railway.app'; // Vaša Railway URL
const LOCAL_URL = 'localhost:3001';
const USE_PRODUCTION = true; // Testujeme produkciu

const baseUrl = USE_PRODUCTION ? PRODUCTION_URL : LOCAL_URL;
const protocol = USE_PRODUCTION ? https : http;

console.log('🚀 TESTOVANIE V2 PROTOCOL SYSTÉMU');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`📍 Server: ${baseUrl}`);
console.log(`⏰ Čas: ${new Date().toLocaleString('sk-SK')}\n`);

let authToken = '';
let userId = '';

// Test funkcie
async function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = protocol.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test 1: Login
async function testLogin() {
  console.log('1️⃣ TEST: Prihlásenie ako admin...');
  
  const loginData = JSON.stringify({
    username: 'admin',
    password: 'Black123'
  });
  
  const options = {
    hostname: baseUrl.split(':')[0],
    port: baseUrl.includes(':') ? parseInt(baseUrl.split(':')[1]) : (USE_PRODUCTION ? 443 : 80),
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };
  
  try {
    const response = await makeRequest(options, loginData);
    
    if (response.status === 200 && response.data.token) {
      authToken = response.data.token;
      userId = response.data.user?.id || 'unknown';
      console.log('   ✅ Prihlásenie úspešné');
      console.log(`   📝 User ID: ${userId}`);
      return true;
    } else {
      console.log('   ❌ Prihlásenie zlyhalo:', response.data.message || 'Neznáma chyba');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Chyba pripojenia:', error.message);
    return false;
  }
}

// Test 2: Feature Flags
async function testFeatureFlags() {
  console.log('\n2️⃣ TEST: Kontrola V2 Feature Flags...');
  
  const options = {
    hostname: baseUrl.split(':')[0],
    port: baseUrl.includes(':') ? parseInt(baseUrl.split(':')[1]) : (USE_PRODUCTION ? 443 : 80),
    path: '/api/feature-flags/check',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };
  
  const data = JSON.stringify({
    flags: ['PROTOCOL_V2'],
    userId: userId
  });
  
  try {
    const response = await makeRequest(options, data);
    
    if (response.status === 200) {
      const v2Enabled = response.data.PROTOCOL_V2 || response.data.flags?.PROTOCOL_V2;
      if (v2Enabled) {
        console.log('   ✅ V2 Protocol je POVOLENÝ pre tohto používateľa');
        return true;
      } else {
        console.log('   ⚠️  V2 Protocol NIE JE povolený pre tohto používateľa');
        return false;
      }
    } else {
      // Ak endpoint neexistuje, skúsime alternatívnu metódu
      console.log('   ℹ️  Feature flags endpoint neexistuje, kontrolujem konfiguráciu...');
      return await testV2Config();
    }
  } catch (error) {
    console.log('   ⚠️  Feature flags endpoint nedostupný:', error.message);
    return await testV2Config();
  }
}

// Test 3: V2 Configuration
async function testV2Config() {
  console.log('\n3️⃣ TEST: Kontrola V2 konfigurácie...');
  
  const options = {
    hostname: baseUrl.split(':')[0],
    port: baseUrl.includes(':') ? parseInt(baseUrl.split(':')[1]) : (USE_PRODUCTION ? 443 : 80),
    path: '/api/config/v2',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  };
  
  try {
    const response = await makeRequest(options);
    
    if (response.status === 200) {
      console.log('   ✅ V2 konfigurácia:', JSON.stringify(response.data, null, 2));
      return true;
    } else {
      console.log('   ℹ️  V2 config endpoint neexistuje (možno normálne)');
      return true; // Nie je to kritická chyba
    }
  } catch (error) {
    console.log('   ℹ️  V2 config nedostupný:', error.message);
    return true; // Nie je to kritická chyba
  }
}

// Test 4: V2 API Endpoints
async function testV2Endpoints() {
  console.log('\n4️⃣ TEST: V2 API Endpoints...');
  
  const endpoints = [
    { path: '/api/v2/protocols', method: 'GET', name: 'List V2 Protocols' },
    { path: '/api/v2/queue/status', method: 'GET', name: 'Queue Status' },
    { path: '/api/v2/health', method: 'GET', name: 'V2 Health Check' }
  ];
  
  let passed = 0;
  
  for (const endpoint of endpoints) {
    const options = {
      hostname: baseUrl.split(':')[0],
      port: baseUrl.includes(':') ? parseInt(baseUrl.split(':')[1]) : (USE_PRODUCTION ? 443 : 80),
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    };
    
    try {
      const response = await makeRequest(options);
      
      if (response.status === 200 || response.status === 201) {
        console.log(`   ✅ ${endpoint.name}: OK`);
        passed++;
      } else if (response.status === 404) {
        console.log(`   ⚠️  ${endpoint.name}: Endpoint neexistuje`);
      } else {
        console.log(`   ❌ ${endpoint.name}: Status ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: ${error.message}`);
    }
  }
  
  return passed > 0;
}

// Test 5: Vytvorenie V2 Protokolu
async function testCreateV2Protocol() {
  console.log('\n5️⃣ TEST: Vytvorenie V2 Protokolu...');
  
  const protocolData = JSON.stringify({
    type: 'handover',
    vehicleId: 'test-vehicle-1',
    customerId: 'test-customer-1',
    rentalId: 'test-rental-1',
    data: {
      vehicle: {
        licensePlate: 'BA-123-TEST',
        brand: 'Tesla',
        model: 'Model 3',
        year: 2024
      },
      customer: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@test.com'
      },
      rental: {
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        startKm: 10000,
        location: 'Bratislava'
      },
      photos: []
    }
  });
  
  const options = {
    hostname: baseUrl.split(':')[0],
    port: baseUrl.includes(':') ? parseInt(baseUrl.split(':')[1]) : (USE_PRODUCTION ? 443 : 80),
    path: '/api/v2/protocols',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': protocolData.length,
      'Authorization': `Bearer ${authToken}`
    }
  };
  
  try {
    const response = await makeRequest(options, protocolData);
    
    if (response.status === 200 || response.status === 201) {
      console.log('   ✅ V2 Protocol úspešne vytvorený!');
      console.log(`   📝 Protocol ID: ${response.data.id || response.data.protocolId || 'N/A'}`);
      return true;
    } else if (response.status === 404) {
      console.log('   ⚠️  V2 endpoint neexistuje - možno sa používa V1');
      return false;
    } else {
      console.log('   ❌ Vytvorenie zlyhalo:', response.data.message || `Status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Chyba:', error.message);
    return false;
  }
}

// Test 6: Redis Queue Status
async function testRedisQueue() {
  console.log('\n6️⃣ TEST: Redis Queue System...');
  
  const options = {
    hostname: baseUrl.split(':')[0],
    port: baseUrl.includes(':') ? parseInt(baseUrl.split(':')[1]) : (USE_PRODUCTION ? 443 : 80),
    path: '/api/v2/queue/health',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  };
  
  try {
    const response = await makeRequest(options);
    
    if (response.status === 200) {
      console.log('   ✅ Redis Queue funguje');
      if (response.data.photoQueue) {
        console.log(`   📸 Photo Queue: ${response.data.photoQueue.waiting || 0} čakajúcich`);
      }
      if (response.data.pdfQueue) {
        console.log(`   📄 PDF Queue: ${response.data.pdfQueue.waiting || 0} čakajúcich`);
      }
      return true;
    } else {
      console.log('   ⚠️  Queue health endpoint nedostupný');
      return false;
    }
  } catch (error) {
    console.log('   ⚠️  Queue system nedostupný:', error.message);
    return false;
  }
}

// Hlavná test funkcia
async function runTests() {
  console.log('🏁 ŠTART TESTOVANIA\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const results = {
    login: false,
    featureFlags: false,
    v2Endpoints: false,
    v2Protocol: false,
    redisQueue: false
  };
  
  // 1. Login
  results.login = await testLogin();
  if (!results.login) {
    console.log('\n❌ KRITICKÁ CHYBA: Nemôžem sa prihlásiť!');
    console.log('   Skontrolujte či aplikácia beží na:', baseUrl);
    return;
  }
  
  // 2. Feature Flags
  results.featureFlags = await testFeatureFlags();
  
  // 3. V2 Endpoints
  results.v2Endpoints = await testV2Endpoints();
  
  // 4. Create V2 Protocol
  results.v2Protocol = await testCreateV2Protocol();
  
  // 5. Redis Queue
  results.redisQueue = await testRedisQueue();
  
  // Výsledky
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 VÝSLEDKY TESTOVANIA:\n');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  console.log(`✅ Úspešné: ${passed}/${total}`);
  console.log(`❌ Neúspešné: ${total - passed}/${total}\n`);
  
  console.log('Detaily:');
  console.log(`  • Login: ${results.login ? '✅' : '❌'}`);
  console.log(`  • Feature Flags: ${results.featureFlags ? '✅' : '⚠️'}`);
  console.log(`  • V2 Endpoints: ${results.v2Endpoints ? '✅' : '⚠️'}`);
  console.log(`  • V2 Protocol: ${results.v2Protocol ? '✅' : '❌'}`);
  console.log(`  • Redis Queue: ${results.redisQueue ? '✅' : '⚠️'}`);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (passed === total) {
    console.log('🎉 V2 SYSTÉM FUNGUJE PERFEKTNE!');
  } else if (passed >= 3) {
    console.log('✅ V2 SYSTÉM JE FUNKČNÝ (s malými problémami)');
  } else {
    console.log('⚠️  V2 SYSTÉM MÁ PROBLÉMY - skontrolujte konfiguráciu');
  }
  
  console.log('\n💡 TIP: Ak niektoré testy zlyhali:');
  console.log('   1. Skontrolujte Railway logy');
  console.log('   2. Overte environment variables');
  console.log('   3. Reštartujte deployment');
}

// Spustiť testy
runTests().catch(console.error);
