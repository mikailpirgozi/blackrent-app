// 🚀 FÁZA 2.2: Connection Pool Performance Test
const { Pool } = require('pg');

async function testConnectionPool() {
  console.log('🔍 Testing current connection pool performance...');
  
  // Aktuálna konfigurácia
  const currentPool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:nfwrpKxILRUMqunYTZJEhjudEstqLRGv@trolley.proxy.rlwy.net:13400/railway',
    ssl: { rejectUnauthorized: false },
    max: 25,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 5000,
    allowExitOnIdle: true,
  });

  // Optimalizovaná konfigurácia
  const optimizedPool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:nfwrpKxILRUMqunYTZJEhjudEstqLRGv@trolley.proxy.rlwy.net:13400/railway',
    ssl: { rejectUnauthorized: false },
    // 🚀 OPTIMALIZOVANÉ NASTAVENIA:
    max: 15, // Znížené z 25 - Railway má limity
    min: 2,  // Minimálne 2 connections vždy hotové
    idleTimeoutMillis: 30000, // 30s - rýchlejšie uvoľnenie
    connectionTimeoutMillis: 2000, // 2s - rýchlejšie timeout
    query_timeout: 10000, // 10s timeout pre query
    acquireTimeoutMillis: 3000, // 3s timeout pre získanie connection
    allowExitOnIdle: true,
    // Keepalive pre Railway
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
  });

  const testQuery = `
    WITH test_range AS (
      SELECT CURRENT_DATE as start_date, CURRENT_DATE + INTERVAL '30 days' as end_date
    )
    SELECT COUNT(*) as total_records
    FROM vehicles v, test_range tr
    WHERE v.status = 'available';
  `;

  // Test aktuálnej konfigurácie
  console.log('\n📊 Testing CURRENT configuration...');
  const currentStart = Date.now();
  try {
    for (let i = 0; i < 5; i++) {
      const client = await currentPool.connect();
      await client.query(testQuery);
      client.release();
    }
    const currentTime = Date.now() - currentStart;
    console.log(`✅ Current config: ${currentTime}ms for 5 queries`);
  } catch (error) {
    console.error('❌ Current config error:', error.message);
  }

  // Test optimalizovanej konfigurácie
  console.log('\n🚀 Testing OPTIMIZED configuration...');
  const optimizedStart = Date.now();
  try {
    for (let i = 0; i < 5; i++) {
      const client = await optimizedPool.connect();
      await client.query(testQuery);
      client.release();
    }
    const optimizedTime = Date.now() - optimizedStart;
    console.log(`✅ Optimized config: ${optimizedTime}ms for 5 queries`);
    
    const improvement = ((currentTime - optimizedTime) / currentTime * 100).toFixed(1);
    console.log(`📈 Performance improvement: ${improvement}%`);
  } catch (error) {
    console.error('❌ Optimized config error:', error.message);
  }

  // Pool statistics
  console.log('\n📊 Pool Statistics:');
  console.log('Current pool:', {
    totalCount: currentPool.totalCount,
    idleCount: currentPool.idleCount,
    waitingCount: currentPool.waitingCount
  });
  
  console.log('Optimized pool:', {
    totalCount: optimizedPool.totalCount,
    idleCount: optimizedPool.idleCount,
    waitingCount: optimizedPool.waitingCount
  });

  await currentPool.end();
  await optimizedPool.end();
}

testConnectionPool().catch(console.error);