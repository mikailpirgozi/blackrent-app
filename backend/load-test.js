const autocannon = require('autocannon');

// Get token from environment or use placeholder
const TEST_TOKEN = process.env.TEST_TOKEN || 'YOUR_TOKEN_HERE';

if (TEST_TOKEN === 'YOUR_TOKEN_HERE') {
  console.error('❌ Please set TEST_TOKEN environment variable');
  console.error('   export TEST_TOKEN="your-jwt-token"');
  process.exit(1);
}

async function runLoadTest() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚡ BlackRent Load Testing - Express vs Fastify');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const testConfig = {
    connections: 10,
    pipelining: 1,
    duration: 10,
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  // Test Express
  console.log('🧪 Testing Express (port 3001)...');
  console.log('');
  const expressResult = await autocannon({
    url: 'http://localhost:3001/api/vehicles',
    ...testConfig
  });

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Express Results:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Requests:  ${expressResult.requests.total} total`);
  console.log(`   Latency:   ${expressResult.latency.mean.toFixed(2)}ms average`);
  console.log(`   Throughput: ${(expressResult.throughput.mean / 1024 / 1024).toFixed(2)} MB/s`);
  console.log(`   RPS:       ${expressResult.requests.mean.toFixed(2)} req/s`);
  console.log(`   2xx:       ${expressResult['2xx']} responses`);
  console.log(`   Non-2xx:   ${expressResult.non2xx} responses`);
  console.log('');

  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test Fastify
  console.log('🚀 Testing Fastify (port 3002)...');
  console.log('');
  const fastifyResult = await autocannon({
    url: 'http://localhost:3002/api/vehicles',
    ...testConfig
  });

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Fastify Results:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Requests:  ${fastifyResult.requests.total} total`);
  console.log(`   Latency:   ${fastifyResult.latency.mean.toFixed(2)}ms average`);
  console.log(`   Throughput: ${(fastifyResult.throughput.mean / 1024 / 1024).toFixed(2)} MB/s`);
  console.log(`   RPS:       ${fastifyResult.requests.mean.toFixed(2)} req/s`);
  console.log(`   2xx:       ${fastifyResult['2xx']} responses`);
  console.log(`   Non-2xx:   ${fastifyResult.non2xx} responses`);
  console.log('');

  // Comparison
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 Comparison:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const rpsImprovement = ((fastifyResult.requests.mean - expressResult.requests.mean) / expressResult.requests.mean * 100).toFixed(2);
  const latencyImprovement = ((expressResult.latency.mean - fastifyResult.latency.mean) / expressResult.latency.mean * 100).toFixed(2);
  const throughputImprovement = ((fastifyResult.throughput.mean - expressResult.throughput.mean) / expressResult.throughput.mean * 100).toFixed(2);

  console.log(`   RPS:        ${rpsImprovement > 0 ? '+' : ''}${rpsImprovement}% (Fastify ${rpsImprovement > 0 ? 'faster' : 'slower'})`);
  console.log(`   Latency:    ${latencyImprovement > 0 ? '+' : ''}${latencyImprovement}% (Fastify ${latencyImprovement > 0 ? 'better' : 'worse'})`);
  console.log(`   Throughput: ${throughputImprovement > 0 ? '+' : ''}${throughputImprovement}% (Fastify ${throughputImprovement > 0 ? 'higher' : 'lower'})`);
  console.log('');

  // Winner
  if (fastifyResult.requests.mean > expressResult.requests.mean) {
    const speedup = (fastifyResult.requests.mean / expressResult.requests.mean).toFixed(2);
    console.log(`🏆 Winner: Fastify (${speedup}x faster!)`);
  } else {
    console.log(`🏆 Winner: Express`);
  }
  console.log('');
}

runLoadTest().catch(err => {
  console.error('❌ Load test failed:', err);
  process.exit(1);
});


