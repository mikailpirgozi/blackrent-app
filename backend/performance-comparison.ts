import axios from 'axios';

const EXPRESS_URL = 'http://localhost:3000/api';
const FASTIFY_URL = 'http://localhost:3001/api';

// Test token - nahraď svojim valid tokenom
const TEST_TOKEN = process.env.TEST_TOKEN || '';

interface TestResult {
  endpoint: string;
  expressTime: number;
  fastifyTime: number;
  improvement: number;
  error?: string;
}

const testEndpoints = [
  { path: '/debug/test-connection', auth: false },
  { path: '/vehicles', auth: true },
  { path: '/rentals', auth: true },
  { path: '/customers', auth: true },
  { path: '/protocols/bulk-status', auth: true },
  { path: '/insurances', auth: true },
  { path: '/expenses', auth: true },
  { path: '/settlements', auth: true },
];

async function testEndpoint(
  baseUrl: string,
  endpoint: { path: string; auth: boolean },
  name: string
): Promise<number> {
  const config = endpoint.auth
    ? {
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
      }
    : {};

  try {
    const start = Date.now();
    await axios.get(baseUrl + endpoint.path, config);
    const time = Date.now() - start;
    console.log(`  ${name}: ${time}ms`);
    return time;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(`  ${name}: ERROR - ${error.response?.status || 'Network error'}`);
    }
    throw error;
  }
}

async function runComparison(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('\n🚀 Starting Performance Comparison...\n');
  console.log('=' .repeat(60));

  for (const endpoint of testEndpoints) {
    console.log(`\n📊 Testing: ${endpoint.path}`);

    try {
      const expressTime = await testEndpoint(EXPRESS_URL, endpoint, 'Express');
      const fastifyTime = await testEndpoint(FASTIFY_URL, endpoint, 'Fastify');

      const improvement = ((expressTime - fastifyTime) / expressTime) * 100;

      results.push({
        endpoint: endpoint.path,
        expressTime,
        fastifyTime,
        improvement,
      });

      console.log(
        `  ⚡ Fastify je ${improvement > 0 ? improvement.toFixed(1) : '0'}% ${
          improvement > 0 ? 'rýchlejší' : 'pomalší'
        }`
      );
    } catch (error) {
      console.log(`  ❌ Error testing ${endpoint.path}`);
      results.push({
        endpoint: endpoint.path,
        expressTime: 0,
        fastifyTime: 0,
        improvement: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

function printSummary(results: TestResult[]) {
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 SUMMARY REPORT');
  console.log('='.repeat(60));

  const validResults = results.filter((r) => !r.error);

  if (validResults.length === 0) {
    console.log('\n❌ No valid results to analyze');
    return;
  }

  const avgExpressTime =
    validResults.reduce((sum, r) => sum + r.expressTime, 0) / validResults.length;
  const avgFastifyTime =
    validResults.reduce((sum, r) => sum + r.fastifyTime, 0) / validResults.length;
  const avgImprovement =
    validResults.reduce((sum, r) => sum + r.improvement, 0) / validResults.length;

  console.log('\n📈 Average Response Times:');
  console.log(`  Express:  ${avgExpressTime.toFixed(2)}ms`);
  console.log(`  Fastify:  ${avgFastifyTime.toFixed(2)}ms`);
  console.log(`  Speedup:  ${avgImprovement.toFixed(1)}%`);

  console.log('\n🏆 Best Improvements:');
  const sorted = [...validResults].sort((a, b) => b.improvement - a.improvement);
  sorted.slice(0, 3).forEach((r) => {
    console.log(`  ${r.endpoint}: +${r.improvement.toFixed(1)}%`);
  });

  console.log('\n⚠️  Worst Improvements:');
  sorted
    .slice(-3)
    .reverse()
    .forEach((r) => {
      console.log(`  ${r.endpoint}: ${r.improvement.toFixed(1)}%`);
    });

  if (results.some((r) => r.error)) {
    console.log('\n❌ Errors:');
    results
      .filter((r) => r.error)
      .forEach((r) => {
        console.log(`  ${r.endpoint}: ${r.error}`);
      });
  }

  console.log('\n' + '='.repeat(60));
}

// Main execution
async function main() {
  console.log('🔍 Performance Comparison: Express vs Fastify');
  console.log('\n⚙️  Configuration:');
  console.log(`  Express URL: ${EXPRESS_URL}`);
  console.log(`  Fastify URL: ${FASTIFY_URL}`);
  console.log(`  Auth Token:  ${TEST_TOKEN ? '✅ Set' : '❌ Not set (will test only public endpoints)'}`);

  if (!TEST_TOKEN) {
    console.log(
      '\n⚠️  Warning: No TEST_TOKEN provided. Set it via environment variable:'
    );
    console.log('  export TEST_TOKEN="your-token-here"');
    console.log('  npm run test:performance\n');
  }

  const results = await runComparison();
  printSummary(results);

  console.log('\n✅ Performance comparison complete!\n');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

