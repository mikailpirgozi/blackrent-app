#!/usr/bin/env node
/**
 * Compare Local vs Production Database via API endpoints
 */

const LOCAL_API = 'http://localhost:3001/api';
const PROD_API = 'https://blackrent-app-production-4d6f.up.railway.app/api';

// Admin credentials - replace with actual admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123'; // Replace with actual password

async function login(apiUrl) {
  try {
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD
      })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(`Login failed: ${data.error}`);
    }

    return data.data.token;
  } catch (error) {
    console.error(`❌ Login error for ${apiUrl}:`, error.message);
    return null;
  }
}

async function getDatabaseSchema(apiUrl, token) {
  try {
    const response = await fetch(`${apiUrl}/debug/database-schema`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(`Schema fetch failed: ${data.error}`);
    }

    return data.data;
  } catch (error) {
    console.error(`❌ Schema fetch error for ${apiUrl}:`, error.message);
    return null;
  }
}

function compareSchemas(localSchema, prodSchema) {
  console.log('\n' + '='.repeat(100));
  console.log('🔍 DATABASE COMPARISON RESULTS');
  console.log('='.repeat(100));

  const tables = Object.keys(localSchema.schemas);

  for (const table of tables) {
    console.log(`\n📋 TABLE: ${table.toUpperCase()}`);
    console.log('-'.repeat(100));

    const localTable = localSchema.schemas[table];
    const prodTable = prodSchema.schemas[table];

    console.log(`\n📊 Record Counts:`);
    console.log(`  Local: ${localTable.recordCount}`);
    console.log(`  Production: ${prodTable.recordCount}`);

    // Compare columns
    const localCols = new Set(localTable.columns.map(c => c.column_name));
    const prodCols = new Set(prodTable.columns.map(c => c.column_name));

    const onlyInLocal = [...localCols].filter(c => !prodCols.has(c));
    const onlyInProd = [...prodCols].filter(c => !localCols.has(c));

    console.log(`\n🔄 Column Differences:`);
    if (onlyInLocal.length > 0) {
      console.log(`  ❌ Columns ONLY in LOCAL: ${onlyInLocal.join(', ')}`);
    }
    if (onlyInProd.length > 0) {
      console.log(`  ❌ Columns ONLY in PRODUCTION: ${onlyInProd.join(', ')}`);
    }

    // Check type differences
    const commonCols = [...localCols].filter(c => prodCols.has(c));
    const typeDiffs = [];
    for (const col of commonCols) {
      const localCol = localTable.columns.find(c => c.column_name === col);
      const prodCol = prodTable.columns.find(c => c.column_name === col);
      if (localCol.data_type !== prodCol.data_type) {
        typeDiffs.push(`${col}: LOCAL=${localCol.data_type}, PROD=${prodCol.data_type}`);
      }
    }

    if (typeDiffs.length > 0) {
      console.log(`  ⚠️  Type differences:`);
      typeDiffs.forEach(diff => console.log(`    - ${diff}`));
    }

    if (onlyInLocal.length === 0 && onlyInProd.length === 0 && typeDiffs.length === 0) {
      console.log(`  ✅ Schemas are IDENTICAL`);
    }

    // Compare foreign keys
    console.log(`\n🔗 Foreign Keys:`);
    console.log(`  Local: ${localTable.foreignKeys.length} keys`);
    localTable.foreignKeys.forEach(fk => {
      console.log(`    - ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    console.log(`  Production: ${prodTable.foreignKeys.length} keys`);
    prodTable.foreignKeys.forEach(fk => {
      console.log(`    - ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
  }

  console.log('\n' + '='.repeat(100));
  console.log('✅ COMPARISON COMPLETE');
  console.log('='.repeat(100));
}

async function main() {
  console.log('🚀 Starting Database Comparison...\n');

  // Check if local backend is running
  try {
    const localHealth = await fetch(`${LOCAL_API}/health`);
    if (!localHealth.ok) {
      console.log('⚠️  Local backend not running. Start it with: cd backend && pnpm dev');
      console.log('Comparing only production database...\n');
    }
  } catch (error) {
    console.log('⚠️  Local backend not running. Comparing only production database...\n');
  }

  // Login to production
  console.log('🔐 Logging in to PRODUCTION...');
  const prodToken = await login(PROD_API);
  if (!prodToken) {
    console.error('❌ Failed to login to production');
    process.exit(1);
  }
  console.log('✅ Production login successful\n');

  // Get production schema
  console.log('📥 Fetching PRODUCTION database schema...');
  const prodSchema = await getDatabaseSchema(PROD_API, prodToken);
  if (!prodSchema) {
    console.error('❌ Failed to fetch production schema');
    process.exit(1);
  }
  console.log('✅ Production schema fetched\n');

  console.log('📍 Production Database:', prodSchema.database);
  console.log('📍 Environment:', prodSchema.environment);
  console.log('📍 Timestamp:', prodSchema.timestamp);

  // Try to get local schema
  try {
    console.log('\n🔐 Logging in to LOCAL...');
    const localToken = await login(LOCAL_API);
    if (localToken) {
      console.log('✅ Local login successful\n');

      console.log('📥 Fetching LOCAL database schema...');
      const localSchema = await getDatabaseSchema(LOCAL_API, localToken);
      if (localSchema) {
        console.log('✅ Local schema fetched\n');

        console.log('📍 Local Database:', localSchema.database);
        console.log('📍 Environment:', localSchema.environment);
        console.log('📍 Timestamp:', localSchema.timestamp);

        // Compare
        compareSchemas(localSchema, prodSchema);
        return;
      }
    }
  } catch (error) {
    console.log('⚠️  Could not fetch local schema, showing production only\n');
  }

  // If we get here, just show production schema
  console.log('\n' + '='.repeat(100));
  console.log('📋 PRODUCTION DATABASE SCHEMA');
  console.log('='.repeat(100));

  for (const [table, schema] of Object.entries(prodSchema.schemas)) {
    console.log(`\n📋 ${table.toUpperCase()}`);
    console.log(`  Records: ${schema.recordCount}`);
    console.log(`  Columns: ${schema.columns.length}`);
    console.log(`  Foreign Keys: ${schema.foreignKeys.length}`);
    
    console.log('\n  Columns:');
    schema.columns.forEach(col => {
      console.log(`    - ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
  }
}

main();

