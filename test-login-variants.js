const https = require('https');

console.log('🔐 TESTOVANIE PRIHLASOVACÍCH ÚDAJOV');
console.log('==================================');

const loginVariants = [
  { username: 'admin', password: 'admin123' },
  { username: 'admin', password: 'admin' },
  { username: 'administrator', password: 'admin123' },
  { username: 'root', password: 'admin123' },
  { username: 'admin', password: 'password' }
];

async function testLogin(credentials) {
  return new Promise((resolve) => {
    const loginData = JSON.stringify(credentials);

    const options = {
      hostname: 'blackrent-app-production-4d6f.up.railway.app',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      },
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            credentials,
            status: res.statusCode,
            success: response.success,
            response: response
          });
        } catch (e) {
          resolve({
            credentials,
            status: res.statusCode,
            success: false,
            error: 'Parse error',
            raw: data
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        credentials,
        success: false,
        error: error.message
      });
    });

    req.on('timeout', () => {
      resolve({
        credentials,
        success: false,
        error: 'Timeout'
      });
    });

    req.write(loginData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testujem rôzne prihlasovacie údaje...\n');
  
  for (let i = 0; i < loginVariants.length; i++) {
    const variant = loginVariants[i];
    console.log(`${i + 1}. Testujem: ${variant.username} / ${variant.password}`);
    
    const result = await testLogin(variant);
    
    if (result.success) {
      console.log(`   ✅ ÚSPECH! Token: ${result.response.token.substring(0, 20)}...`);
      console.log(`   📝 User: ${result.response.user?.username || 'N/A'}`);
      return result.response.token; // Vrátime úspešný token
    } else {
      console.log(`   ❌ Zlyhalo: ${result.error || result.response?.error || 'Unknown error'}`);
    }
    
    // Krátka pauza medzi testami
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n❌ Žiadne prihlasovacie údaje nefungovali!');
  return null;
}

// Ak sa podarí prihlásiť, otestujeme protokoly
async function testProtocolsIfLoggedIn(token) {
  if (!token) return;
  
  console.log('\n📋 Testujem protokoly endpoint...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'blackrent-app-production-4d6f.up.railway.app',
      port: 443,
      path: '/api/protocols/handover',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📊 Protocols endpoint status: ${res.statusCode}`);
        console.log(`📝 Response: ${data.substring(0, 200)}...`);
        
        if (res.statusCode === 200 || res.statusCode === 404) {
          console.log('✅ Protokoly endpoint je dostupný!');
        } else {
          console.log('❌ Protokoly endpoint má problém');
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('❌ Chyba pri teste protokolov:', error.message);
      resolve();
    });

    req.end();
  });
}

// Spustenie testov
runTests()
  .then(testProtocolsIfLoggedIn)
  .then(() => {
    console.log('\n✅ Testovanie dokončené!');
  })
  .catch((error) => {
    console.log('\n💥 Chyba:', error);
  }); 