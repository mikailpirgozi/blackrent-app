#!/usr/bin/env node

/**
 * 🔍 Porovnanie PDF generátorov
 * Vytvorí PDF s pôvodným a novým generátorom pre porovnanie
 */

const { PDFLibGenerator } = require('./dist/utils/pdf-lib-generator.js');
const { PDFLibCustomFontGenerator } = require('./dist/utils/pdf-lib-custom-font-generator.js');
const fs = require('fs');
const path = require('path');

console.log('🔍 POROVNANIE PDF GENERÁTOROV');
console.log('=============================');

async function comparePDFGenerators() {
  // Testovací protokol
  const testProtocol = {
    id: 'COMPARE-001',
    location: 'Trenčín - POROVNANIE',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    vehicleCondition: {
      odometer: 50000,
      fuelLevel: 75,
      fuelType: 'Benzín',
      exteriorCondition: 'Výborný',
      interiorCondition: 'Dobrý'
    },
    notes: 'POROVNANIE: Tento text by mal vyzerať INAK v novom generátore (lepšia typografia) oproti pôvodnému generátoru.',
    rentalData: {
      id: 'RENTAL-COMPARE-001',
      customer: {
        name: 'POROVNANIE Zákazník',
        email: 'compare@example.com',
        phone: '+421900000000'
      },
      vehicle: {
        brand: 'Mercedes',
        model: 'CLA 200',
        licensePlate: 'CMP123',
        company: 'Porovnanie s.r.o.'
      },
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    damages: [],
    signatures: []
  };

  try {
    // 1. Pôvodný PDF-lib generátor
    console.log('📄 Generujem PDF s PÔVODNÝM generátorom...');
    const originalGenerator = new PDFLibGenerator();
    const originalPDF = await originalGenerator.generateHandoverProtocol(testProtocol);
    
    const originalPath = path.join(__dirname, 'compare-original.pdf');
    fs.writeFileSync(originalPath, originalPDF);
    console.log(`✅ Pôvodný PDF: ${originalPath} (${(originalPDF.length / 1024).toFixed(1)} KB)`);

    // 2. Nový custom font generátor
    console.log('📄 Generujem PDF s NOVÝM custom font generátorom...');
    const newGenerator = new PDFLibCustomFontGenerator('sf-pro');
    const newPDF = await newGenerator.generateHandoverProtocol(testProtocol);
    
    const newPath = path.join(__dirname, 'compare-new-typography.pdf');
    fs.writeFileSync(newPath, newPDF);
    console.log(`✅ Nový PDF: ${newPath} (${(newPDF.length / 1024).toFixed(1)} KB)`);

    console.log('\n📊 POROVNANIE:');
    console.log(`- Pôvodný generátor: ${(originalPDF.length / 1024).toFixed(1)} KB`);
    console.log(`- Nový generátor: ${(newPDF.length / 1024).toFixed(1)} KB`);
    console.log(`- Rozdiel: ${((newPDF.length - originalPDF.length) / 1024).toFixed(1)} KB`);
    
    console.log('\n🎯 INŠTRUKCIE PRE POROVNANIE:');
    console.log('1. Otvor oba PDF súbory vedľa seba');
    console.log('2. Porovnaj hlavný nadpis "ODOVZDÁVACÍ PROTOKOL"');
    console.log('3. Porovnaj sekcie ako "Základné informácie"');
    console.log('4. Porovnaj labels vs values (hrubé vs tenké)');
    console.log('5. Porovnaj poznámky a footer');
    
    console.log('\n🚀 Porovnanie dokončené!');
    
  } catch (error) {
    console.error('❌ Chyba pri porovnávaní:', error);
  }
}

comparePDFGenerators();
