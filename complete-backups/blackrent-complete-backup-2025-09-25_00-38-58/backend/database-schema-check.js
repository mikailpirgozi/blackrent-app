const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Databázové pripojenie
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:nfwrpKxILRUMqunYTZJEhjudEstqLRGv@trolley.proxy.rlwy.net:13400/railway'
});

// Definície očakávaných stĺpcov pre každú tabuľku na základe kódu
const expectedSchema = {
  users: [
    'id', 'username', 'email', 'password_hash', 'role', 'created_at', 'updated_at',
    'company_id', 'employee_number', 'hire_date', 'is_active', 'last_login',
    'first_name', 'last_name', 'signature_template', 'linked_investor_id', 'permissions'
  ],
  
  vehicles: [
    'id', 'brand', 'model', 'license_plate', 'company', 'pricing', 'commission',
    'status', 'created_at', 'updated_at', 'owner_name', 'company_id', 'stk_expiry',
    'category', 'owner_company_id'
  ],
  
  rentals: [
    'id', 'customer_id', 'vehicle_id', 'start_date', 'end_date', 'total_price',
    'status', 'created_at', 'updated_at', 'payment_method', 'notes', 'customer_name',
    'customer_phone', 'order_number', 'vehicle_name', 'vehicle_code', 'handover_place',
    'daily_kilometers', 'approval_status', 'auto_processed_at', 'email_content',
    'vehicle_company_snapshot', 'company', 'rental_type', 'is_flexible', 'flexible_end_date',
    'can_be_overridden', 'override_priority', 'notification_threshold', 'auto_extend',
    'override_history', 'customer_email'
  ],
  
  customers: [
    'id', 'name', 'email', 'phone', 'address', 'created_at', 'updated_at',
    'driver_license', 'birth_date', 'id_number'
  ],
  
  companies: [
    'id', 'name', 'business_id', 'tax_id', 'address', 'contact_person', 'email',
    'phone', 'contract_start_date', 'contract_end_date', 'commission_rate',
    'is_active', 'created_at', 'updated_at'
  ],
  
  settlements: [
    'id', 'rental_id', 'amount', 'commission', 'net_amount', 'status', 'created_at',
    'updated_at', 'paid_at', 'notes'
  ],
  
  expenses: [
    'id', 'vehicle_id', 'amount', 'description', 'category', 'date', 'receipt_url',
    'created_at', 'updated_at', 'company_id', 'category_id'
  ],
  
  insurances: [
    'id', 'vehicle_id', 'provider', 'policy_number', 'start_date', 'end_date',
    'premium', 'coverage_type', 'created_at', 'updated_at'
  ],
  
  protocols: [
    'id', 'rental_id', 'type', 'data', 'created_at', 'updated_at', 'created_by'
  ],
  
  email_processing_history: [
    'id', 'email_id', 'message_id', 'subject', 'sender', 'recipient', 'email_content',
    'email_html', 'received_at', 'processed_at', 'status', 'action_taken', 'processed_by',
    'parsed_data', 'confidence_score', 'error_message', 'notes', 'tags', 'rental_id',
    'is_blacklisted', 'created_at', 'updated_at', 'archived_at'
  ],
  
  blacklist: [
    'id', 'email', 'reason', 'created_at', 'created_by', 'is_active'
  ],
  
  protocol_photos: [
    'id', 'protocol_id', 'photo_url', 'category', 'description', 'created_at'
  ],
  
  protocol_signatures: [
    'id', 'protocol_id', 'signature_type', 'signature_data', 'signer_name', 'created_at'
  ],
  
  expense_categories: [
    'id', 'name', 'description', 'is_active', 'created_at', 'updated_at'
  ]
};

async function checkDatabaseSchema() {
  console.log('🔍 DATABÁZOVÁ SCHÉMA ANALÝZA');
  console.log('=' .repeat(50));
  
  try {
    const client = await pool.connect();
    
    // Získaj všetky tabuľky
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`📋 Našiel som ${tablesResult.rows.length} tabuliek v databáze:`);
    tablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));
    console.log();
    
    const issues = [];
    
    for (const [tableName, expectedColumns] of Object.entries(expectedSchema)) {
      console.log(`🔍 Kontrolujem tabuľku: ${tableName}`);
      
      // Skontroluj či tabuľka existuje
      const tableExists = tablesResult.rows.some(row => row.table_name === tableName);
      
      if (!tableExists) {
        console.log(`  ❌ TABUĽKA NEEXISTUJE: ${tableName}`);
        issues.push({
          type: 'missing_table',
          table: tableName,
          message: `Tabuľka ${tableName} neexistuje`
        });
        continue;
      }
      
      // Získaj stĺpce tabuľky
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);
      
      const actualColumns = columnsResult.rows.map(row => row.column_name);
      
      console.log(`  📊 Aktuálne stĺpce (${actualColumns.length}):`, actualColumns.join(', '));
      
      // Nájdi chýbajúce stĺpce
      const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
      
      // Nájdi extra stĺpce
      const extraColumns = actualColumns.filter(col => !expectedColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log(`  ❌ CHÝBAJÚCE STĹPCE (${missingColumns.length}):`, missingColumns.join(', '));
        issues.push({
          type: 'missing_columns',
          table: tableName,
          columns: missingColumns,
          message: `V tabuľke ${tableName} chýbajú stĺpce: ${missingColumns.join(', ')}`
        });
      }
      
      if (extraColumns.length > 0) {
        console.log(`  ℹ️ EXTRA STĹPCE (${extraColumns.length}):`, extraColumns.join(', '));
      }
      
      if (missingColumns.length === 0 && extraColumns.length === 0) {
        console.log(`  ✅ TABUĽKA OK - všetky stĺpce sú správne`);
      }
      
      console.log();
    }
    
    client.release();
    
    // Súhrn problémov
    console.log('📊 SÚHRN ANALÝZY');
    console.log('=' .repeat(50));
    
    if (issues.length === 0) {
      console.log('✅ DATABÁZA JE V PORIADKU - žiadne problémy nenájdené!');
    } else {
      console.log(`❌ NAŠIEL SOM ${issues.length} PROBLÉMOV:`);
      console.log();
      
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.message}`);
        if (issue.type === 'missing_columns') {
          console.log(`   Oprava: ALTER TABLE ${issue.table} ADD COLUMN ...`);
        } else if (issue.type === 'missing_table') {
          console.log(`   Oprava: CREATE TABLE ${issue.table} ...`);
        }
      });
      
      console.log();
      console.log('🔧 AUTOMATICKÁ OPRAVA');
      console.log('Chcete spustiť automatické opravy? Spustite: node fix-database-schema.js');
    }
    
    // Ulož výsledky do súboru
    const report = {
      timestamp: new Date().toISOString(),
      issues: issues,
      summary: {
        totalIssues: issues.length,
        missingTables: issues.filter(i => i.type === 'missing_table').length,
        missingColumns: issues.filter(i => i.type === 'missing_columns').length
      }
    };
    
    fs.writeFileSync('database-schema-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Detailný report uložený do: database-schema-report.json');
    
  } catch (error) {
    console.error('❌ Chyba pri analýze databázy:', error.message);
  } finally {
    await pool.end();
  }
}

// Spusti analýzu
checkDatabaseSchema();
