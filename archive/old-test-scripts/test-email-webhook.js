#!/usr/bin/env node

// 🧪 Test skript pre Email Webhook API
// Testuje funkčnosť webhook endpointu pre automatické spracovanie emailov

const https = require('https');
const http = require('http');

// Test data - simulácia emailu s objednávkou
const testEmailData = {
  from: 'customer@example.com',
  to: 'reservations@blackrent.sk',
  subject: 'Nová objednávka - BMW X5',
  body: `
Číslo objednávky TEST001

Objednávka prijatá 30.01.2025

Spôsob úhrady Bankový prevod

Odoberateľ Test Zákazník
E-mail customer@example.com
Telefon +421 912 345 678
Kontaktná adresa Bratislava, Test Street 123

Miesto vyzdvihnutia Bratislava - Letisko
Miesto odovzdania Bratislava - Letisko

Čas rezervacie 2025-02-01 09:00:00 - 2025-02-05 18:00:00

Položky objednávky
Názov                    Kód      Cena    Spolu
BMW X5 xDrive30d        BA123CD   89.00   356.00€

Počet povolených km 200 km

Depozit 500,00 €
Suma k úhrade 856,00 €

Ďakujeme za vašu objednávku!
  `.trim(),
  headers: {
    'Date': new Date().toISOString(),
    'Message-ID': '<test@example.com>'
  },
  timestamp: new Date().toISOString()
};

// Funkcia na HTTP request (GET alebo POST)
function makeRequest(hostname, port, path, data, useHttps = false, method = 'POST') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port,
      path,
      method,
      headers: {}
    };

    if (method === 'POST' && data) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = (useHttps ? https : http).request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonResponse
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (method === 'POST' && data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test funkcie

async function testSimpleEndpoint() {
  console.log('🧪 Test 1: Simple backend endpoint');
  try {
    const response = await makeRequest('localhost', 3001, '/api/test-simple', null, false, 'GET');
    console.log('✅ Status:', response.statusCode);
    console.log('📦 Response:', response.body);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log('');
}

async function testWebhookEndpoint() {
  console.log('🧪 Test 2: Email webhook endpoint');
  try {
    const response = await makeRequest('localhost', 3001, '/api/email-webhook/webhook', testEmailData);
    console.log('✅ Status:', response.statusCode);
    console.log('📦 Response:', JSON.stringify(response.body, null, 2));
    
    if (response.body && response.body.success) {
      console.log('🎉 Webhook processed successfully!');
      console.log('📋 Rental ID:', response.body.data?.rentalId);
      console.log('🔢 Order Number:', response.body.data?.orderNumber);
      console.log('👤 Customer:', response.body.data?.customerName);
      console.log('🚗 Vehicle Code:', response.body.data?.vehicleCode);
      console.log('✅ Vehicle Found:', response.body.data?.vehicleFound);
    } else {
      console.log('⚠️ Webhook processing failed');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log('');
}

async function testSpamFilter() {
  console.log('🧪 Test 3: Spam filter test');
  const spamEmailData = {
    from: 'spam@suspicious-domain.com',
    to: 'reservations@blackrent.sk',
    subject: 'URGENT!!! Click here for free money!!!',
    body: 'Congratulations! You won the lottery! Click here to claim your prize!',
    timestamp: new Date().toISOString()
  };

  try {
    const response = await makeRequest('localhost', 3001, '/api/email-webhook/webhook', spamEmailData);
    console.log('✅ Status:', response.statusCode);
    console.log('📦 Response:', JSON.stringify(response.body, null, 2));
    
    if (response.body && response.body.data?.status === 'spam_filtered') {
      console.log('🛡️ Spam correctly filtered!');
    } else {
      console.log('⚠️ Spam filter may not be working correctly');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log('');
}

async function testPendingRentals() {
  console.log('🧪 Test 4: Get pending rentals (requires auth)');
  try {
    const response = await makeRequest('localhost', 3001, '/api/email-webhook/pending', null, false, 'GET');
    console.log('✅ Status:', response.statusCode);
    console.log('📦 Response:', JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 401) {
      console.log('🔐 Authentication required (expected for protected endpoint)');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log('');
}

async function testStats() {
  console.log('🧪 Test 5: Get webhook stats (requires auth)');
  try {
    const response = await makeRequest('localhost', 3001, '/api/email-webhook/stats', null, false, 'GET');
    console.log('✅ Status:', response.statusCode);
    console.log('📦 Response:', JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 401) {
      console.log('🔐 Authentication required (expected for protected endpoint)');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log('');
}

// Spustenie testov
async function runAllTests() {
  console.log('🚀 BlackRent Email Webhook Tests');
  console.log('=====================================');
  console.log('');
  
  // Počkaj chvíľu na spustenie backendu
  console.log('⏱️ Waiting for backend to start...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log('');
  
  await testSimpleEndpoint();
  await testWebhookEndpoint();
  await testSpamFilter();
  await testPendingRentals();
  await testStats();
  
  console.log('✅ All tests completed!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Check database for new pending rental');
  console.log('2. Test frontend components for managing pending rentals');
  console.log('3. Setup production webhook URL');
  console.log('4. Configure email forwarding service');
}

// Spustenie
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testEmailData,
  makeRequest,
  testWebhookEndpoint,
  testSpamFilter
};