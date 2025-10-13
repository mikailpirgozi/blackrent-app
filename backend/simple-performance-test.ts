/**
 * Simple Performance Test
 * 
 * Tento script otestuje performance aktuálne bežiaceho servera (Express alebo Fastify)
 * a vytvorí report s výsledkami.
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const TEST_TOKEN = process.env.TEST_TOKEN || '';
const ITERATIONS = 10; // Počet opakovaní pre každý endpoint

interface TestResult {
  endpoint: string;
  avgTime: number;
  minTime: number;
  maxTime: number;
  successRate: number;
  totalRequests: number;
}

const testEndpoints = [
  { path: '/debug/test-connection', auth: false, name: 'Health Check' },
  { path: '/vehicles', auth: true, name: 'Vehicles List' },
  { path: '/rentals', auth: true, name: 'Rentals List' },
  { path: '/customers', auth: true, name: 'Customers List' },
  { path: '/expenses', auth: true, name: 'Expenses List' },
  { path: '/insurances', auth: true, name: 'Insurances List' },
];

async function testEndpoint(
  endpoint: { path: string; auth: boolean; name: string }
): Promise<TestResult> {
  const times: number[] = [];
  let successCount = 0;

  const config = endpoint.auth
    ? { headers: { Authorization: `Bearer ${TEST_TOKEN}` } }
    : {};

  console.log(`  Testing ${endpoint.name} (${ITERATIONS}x)...`);

  for (let i = 0; i < ITERATIONS; i++) {
    try {
      const start = Date.now();
      await axios.get(API_URL + endpoint.path, config);
      const time = Date.now() - start;
      times.push(time);
      successCount++;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(`    ⚠️  Request ${i + 1} failed: ${error.response?.status || 'Network error'}`);
      }
    }
  }

  const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  const minTime = times.length > 0 ? Math.min(...times) : 0;
  const maxTime = times.length > 0 ? Math.max(...times) : 0;
  const successRate = (successCount / ITERATIONS) * 100;

  console.log(`    Avg: ${avgTime.toFixed(1)}ms | Min: ${minTime}ms | Max: ${maxTime}ms | Success: ${successRate}%`);

  return {
    endpoint: endpoint.name,
    avgTime,
    minTime,
    maxTime,
    successRate,
    totalRequests: ITERATIONS,
  };
}

async function detectServerType(): Promise<'Express' | 'Fastify' | 'Unknown'> {
  try {
    const response = await axios.get(`${API_URL}/debug/test-connection`);
    // Fastify má requestId v error response
    if (response.data.requestId) {
      return 'Fastify';
    }
    // Express nemá requestId
    return 'Express';
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.requestId) {
      return 'Fastify';
    }
    return 'Unknown';
  }
}

function generateReport(
  results: TestResult[],
  serverType: string,
  timestamp: string
): string {
  const validResults = results.filter((r) => r.successRate > 0);

  if (validResults.length === 0) {
    return '# ❌ Performance Test Failed\n\nNo successful requests.\n';
  }

  const avgOverall =
    validResults.reduce((sum, r) => sum + r.avgTime, 0) / validResults.length;

  let report = `# 📊 Performance Test Report\n\n`;
  report += `**Server Type:** ${serverType}\n`;
  report += `**Timestamp:** ${timestamp}\n`;
  report += `**API URL:** ${API_URL}\n`;
  report += `**Iterations per endpoint:** ${ITERATIONS}\n\n`;

  report += `## 📈 Overall Statistics\n\n`;
  report += `- **Average Response Time:** ${avgOverall.toFixed(2)}ms\n`;
  report += `- **Fastest Endpoint:** ${validResults.sort((a, b) => a.avgTime - b.avgTime)[0].endpoint} (${validResults[0].avgTime.toFixed(2)}ms)\n`;
  report += `- **Slowest Endpoint:** ${validResults.sort((a, b) => b.avgTime - a.avgTime)[0].endpoint} (${validResults[0].avgTime.toFixed(2)}ms)\n\n`;

  report += `## 📋 Detailed Results\n\n`;
  report += `| Endpoint | Avg Time | Min Time | Max Time | Success Rate |\n`;
  report += `|----------|----------|----------|----------|-------------|\n`;

  for (const result of results) {
    report += `| ${result.endpoint} | ${result.avgTime.toFixed(1)}ms | ${result.minTime}ms | ${result.maxTime}ms | ${result.successRate.toFixed(0)}% |\n`;
  }

  report += `\n## 🎯 Performance Grade\n\n`;

  if (avgOverall < 100) {
    report += `**Grade: A+ ⭐⭐⭐**\n\nExcellent performance! Average response time under 100ms.\n`;
  } else if (avgOverall < 200) {
    report += `**Grade: A ⭐⭐**\n\nVery good performance. Average response time under 200ms.\n`;
  } else if (avgOverall < 500) {
    report += `**Grade: B ⭐**\n\nGood performance. Average response time under 500ms.\n`;
  } else {
    report += `**Grade: C**\n\nPerformance could be improved. Average response time over 500ms.\n`;
  }

  return report;
}

async function main() {
  console.log('\n🚀 BlackRent Performance Test\n');
  console.log('='.repeat(60));
  console.log(`API URL: ${API_URL}`);
  console.log(`Auth Token: ${TEST_TOKEN ? '✅ Set' : '❌ Not set'}\n`);

  if (!TEST_TOKEN) {
    console.log('⚠️  Warning: No TEST_TOKEN. Only public endpoints will work.');
    console.log('Set token: export TEST_TOKEN="your-token"\n');
  }

  // Detect server type
  console.log('🔍 Detecting server type...');
  const serverType = await detectServerType();
  console.log(`   Server: ${serverType}\n`);

  // Run tests
  console.log('📊 Running performance tests...\n');
  const results: TestResult[] = [];

  for (const endpoint of testEndpoints) {
    if (endpoint.auth && !TEST_TOKEN) {
      console.log(`  ⏭️  Skipping ${endpoint.name} (requires auth)\n`);
      continue;
    }

    const result = await testEndpoint(endpoint);
    results.push(result);
    console.log('');
  }

  // Generate report
  const timestamp = new Date().toISOString();
  const report = generateReport(results, serverType, timestamp);

  // Save report
  const reportsDir = path.join(__dirname, 'performance-results');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportFile = path.join(
    reportsDir,
    `performance_${serverType.toLowerCase()}_${Date.now()}.md`
  );
  fs.writeFileSync(reportFile, report);

  // Print summary
  console.log('='.repeat(60));
  console.log('\n' + report + '\n');
  console.log('='.repeat(60));
  console.log(`\n📄 Report saved to: ${reportFile}\n`);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});


