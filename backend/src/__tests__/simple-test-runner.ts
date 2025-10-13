/**
 * Simple Test Runner for Fastify Routes
 * Tests basic endpoint availability and authentication
 */

import { buildFastify } from '../fastify-app';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  error?: string;
}

const results: TestResult[] = [];

async function runTests() {
  console.log('\n🧪 Starting Fastify Route Tests...\n');
  
  const fastify = await buildFastify();
  await fastify.ready();

  // Health Check Tests
  await test('Health Check', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/health'
    });
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }
  });

  // Auth Route Tests
  await test('Login - Missing Username', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { password: 'test' }
    });
    if (response.statusCode !== 400) {
      throw new Error(`Expected 400, got ${response.statusCode}`);
    }
  });

  await test('Login - Invalid Credentials', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'fake', password: 'fake' }
    });
    if (response.statusCode !== 401) {
      throw new Error(`Expected 401, got ${response.statusCode}`);
    }
  });

  await test('Auth Health', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/auth/health'
    });
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }
  });

  // Customers Route Tests
  await test('Customers - Unauthorized', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/customers'
    });
    if (response.statusCode !== 401) {
      throw new Error(`Expected 401, got ${response.statusCode}`);
    }
  });

  // Vehicles Route Tests
  await test('Vehicles - Unauthorized', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/vehicles'
    });
    if (response.statusCode !== 401) {
      throw new Error(`Expected 401, got ${response.statusCode}`);
    }
  });

  // Rentals Route Tests
  await test('Rentals - Unauthorized', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/rentals'
    });
    if (response.statusCode !== 401) {
      throw new Error(`Expected 401, got ${response.statusCode}`);
    }
  });

  // Protocols Route Tests
  await test('Protocols - Unauthorized', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/protocols'
    });
    if (response.statusCode !== 401) {
      throw new Error(`Expected 401, got ${response.statusCode}`);
    }
  });

  // Expenses Route Tests
  await test('Expenses - Unauthorized', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/expenses'
    });
    if (response.statusCode !== 401) {
      throw new Error(`Expected 401, got ${response.statusCode}`);
    }
  });

  // Leasings Route Tests
  await test('Leasings - Unauthorized', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/leasings'
    });
    if (response.statusCode !== 401) {
      throw new Error(`Expected 401, got ${response.statusCode}`);
    }
  });

  // Files Route Tests
  await test('Files Status - Unauthorized', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/files/status'
    });
    if (response.statusCode !== 401) {
      throw new Error(`Expected 401, got ${response.statusCode}`);
    }
  });

  // Settlements Route Tests
  await test('Settlements - Unauthorized', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/settlements'
    });
    if (response.statusCode !== 401) {
      throw new Error(`Expected 401, got ${response.statusCode}`);
    }
  });

  await fastify.close();

  // Print Results
  console.log('\n📊 Test Results:\n');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log(`\n${passed} passed, ${failed} failed, ${results.length} total\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, status: 'PASS' });
  } catch (error) {
    results.push({
      name,
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});

