#!/usr/bin/env node

const { Pool } = require('pg');

async function fixDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  const client = await pool.connect();

  try {
    console.log('🔧 Starting manual database fix...');
    
    // 1. Check current schema
    console.log('📋 Checking current rentals table schema...');
    const schema = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'rentals' AND column_name IN ('id', 'vehicle_id', 'customer_id')
      ORDER BY column_name
    `);
    
    console.log('Current schema:', schema.rows);
    
    // 2. If ID is integer, we need to recreate the table
    const idColumn = schema.rows.find(row => row.column_name === 'id');
    if (idColumn && idColumn.data_type === 'integer') {
      console.log('🔄 Converting rentals table from INTEGER to UUID...');
      
      // Backup existing data
      const existingRentals = await client.query('SELECT * FROM rentals');
      console.log(`📦 Backing up ${existingRentals.rows.length} existing rentals...`);
      
      // Drop and recreate table with UUID
      await client.query('DROP TABLE IF EXISTS rentals CASCADE');
      
      await client.query(`
        CREATE TABLE rentals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
          customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
          customer_name VARCHAR(100) NOT NULL,
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          commission DECIMAL(10,2) NOT NULL DEFAULT 0,
          payment_method VARCHAR(50) NOT NULL,
          discount TEXT,
          custom_commission TEXT,
          extra_km_charge DECIMAL(10,2),
          paid BOOLEAN DEFAULT FALSE,
          status VARCHAR(30) DEFAULT 'pending',
          handover_place TEXT,
          confirmed BOOLEAN DEFAULT FALSE,
          payments JSONB,
          history JSONB,
          order_number VARCHAR(50),
          deposit DECIMAL(10,2),
          allowed_kilometers INTEGER,
          extra_kilometer_rate DECIMAL(10,2),
          return_conditions TEXT,
          fuel_level INTEGER,
          odometer INTEGER,
          return_fuel_level INTEGER,
          return_odometer INTEGER,
          actual_kilometers INTEGER,
          fuel_refill_cost DECIMAL(10,2),
          handover_protocol_id UUID,
          return_protocol_id UUID,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Rentals table recreated with UUID');
      
      // Restore data with new UUIDs
      if (existingRentals.rows.length > 0) {
        console.log('🔄 Restoring data with new UUIDs...');
        for (const rental of existingRentals.rows) {
          await client.query(`
            INSERT INTO rentals (
              customer_name, start_date, end_date, total_price, commission, 
              payment_method, discount, custom_commission, extra_km_charge, 
              paid, status, handover_place, confirmed, payments, history, 
              order_number, deposit, allowed_kilometers, extra_kilometer_rate,
              return_conditions, fuel_level, odometer, return_fuel_level, 
              return_odometer, actual_kilometers, fuel_refill_cost,
              handover_protocol_id, return_protocol_id, created_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
              $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
            )
          `, [
            rental.customer_name,
            rental.start_date,
            rental.end_date,
            rental.total_price,
            rental.commission || 0,
            rental.payment_method,
            rental.discount,
            rental.custom_commission,
            rental.extra_km_charge,
            rental.paid || false,
            rental.status || 'pending',
            rental.handover_place,
            rental.confirmed || false,
            rental.payments,
            rental.history,
            rental.order_number,
            rental.deposit,
            rental.allowed_kilometers,
            rental.extra_kilometer_rate,
            rental.return_conditions,
            rental.fuel_level,
            rental.odometer,
            rental.return_fuel_level,
            rental.return_odometer,
            rental.actual_kilometers,
            rental.fuel_refill_cost,
            rental.handover_protocol_id,
            rental.return_protocol_id,
            rental.created_at || new Date()
          ]);
        }
        console.log(`✅ Restored ${existingRentals.rows.length} rentals`);
      }
    } else {
      console.log('✅ Rentals table already has UUID columns');
    }
    
    // 3. Check expenses table
    console.log('📋 Checking expenses table...');
    const expensesSchema = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'expenses' AND column_name = 'id'
    `);
    
    const expenseIdColumn = expensesSchema.rows.find(row => row.column_name === 'id');
    if (expenseIdColumn && expenseIdColumn.data_type === 'integer') {
      console.log('🔄 Converting expenses table from INTEGER to UUID...');
      
      // Backup existing data
      const existingExpenses = await client.query('SELECT * FROM expenses');
      console.log(`📦 Backing up ${existingExpenses.rows.length} existing expenses...`);
      
      // Drop and recreate table
      await client.query('DROP TABLE IF EXISTS expenses CASCADE');
      
      await client.query(`
        CREATE TABLE expenses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          description TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          date TIMESTAMP NOT NULL,
          vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
          company VARCHAR(100) NOT NULL,
          category VARCHAR(50) NOT NULL,
          note TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Restore data
      if (existingExpenses.rows.length > 0) {
        for (const expense of existingExpenses.rows) {
          await client.query(`
            INSERT INTO expenses (description, amount, date, vehicle_id, company, category, note, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            expense.description,
            expense.amount,
            expense.date,
            expense.vehicle_id,
            expense.company,
            expense.category,
            expense.note,
            expense.created_at || new Date()
          ]);
        }
        console.log(`✅ Restored ${existingExpenses.rows.length} expenses`);
      }
      
      console.log('✅ Expenses table converted to UUID');
    } else {
      console.log('✅ Expenses table already has UUID columns');
    }
    
    // 4. Final verification
    console.log('📋 Final verification...');
    const finalSchema = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('rentals', 'expenses') AND column_name = 'id'
      ORDER BY table_name
    `);
    
    console.log('Final schema:');
    finalSchema.rows.forEach(row => {
      console.log(`  ${row.table_name}.${row.column_name}: ${row.data_type}`);
    });
    
    console.log('🎉 Database fix completed!');
    
  } catch (error) {
    console.error('❌ Database fix failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  fixDatabase().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { fixDatabase }; 