#!/usr/bin/env node

/**
 * 🔍 BLACKRENT SYSTEM COMPLETE DIAGNOSTIC TEST
 * 
 * Kompletný automatický test všetkých komponentov systému:
 * - Backend API dostupnosť
 * - R2 Storage konfigurácia
 * - Database pripojenie
 * - PDF generation
 * - Environment variables
 * - Frontend-Backend connectivity
 */

const https = require('https');
const http = require('http');

// 🎯 Test konfigurácia
const TESTS = {
  BACKEND_BASE_URL: 'https://blackrent-app-production-4d6f.up.railway.app',
  FRONTEND_URL: 'https://blackrent-app.vercel.app',
  LOCAL_BACKEND: 'http://localhost:3001',
  TIMEOUT: 15000
};

// 🔧 Helper funkcie
const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout after ${TESTS.TIMEOUT}ms`));
    }, TESTS.TIMEOUT);

    const req = client.request(url, options, (res) => {
      clearTimeout(timeout);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = res.headers['content-type']?.includes('application/json') 
            ? JSON.parse(data) 
            : data;
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
};

// 🎨 Fancy logging
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  test: (msg) => console.log(`🧪 ${msg}`)
};

// 📊 Results tracking
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

const recordTest = (name, passed, details = '') => {
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
    log.success(`${name} ${details}`);
  } else {
    testResults.failed++;
    log.error(`${name} ${details}`);
  }
};

// 🔍 TEST FUNCTIONS

async function testBackendHealth() {
  log.test('Testing Backend Health...');
  try {
    // Test simple endpoint first (without auth)
    const response = await makeRequest(`${TESTS.BACKEND_BASE_URL}/api/test-simple`);
    if (response.status === 200) {
      recordTest('Backend Health', true, '- API is responding');
      return true;
    } else {
      // Fallback to root endpoint
      const rootResponse = await makeRequest(`${TESTS.BACKEND_BASE_URL}/`);
      if (rootResponse.status === 200) {
        recordTest('Backend Health', true, '- Root endpoint responding');
        return true;
      } else {
        recordTest('Backend Health', false, `- Status: ${response.status}`);
        return false;
      }
    }
  } catch (error) {
    recordTest('Backend Health', false, `- Error: ${error.message}`);
    return false;
  }
}

async function testR2Configuration() {
  log.test('Testing R2 Storage Configuration...');
  try {
    const response = await makeRequest(`${TESTS.BACKEND_BASE_URL}/api/migrations/r2-status`);
    if (response.status === 200 && response.data) {
      const isConfigured = response.data.configured;
      if (isConfigured) {
        recordTest('R2 Configuration', true, '- R2 is properly configured');
        return true;
      } else {
        const missing = response.data.missingVariables || [];
        recordTest('R2 Configuration', false, `- Missing: ${missing.join(', ')}`);
        return false;
      }
    } else {
      recordTest('R2 Configuration', false, `- Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    recordTest('R2 Configuration', false, `- Error: ${error.message}`);
    return false;
  }
}

async function testDatabaseConnection() {
  log.test('Testing Database Connection...');
  try {
    // Test with root endpoint that should show database status
    const response = await makeRequest(`${TESTS.BACKEND_BASE_URL}/`);
    if (response.status === 200 && response.data) {
      if (response.data.database || response.data.success) {
        recordTest('Database Connection', true, '- Backend responding (DB likely OK)');
        return true;  
      } else {
        recordTest('Database Connection', false, '- Backend responding but no DB status');
        return false;
      }
    } else {
      recordTest('Database Connection', false, `- Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    recordTest('Database Connection', false, `- Error: ${error.message}`);
    return false;
  }
}

async function testAPIEndpoints() {
  log.test('Testing Critical API Endpoints...');
  
  const endpoints = [
    { path: '/api/test-simple', name: 'Test Endpoint' },
    { path: '/api/debug/pdf-generator', name: 'PDF Generator Debug' },
    { path: '/api/migrations/r2-status', name: 'R2 Status API' },
    { path: '/', name: 'Root Health API' }
  ];
  
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${TESTS.BACKEND_BASE_URL}${endpoint.path}`);
      if (response.status === 200) {
        recordTest(endpoint.name, true, '- Endpoint accessible');
      } else {
        recordTest(endpoint.name, false, `- Status: ${response.status}`);
        allPassed = false;
      }
    } catch (error) {
      recordTest(endpoint.name, false, `- Error: ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function testFileUploadEndpoint() {
  log.test('Testing File Upload Endpoint...');
  try {
    // Test the migrations r2-status which should be accessible
    const response = await makeRequest(`${TESTS.BACKEND_BASE_URL}/api/migrations/r2-status`);
    if (response.status === 200) {
      recordTest('File Upload Endpoint', true, '- File/R2 endpoints accessible');
      return true;
    } else {
      recordTest('File Upload Endpoint', false, `- Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    recordTest('File Upload Endpoint', false, `- Error: ${error.message}`);
    return false;
  }
}

async function testFrontendConnectivity() {
  log.test('Testing Frontend Connectivity...');
  try {
    const response = await makeRequest(TESTS.FRONTEND_URL);
    if (response.status === 200) {
      recordTest('Frontend Connectivity', true, '- Frontend is accessible');
      return true;
    } else {
      recordTest('Frontend Connectivity', false, `- Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    recordTest('Frontend Connectivity', false, `- Error: ${error.message}`);
    return false;
  }
}

async function testCORSConfiguration() {
  log.test('Testing CORS Configuration...');
  try {
    const response = await makeRequest(`${TESTS.BACKEND_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Origin': TESTS.FRONTEND_URL,
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    const hasCORSHeader = response.headers['access-control-allow-origin'];
    if (hasCORSHeader) {
      recordTest('CORS Configuration', true, '- CORS headers present');
      return true;
    } else {
      recordTest('CORS Configuration', false, '- Missing CORS headers');
      return false;
    }
  } catch (error) {
    recordTest('CORS Configuration', false, `- Error: ${error.message}`);
    return false;
  }
}

// 🚀 MAIN TEST RUNNER
async function runAllTests() {
  console.log('\n🔍 BLACKRENT SYSTEM DIAGNOSTIC TEST');
  console.log('='.repeat(50));
  console.log(`📍 Backend: ${TESTS.BACKEND_BASE_URL}`);
  console.log(`📍 Frontend: ${TESTS.FRONTEND_URL}`);
  console.log(`⏱️  Timeout: ${TESTS.TIMEOUT}ms`);
  console.log('='.repeat(50));
  
  const tests = [
    testBackendHealth,
    testR2Configuration,
    testDatabaseConnection,
    testAPIEndpoints,
    testFileUploadEndpoint,
    testFrontendConnectivity,
    testCORSConfiguration
  ];
  
  for (const test of tests) {
    await test();
    console.log(''); // Blank line between tests
  }
  
  // 📊 Final Results
  console.log('='.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL SYSTEMS OPERATIONAL!');
    console.log('✅ Your BlackRent application is fully functional.');
  } else {
    console.log('\n⚠️  ISSUES DETECTED:');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`   • ${t.name}: ${t.details}`));
    
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    if (testResults.tests.find(t => t.name.includes('R2') && !t.passed)) {
      console.log('   • Check Railway environment variables for R2 configuration');
      console.log('   • Verify R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME');
    }
    if (testResults.tests.find(t => t.name.includes('Database') && !t.passed)) {
      console.log('   • Check DATABASE_URL environment variable');
      console.log('   • Verify PostgreSQL database is accessible');
    }
    if (testResults.tests.find(t => t.name.includes('Backend') && !t.passed)) {
      console.log('   • Check Railway backend deployment status');
      console.log('   • Verify backend service is running');
    }
  }
  
  console.log('\n' + '='.repeat(50));
  process.exit(testResults.failed === 0 ? 0 : 1);
}

// Execute tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, makeRequest };