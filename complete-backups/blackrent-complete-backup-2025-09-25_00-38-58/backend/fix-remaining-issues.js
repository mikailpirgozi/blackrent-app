const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:nfwrpKxILRUMqunYTZJEhjudEstqLRGv@trolley.proxy.rlwy.net:13400/railway'
});

async function fixRemainingIssues() {
  console.log('🔧 OPRAVUJEM ZOSTÁVAJÚCE PROBLÉMY');
  console.log('=' .repeat(50));
  
  try {
    const client = await pool.connect();
    let fixedIssues = 0;
    
    // Pridaj chýbajúce stĺpce do existujúcich tabuliek
    const fixes = [
      // Vehicles table
      'ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      'ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255)',
      
      // Rentals table
      'ALTER TABLE rentals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      
      // Customers table
      'ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      
      // Companies table - pridaj do existujúcej tabuľky
      'ALTER TABLE companies ADD COLUMN IF NOT EXISTS business_id VARCHAR(50)',
      'ALTER TABLE companies ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50)',
      'ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255)',
      'ALTER TABLE companies ADD COLUMN IF NOT EXISTS contract_start_date DATE',
      'ALTER TABLE companies ADD COLUMN IF NOT EXISTS contract_end_date DATE',
      'ALTER TABLE companies ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 20.00',
      'ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true',
      'ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      
      // Settlements table - pridaj do existujúcej tabuľky
      'ALTER TABLE settlements ADD COLUMN IF NOT EXISTS rental_id UUID',
      'ALTER TABLE settlements ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2)',
      'ALTER TABLE settlements ADD COLUMN IF NOT EXISTS commission DECIMAL(10,2)',
      'ALTER TABLE settlements ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10,2)',
      'ALTER TABLE settlements ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP',
      'ALTER TABLE settlements ADD COLUMN IF NOT EXISTS notes TEXT',
      
      // Expenses table
      'ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT',
      'ALTER TABLE expenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      
      // Insurances table
      'ALTER TABLE insurances ADD COLUMN IF NOT EXISTS vehicle_id UUID',
      'ALTER TABLE insurances ADD COLUMN IF NOT EXISTS provider VARCHAR(255)',
      'ALTER TABLE insurances ADD COLUMN IF NOT EXISTS coverage_type VARCHAR(100)',
      'ALTER TABLE insurances ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      
      // Protocols table
      'ALTER TABLE protocols ADD COLUMN IF NOT EXISTS data JSONB',
      
      // Email processing history - pridaj do existujúcej tabuľky
      'ALTER TABLE email_processing_history ADD COLUMN IF NOT EXISTS email_id TEXT',
      'ALTER TABLE email_processing_history ADD COLUMN IF NOT EXISTS message_id TEXT',
      'ALTER TABLE email_processing_history ADD COLUMN IF NOT EXISTS subject TEXT',
      'ALTER TABLE email_processing_history ADD COLUMN IF NOT EXISTS sender TEXT',
      'ALTER TABLE email_processing_history ADD COLUMN IF NOT EXISTS recipient TEXT DEFAULT \'info@blackrent.sk\'',
      'ALTER TABLE email_processing_history ADD COLUMN IF NOT EXISTS email_content TEXT',
      'ALTER TABLE email_processing_history ADD COLUMN IF NOT EXISTS email_html TEXT',
      'ALTER TABLE email_processing_history ADD COLUMN IF NOT EXISTS received_at TIMESTAMP',
      'ALTER TABLE email_processing_history ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP',
      'ALTER TABLE email_processing_history ADD COLUMN IF NOT EXISTS action_taken TEXT',
      'ALTER TABLE email_processing_history ADD COLUMN IF NOT EXISTS processed_by UUID',
      'ALTER TABLE email_processing_history ADD COLUMN IF NOT EXISTS parsed_data JSONB',
      'ALTER TABLE email_processing_history ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) DEFAULT 0.0',
      'ALTER TABLE email_processing_history ADD COLUMN IF NOT EXISTS error_message TEXT',
      'ALTER TABLE email_processing_history ADD COLUMN IF NOT EXISTS notes TEXT',
      'ALTER TABLE email_processing_history ADD COLUMN IF NOT EXISTS tags TEXT[]',
      'ALTER TABLE email_processing_history ADD COLUMN IF NOT EXISTS rental_id UUID',
      'ALTER TABLE email_processing_history ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT FALSE',
      'ALTER TABLE email_processing_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      'ALTER TABLE email_processing_history ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    ];
    
    console.log('📊 Pridávam chýbajúce stĺpce...');
    
    for (const sql of fixes) {
      try {
        await client.query(sql);
        const tableName = sql.match(/ALTER TABLE (\\w+)/)[1];
        const columnName = sql.match(/ADD COLUMN IF NOT EXISTS (\\w+)/)[1];
        console.log(`  ✅ ${tableName}.${columnName} pridané`);
        fixedIssues++;
      } catch (error) {
        console.log(`  ⚠️ ${sql.substring(0, 50)}...: ${error.message}`);
      }
    }
    
    console.log();
    console.log('🏗️ Vytváram chýbajúce tabuľky...');
    
    // Vytvor protocol_photos tabuľku bez FK constraint
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS protocol_photos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          protocol_id UUID,
          photo_url TEXT NOT NULL,
          category VARCHAR(50),
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✅ protocol_photos tabuľka vytvorená');
      fixedIssues++;
    } catch (error) {
      console.log(`  ⚠️ protocol_photos: ${error.message}`);
    }
    
    // Vytvor protocol_signatures tabuľku bez FK constraint
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS protocol_signatures (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          protocol_id UUID,
          signature_type VARCHAR(50) NOT NULL,
          signature_data TEXT NOT NULL,
          signer_name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✅ protocol_signatures tabuľka vytvorená');
      fixedIssues++;
    } catch (error) {
      console.log(`  ⚠️ protocol_signatures: ${error.message}`);
    }
    
    console.log();
    console.log('🔍 Vytváram dodatočné indexy...');
    
    const additionalIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_settlements_rental_id ON settlements(rental_id)',
      'CREATE INDEX IF NOT EXISTS idx_insurances_vehicle_id ON insurances(vehicle_id)',
      'CREATE INDEX IF NOT EXISTS idx_protocol_photos_protocol_id ON protocol_photos(protocol_id)',
      'CREATE INDEX IF NOT EXISTS idx_protocol_signatures_protocol_id ON protocol_signatures(protocol_id)',
      'CREATE INDEX IF NOT EXISTS idx_email_processing_history_email_id ON email_processing_history(email_id)',
      'CREATE INDEX IF NOT EXISTS idx_email_processing_history_rental_id ON email_processing_history(rental_id)'
    ];
    
    for (const indexSql of additionalIndexes) {
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
    console.log('🔍 Spustite znovu kontrolu: node database-schema-check.js');
    
  } catch (error) {
    console.error('❌ Chyba pri oprave:', error.message);
  } finally {
    await pool.end();
  }
}

fixRemainingIssues();
