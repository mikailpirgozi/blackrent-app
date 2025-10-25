#!/usr/bin/env node
/**
 * Compare Local (Development) vs Production Database Schemas
 */

import pg from 'pg';
const { Pool } = pg;

// Local Development Database (from backend/.env)
const LOCAL_DB_URL = 'postgresql://postgres:krFQVDQmQNMNofjlFaHMyVQxTqrtRsQg@switchyard.proxy.rlwy.net:41478/railway';

// Production Database URL - paste from Railway dashboard
const PRODUCTION_DB_URL = process.env.PROD_DATABASE_URL || '';

async function getTableSchema(pool, tableName) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type,
        character_maximum_length,
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    return result.rows;
  } finally {
    client.release();
  }
}

async function getForeignKeys(pool, tableName) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = $1
      ORDER BY kcu.column_name
    `, [tableName]);
    return result.rows;
  } finally {
    client.release();
  }
}

async function getSampleData(pool, tableName, limit = 3) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM ${tableName} 
      ORDER BY created_at DESC 
      LIMIT $1
    `, [limit]);
    return result.rows;
  } catch (error) {
    console.log(`⚠️  Could not fetch sample data from ${tableName}: ${error.message}`);
    return [];
  } finally {
    client.release();
  }
}

async function compareDatabase(localUrl, prodUrl) {
  console.log('🔍 BLACKRENT DATABASE COMPARISON');
  console.log('=' .repeat(100));
  console.log('📍 Local (Development): switchyard.proxy.rlwy.net:41478');
  console.log('📍 Production: ' + (prodUrl ? 'Connected' : 'NOT PROVIDED'));
  console.log('=' .repeat(100));
  console.log('');

  const localPool = new Pool({
    connectionString: localUrl,
    ssl: { rejectUnauthorized: false }
  });

  let prodPool = null;
  if (prodUrl) {
    prodPool = new Pool({
      connectionString: prodUrl,
      ssl: { rejectUnauthorized: false }
    });
  }

  const tablesToCheck = [
    'insurances',
    'vehicle_documents',
    'vehicles',
    'rentals',
    'users',
    'companies',
    'insurers'
  ];

  try {
    for (const table of tablesToCheck) {
      console.log('\n' + '='.repeat(100));
      console.log(`📋 TABLE: ${table.toUpperCase()}`);
      console.log('='.repeat(100));

      // LOCAL SCHEMA
      console.log('\n🏠 LOCAL (Development) Schema:');
      console.log('-'.repeat(100));
      const localSchema = await getTableSchema(localPool, table);
      
      if (localSchema.length === 0) {
        console.log(`❌ Table '${table}' does not exist in LOCAL database`);
      } else {
        console.log('Column Name          | Type              | Nullable | Default');
        console.log('-'.repeat(100));
        localSchema.forEach(row => {
          const name = row.column_name.padEnd(20);
          const type = row.data_type.padEnd(18);
          const nullable = row.is_nullable.padEnd(9);
          const def = (row.column_default || 'null').substring(0, 30);
          console.log(`${name} | ${type} | ${nullable} | ${def}`);
        });

        // Sample data
        const localSample = await getSampleData(localPool, table, 2);
        console.log(`\n📊 Sample Data (${localSample.length} records):`);
        if (localSample.length > 0) {
          console.log(JSON.stringify(localSample[0], null, 2).substring(0, 500));
        }
      }

      // PRODUCTION SCHEMA
      if (prodPool) {
        console.log('\n\n🌐 PRODUCTION Schema:');
        console.log('-'.repeat(100));
        const prodSchema = await getTableSchema(prodPool, table);
        
        if (prodSchema.length === 0) {
          console.log(`❌ Table '${table}' does not exist in PRODUCTION database`);
        } else {
          console.log('Column Name          | Type              | Nullable | Default');
          console.log('-'.repeat(100));
          prodSchema.forEach(row => {
            const name = row.column_name.padEnd(20);
            const type = row.data_type.padEnd(18);
            const nullable = row.is_nullable.padEnd(9);
            const def = (row.column_default || 'null').substring(0, 30);
            console.log(`${name} | ${type} | ${nullable} | ${def}`);
          });

          // Sample data
          const prodSample = await getSampleData(prodPool, table, 2);
          console.log(`\n📊 Sample Data (${prodSample.length} records):`);
          if (prodSample.length > 0) {
            console.log(JSON.stringify(prodSample[0], null, 2).substring(0, 500));
          }

          // COMPARE SCHEMAS
          console.log('\n\n🔄 DIFFERENCES:');
          console.log('-'.repeat(100));
          
          const localCols = new Set(localSchema.map(r => r.column_name));
          const prodCols = new Set(prodSchema.map(r => r.column_name));
          
          const onlyInLocal = [...localCols].filter(c => !prodCols.has(c));
          const onlyInProd = [...prodCols].filter(c => !localCols.has(c));
          
          if (onlyInLocal.length > 0) {
            console.log(`❌ Columns ONLY in LOCAL: ${onlyInLocal.join(', ')}`);
          }
          if (onlyInProd.length > 0) {
            console.log(`❌ Columns ONLY in PRODUCTION: ${onlyInProd.join(', ')}`);
          }
          
          // Check type differences
          const commonCols = [...localCols].filter(c => prodCols.has(c));
          const typeDiffs = [];
          for (const col of commonCols) {
            const localCol = localSchema.find(r => r.column_name === col);
            const prodCol = prodSchema.find(r => r.column_name === col);
            if (localCol.data_type !== prodCol.data_type) {
              typeDiffs.push(`${col}: LOCAL=${localCol.data_type}, PROD=${prodCol.data_type}`);
            }
          }
          
          if (typeDiffs.length > 0) {
            console.log(`⚠️  Type differences: ${typeDiffs.join('; ')}`);
          }
          
          if (onlyInLocal.length === 0 && onlyInProd.length === 0 && typeDiffs.length === 0) {
            console.log('✅ Schemas are IDENTICAL');
          }
        }
      }

      // FOREIGN KEYS
      console.log('\n\n🔗 Foreign Keys:');
      console.log('-'.repeat(100));
      const localFKs = await getForeignKeys(localPool, table);
      if (localFKs.length > 0) {
        console.log('LOCAL:');
        localFKs.forEach(fk => {
          console.log(`  ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      } else {
        console.log('LOCAL: No foreign keys');
      }

      if (prodPool) {
        const prodFKs = await getForeignKeys(prodPool, table);
        if (prodFKs.length > 0) {
          console.log('PRODUCTION:');
          prodFKs.forEach(fk => {
            console.log(`  ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
          });
        } else {
          console.log('PRODUCTION: No foreign keys');
        }
      }
    }

    console.log('\n\n' + '='.repeat(100));
    console.log('✅ COMPARISON COMPLETE');
    console.log('='.repeat(100));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await localPool.end();
    if (prodPool) {
      await prodPool.end();
    }
  }
}

// Check if production URL is provided
if (!PRODUCTION_DB_URL) {
  console.log('⚠️  PRODUCTION DATABASE URL NOT PROVIDED');
  console.log('');
  console.log('To compare with production, run:');
  console.log('PROD_DATABASE_URL="postgresql://..." node compare-local-vs-production.js');
  console.log('');
  console.log('For now, showing LOCAL database schema only...');
  console.log('');
}

compareDatabase(LOCAL_DB_URL, PRODUCTION_DB_URL);




