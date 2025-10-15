/**
 * Quick Database Check Script
 * Check how many vehicles are in Railway PostgreSQL
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Connecting to Railway PostgreSQL...\n');
    
    // Count vehicles
    const vehicleCount = await client.query('SELECT COUNT(*) as count FROM vehicles WHERE status != $1', ['removed']);
    console.log('✅ Available Vehicles:', vehicleCount.rows[0].count);
    
    // Get sample vehicles
    const vehicles = await client.query(`
      SELECT id, brand, model, category, status, created_at 
      FROM vehicles 
      WHERE status != 'removed'
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (vehicles.rows.length > 0) {
      console.log('\n📦 Sample Vehicles:');
      vehicles.rows.forEach((v, i) => {
        console.log(`${i + 1}. ${v.brand} ${v.model} (${v.category}) - Status: ${v.status}`);
      });
    } else {
      console.log('\n⚠️  WARNING: No vehicles found in database!');
      console.log('You need to add vehicles via Web Admin or seed script.');
    }
    
    // Count customers
    const customerCount = await client.query('SELECT COUNT(*) as count FROM customers');
    console.log('\n👥 Customers:', customerCount.rows[0].count);
    
    // Count rentals
    const rentalCount = await client.query('SELECT COUNT(*) as count FROM rentals');
    console.log('📅 Rentals:', rentalCount.rows[0].count);
    
  } catch (error) {
    console.error('❌ Database Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabase();

