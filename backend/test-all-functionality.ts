/**
 * Comprehensive Functionality Test Suite
 * Tests ALL critical BlackRent functionalities
 */

import axios, { type AxiosError } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const TEST_TOKEN = process.env.TEST_TOKEN || '';

interface TestResult {
  name: string;
  endpoint: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  responseTime: number;
  error?: string;
}

const results: TestResult[] = [];

// Helper function to make authenticated request
async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: unknown
): Promise<{ success: boolean; status: number; data?: unknown; time: number }> {
  const start = Date.now();
  try {
    const response = await axios({
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data,
    });
    const time = Date.now() - start;
    return {
      success: true,
      status: response.status,
      data: response.data,
      time,
    };
  } catch (error) {
    const time = Date.now() - start;
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error.response?.status || 0,
        data: error.response?.data,
        time,
      };
    }
    throw error;
  }
}

// Test 1: Authentication
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...\n');

  const test1 = await apiRequest('GET', '/auth/verify-token');
  results.push({
    name: 'Verify Token',
    endpoint: '/auth/verify-token',
    status: test1.success ? 'PASS' : 'FAIL',
    responseTime: test1.time,
    error: test1.success ? undefined : `Status: ${test1.status}`,
  });
  console.log(
    `  ${test1.success ? '✅' : '❌'} Verify Token: ${test1.time}ms`
  );
}

// Test 2: Vehicles
async function testVehicles() {
  console.log('\n🚗 Testing Vehicles...\n');

  const test1 = await apiRequest('GET', '/vehicles');
  results.push({
    name: 'List Vehicles',
    endpoint: '/vehicles',
    status: test1.success ? 'PASS' : 'FAIL',
    responseTime: test1.time,
  });
  console.log(`  ${test1.success ? '✅' : '❌'} List Vehicles: ${test1.time}ms`);

  if (test1.success && test1.data) {
    const vehicleData = test1.data as { data?: Array<{ id: string }> };
    if (vehicleData.data && vehicleData.data.length > 0) {
      const vehicleId = vehicleData.data[0].id;
      const test2 = await apiRequest('GET', `/vehicles/${vehicleId}`);
      results.push({
        name: 'Get Single Vehicle',
        endpoint: `/vehicles/:id`,
        status: test2.success ? 'PASS' : 'FAIL',
        responseTime: test2.time,
      });
      console.log(
        `  ${test2.success ? '✅' : '❌'} Get Single Vehicle: ${test2.time}ms`
      );
    }
  }
}

// Test 3: Rentals
async function testRentals() {
  console.log('\n📋 Testing Rentals...\n');

  const test1 = await apiRequest('GET', '/rentals');
  results.push({
    name: 'List Rentals',
    endpoint: '/rentals',
    status: test1.success ? 'PASS' : 'FAIL',
    responseTime: test1.time,
  });
  console.log(`  ${test1.success ? '✅' : '❌'} List Rentals: ${test1.time}ms`);
}

// Test 4: Protocols
async function testProtocols() {
  console.log('\n📄 Testing Protocols...\n');

  const test1 = await apiRequest('GET', '/protocols/bulk-status');
  results.push({
    name: 'Bulk Protocol Status',
    endpoint: '/protocols/bulk-status',
    status: test1.success ? 'PASS' : 'FAIL',
    responseTime: test1.time,
  });
  console.log(
    `  ${test1.success ? '✅' : '❌'} Bulk Protocol Status: ${test1.time}ms`
  );
}

// Test 5: File Upload (Critical)
async function testFileUpload() {
  console.log('\n📤 Testing File Upload (CRITICAL)...\n');

  // Test single file upload
  console.log('  Creating test image...');
  const testImagePath = path.join(__dirname, 'test-upload.txt');
  fs.writeFileSync(testImagePath, 'Test file content for upload');

  try {
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-upload.txt',
      contentType: 'text/plain',
    });

    const start = Date.now();
    try {
      const response = await axios.post(`${API_URL}/files/upload`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
      });
      const time = Date.now() - start;

      results.push({
        name: 'Single File Upload',
        endpoint: '/files/upload',
        status: response.status === 200 ? 'PASS' : 'FAIL',
        responseTime: time,
      });
      console.log(
        `  ✅ Single File Upload: ${time}ms - ${response.data.success ? 'SUCCESS' : 'FAILED'}`
      );
    } catch (error) {
      const time = Date.now() - start;
      const axiosError = error as AxiosError;
      results.push({
        name: 'Single File Upload',
        endpoint: '/files/upload',
        status: 'FAIL',
        responseTime: time,
        error: `Status: ${axiosError.response?.status} - ${JSON.stringify(axiosError.response?.data)}`,
      });
      console.log(`  ❌ Single File Upload: ${time}ms - FAILED`);
      console.log(`     Error: ${axiosError.response?.status}`);
    }
  } finally {
    // Cleanup
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  }
}

// Test 6: Customers
async function testCustomers() {
  console.log('\n👥 Testing Customers...\n');

  const test1 = await apiRequest('GET', '/customers');
  results.push({
    name: 'List Customers',
    endpoint: '/customers',
    status: test1.success ? 'PASS' : 'FAIL',
    responseTime: test1.time,
  });
  console.log(
    `  ${test1.success ? '✅' : '❌'} List Customers: ${test1.time}ms`
  );
}

// Test 7: Expenses
async function testExpenses() {
  console.log('\n💰 Testing Expenses...\n');

  const test1 = await apiRequest('GET', '/expenses');
  results.push({
    name: 'List Expenses',
    endpoint: '/expenses',
    status: test1.success ? 'PASS' : 'FAIL',
    responseTime: test1.time,
  });
  console.log(`  ${test1.success ? '✅' : '❌'} List Expenses: ${test1.time}ms`);
}

// Test 8: Insurances
async function testInsurances() {
  console.log('\n🛡️ Testing Insurances...\n');

  const test1 = await apiRequest('GET', '/insurances');
  results.push({
    name: 'List Insurances',
    endpoint: '/insurances',
    status: test1.success ? 'PASS' : 'FAIL',
    responseTime: test1.time,
  });
  console.log(
    `  ${test1.success ? '✅' : '❌'} List Insurances: ${test1.time}ms`
  );
}

// Test 9: Companies
async function testCompanies() {
  console.log('\n🏢 Testing Companies...\n');

  const test1 = await apiRequest('GET', '/companies');
  results.push({
    name: 'List Companies',
    endpoint: '/companies',
    status: test1.success ? 'PASS' : 'FAIL',
    responseTime: test1.time,
  });
  console.log(
    `  ${test1.success ? '✅' : '❌'} List Companies: ${test1.time}ms`
  );
}

// Generate Report
function generateReport() {
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(70) + '\n');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`);
  console.log(`⏭️  Skipped: ${skipped}\n`);

  console.log('Detailed Results:');
  console.log('-'.repeat(70));
  results.forEach((result) => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
    console.log(
      `${icon} ${result.name.padEnd(30)} ${result.endpoint.padEnd(25)} ${result.responseTime}ms`
    );
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(70));

  // Save to file
  const reportFile = path.join(__dirname, 'test-results.json');
  fs.writeFileSync(
    reportFile,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: { total, passed, failed, skipped },
        results,
      },
      null,
      2
    )
  );
  console.log(`\n📄 Detailed report saved to: ${reportFile}\n`);
}

// Main execution
async function main() {
  console.log('🚀 BlackRent Complete Functionality Test Suite');
  console.log('='.repeat(70));
  console.log(`API URL: ${API_URL}`);
  console.log(`Auth Token: ${TEST_TOKEN ? '✅ Set' : '❌ Not set'}\n`);

  if (!TEST_TOKEN) {
    console.error('❌ ERROR: TEST_TOKEN not set!');
    console.error('Run: export TEST_TOKEN="your-token"');
    process.exit(1);
  }

  try {
    await testAuthentication();
    await testVehicles();
    await testRentals();
    await testProtocols();
    await testFileUpload(); // CRITICAL
    await testCustomers();
    await testExpenses();
    await testInsurances();
    await testCompanies();

    generateReport();

    const failed = results.filter((r) => r.status === 'FAIL').length;
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Fatal error during testing:', error);
    process.exit(1);
  }
}

main();

