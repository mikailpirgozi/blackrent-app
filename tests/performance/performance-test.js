#!/usr/bin/env node

const https = require('https');
const http = require('http');

const API_BASE = 'https://blackrent-app-production-4d6f.up.railway.app/api';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
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

// Login and get token
async function login() {
  console.log('🔐 Logging in to get auth token...');
  
  const loginData = JSON.stringify({
    username: 'admin',
    password: 'Black123'
  });
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    },
    body: loginData
  };
  
  try {
    const result = await makeRequest(`${API_BASE}/auth/login`, options);
    
    if (result.status === 200 && result.data.success) {
      console.log('✅ Login successful');
      return result.data.token;
    } else {
      console.error('❌ Login failed:', result.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return null;
  }
}

// Test API endpoint performance
async function testEndpoint(token, endpoint, name) {
  console.log(`\n🔍 Testing ${name}...`);
  
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  const startTime = Date.now();
  
  try {
    const result = await makeRequest(`${API_BASE}${endpoint}`, options);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (result.status === 200) {
      const dataCount = Array.isArray(result.data.data) ? result.data.data.length : 'N/A';
      console.log(`✅ ${name}: ${duration}ms (${dataCount} records)`);
      return { success: true, duration, count: dataCount };
    } else {
      console.log(`❌ ${name}: ${duration}ms - Error ${result.status}`);
      return { success: false, duration, error: result.status };
    }
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`❌ ${name}: ${duration}ms - ${error.message}`);
    return { success: false, duration, error: error.message };
  }
}

// Main performance test
async function runPerformanceTest() {
  console.log('🚀 BlackRent Performance Test - Post Optimization');
  console.log('=' .repeat(50));
  
  // Get auth token
  const token = await login();
  if (!token) {
    console.error('Cannot continue without auth token');
    process.exit(1);
  }
  
  // Test endpoints
  const endpoints = [
    { path: '/vehicles', name: 'Vehicles API' },
    { path: '/rentals', name: 'Rentals API' },
    { path: '/customers', name: 'Customers API' },
    { path: '/companies', name: 'Companies API' },
    { path: '/expenses', name: 'Expenses API' },
    { path: '/insurances', name: 'Insurances API' },
    { path: '/settlements', name: 'Settlements API' },
    { path: '/vehicle-documents', name: 'Vehicle Documents API' }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(token, endpoint.path, endpoint.name);
    results.push({ ...result, name: endpoint.name });
  }
  
  // Summary
  console.log('\n📊 PERFORMANCE SUMMARY');
  console.log('=' .repeat(50));
  
  const successful = results.filter(r => r.success);
  const totalTime = successful.reduce((sum, r) => sum + r.duration, 0);
  const avgTime = successful.length > 0 ? Math.round(totalTime / successful.length) : 0;
  
  console.log(`Total API calls: ${results.length}`);
  console.log(`Successful calls: ${successful.length}`);
  console.log(`Total time: ${totalTime}ms`);
  console.log(`Average time per call: ${avgTime}ms`);
  console.log(`Simulated user load time: ${totalTime}ms`);
  
  // Individual results
  console.log('\n📋 Individual Results:');
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    const count = r.count !== 'N/A' ? ` (${r.count} records)` : '';
    console.log(`${status} ${r.name}: ${r.duration}ms${count}`);
  });
  
  console.log('\n🎯 EXPECTED IMPROVEMENTS:');
  console.log('- Database indexes should reduce JOIN times by 30-50%');
  console.log('- Permission caching should eliminate 7 out of 8 getUserCompanyAccess() calls');
  console.log('- First API call = cache miss, subsequent calls = cache hit');
}

// Run the test
runPerformanceTest().catch(console.error);