const { Pool } = require('pg');

// Railway PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createSettlementsTable() {
  console.log('🔧 Creating settlements table in PostgreSQL...');
  
  try {
    const client = await pool.connect();
    
    // Create settlements table with simplified schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS settlements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company VARCHAR(100),
        period VARCHAR(50),
        from_date TIMESTAMP NOT NULL,
        to_date TIMESTAMP NOT NULL,
        total_rentals INTEGER DEFAULT 0,
        total_income DECIMAL(10,2) DEFAULT 0,
        total_expenses DECIMAL(10,2) DEFAULT 0,
        commission DECIMAL(10,2) DEFAULT 0,
        net_income DECIMAL(10,2) DEFAULT 0,
        rentals_by_payment_method JSONB DEFAULT '{}',
        expenses_by_category JSONB DEFAULT '{}',
        summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Settlements table created successfully!');
    
    // Check if table exists and has data
    const result = await client.query('SELECT COUNT(*) as count FROM settlements;');
    console.log(`📊 Settlements count: ${result.rows[0].count}`);
    
    client.release();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating settlements table:', error);
    process.exit(1);
  }
}

createSettlementsTable(); 