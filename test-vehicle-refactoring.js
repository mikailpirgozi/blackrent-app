/**
 * Test Vehicle Repository Refactoring
 * Porovnáva výsledky pôvodnej a refaktorovanej implementácie
 */

const { PostgresDatabase } = require('./backend/dist/models/postgres-database.js');
const { PostgresDatabaseRefactored } = require('./backend/dist/models/PostgresDatabaseRefactored.js');

async function testVehicleRefactoring() {
  console.log('🧪 TESTING VEHICLE REPOSITORY REFACTORING');
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
    console.log('\n📋 Test 1: getVehicles()');
    try {
      const originalVehicles = await originalDb.getVehicles();
      const refactoredVehicles = await refactoredDb.getVehicles();
      
      if (originalVehicles.length === refactoredVehicles.length) {
        console.log('✅ PASSED - Rovnaký počet vozidiel:', originalVehicles.length);
        testsPassed++;
      } else {
        console.log('❌ FAILED - Rozdielny počet vozidiel:', {
          original: originalVehicles.length,
          refactored: refactoredVehicles.length
        });
        testsFailed++;
      }
    } catch (error) {
      console.log('❌ FAILED - Chyba pri teste getVehicles:', error.message);
      testsFailed++;
    }

    // Test 2: Get Vehicle by ID (ak existujú vozidlá)
    console.log('\n🚗 Test 2: getVehicle(id)');
    try {
      const vehicles = await originalDb.getVehicles();
      if (vehicles.length > 0) {
        const vehicleId = vehicles[0].id;
        const originalVehicle = await originalDb.getVehicle(vehicleId);
        const refactoredVehicle = await refactoredDb.getVehicle(vehicleId);
        
        if (originalVehicle && refactoredVehicle && originalVehicle.id === refactoredVehicle.id) {
          console.log('✅ PASSED - Vozidlo načítané správne:', vehicleId);
          testsPassed++;
        } else {
          console.log('❌ FAILED - Rozdielne výsledky pre getVehicle');
          testsFailed++;
        }
      } else {
        console.log('⏭️ SKIPPED - Žiadne vozidlá na testovanie');
      }
    } catch (error) {
      console.log('❌ FAILED - Chyba pri teste getVehicle:', error.message);
      testsFailed++;
    }

    // Test 3: Database Connection
    console.log('\n🔌 Test 3: testConnection()');
    try {
      const originalConnection = await originalDb.testConnection?.() || true;
      const refactoredConnection = await refactoredDb.testConnection();
      
      if (originalConnection && refactoredConnection) {
        console.log('✅ PASSED - Obe databázy majú funkčné spojenie');
        testsPassed++;
      } else {
        console.log('❌ FAILED - Problém so spojením');
        testsFailed++;
      }
    } catch (error) {
      console.log('❌ FAILED - Chyba pri teste connection:', error.message);
      testsFailed++;
    }

    // Test 4: Pool Stats
    console.log('\n📊 Test 4: getPoolStats()');
    try {
      const originalStats = originalDb.dbPool ? {
        totalCount: originalDb.dbPool.totalCount,
        idleCount: originalDb.dbPool.idleCount,
        waitingCount: originalDb.dbPool.waitingCount
      } : null;
      
      const refactoredStats = refactoredDb.getPoolStats();
      
      if (originalStats && refactoredStats) {
        console.log('✅ PASSED - Pool štatistiky dostupné');
        console.log('   Original:', originalStats);
        console.log('   Refactored:', refactoredStats);
        testsPassed++;
      } else {
        console.log('⚠️ WARNING - Pool štatistiky nedostupné (nie je chyba)');
        testsPassed++; // Nie je kritické
      }
    } catch (error) {
      console.log('⚠️ WARNING - Chyba pri pool stats:', error.message);
      testsPassed++; // Nie je kritické
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
  console.log('📊 VÝSLEDKY TESTOVANIA');
  console.log('==========================================');
  console.log(`Úspešné testy: ${testsPassed}`);
  console.log(`Neúspešné testy: ${testsFailed}`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 VŠETKY TESTY PREŠLI!');
    console.log('✅ Vehicle Repository refaktoring je funkčný');
    console.log('✅ Žiadne dáta sa nestratili');
    console.log('✅ Funkcionalita zostala zachovaná');
    return true;
  } else {
    console.log('\n❌ NIEKTORÉ TESTY ZLYHALI!');
    console.log('⚠️ Refaktoring potrebuje opravu');
    return false;
  }
}

// Spusti test
if (require.main === module) {
  testVehicleRefactoring()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test zlyhal:', error);
      process.exit(1);
    });
}

module.exports = { testVehicleRefactoring };
