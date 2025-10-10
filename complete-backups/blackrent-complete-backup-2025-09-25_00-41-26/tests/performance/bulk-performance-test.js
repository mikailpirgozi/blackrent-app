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

// Test BULK endpoint
async function testBulkEndpoint(token) {
  console.log('\n🚀 Testing BULK DATA endpoint...');
  
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  const startTime = Date.now();
  
  try {
    const result = await makeRequest(`${API_BASE}/bulk/data`, options);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (result.status === 200) {
      const data = result.data.data;
      const metadata = result.data.metadata;
      
      console.log(`✅ BULK endpoint: ${duration}ms (frontend total)`);
      console.log(`⚡ Backend processing: ${metadata.loadTimeMs}ms`);
      console.log(`📊 Data counts:`, {
        vehicles: data.vehicles.length,
        rentals: data.rentals.length,
        customers: data.customers.length,
        companies: data.companies.length,
        expenses: data.expenses.length,
        insurances: data.insurances.length,
        settlements: data.settlements.length,
        vehicleDocuments: data.vehicleDocuments.length,
        insuranceClaims: data.insuranceClaims.length
      });
      
      console.log(`🔐 User info:`, {
        userRole: metadata.userRole,
        isFiltered: metadata.isFiltered,
        timestamp: metadata.timestamp
      });
      
      return { 
        success: true, 
        duration, 
        backendTime: metadata.loadTimeMs,
        totalRecords: Object.values(data).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0),
        metadata 
      };
    } else {
      console.log(`❌ BULK endpoint: ${duration}ms - Error ${result.status}`);
      console.log('Error details:', result.data);
      return { success: false, duration, error: result.status };
    }
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`❌ BULK endpoint: ${duration}ms - ${error.message}`);
    return { success: false, duration, error: error.message };
  }
}

// Compare with individual endpoints (fallback test)
async function testIndividualEndpoints(token) {
  console.log('\n🔄 Testing individual endpoints (for comparison)...');
  
  const endpoints = [
    { path: '/vehicles', name: 'Vehicles' },
    { path: '/rentals', name: 'Rentals' },
    { path: '/customers', name: 'Customers' },
    { path: '/companies', name: 'Companies' },
    { path: '/expenses', name: 'Expenses' },
    { path: '/insurances', name: 'Insurances' },
    { path: '/settlements', name: 'Settlements' },
    { path: '/vehicle-documents', name: 'Vehicle Documents' }
  ];
  
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  const startTime = Date.now();
  
  // Test all endpoints in parallel (like the old AppContext)
  const promises = endpoints.map(async endpoint => {
    const epStartTime = Date.now();
    try {
      const result = await makeRequest(`${API_BASE}${endpoint.path}`, options);
      const epDuration = Date.now() - epStartTime;
      
      if (result.status === 200) {
        const count = Array.isArray(result.data.data) ? result.data.data.length : 'N/A';
        return { success: true, name: endpoint.name, duration: epDuration, count };
      } else {
        return { success: false, name: endpoint.name, duration: epDuration, error: result.status };
      }
    } catch (error) {
      const epDuration = Date.now() - epStartTime;
      return { success: false, name: endpoint.name, duration: epDuration, error: error.message };
    }
  });
  
  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;
  
  console.log(`📊 Individual endpoints total: ${totalTime}ms`);
  
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    const count = r.count ? ` (${r.count} records)` : '';
    console.log(`${status} ${r.name}: ${r.duration}ms${count}`);
  });
  
  return { totalTime, results };
}

// Main performance comparison
async function runBulkPerformanceTest() {
  console.log('🚀 BlackRent BULK Endpoint Performance Test');
  console.log('=' .repeat(60));
  
  // Get auth token
  const token = await login();
  if (!token) {
    console.error('Cannot continue without auth token');
    process.exit(1);
  }
  
  // Test BULK endpoint multiple times for consistency
  console.log('\n📊 RUNNING BULK TESTS (3 runs for accuracy)...');
  const bulkTests = [];
  
  for (let i = 1; i <= 3; i++) {
    console.log(`\n--- BULK Test ${i}/3 ---`);
    const result = await testBulkEndpoint(token);
    if (result.success) {
      bulkTests.push(result);
    }
    
    // Small delay between tests
    if (i < 3) await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test individual endpoints for comparison
  const individualTest = await testIndividualEndpoints(token);
  
  // Calculate averages and summary
  console.log('\n🏆 PERFORMANCE COMPARISON SUMMARY');
  console.log('=' .repeat(60));
  
  if (bulkTests.length > 0) {
    const avgBulkFrontend = Math.round(bulkTests.reduce((sum, t) => sum + t.duration, 0) / bulkTests.length);
    const avgBulkBackend = Math.round(bulkTests.reduce((sum, t) => sum + t.backendTime, 0) / bulkTests.length);
    const totalRecords = bulkTests[0].totalRecords;
    
    console.log(`📈 BULK ENDPOINT (average of ${bulkTests.length} tests):`);
    console.log(`   Frontend total: ${avgBulkFrontend}ms`);
    console.log(`   Backend processing: ${avgBulkBackend}ms`);
    console.log(`   Network overhead: ${avgBulkFrontend - avgBulkBackend}ms`);
    console.log(`   Total records: ${totalRecords}`);
    
    console.log(`\n📊 INDIVIDUAL ENDPOINTS:`);
    console.log(`   Total time: ${individualTest.totalTime}ms`);
    console.log(`   Successful calls: ${individualTest.results.filter(r => r.success).length}/8`);
    
    // Performance improvement calculation
    const improvement = Math.round(((individualTest.totalTime - avgBulkFrontend) / individualTest.totalTime) * 100);
    const speedMultiplier = Math.round((individualTest.totalTime / avgBulkFrontend) * 10) / 10;
    
    console.log(`\n🎯 PERFORMANCE IMPROVEMENT:`);
    console.log(`   Time saved: ${individualTest.totalTime - avgBulkFrontend}ms`);
    console.log(`   Improvement: ${improvement}% faster`);
    console.log(`   Speed multiplier: ${speedMultiplier}x faster`);
    
    console.log(`\n🚀 COMPLETE OPTIMIZATION CHAIN:`);
    console.log(`   Original estimated time: ~2-4 seconds`);
    console.log(`   After Phase 1+2: 666ms (70% improvement)`);
    console.log(`   After Phase 3 (BULK): ${avgBulkFrontend}ms (${Math.round(((2500 - avgBulkFrontend) / 2500) * 100)}% total improvement)`);
    console.log(`   Final speedup: ${Math.round(2500 / avgBulkFrontend)}x faster than original!`);
    
  } else {
    console.log('❌ BULK endpoint tests failed');
  }
}

// Run the test
runBulkPerformanceTest().catch(console.error);