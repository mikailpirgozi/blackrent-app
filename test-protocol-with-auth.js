const https = require('https');
const { v4: uuidv4 } = require('uuid');

console.log('🔐 TEST PROTOKOLU S AUTENTIFIKÁCIOU');
console.log('===================================');

const API_BASE = 'https://blackrent-app-production-4d6f.up.railway.app';

// Najprv sa prihlásime
async function login() {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({
      username: 'admin',
      password: 'admin123'
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
        try {
          const response = JSON.parse(data);
          if (response.success && response.token) {
            console.log('✅ Prihlásenie úspešné!');
            resolve(response.token);
          } else {
            console.log('❌ Prihlásenie zlyhalo:', response);
            reject(new Error('Login failed'));
          }
        } catch (e) {
          console.log('❌ Chyba pri parsovaní odpovede:', e);
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
}

// Test vytvorenia protokolu s autentifikáciou
async function testProtocolWithAuth(token) {
  return new Promise((resolve, reject) => {
    // Vygenerujeme validný UUID pre rental ID
    const testRentalId = uuidv4();
    
    const testProtocolData = {
      rentalId: testRentalId, // Teraz používame validný UUID
      location: 'Košice',
      vehicleCondition: {
        odometer: 50000,
        fuelLevel: 75,
        fuelType: 'Benzín',
        exteriorCondition: 'Dobrý',
        interiorCondition: 'Dobrý',
        notes: 'Test protocol s autentifikáciou'
      },
      vehicleImages: [{
        id: uuidv4(),
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
        id: uuidv4(),
        signerName: 'Test User',
        signerRole: 'employee',
        timestamp: new Date().toISOString(),
        location: 'Košice',
        ipAddress: '127.0.0.1'
      }],
      rentalData: {
        orderNumber: 'TEST-001',
        vehicle: {
          id: uuidv4(),
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
      notes: 'Automatický test protokolu s autentifikáciou',
      createdBy: 'test-script'
    };

    const postData = JSON.stringify(testProtocolData);

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

    console.log('📝 Posielam protokol s rental ID:', testRentalId);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('📊 Status:', res.statusCode);
        console.log('📝 Response:', data);
        
        if (res.statusCode === 201) {
          console.log('🎉 PROTOKOL ÚSPEŠNE VYTVORENÝ!');
          resolve(true);
        } else {
          console.log('❌ Chyba pri vytváraní protokolu');
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Network error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Hlavná funkcia
async function runTest() {
  try {
    console.log('🔐 Krok 1: Prihlásenie...');
    const token = await login();
    
    console.log('\n📝 Krok 2: Test vytvorenia protokolu...');
    const success = await testProtocolWithAuth(token);
    
    if (success) {
      console.log('\n✅ VŠETKY TESTY PREŠLI!');
      console.log('🎯 Protokoly fungujú správne s autentifikáciou!');
    } else {
      console.log('\n❌ TEST ZLYHAL');
      console.log('🔍 Skontrolujte Railway logy pre detaily');
    }
    
  } catch (error) {
    console.log('\n💥 CHYBA PRI TESTE:', error.message);
  }
}

// Spustenie testu
runTest(); 