const { Pool } = require('pg');

async function test() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/blackrent'
  });
  
  try {
    // Get a platform ID
    const platformRes = await pool.query('SELECT id, name FROM platforms LIMIT 1');
    if (platformRes.rows.length === 0) {
      console.log('❌ No platforms found');
      return;
    }
    
    const platformId = platformRes.rows[0].id;
    console.log('📋 Testing with platform:', platformId, platformRes.rows[0].name);
    
    // Test the exact query from getPlatformStats
    console.log('\n🧪 Testing UUID casting queries...\n');
    
    const companies = await pool.query(
      'SELECT COUNT(*) as count FROM companies WHERE platform_id = $1::uuid',
      [platformId]
    );
    console.log('✅ Companies query:', companies.rows[0].count);
    
    const users = await pool.query(
      `SELECT COUNT(DISTINCT u.id) as count 
       FROM users u 
       INNER JOIN companies c ON u.company_id = c.id 
       WHERE c.platform_id = $1::uuid`,
      [platformId]
    );
    console.log('✅ Users query:', users.rows[0].count);
    
    const vehicles = await pool.query(
      `SELECT COUNT(DISTINCT v.id) as count 
       FROM vehicles v 
       INNER JOIN companies c ON v.owner_company_id = c.id 
       WHERE c.platform_id = $1::uuid`,
      [platformId]
    );
    console.log('✅ Vehicles query:', vehicles.rows[0].count);
    
    const rentals = await pool.query(
      `SELECT COUNT(DISTINCT r.id) as count 
       FROM rentals r 
       INNER JOIN vehicles v ON r.vehicle_id = v.id 
       INNER JOIN companies c ON v.owner_company_id = c.id 
       WHERE c.platform_id = $1::uuid`,
      [platformId]
    );
    console.log('✅ Rentals query:', rentals.rows[0].count);
    
    console.log('\n✅ All UUID casting queries work!');
    
  } catch (error) {
    console.error('❌ Query failed:', error.message);
  } finally {
    await pool.end();
  }
}

test();
