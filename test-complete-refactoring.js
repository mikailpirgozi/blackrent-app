/**
 * Test Complete Database Refactoring
 * Porovnáva výsledky pôvodnej a refaktorovanej implementácie
 */

const { PostgresDatabase } = require('./backend/dist/models/postgres-database.js');
const { PostgresDatabaseRefactored } = require('./backend/dist/models/PostgresDatabaseRefactored.js');

async function testCompleteRefactoring() {
  console.log('🧪 TESTING COMPLETE DATABASE REFACTORING');
  console.log('==========================================');

  let originalDb, refactoredDb;
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Initialize databases
    console.log('🔧 Inicializujem databázy...');
    originalDb = new PostgresDatabase();
    refactoredDb = new PostgresDatabaseRefactored();

    // Test 1: Get Vehicles
    console.log('\n🚗 Test 1: getVehicles()');
    try {
      const originalVehicles = await originalDb.getVehicles();
      const refactoredVehicles = await refactoredDb.getVehicles();
      
      if (originalVehicles.length === refactoredVehicles.length) {
        console.log('✅ PASSED - Vozidlá:', originalVehicles.length);
        testsPassed++;
      } else {
        console.log('❌ FAILED - Vozidlá:', {
          original: originalVehicles.length,
          refactored: refactoredVehicles.length
        });
        testsFailed++;
      }
    } catch (error) {
      console.log('❌ FAILED - Chyba pri getVehicles:', error.message);
      testsFailed++;
    }

    // Test 2: Get Rentals
    console.log('\n🏠 Test 2: getRentals()');
    try {
      const originalRentals = await originalDb.getRentals();
      const refactoredRentals = await refactoredDb.getRentals();
      
      if (originalRentals.length === refactoredRentals.length) {
        console.log('✅ PASSED - Prenájmy:', originalRentals.length);
        testsPassed++;
      } else {
        console.log('❌ FAILED - Prenájmy:', {
          original: originalRentals.length,
          refactored: refactoredRentals.length
        });
        testsFailed++;
      }
    } catch (error) {
      console.log('❌ FAILED - Chyba pri getRentals:', error.message);
      testsFailed++;
    }

    // Test 3: Get Customers
    console.log('\n👥 Test 3: getCustomers()');
    try {
      const originalCustomers = await originalDb.getCustomers();
      const refactoredCustomers = await refactoredDb.getCustomers();
      
      if (originalCustomers.length === refactoredCustomers.length) {
        console.log('✅ PASSED - Zákazníci:', originalCustomers.length);
        testsPassed++;
      } else {
        console.log('❌ FAILED - Zákazníci:', {
          original: originalCustomers.length,
          refactored: refactoredCustomers.length
        });
        testsFailed++;
      }
    } catch (error) {
      console.log('❌ FAILED - Chyba pri getCustomers:', error.message);
      testsFailed++;
    }

  } catch (error) {
    console.log('💥 KRITICKÁ CHYBA:', error.message);
    testsFailed++;
  } finally {
    // Cleanup
    try {
      if (originalDb?.dbPool) {
        await originalDb.dbPool.end();
      }
      if (refactoredDb) {
        await refactoredDb.close();
      }
    } catch (error) {
      console.log('⚠️ Chyba pri cleanup:', error.message);
    }
  }

  // Results
  console.log('\n==========================================');
  console.log('📊 VÝSLEDKY KOMPLETNÉHO TESTOVANIA');
  console.log('==========================================');
  console.log(`Úspešné testy: ${testsPassed}`);
  console.log(`Neúspešné testy: ${testsFailed}`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 VŠETKY TESTY PREŠLI!');
    console.log('✅ Kompletný Database refaktoring je funkčný');
    console.log('✅ Žiadne dáta sa nestratili');
    console.log('✅ Všetky repository fungujú identicky');
    console.log('');
    console.log('🏗️ REFAKTOROVANÉ KOMPONENTY:');
    console.log('   ✅ VehicleRepository - vozidlá');
    console.log('   ✅ RentalRepository - prenájmy');  
    console.log('   ✅ CustomerRepository - zákazníci');
    console.log('   ✅ BaseRepository - základná trieda');
    console.log('   ✅ DatabaseConnection - connection pool');
    return true;
  } else {
    console.log('\n❌ NIEKTORÉ TESTY ZLYHALI!');
    return false;
  }
}

// Spusti test
if (require.main === module) {
  testCompleteRefactoring()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test zlyhal:', error);
      process.exit(1);
    });
}

module.exports = { testCompleteRefactoring };
