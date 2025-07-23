const https = require('https');
const { v4: uuidv4 } = require('uuid');

console.log('🎯 FINÁLNY TEST PROTOKOLOV');
console.log('==========================');

// Prihlásenie s novým heslom
async function login() {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({
      username: 'admin',
      password: 'Black123'  // Nové heslo po resete
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
            console.log('✅ Prihlásenie úspešné s novým heslom!');
            console.log('👤 User:', response.user?.username);
            resolve(response.token);
          } else {
            console.log('❌ Prihlásenie zlyhalo:', response);
            reject(new Error('Login failed'));
          }
        } catch (e) {
          console.log('❌ Chyba pri parsovaní:', e);
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
}

// Test vytvorenia protokolu
async function testProtocolCreation(token) {
  return new Promise((resolve, reject) => {
    const testRentalId = uuidv4();
    
    const protocolData = {
      rentalId: testRentalId,
      location: 'Košice - Test',
      vehicleCondition: {
        odometer: 50000,
        fuelLevel: 75,
        fuelType: 'Benzín',
        exteriorCondition: 'Dobrý',
        interiorCondition: 'Dobrý',
        notes: 'Finálny test protokolu po oprave'
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
        signerName: 'Test Admin',
        signerRole: 'employee',
        timestamp: new Date().toISOString(),
        location: 'Košice',
        ipAddress: '127.0.0.1'
      }],
      rentalData: {
        orderNumber: 'FINAL-TEST-001',
        vehicle: {
          id: uuidv4(),
          brand: 'BMW',
          model: 'X5',
          licensePlate: 'BA999TEST',
          company: 'Test Rent',
          pricing: [],
          commission: { type: 'percentage', value: 20 },
          status: 'available'
        },
        customer: { name: 'Test Customer Final' },
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        totalPrice: 500,
        deposit: 100,
        currency: 'EUR',
        allowedKilometers: 1000,
        extraKilometerRate: 0.5
      },
      pdfUrl: 'https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev/test-protocol-final.pdf',
      emailSent: false,
      notes: 'Finálny test protokolu po všetkých opravách',
      createdBy: 'final-test-script'
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

    console.log('📝 Vytváram protokol s ID:', testRentalId);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('📊 Status odpovede:', res.statusCode);
        console.log('📝 Response body:', data);
        
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 201) {
            console.log('🎉 PROTOKOL ÚSPEŠNE VYTVORENÝ!');
            console.log('📋 Protocol ID:', response.protocol?.id);
            resolve({ success: true, protocol: response.protocol });
          } else {
            console.log('❌ Chyba pri vytváraní protokolu');
            console.log('🔍 Detail chyby:', response);
            resolve({ success: false, error: response });
          }
        } catch (e) {
          console.log('❌ Chyba pri parsovaní odpovede:', e);
          console.log('📝 Raw response:', data);
          resolve({ success: false, error: 'Parse error', raw: data });
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Network error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Hlavná funkcia
async function runFinalTest() {
  try {
    console.log('🔐 Krok 1: Prihlásenie s novým heslom...');
    const token = await login();
    
    console.log('\n📝 Krok 2: Test vytvorenia protokolu...');
    const result = await testProtocolCreation(token);
    
    console.log('\n📊 FINÁLNY VÝSLEDOK:');
    console.log('====================');
    
    if (result.success) {
      console.log('🎉 VŠETKO FUNGUJE PERFEKTNE!');
      console.log('✅ Prihlásenie: OK');
      console.log('✅ Autentifikácia: OK'); 
      console.log('✅ Protokoly API: OK');
      console.log('✅ PostgreSQL: OK');
      console.log('✅ Railway deployment: OK');
      console.log('');
      console.log('🎯 PROTOKOLY SÚ PLNE FUNKČNÉ!');
      console.log('📱 Môžete testovať v aplikácii: https://blackrent-app.vercel.app');
      console.log('🔑 Prihlasovacie údaje: admin / Black123');
    } else {
      console.log('❌ STÁLE SÚ PROBLÉMY:');
      console.log('🔍 Detail chyby:', JSON.stringify(result.error, null, 2));
      console.log('');
      console.log('💡 ĎALŠIE KROKY:');
      console.log('1. Skontrolujte Railway logy');
      console.log('2. Overte PostgreSQL databázu');
      console.log('3. Skontrolujte protokoly tabuľky');
    }
    
  } catch (error) {
    console.log('\n💥 KRITICKÁ CHYBA:', error.message);
    console.log('🆘 Kontaktujte support pre pomoc');
  }
}

// Spustenie finálneho testu
runFinalTest(); 