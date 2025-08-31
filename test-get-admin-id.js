// Jednoduchý test script pre získanie Admin ID
// Spustite: cd backend && node ../test-get-admin-id.js

const http = require('http');

const loginData = JSON.stringify({
  username: 'admin',
  password: 'Black123'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

console.log('🔍 Získavam Admin ID...\n');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.user && response.user.id) {
        console.log('✅ ADMIN ID NÁJDENÉ!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`  Admin ID:   ${response.user.id}`);
        console.log(`  Username:   ${response.user.username}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('📋 DO RAILWAY PRIDAJTE:\n');
        console.log(`   PROTOCOL_V2_USER_IDS=${response.user.id}\n`);
      } else {
        console.log('❌ Nepodarilo sa získať ID');
        console.log('Response:', response);
      }
    } catch (e) {
      console.log('❌ Chyba:', e.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Chyba pripojenia:', error.message);
  console.log('\n💡 Tip: Skontrolujte či beží backend na porte 3001');
  console.log('   Spustite: npm run dev:start');
});

req.write(loginData);
req.end();
