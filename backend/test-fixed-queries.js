require('dotenv').config();
const { Pool } = require('pg');

async function test() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const platformRes = await pool.query('SELECT id, name FROM platforms LIMIT 1');
    const platformId = platformRes.rows[0].id;
    console.log('📋 Platform:', platformId, platformRes.rows[0].name, '\n');
    
    const users = await pool.query(
      `SELECT COUNT(DISTINCT u.id) as count 
       FROM users u 
       INNER JOIN companies c ON u.company_id = c.id::text::uuid 
       WHERE c.platform_id = $1::uuid`,
      [platformId]
    );
    console.log('✅ Users:', users.rows[0].count);
    
    const vehicles = await pool.query(
      `SELECT COUNT(DISTINCT v.id) as count 
       FROM vehicles v 
       INNER JOIN companies c ON v.owner_company_id = c.id::text::uuid 
       WHERE c.platform_id = $1::uuid`,
      [platformId]
    );
    console.log('✅ Vehicles:', vehicles.rows[0].count);
    
    const rentals = await pool.query(
      `SELECT COUNT(DISTINCT r.id) as count 
       FROM rentals r 
       INNER JOIN vehicles v ON r.vehicle_id = v.id 
       INNER JOIN companies c ON v.owner_company_id = c.id::text::uuid 
       WHERE c.platform_id = $1::uuid`,
      [platformId]
    );
    console.log('✅ Rentals:', rentals.rows[0].count);
    
    console.log('\n🎉 ALL QUERIES WORK! Platform stats fixed!');
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
  } finally {
    await pool.end();
  }
}

test();
