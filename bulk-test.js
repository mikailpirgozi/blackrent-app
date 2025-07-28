#!/usr/bin/env node

const https = require('https');

const API_BASE = 'https://blackrent-app-production-4d6f.up.railway.app/api';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testBulkEndpoint() {
  console.log('🚀 TESTOVANIE BULK ENDPOINT PERFORMANCE');
  console.log('=======================================');
  
  try {
    // 1. Login
    console.log('🔐 Prihlasovanie...');
    const loginData = JSON.stringify({
      username: 'admin',
      password: 'Black123'
    });

    const loginResponse = await makeRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      },
      body: loginData
    });

    if (loginResponse.status !== 200 || !loginResponse.data.success) {
      throw new Error(`Login failed: ${JSON.stringify(loginResponse.data)}`);
    }

    const token = loginResponse.data.token;
    console.log('✅ Prihlásenie úspešné');

    // 2. Test bulk endpoint
    console.log('\n⚡ Testovanie BULK endpoint...');
    const bulkStartTime = Date.now();
    
    const bulkResponse = await makeRequest(`${API_BASE}/bulk/data`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const bulkTime = Date.now() - bulkStartTime;

    if (bulkResponse.status === 200 && bulkResponse.data.success) {
      console.log(`✅ BULK endpoint úspešný: ${bulkTime}ms`);
      
      const data = bulkResponse.data.data;
      console.log('\n📊 BULK endpoint výsledky:');
      console.log(`- Vehicles: ${data.vehicles?.length || 0}`);
      console.log(`- Rentals: ${data.rentals?.length || 0}`);
      console.log(`- Customers: ${data.customers?.length || 0}`);
      console.log(`- Companies: ${data.companies?.length || 0}`);
      console.log(`- Insurers: ${data.insurers?.length || 0}`);
      console.log(`- Expenses: ${data.expenses?.length || 0}`);
      console.log(`- Insurances: ${data.insurances?.length || 0}`);
      console.log(`- Settlements: ${data.settlements?.length || 0}`);
      
      if (data.metadata) {
        console.log('\n🎯 Metadata:');
        console.log(`- Backend load time: ${data.metadata.loadTimeMs}ms`);
        console.log(`- User role: ${data.metadata.userRole}`);
        console.log(`- Is filtered: ${data.metadata.isFiltered}`);
        console.log(`- Timestamp: ${data.metadata.timestamp}`);
        
        console.log('\n🏆 PERFORMANCE ANALÝZA:');
        console.log(`- Frontend request: ${bulkTime}ms`);
        console.log(`- Backend processing: ${data.metadata.loadTimeMs}ms`);
        console.log(`- Network latency: ~${bulkTime - data.metadata.loadTimeMs}ms`);
      }
      
      console.log('\n🎉 BULK endpoint funguje perfektne!');
      
    } else {
      console.error(`❌ BULK endpoint chyba: ${bulkResponse.status}`);
      console.error(JSON.stringify(bulkResponse.data, null, 2));
    }

    // 3. Porovnanie s individuálnymi calls
    console.log('\n🔄 Porovnanie s individuálnymi API calls...');
    const individualStartTime = Date.now();
    
    const endpoints = [
      '/vehicles',
      '/rentals', 
      '/customers',
      '/companies',
      '/insurers',
      '/expenses',
      '/insurances',
      '/settlements'
    ];

    const individualPromises = endpoints.map(endpoint => 
      makeRequest(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
    );

    const individualResponses = await Promise.all(individualPromises);
    const individualTime = Date.now() - individualStartTime;

    console.log(`✅ Individuálne calls: ${individualTime}ms`);
    
    console.log('\n🏆 FINÁLNE POROVNANIE:');
    console.log(`- BULK endpoint: ${bulkTime}ms`);
    console.log(`- Individuálne calls: ${individualTime}ms`);
    
    const improvement = ((individualTime - bulkTime) / individualTime * 100).toFixed(1);
    if (bulkTime < individualTime) {
      console.log(`🚀 BULK je ${improvement}% RÝCHLEJŠÍ!`);
    } else {
      console.log(`⚠️ Individuálne calls sú rýchlejšie o ${Math.abs(improvement)}%`);
    }

  } catch (error) {
    console.error('❌ Test chyba:', error.message);
  }
}

testBulkEndpoint();