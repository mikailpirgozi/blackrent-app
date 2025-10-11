const { Pool } = require('pg');
const fs = require('fs');

// Databázové pripojenie
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:nfwrpKxILRUMqunYTZJEhjudEstqLRGv@trolley.proxy.rlwy.net:13400/railway'
});

// SQL príkazy na vytvorenie chýbajúcich stĺpcov
const columnDefinitions = {
  // Users table
  'users.permissions': 'ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT \'[]\'',
  'users.linked_investor_id': 'ALTER TABLE users ADD COLUMN IF NOT EXISTS linked_investor_id UUID',
  
  // Vehicles table  
  'vehicles.owner_company_id': 'ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS owner_company_id UUID',
  'vehicles.stk_expiry': 'ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS stk_expiry DATE',
  'vehicles.category': 'ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS category VARCHAR(100)',
  
  // Rentals table
  'rentals.customer_email': 'ALTER TABLE rentals ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255)',
  'rentals.customer_phone': 'ALTER TABLE rentals ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(30)',
  'rentals.order_number': 'ALTER TABLE rentals ADD COLUMN IF NOT EXISTS order_number VARCHAR(100)',
  'rentals.vehicle_name': 'ALTER TABLE rentals ADD COLUMN IF NOT EXISTS vehicle_name VARCHAR(255)',
  'rentals.vehicle_code': 'ALTER TABLE rentals ADD COLUMN IF NOT EXISTS vehicle_code VARCHAR(100)',
  'rentals.handover_place': 'ALTER TABLE rentals ADD COLUMN IF NOT EXISTS handover_place VARCHAR(255)',
  'rentals.daily_kilometers': 'ALTER TABLE rentals ADD COLUMN IF NOT EXISTS daily_kilometers INTEGER',
  'rentals.approval_status': 'ALTER TABLE rentals ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) DEFAULT \'pending\'',
  'rentals.auto_processed_at': 'ALTER TABLE rentals ADD COLUMN IF NOT EXISTS auto_processed_at TIMESTAMP',
  'rentals.email_content': 'ALTER TABLE rentals ADD COLUMN IF NOT EXISTS email_content TEXT',
  'rentals.vehicle_company_snapshot': 'ALTER TABLE rentals ADD COLUMN IF NOT EXISTS vehicle_company_snapshot VARCHAR(255)',
  'rentals.company': 'ALTER TABLE rentals ADD COLUMN IF NOT EXISTS company VARCHAR(255)',
  'rentals.rental_type': 'ALTER TABLE rentals ADD COLUMN IF NOT EXISTS rental_type VARCHAR(50) DEFAULT \'standard\'',
  'rentals.is_flexible': 'ALTER TABLE rentals ADD COLUMN IF NOT EXISTS is_flexible BOOLEAN DEFAULT FALSE',
  'rentals.flexible_end_date': 'ALTER TABLE rentals ADD COLUMN IF NOT EXISTS flexible_end_date DATE',
  'rentals.can_be_overridden': 'ALTER TABLE rentals ADD COLUMN IF NOT EXISTS can_be_overridden BOOLEAN DEFAULT FALSE',
  'rentals.override_priority': 'ALTER TABLE rentals ADD COLUMN IF NOT EXISTS override_priority INTEGER DEFAULT 5',
  'rentals.notification_threshold': 'ALTER TABLE rentals ADD COLUMN IF NOT EXISTS notification_threshold INTEGER DEFAULT 3',
  'rentals.auto_extend': 'ALTER TABLE rentals ADD COLUMN IF NOT EXISTS auto_extend BOOLEAN DEFAULT FALSE',
  'rentals.override_history': 'ALTER TABLE rentals ADD COLUMN IF NOT EXISTS override_history JSONB DEFAULT \'[]\'',
  
  // Customers table
  'customers.driver_license': 'ALTER TABLE customers ADD COLUMN IF NOT EXISTS driver_license VARCHAR(100)',
  'customers.birth_date': 'ALTER TABLE customers ADD COLUMN IF NOT EXISTS birth_date DATE',
  'customers.id_number': 'ALTER TABLE customers ADD COLUMN IF NOT EXISTS id_number VARCHAR(50)',
  
  // Expenses table
  'expenses.company_id': 'ALTER TABLE expenses ADD COLUMN IF NOT EXISTS company_id UUID',
  'expenses.category_id': 'ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category_id UUID'
};

// SQL príkazy na vytvorenie chýbajúcich tabuliek
const tableDefinitions = {
  companies: `
    CREATE TABLE IF NOT EXISTS companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      business_id VARCHAR(50),
      tax_id VARCHAR(50),
      address TEXT,
      contact_person VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      contract_start_date DATE,
      contract_end_date DATE,
      commission_rate DECIMAL(5,2) DEFAULT 20.00,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  
  settlements: `
    CREATE TABLE IF NOT EXISTS settlements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      rental_id UUID REFERENCES rentals(id),
      amount DECIMAL(10,2) NOT NULL,
      commission DECIMAL(10,2) NOT NULL,
      net_amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      paid_at TIMESTAMP,
      notes TEXT
    )
  `,
  
  insurances: `
    CREATE TABLE IF NOT EXISTS insurances (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vehicle_id UUID REFERENCES vehicles(id),
      provider VARCHAR(255) NOT NULL,
      policy_number VARCHAR(100) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      premium DECIMAL(10,2) NOT NULL,
      coverage_type VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  
  protocols: `
    CREATE TABLE IF NOT EXISTS protocols (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      rental_id UUID REFERENCES rentals(id),
      type VARCHAR(50) NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by UUID REFERENCES users(id)
    )
  `,
  
  email_processing_history: `
    CREATE TABLE IF NOT EXISTS email_processing_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email_id TEXT UNIQUE NOT NULL,
      message_id TEXT,
      subject TEXT NOT NULL,
      sender TEXT NOT NULL,
      recipient TEXT DEFAULT 'info@blackrent.sk',
      email_content TEXT,
      email_html TEXT,
      received_at TIMESTAMP NOT NULL,
      processed_at TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processing', 'processed', 'rejected', 'archived', 'duplicate')),
      action_taken TEXT CHECK (action_taken IN ('approved', 'rejected', 'edited', 'deleted', 'archived', 'duplicate')),
      processed_by UUID,
      parsed_data JSONB,
      confidence_score DECIMAL(3,2) DEFAULT 0.0,
      error_message TEXT,
      notes TEXT,
      tags TEXT[],
      rental_id UUID,
      is_blacklisted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      archived_at TIMESTAMP
    )
  `,
  
  blacklist: `
    CREATE TABLE IF NOT EXISTS blacklist (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by UUID REFERENCES users(id),
      is_active BOOLEAN DEFAULT TRUE
    )
  `,
  
  protocol_photos: `
    CREATE TABLE IF NOT EXISTS protocol_photos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
      photo_url TEXT NOT NULL,
      category VARCHAR(50),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  
  protocol_signatures: `
    CREATE TABLE IF NOT EXISTS protocol_signatures (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
      signature_type VARCHAR(50) NOT NULL,
      signature_data TEXT NOT NULL,
      signer_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  
  expense_categories: `
    CREATE TABLE IF NOT EXISTS expense_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
};

async function fixDatabaseSchema() {
  console.log('🔧 AUTOMATICKÁ OPRAVA DATABÁZOVEJ SCHÉMY');
  console.log('=' .repeat(50));
  
  try {
    // Načítaj report z predchádzajúcej analýzy
    let report = null;
    try {
      const reportData = fs.readFileSync('database-schema-report.json', 'utf8');
      report = JSON.parse(reportData);
    } catch (error) {
      console.log('⚠️ Nenašiel som report súbor, spúšťam bez neho...');
    }
    
    const client = await pool.connect();
    let fixedIssues = 0;
    
    console.log('🏗️ Vytváram chýbajúce tabuľky...');
    
    // Vytvor chýbajúce tabuľky
    for (const [tableName, sql] of Object.entries(tableDefinitions)) {
      try {
        console.log(`  📋 Vytváram tabuľku: ${tableName}`);
        await client.query(sql);
        console.log(`  ✅ Tabuľka ${tableName} vytvorená`);
        fixedIssues++;
      } catch (error) {
        console.log(`  ⚠️ Tabuľka ${tableName}: ${error.message}`);
      }
    }
    
    console.log();
    console.log('📊 Pridávam chýbajúce stĺpce...');
    
    // Pridaj chýbajúce stĺpce
    for (const [columnKey, sql] of Object.entries(columnDefinitions)) {
      try {
        const [tableName, columnName] = columnKey.split('.');
        console.log(`  📋 Pridávam stĺpec: ${tableName}.${columnName}`);
        await client.query(sql);
        console.log(`  ✅ Stĺpec ${columnName} pridaný do ${tableName}`);
        fixedIssues++;
      } catch (error) {
        console.log(`  ⚠️ Stĺpec ${columnKey}: ${error.message}`);
      }
    }
    
    console.log();
    console.log('🔍 Vytváram užitočné indexy...');
    
    // Pridaj indexy pre lepšiu performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_rentals_customer_email ON rentals(customer_email)',
      'CREATE INDEX IF NOT EXISTS idx_rentals_order_number ON rentals(order_number)',
      'CREATE INDEX IF NOT EXISTS idx_rentals_approval_status ON rentals(approval_status)',
      'CREATE INDEX IF NOT EXISTS idx_rentals_vehicle_id ON rentals(vehicle_id)',
      'CREATE INDEX IF NOT EXISTS idx_vehicles_company_id ON vehicles(company_id)',
      'CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id)',
      'CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_id ON expenses(vehicle_id)',
      'CREATE INDEX IF NOT EXISTS idx_protocols_rental_id ON protocols(rental_id)'
    ];
    
    for (const indexSql of indexes) {
      try {
        await client.query(indexSql);
        console.log(`  ✅ Index vytvorený`);
      } catch (error) {
        console.log(`  ⚠️ Index: ${error.message}`);
      }
    }
    
    client.release();
    
    console.log();
    console.log('📊 SÚHRN OPRÁV');
    console.log('=' .repeat(50));
    console.log(`✅ Opravených problémov: ${fixedIssues}`);
    console.log('✅ Databázová schéma aktualizovaná!');
    console.log();
    console.log('🔍 Odporúčam spustiť znovu analýzu: node database-schema-check.js');
    
  } catch (error) {
    console.error('❌ Chyba pri oprave databázy:', error.message);
  } finally {
    await pool.end();
  }
}

// Spusti opravu
fixDatabaseSchema();
