#!/usr/bin/env node
/**
 * Complete Database Schema Comparison
 * Railway vs Localhost PostgreSQL
 */

import pg from 'pg';
const { Pool } = pg;

async function compareSchemas() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    console.log('This script must run via: railway run node compare-db-schemas.js');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Railway PostgreSQL...\n');
    const client = await pool.connect();
    
    // 1. INSURANCES TABLE
    console.log('=' .repeat(100));
    console.log('📋 INSURANCES TABLE - COMPLETE SCHEMA');
    console.log('='.repeat(100));
    
    const insurancesSchema = await client.query(`
      SELECT 
        column_name, 
        data_type,
        character_maximum_length,
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns 
      WHERE table_name = 'insurances' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nColumn Name          | Type              | Nullable | Default');
    console.log('-'.repeat(100));
    insurancesSchema.rows.forEach(row => {
      const name = row.column_name.padEnd(20);
      const type = row.data_type.padEnd(18);
      const nullable = row.is_nullable.padEnd(9);
      const def = (row.column_default || 'null').substring(0, 30);
      console.log(`${name} | ${type} | ${nullable} | ${def}`);
    });
    
    // 2. VEHICLE_DOCUMENTS TABLE
    console.log('\n' + '='.repeat(100));
    console.log('📋 VEHICLE_DOCUMENTS TABLE - COMPLETE SCHEMA');
    console.log('='.repeat(100));
    
    const vehicleDocsSchema = await client.query(`
      SELECT 
        column_name, 
        data_type,
        character_maximum_length,
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns 
      WHERE table_name = 'vehicle_documents' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nColumn Name          | Type              | Nullable | Default');
    console.log('-'.repeat(100));
    vehicleDocsSchema.rows.forEach(row => {
      const name = row.column_name.padEnd(20);
      const type = row.data_type.padEnd(18);
      const nullable = row.is_nullable.padEnd(9);
      const def = (row.column_default || 'null').substring(0, 30);
      console.log(`${name} | ${type} | ${nullable} | ${def}`);
    });
    
    // 3. SAMPLE DATA WITH TYPES
    console.log('\n' + '='.repeat(100));
    console.log('🔍 SAMPLE INSURANCE DATA (first 3 records)');
    console.log('='.repeat(100));
    
    const sampleInsurances = await client.query(`
      SELECT 
        id, 
        vehicle_id,
        type,
        policy_number,
        pg_typeof(id) as id_type, 
        pg_typeof(vehicle_id) as vehicle_id_type,
        pg_typeof(insurer_id) as insurer_id_type
      FROM insurances 
      ORDER BY id 
      LIMIT 3
    `);
    
    if (sampleInsurances.rows.length > 0) {
      console.log('\nID   | vehicle_id | ID Type    | vehicle_id Type | insurer_id Type | Type');
      console.log('-'.repeat(100));
      sampleInsurances.rows.forEach(row => {
        console.log(`${row.id} | ${row.vehicle_id || 'null'} | ${row.id_type} | ${row.vehicle_id_type || 'null'} | ${row.insurer_id_type || 'null'} | ${row.type}`);
      });
    } else {
      console.log('No insurance records found');
    }
    
    // 4. SAMPLE VEHICLE DOCUMENTS
    console.log('\n' + '='.repeat(100));
    console.log('🔍 SAMPLE VEHICLE_DOCUMENTS DATA (first 3 records)');
    console.log('='.repeat(100));
    
    const sampleDocs = await client.query(`
      SELECT 
        id, 
        vehicle_id,
        document_type,
        pg_typeof(id) as id_type, 
        pg_typeof(vehicle_id) as vehicle_id_type
      FROM vehicle_documents 
      ORDER BY created_at DESC
      LIMIT 3
    `);
    
    if (sampleDocs.rows.length > 0) {
      console.log('\nID (first 20 chars) | vehicle_id | ID Type | vehicle_id Type | Document Type');
      console.log('-'.repeat(100));
      sampleDocs.rows.forEach(row => {
        const shortId = row.id.toString().substring(0, 20);
        console.log(`${shortId} | ${row.vehicle_id} | ${row.id_type} | ${row.vehicle_id_type} | ${row.document_type}`);
      });
    } else {
      console.log('No vehicle_documents records found');
    }
    
    // 5. FOREIGN KEYS
    console.log('\n' + '='.repeat(100));
    console.log('🔗 FOREIGN KEY CONSTRAINTS');
    console.log('='.repeat(100));
    
    const foreignKeys = await client.query(`
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
        AND tc.table_name IN ('insurances', 'vehicle_documents')
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    console.log('\nTable                | Column           | References Table  | References Column');
    console.log('-'.repeat(100));
    foreignKeys.rows.forEach(row => {
      const table = row.table_name.padEnd(20);
      const col = row.column_name.padEnd(17);
      const refTable = row.foreign_table_name.padEnd(18);
      const refCol = row.foreign_column_name;
      console.log(`${table} | ${col} | ${refTable} | ${refCol}`);
    });
    
    client.release();
    console.log('\n✅ Railway database schema check complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

compareSchemas();

