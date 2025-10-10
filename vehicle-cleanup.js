#!/usr/bin/env node

/**
 * 🚗 BLACKRENT VEHICLE DATABASE CLEANUP SCRIPT
 * 
 * Vymaže len vozidlá a súvisiace dáta z databázy
 * Zachová prenájmy, zákazníkov, firmy a ostatné dáta
 */

const { Pool } = require('pg');

// Railway PostgreSQL pripojenie
const pool = new Pool({
  host: 'trolley.proxy.rlwy.net',
  port: 13400,
  database: 'railway',
  user: 'postgres',
  password: 'nfwrpKxILRUMqunYTZJEhjudEstqLRGv',
  ssl: {
    rejectUnauthorized: false
  }
});

async function cleanupVehicles() {
  const client = await pool.connect();
  try {
    console.log('🚗 Vymazávam všetky vozidlá z databázy...');
    
    // Počet vozidiel pred vymazaním
    const vehiclesCount = await client.query('SELECT COUNT(*) FROM vehicles');
    console.log(`📊 Aktuálne vozidlá v databáze: ${vehiclesCount.rows[0].count}`);
    
    if (vehiclesCount.rows[0].count === '0') {
      console.log('✅ Databáza vozidiel je už prázdna!');
      return;
    }

    // Vymaž vozidlá v správnom poradí (kvôli foreign key constraints)
    console.log('🗑️ Vymazávam vehicle_unavailability...');
    const deletedUnavailability = await client.query('DELETE FROM vehicle_unavailability');
    console.log(`   ✅ Vymazané nedostupnosti: ${deletedUnavailability.rowCount}`);
    
    console.log('🗑️ Vymazávam vehicle_documents...');
    const deletedDocs = await client.query('DELETE FROM vehicle_documents');
    console.log(`   ✅ Vymazané dokumenty: ${deletedDocs.rowCount}`);
    
    console.log('🗑️ Vymazávam expenses súvisiace s vozidlami...');
    const deletedExpenses = await client.query('DELETE FROM expenses WHERE vehicle_id IS NOT NULL');
    console.log(`   ✅ Vymazané náklady: ${deletedExpenses.rowCount}`);
    
    console.log('🗑️ Vymazávam insurances súvisiace s vozidlami...');
    const deletedInsurances = await client.query('DELETE FROM insurances WHERE vehicle_id IS NOT NULL');
    console.log(`   ✅ Vymazané poistenia: ${deletedInsurances.rowCount}`);
    
    console.log('🗑️ Vymazávam všetky vozidlá...');
    const deletedVehicles = await client.query('DELETE FROM vehicles');
    console.log(`   ✅ Vymazané vozidlá: ${deletedVehicles.rowCount}`);

    console.log('\n🎉 CLEANUP VOZIDIEL DOKONČENÝ!');
    console.log(`📊 Celkovo vymazané záznamy: ${
      deletedUnavailability.rowCount + 
      deletedDocs.rowCount + 
      deletedExpenses.rowCount + 
      deletedInsurances.rowCount + 
      deletedVehicles.rowCount
    }`);

    // Overenie že je databáza vozidiel prázdna
    const finalCount = await client.query('SELECT COUNT(*) FROM vehicles');
    console.log(`✅ Finálny počet vozidiel: ${finalCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Chyba pri vymazávaní vozidiel:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await cleanupVehicles();
    console.log('\n🚀 Databáza vozidiel je pripravená na nový import!');
  } catch (error) {
    console.error('❌ Script zlyhal:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
