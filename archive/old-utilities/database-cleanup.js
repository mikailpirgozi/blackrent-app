#!/usr/bin/env node

/**
 * 🗑️ BLACKRENT DATABASE CLEANUP SCRIPT
 * 
 * Bezpečne vymaže všetky vozidlá a prenájmy z databázy
 * Zachová zákazníkov, firmy, používateľov a ostatné dáta
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

async function createBackup() {
  const client = await pool.connect();
  try {
    console.log('📦 Vytváram zálohu pred vymazaním...');
    
    // Počet záznamov pred vymazaním
    const vehiclesCount = await client.query('SELECT COUNT(*) FROM vehicles');
    const rentalsCount = await client.query('SELECT COUNT(*) FROM rentals');
    const expensesCount = await client.query('SELECT COUNT(*) FROM expenses WHERE vehicle_id IS NOT NULL');
    const insurancesCount = await client.query('SELECT COUNT(*) FROM insurances WHERE vehicle_id IS NOT NULL');
    
    console.log('📊 Aktuálny stav databázy:');
    console.log(`   🚗 Vozidlá: ${vehiclesCount.rows[0].count}`);
    console.log(`   🏠 Prenájmy: ${rentalsCount.rows[0].count}`);
    console.log(`   💰 Náklady (s vozidlom): ${expensesCount.rows[0].count}`);
    console.log(`   🛡️ Poistenia (s vozidlom): ${insurancesCount.rows[0].count}`);
    
    // Vytvor backup tabuľky
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles_backup_${timestamp.substring(0, 10)} AS 
      SELECT * FROM vehicles
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS rentals_backup_${timestamp.substring(0, 10)} AS 
      SELECT * FROM rentals
    `);
    
    console.log(`✅ Záloha vytvorená: vehicles_backup_${timestamp.substring(0, 10)}, rentals_backup_${timestamp.substring(0, 10)}`);
    
    return {
      vehiclesCount: vehiclesCount.rows[0].count,
      rentalsCount: rentalsCount.rows[0].count,
      expensesCount: expensesCount.rows[0].count,
      insurancesCount: insurancesCount.rows[0].count
    };
    
  } finally {
    client.release();
  }
}

async function cleanupDatabase() {
  const client = await pool.connect();
  try {
    console.log('🗑️ Začínam cleanup databázy...');
    
    // FÁZA 1: Vymaž všetky prenájmy
    console.log('🏠 Vymazávam všetky prenájmy...');
    const deletedRentals = await client.query('DELETE FROM rentals');
    console.log(`   ✅ Vymazané prenájmy: ${deletedRentals.rowCount}`);
    
    // FÁZA 2: Vymaž súvisiace dáta vozidiel
    console.log('🔗 Vymazávam súvisiace dáta vozidiel...');
    
    // Vymaž náklady súvisiace s vozidlami
    const deletedExpenses = await client.query('DELETE FROM expenses WHERE vehicle_id IS NOT NULL');
    console.log(`   ✅ Vymazané náklady: ${deletedExpenses.rowCount}`);
    
    // Vymaž poistenia súvisiace s vozidlami
    const deletedInsurances = await client.query('DELETE FROM insurances WHERE vehicle_id IS NOT NULL');
    console.log(`   ✅ Vymazané poistenia: ${deletedInsurances.rowCount}`);
    
    // Vymaž dokumenty vozidiel
    const deletedDocs = await client.query('DELETE FROM vehicle_documents WHERE vehicle_id IS NOT NULL');
    console.log(`   ✅ Vymazané dokumenty: ${deletedDocs.rowCount}`);
    
    // Vymaž nedostupnosti vozidiel
    const deletedUnavailability = await client.query('DELETE FROM vehicle_unavailability WHERE vehicle_id IS NOT NULL');
    console.log(`   ✅ Vymazané nedostupnosti: ${deletedUnavailability.rowCount}`);
    
    // Vymaž nároky na poistenie
    const deletedClaims = await client.query('DELETE FROM insurance_claims WHERE vehicle_id IS NOT NULL');
    console.log(`   ✅ Vymazané nároky: ${deletedClaims.rowCount}`);
    
    // FÁZA 3: Vymaž všetky vozidlá
    console.log('🚗 Vymazávam všetky vozidlá...');
    const deletedVehicles = await client.query('DELETE FROM vehicles');
    console.log(`   ✅ Vymazané vozidlá: ${deletedVehicles.rowCount}`);
    
    // FÁZA 4: Reset sequences (ak existujú)
    try {
      await client.query('ALTER SEQUENCE IF EXISTS vehicles_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE IF EXISTS rentals_id_seq RESTART WITH 1');
      console.log('   ✅ Sequences resetované');
    } catch (error) {
      console.log('   ℹ️ Sequences nie sú potrebné (používame UUID)');
    }
    
    console.log('🎉 Cleanup dokončený!');
    
    return {
      deletedRentals: deletedRentals.rowCount,
      deletedVehicles: deletedVehicles.rowCount,
      deletedExpenses: deletedExpenses.rowCount,
      deletedInsurances: deletedInsurances.rowCount,
      deletedDocs: deletedDocs.rowCount,
      deletedUnavailability: deletedUnavailability.rowCount,
      deletedClaims: deletedClaims.rowCount
    };
    
  } finally {
    client.release();
  }
}

async function verifyCleanup() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verifikujem cleanup...');
    
    const vehiclesCount = await client.query('SELECT COUNT(*) FROM vehicles');
    const rentalsCount = await client.query('SELECT COUNT(*) FROM rentals');
    const expensesCount = await client.query('SELECT COUNT(*) FROM expenses WHERE vehicle_id IS NOT NULL');
    
    console.log('📊 Stav po cleanup:');
    console.log(`   🚗 Vozidlá: ${vehiclesCount.rows[0].count}`);
    console.log(`   🏠 Prenájmy: ${rentalsCount.rows[0].count}`);
    console.log(`   💰 Náklady (s vozidlom): ${expensesCount.rows[0].count}`);
    
    // Skontroluj že ostatné dáta zostali
    const customersCount = await client.query('SELECT COUNT(*) FROM customers');
    const companiesCount = await client.query('SELECT COUNT(*) FROM companies');
    const usersCount = await client.query('SELECT COUNT(*) FROM users');
    
    console.log('✅ Zachované dáta:');
    console.log(`   👥 Zákazníci: ${customersCount.rows[0].count}`);
    console.log(`   🏢 Firmy: ${companiesCount.rows[0].count}`);
    console.log(`   👤 Používatelia: ${usersCount.rows[0].count}`);
    
    const allClean = vehiclesCount.rows[0].count === '0' && rentalsCount.rows[0].count === '0';
    
    if (allClean) {
      console.log('🎉 Cleanup úspešný - databáza je pripravená na nové dáta!');
    } else {
      console.log('⚠️ Cleanup nebol úplný - skontrolujte chyby vyššie');
    }
    
    return allClean;
    
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🚀 BlackRent Database Cleanup Script');
    console.log('=====================================');
    
    // Vytvor zálohu
    const backupInfo = await createBackup();
    
    // Potvrdenie od používateľa
    console.log('\n⚠️  POZOR: Toto vymaže všetky vozidlá a prenájmy!');
    console.log('📦 Záloha bola vytvorená pre prípad potreby obnovy.');
    console.log('\nPokračovať? (y/N)');
    
    // Pre automatické spustenie bez interakcie
    const shouldProceed = process.argv.includes('--yes') || process.argv.includes('-y');
    
    if (!shouldProceed) {
      console.log('❌ Cleanup zrušený používateľom');
      process.exit(0);
    }
    
    // Vykonaj cleanup
    const cleanupResults = await cleanupDatabase();
    
    // Verifikuj výsledky
    const isClean = await verifyCleanup();
    
    console.log('\n📋 SÚHRN CLEANUP:');
    console.log(`   🏠 Vymazané prenájmy: ${cleanupResults.deletedRentals}`);
    console.log(`   🚗 Vymazané vozidlá: ${cleanupResults.deletedVehicles}`);
    console.log(`   💰 Vymazané náklady: ${cleanupResults.deletedExpenses}`);
    console.log(`   🛡️ Vymazané poistenia: ${cleanupResults.deletedInsurances}`);
    console.log(`   📄 Vymazané dokumenty: ${cleanupResults.deletedDocs}`);
    console.log(`   ⏸️ Vymazané nedostupnosti: ${cleanupResults.deletedUnavailability}`);
    console.log(`   📋 Vymazané nároky: ${cleanupResults.deletedClaims}`);
    
    if (isClean) {
      console.log('\n🎉 Databáza je pripravená na import nových dát!');
      console.log('💡 Môžete teraz importovať vozidlá a prenájmy cez CSV.');
    }
    
  } catch (error) {
    console.error('❌ Chyba pri cleanup:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Spusti script
if (require.main === module) {
  main();
}

module.exports = { createBackup, cleanupDatabase, verifyCleanup };
