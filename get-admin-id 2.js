#!/usr/bin/env node

/**
 * Script na zistenie ID admin účtu
 * Spustite: node get-admin-id.js
 */

const path = require('path');
const { Pool } = require(path.join(__dirname, 'node_modules/pg'));
require(path.join(__dirname, 'node_modules/dotenv')).config({ path: './backend/.env' });

// Railway PostgreSQL connection
const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Chyba: DATABASE_URL nie je nastavené!');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function getAdminId() {
  try {
    console.log('🔍 Hľadám admin účet v databáze...\n');
    
    // Nájdi admin účet
    const result = await pool.query(`
      SELECT 
        id,
        username,
        email,
        first_name,
        last_name,
        created_at
      FROM users 
      WHERE username = 'admin'
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      console.log('⚠️  Admin účet nebol nájdený!');
      console.log('   Vytvorte ho cez: /api/auth/reset-admin\n');
      return;
    }
    
    const admin = result.rows[0];
    
    console.log('✅ ADMIN ÚČET NÁJDENÝ!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  ID:         ${admin.id}`);
    console.log(`  Username:   ${admin.username}`);
    console.log(`  Email:      ${admin.email || 'N/A'}`);
    console.log(`  Meno:       ${admin.first_name || ''} ${admin.last_name || ''}`);
    console.log(`  Vytvorený:  ${new Date(admin.created_at).toLocaleString('sk-SK')}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📋 DO RAILWAY ENVIRONMENT VARIABLES PRIDAJTE:\n');
    console.log(`   PROTOCOL_V2_USER_IDS=${admin.id}`);
    console.log('\n💡 Alebo ak chcete viacero admin účtov:');
    console.log(`   PROTOCOL_V2_USER_IDS=${admin.id},user2-id,user3-id\n`);
    
    // Skontroluj aj ostatných používateľov
    const usersResult = await pool.query(`
      SELECT COUNT(*) as total FROM users
    `);
    
    console.log(`📊 Celkový počet používateľov: ${usersResult.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Chyba pri pripojení k databáze:', error.message);
    console.log('\n💡 Tip: Skontrolujte DATABASE_URL v backend/.env');
  } finally {
    await pool.end();
  }
}

// Spusti script
getAdminId();
