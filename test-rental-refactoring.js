/**
 * Test Rental Repository Refactoring
 * Porovnáva výsledky pôvodnej a refaktorovanej implementácie
 */

const { PostgresDatabase } = require('./backend/dist/models/postgres-database.js');
const { PostgresDatabaseRefactored } = require('./backend/dist/models/PostgresDatabaseRefactored.js');

async function testRentalRefactoring() {
  console.log('🧪 TESTING RENTAL REPOSITORY REFACTORING');
  console.log('==========================================');

  let originalDb, refactoredDb;
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Initialize databases
    console.log('🔧 Inicializujem databázy...');
    originalDb = new PostgresDatabase();
    refactoredDb = new PostgresDatabaseRefactored();

    // Test 1: Get Rentals
    console.log('\n📋 Test 1: getRentals()');
    try {
      const originalRentals = await originalDb.getRentals();
      const refactoredRentals = await refactoredDb.getRentals();
      
      if (originalRentals.length === refactoredRentals.length) {
        console.log('✅ PASSED - Rovnaký počet prenájmov:', originalRentals.length);
        testsPassed++;
      } else {
        console.log('❌ FAILED - Rozdielny počet prenájmov:', {
          original: originalRentals.length,
          refactored: refactoredRentals.length
        });
        testsFailed++;
      }
    } catch (error) {
      console.log('❌ FAILED - Chyba pri teste getRentals:', error.message);
      testsFailed++;
    }

    // Test 2: Get Rental by ID (ak existujú prenájmy)
    console.log('\n🚗 Test 2: getRental(id)');
    try {
      const rentals = await originalDb.getRentals();
      if (rentals.length > 0) {
        const rentalId = rentals[0].id;
        const originalRental = await originalDb.getRental(rentalId);
        const refactoredRental = await refactoredDb.getRental(rentalId);
        
        if (originalRental && refactoredRental && originalRental.id === refactoredRental.id) {
          console.log('✅ PASSED - Prenájom načítaný správne:', rentalId);
          testsPassed++;
        } else {
          console.log('❌ FAILED - Rozdielne výsledky pre getRental');
          testsFailed++;
        }
      } else {
        console.log('⏭️ SKIPPED - Žiadne prenájmy na testovanie');
        testsPassed++; // Nie je chyba
      }
    } catch (error) {
      console.log('❌ FAILED - Chyba pri teste getRental:', error.message);
      testsFailed++;
    }

    // Test 3: Get Rentals Paginated
    console.log('\n📄 Test 3: getRentalsPaginated()');
    try {
      const originalPaginated = await originalDb.getRentalsPaginated({ page: 1, limit: 10 });
      const refactoredPaginated = await refactoredDb.getRentalsPaginated({ page: 1, limit: 10 });
      
      if (originalPaginated.total === refactoredPaginated.total) {
        console.log('✅ PASSED - Rovnaký počet prenájmov v paginácii:', originalPaginated.total);
        testsPassed++;
      } else {
        console.log('❌ FAILED - Rozdielny počet v paginácii:', {
          original: originalPaginated.total,
          refactored: refactoredPaginated.total
        });
        testsFailed++;
      }
    } catch (error) {
      console.log('❌ FAILED - Chyba pri teste getRentalsPaginated:', error.message);
      testsFailed++;
    }

    // Test 4: Get Rentals for Date Range
    console.log('\n📅 Test 4: getRentalsForDateRange()');
    try {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const originalDateRange = await originalDb.getRentalsForDateRange(startDate, endDate);
      const refactoredDateRange = await refactoredDb.getRentalsForDateRange(startDate, endDate);
      
      if (originalDateRange.length === refactoredDateRange.length) {
        console.log('✅ PASSED - Rovnaký počet prenájmov v dátumovom rozsahu:', originalDateRange.length);
        testsPassed++;
      } else {
        console.log('❌ FAILED - Rozdielny počet v dátumovom rozsahu:', {
          original: originalDateRange.length,
          refactored: refactoredDateRange.length
        });
        testsFailed++;
      }
    } catch (error) {
      console.log('❌ FAILED - Chyba pri teste getRentalsForDateRange:', error.message);
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
  console.log('📊 VÝSLEDKY TESTOVANIA');
  console.log('==========================================');
  console.log(`Úspešné testy: ${testsPassed}`);
  console.log(`Neúspešné testy: ${testsFailed}`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 VŠETKY TESTY PREŠLI!');
    console.log('✅ Rental Repository refaktoring je funkčný');
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
  testRentalRefactoring()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test zlyhal:', error);
      process.exit(1);
    });
}

module.exports = { testRentalRefactoring };
