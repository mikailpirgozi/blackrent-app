const https = require('https');
const { v4: uuidv4 } = require('uuid');

console.log('🧪 TEST BEZ SIGNATURES');
console.log('======================');

// Prihlásenie
async function login() {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({
      username: 'admin',
      password: 'Black123'
    });

    const options = {
      hostname: 'blackrent-app-production-4d6f.up.railway.app',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const response = JSON.parse(data);
        if (response.success) {
          resolve(response.token);
        } else {
          reject(new Error('Login failed'));
        }
      });
    });

    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
}

// Test s minimálnymi dátami
async function testMinimalProtocol(token) {
  return new Promise((resolve) => {
    const testRentalId = uuidv4();
    
    // MINIMÁLNE DÁTA - len povinné polia
    const protocolData = {
      rentalId: testRentalId,
      location: 'Test',
      vehicleCondition: {
        odometer: 100,
        fuelLevel: 50,
        fuelType: 'Benzín'
      },
      vehicleImages: [],      // prázdne array
      vehicleVideos: [],      // prázdne array
      documentImages: [],     // prázdne array
      damageImages: [],       // prázdne array
      damages: [],            // prázdne array
      signatures: [],         // prázdne array - BEZ BASE64!
      rentalData: {
        orderNumber: 'TEST',
        vehicle: {
          id: uuidv4(),
          brand: 'Test',
          model: 'Test'
        },
        customer: { name: 'Test' }
      },
      notes: 'Minimal test'
    };

    const postData = JSON.stringify(protocolData);

    const options = {
      hostname: 'blackrent-app-production-4d6f.up.railway.app',
      port: 443,
      path: '/api/protocols/handover',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('📝 Test s minimálnymi dátami...');

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('📊 Status:', res.statusCode);
        console.log('📝 Response:', data.substring(0, 300));
        
        if (res.statusCode === 201) {
          console.log('✅ MINIMÁLNY PROTOKOL FUNGUJE!');
          resolve(true);
        } else {
          console.log('❌ Aj minimálny protokol zlyhá');
          resolve(false);
        }
      });
    });

    req.on('error', () => resolve(false));
    req.write(postData);
    req.end();
  });
}

// Test s base64 signatures
async function testWithSignatures(token) {
  return new Promise((resolve) => {
    const testRentalId = uuidv4();
    
    const protocolData = {
      rentalId: testRentalId,
      location: 'Test',
      vehicleCondition: {
        odometer: 100,
        fuelLevel: 50,
        fuelType: 'Benzín'
      },
      vehicleImages: [],
      vehicleVideos: [],
      documentImages: [],
      damageImages: [],
      damages: [],
      signatures: [{
        id: uuidv4(),
        signerName: 'Test User',
        signerRole: 'employee',
        timestamp: new Date().toISOString(),
        // BEZ base64 signature!
      }],
      rentalData: {
        orderNumber: 'TEST',
        vehicle: {
          id: uuidv4(),
          brand: 'Test',
          model: 'Test'
        },
        customer: { name: 'Test' }
      },
      notes: 'Test with signatures (no base64)'
    };

    const postData = JSON.stringify(protocolData);

    const options = {
      hostname: 'blackrent-app-production-4d6f.up.railway.app',
      port: 443,
      path: '/api/protocols/handover',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('📝 Test s signatures (bez base64)...');

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('📊 Status:', res.statusCode);
        console.log('📝 Response:', data.substring(0, 300));
        
        if (res.statusCode === 201) {
          console.log('✅ SIGNATURES BEZ BASE64 FUNGUJÚ!');
          resolve(true);
        } else {
          console.log('❌ Signatures stále nefungujú');
          resolve(false);
        }
      });
    });

    req.on('error', () => resolve(false));
    req.write(postData);
    req.end();
  });
}

// Hlavná funkcia
async function runTests() {
  try {
    console.log('🔐 Prihlásenie...');
    const token = await login();
    console.log('✅ Prihlásený!');
    
    console.log('\n🧪 Test 1: Minimálne dáta');
    const test1 = await testMinimalProtocol(token);
    
    console.log('\n🧪 Test 2: S signatures (bez base64)');
    const test2 = await testWithSignatures(token);
    
    console.log('\n📊 VÝSLEDKY:');
    console.log('=============');
    console.log(`Minimálny protokol: ${test1 ? '✅' : '❌'}`);
    console.log(`Signatures (bez base64): ${test2 ? '✅' : '❌'}`);
    
    if (test1 && test2) {
      console.log('\n🎉 PROBLÉM JE V BASE64 SIGNATURES!');
      console.log('💡 Riešenie: Odstrániť base64 z signatures pred uložením do DB');
    } else if (test1) {
      console.log('\n🔍 PROBLÉM JE V SIGNATURES OBJEKTOCH!');
      console.log('💡 Riešenie: Skontrolovať štruktúru signatures');
    } else {
      console.log('\n❌ PROBLÉM JE HLBŠÍ - aj základné dáta nefungujú');
      console.log('💡 Riešenie: Skontrolovať databázovú schému');
    }
    
  } catch (error) {
    console.log('💥 Chyba:', error.message);
  }
}

runTests(); 