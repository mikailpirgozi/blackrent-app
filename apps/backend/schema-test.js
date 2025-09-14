const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/blackrent',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function testSchema() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking database schema...');
    
    // Check all tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('📊 Available tables:', tables.rows.map(r => r.table_name));
    
    // Check users table structure
    try {
      const usersSchema = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      console.log('👤 Users table schema:', usersSchema.rows);
    } catch (e) {
      console.log('❌ Users table error:', e.message);
    }
    
    // Check if users table has any data
    try {
      const userData = await client.query('SELECT id, username, email FROM users LIMIT 3');
      console.log('👥 Users data sample:', userData.rows);
    } catch (e) {
      console.log('❌ Users data error:', e.message);
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

testSchema().catch(console.error);
