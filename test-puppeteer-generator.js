#!/usr/bin/env node

/**
 * 🎭 TEST PUPPETEER PDF GENERÁTORA V2
 * 
 * Testuje nový Puppeteer generátor offline pred nasadením
 */

const fs = require('fs');
const path = require('path');

// Import generátora
const { PuppeteerPDFGeneratorV2 } = require('./backend/dist/utils/puppeteer-pdf-generator-v2');

// Test dáta pre handover protokol
const testHandoverProtocol = {
  id: 'test-puppeteer-' + Date.now(),
  rentalId: 'rental-test-123',
  type: 'handover',
  status: 'completed',
  createdAt: new Date(),
  completedAt: new Date(),
  location: 'Bratislava Test',
  vehicleCondition: {
    odometer: 15000,
    fuelLevel: 85,
    fuelType: 'gasoline',
    exteriorCondition: 'Veľmi dobrý',
    interiorCondition: 'Dobrý',
    notes: 'Malé škrabance na pravých dverách, inak vozidlo v perfektnom stave.'
  },
  vehicleImages: [
    {
      id: 'img1',
      url: 'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Test+Vozidlo+1',
      type: 'vehicle',
      description: 'Predný pohľad',
      timestamp: new Date().toISOString()
    },
    {
      id: 'img2', 
      url: 'https://via.placeholder.com/300x200/2196F3/FFFFFF?text=Test+Vozidlo+2',
      type: 'vehicle',
      description: 'Zadný pohľad',
      timestamp: new Date().toISOString()
    }
  ],
  vehicleVideos: [],
  documentImages: [],
  documentVideos: [],
  damageImages: [],
  damageVideos: [],
  damages: [],
  signatures: [
    {
      id: 'sig1',
      signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      signerName: 'Ján Novák',
      signerRole: 'employee',
      timestamp: new Date().toISOString(),
      location: 'Bratislava Test',
      ipAddress: '127.0.0.1'
    }
  ],
  rentalData: {
    orderNumber: 'ORD-2025-001',
    vehicle: {
      id: 'vehicle-123',
      brand: 'BMW',
      model: 'X5',
      licensePlate: 'BA123TEST',
      company: 'Premium Cars SK',
      pricing: [],
      commission: { type: 'percentage', value: 20 },
      status: 'rented'
    },
    customer: {
      id: 'customer-123',
      name: 'Marián Kováč',
      email: 'marian.kovac@example.com',
      phone: '+421 901 234 567',
      createdAt: new Date()
    },
    startDate: new Date('2025-01-20'),
    endDate: new Date('2025-01-27'),
    totalPrice: 850,
    deposit: 200,
    currency: 'EUR',
    allowedKilometers: 1000,
    extraKilometerRate: 0.25
  },
  notes: 'Zákazník požiadal o predĺženie prenájmu o 2 dni. Vozidlo je v skvelom stave, žiadne problémy.',
  pdfUrl: null
};

async function testPuppeteerGenerator() {
  console.log('🎭 TESTOVANIE PUPPETEER PDF GENERÁTORA V2');
  console.log('=' .repeat(50));
  
  try {
    console.log('📋 Inicializujem generátor...');
    const generator = new PuppeteerPDFGeneratorV2();
    
    console.log('🎨 Generujem handover protokol...');
    console.log('📊 Test dáta:', {
      protocolId: testHandoverProtocol.id,
      vehicle: `${testHandoverProtocol.rentalData.vehicle.brand} ${testHandoverProtocol.rentalData.vehicle.model}`,
      customer: testHandoverProtocol.rentalData.customer.name,
      location: testHandoverProtocol.location
    });
    
    const startTime = Date.now();
    const pdfBuffer = await generator.generateHandoverProtocol(testHandoverProtocol);
    const endTime = Date.now();
    
    console.log('✅ PDF úspešne vygenerované!');
    console.log('📊 Štatistiky:');
    console.log(`   • Veľkosť: ${pdfBuffer.length} bytes (${(pdfBuffer.length / 1024).toFixed(2)} KB)`);
    console.log(`   • Čas generovania: ${endTime - startTime}ms`);
    console.log(`   • Typ: ${pdfBuffer.constructor.name}`);
    
    // Uloženie PDF súboru
    const filename = `test-puppeteer-handover-${Date.now()}.pdf`;
    const filepath = path.join(__dirname, filename);
    
    fs.writeFileSync(filepath, pdfBuffer);
    console.log(`💾 PDF uložené: ${filepath}`);
    
    // Porovnanie s Enhanced jsPDF
    console.log('\n📊 POROVNANIE GENERÁTOROV:');
    console.log('┌─────────────────────┬──────────────────┬─────────────────┐');
    console.log('│ Generátor           │ Veľkosť PDF      │ Čas generovania │');
    console.log('├─────────────────────┼──────────────────┼─────────────────┤');
    console.log(`│ Puppeteer V2        │ ${(pdfBuffer.length / 1024).toFixed(2).padStart(12)} KB │ ${(endTime - startTime).toString().padStart(13)}ms │`);
    console.log('│ Enhanced jsPDF      │        ~685 KB   │         ~200ms  │');
    console.log('│ Legacy pdfkit       │          ~3 KB   │         ~100ms  │');
    console.log('└─────────────────────┴──────────────────┴─────────────────┘');
    
    console.log('\n🎯 PUPPETEER VÝHODY:');
    console.log('✅ Plná podpora HTML/CSS');
    console.log('✅ Perfektná slovenská diakritika');
    console.log('✅ Responzívny dizajn');
    console.log('✅ Profesionálny vzhľad');
    console.log('✅ Flexibilné templaty');
    console.log('✅ Podpora gradientov a tieňov');
    
    console.log('\n🎉 TEST ÚSPEŠNÝ!');
    console.log('📄 PDF súbor je pripravený na kontrolu.');
    
  } catch (error) {
    console.error('❌ CHYBA PRI TESTOVANÍ:');
    console.error(error);
    process.exit(1);
  }
}

// Spustenie testu
if (require.main === module) {
  testPuppeteerGenerator().catch(console.error);
}

module.exports = { testPuppeteerGenerator }; 