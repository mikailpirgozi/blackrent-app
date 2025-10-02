#!/usr/bin/env node

const https = require('https');

console.log('🧪 TESTUJEME SMTP NA COMMIT 972aa78...\n');

// Test základného endpointu najprv
const testBasicEndpoint = () => {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'blackrent-app-production.up.railway.app',
      port: 443,
      path: '/api/auth/login',
      method: 'GET'
    }, (res) => {
      console.log(`📡 Basic endpoint status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 404) {
          console.log('❌ Railway stále nefunguje (404)');
          resolve(false);
        } else {
          console.log('✅ Railway aplikácia beží!');
          resolve(true);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('💥 Connection Error:', error.message);
      resolve(false);
    });
    
    req.end();
  });
};

// Test SMTP cez protokol endpoint
const testSMTP = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      rentalId: 1,
      protocolType: 'handover',
      customerEmail: 'pirgozi1@gmail.com',
      test: true
    });

    const req = https.request({
      hostname: 'blackrent-app-production.up.railway.app',
      port: 443,
      path: '/api/protocols/handover/send-email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': 'Bearer test-token'
      }
    }, (res) => {
      console.log(`📧 SMTP test status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            console.log('✅ SMTP FUNGUJE NA 972aa78!');
            console.log(`📧 Message: ${result.message}`);
          } else {
            console.log('❌ SMTP problém:', result.error);
          }
        } catch (e) {
          console.log('📄 Raw response:', data.substring(0, 200));
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('💥 SMTP Test Error:', error.message);
      resolve();
    });
    
    req.write(postData);
    req.end();
  });
};

// Spustíme testy postupne
(async () => {
  console.log('📤 Testujem Railway dostupnosť...');
  const isRunning = await testBasicEndpoint();
  
  if (isRunning) {
    console.log('\n📧 Testujem SMTP funkcionalitu...');
    await testSMTP();
  } else {
    console.log('\n⏳ Railway ešte deployuje, skús za chvíľu...');
  }
})();
