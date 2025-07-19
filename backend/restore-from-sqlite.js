#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

const SQLITE_BACKUP_FILE = './backups/blackrent-startup-2025-07-13T19-47-08-101Z.db';

async function restoreData() {
  console.log('🔄 Starting data restoration from SQLite to PostgreSQL...');
  
  // PostgreSQL connection
  const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  const pgClient = await pgPool.connect();
  
  try {
    console.log('📋 Step 1: Restoring vehicles...');
    
    // SQLite connection
    const sqliteDb = new sqlite3.Database(SQLITE_BACKUP_FILE);
    
    // Get vehicles from SQLite
    const vehicles = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM vehicles', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📦 Found ${vehicles.length} vehicles to restore`);
    
    // Insert vehicles into PostgreSQL with UUID conversion
    for (const vehicle of vehicles) {
      try {
        await pgClient.query(`
          INSERT INTO vehicles (make, model, year, license_plate, company, pricing, commission, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (license_plate) DO UPDATE SET
            make = $1,
            model = $2,
            year = $3,
            company = $5,
            updated_at = $10
        `, [
          vehicle.brand, // make = brand v SQLite
          vehicle.model,
          vehicle.year,
          vehicle.licensePlate, // license_plate = licensePlate v SQLite  
          'Default Company', // company (nové pole)
          JSON.stringify([]), // pricing (nové pole)
          JSON.stringify({"type": "percentage", "value": 15}), // commission (nové pole)
          vehicle.status || 'available',
          vehicle.createdAt,
          vehicle.updatedAt
        ]);
        
        console.log(`✅ Restored vehicle: ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`);
      } catch (err) {
        console.log(`⚠️ Error restoring vehicle ${vehicle.licensePlate}:`, err.message);
      }
    }
    
    console.log('📋 Step 2: Restoring customers...');
    
    // Get customers from SQLite
    const customers = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM customers', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📦 Found ${customers.length} customers to restore`);
    
    for (const customer of customers) {
      try {
        await pgClient.query(`
          INSERT INTO customers (name, email, phone, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (email) DO UPDATE SET
            name = $1,
            phone = $3,
            updated_at = $5
        `, [
          customer.name,
          customer.email || '',
          customer.phone || '',
          customer.createdAt,
          customer.updatedAt
        ]);
        
        console.log(`✅ Restored customer: ${customer.name}`);
      } catch (err) {
        console.log(`⚠️ Error restoring customer ${customer.name}:`, err.message);
      }
    }
    
    console.log('📋 Step 3: Restoring companies...');
    
    // Get companies from SQLite
    const companies = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM companies', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📦 Found ${companies.length} companies to restore`);
    
    for (const company of companies) {
      try {
        await pgClient.query(`
          INSERT INTO companies (name, created_at, updated_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (name) DO UPDATE SET
            updated_at = $3
        `, [
          company.name,
          company.createdAt,
          company.updatedAt
        ]);
        
        console.log(`✅ Restored company: ${company.name}`);
      } catch (err) {
        console.log(`⚠️ Error restoring company ${company.name}:`, err.message);
      }
    }
    
    console.log('📋 Step 4: Restoring expenses...');
    
    // Get expenses from SQLite  
    const expenses = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM expenses', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📦 Found ${expenses.length} expenses to restore`);
    
    for (const expense of expenses) {
      try {
        await pgClient.query(`
          INSERT INTO expenses (description, amount, date, company, category, note, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          expense.description,
          expense.amount,
          expense.date,
          expense.company || 'Unknown',
          expense.category || 'Other',
          expense.note || '',
          expense.createdAt,
          expense.updatedAt
        ]);
        
        console.log(`✅ Restored expense: ${expense.description} (${expense.amount}€)`);
      } catch (err) {
        console.log(`⚠️ Error restoring expense:`, err.message);
      }
    }
    
    // Close SQLite connection
    sqliteDb.close();
    
    console.log('🎉 Data restoration completed!');
    
    // Summary
    const summary = await pgClient.query(`
      SELECT 
        (SELECT COUNT(*) FROM vehicles) as vehicles_count,
        (SELECT COUNT(*) FROM customers) as customers_count,
        (SELECT COUNT(*) FROM companies) as companies_count,
        (SELECT COUNT(*) FROM expenses) as expenses_count
    `);
    
    console.log('📊 PostgreSQL data summary:', summary.rows[0]);
    
  } catch (error) {
    console.error('❌ Restoration failed:', error);
  } finally {
    pgClient.release();
    await pgPool.end();
  }
}

// Install required packages first
console.log('📦 Installing required packages...');
const { execSync } = require('child_process');

try {
  execSync('npm list sqlite3 > /dev/null 2>&1 || npm install sqlite3', { stdio: 'inherit' });
} catch (err) {
  console.log('⚠️ Failed to install sqlite3, trying anyway...');
}

// Run restoration
restoreData().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 