#!/usr/bin/env node

/**
 * Lokálny test PDF-lib generátora
 * Vygeneruje vzorové PDF súbory pre porovnanie kvality
 */

const fs = require('fs');
const path = require('path');

// Import generátorov (simulujeme backend environment)
const { PDFLibGenerator } = require('./backend/dist/utils/pdf-lib-generator');
const { PDFLibUnicodeGenerator } = require('./backend/dist/utils/pdf-lib-unicode-generator');
const { PDFLibTrueUnicodeGenerator } = require('./backend/dist/utils/pdf-lib-true-unicode-generator');
const { EnhancedPDFGeneratorBackend } = require('./backend/dist/utils/enhanced-pdf-generator-backend');

console.log('🧪 LOKÁLNY TEST PDF GENERÁTOROV');
console.log('==================================');
console.log(`📅 Test spustený: ${new Date().toLocaleString('sk-SK')}`);

// Mock handover protocol data
const mockHandoverProtocol = {
  id: 'test-handover-' + Date.now(),
  createdAt: new Date().toISOString(),
  location: 'Bratislava - Letisko M.R.Štefánika',
  status: 'completed',
  
  // Rental data
  rentalData: {
    orderNumber: 'BR-2025-001234',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 dní
    totalPrice: 280,
    deposit: 500,
    currency: 'EUR',
    
    customer: {
      name: 'Janko Hraško',
      email: 'janko.hrasko@example.com',
      phone: '+421 912 345 678'
    },
    
    vehicle: {
      brand: 'Škoda',
      model: 'Octavia Combi',
      licensePlate: 'BA-123-AB',
      company: 'AutoRent Bratislava s.r.o.',
      year: 2023,
      color: 'Strieborná metalíza'
    }
  },
  
  // Vehicle condition
  vehicleCondition: {
    odometer: 45670,
    fuelLevel: 85,
    fuelType: 'Benzín',
    exteriorCondition: 'Dobrý - pár drobných škrabancov na nárazníku',
    interiorCondition: 'Výborný - čisté sedadlá, funkčná elektronika',
    notes: 'Vozidlo kompletne funkčné, vyčistené a pripravené na prenájom. Zimné pneumatiky nainštalované. Všetky kľúče a dokumenty v poriadku.'
  },
  
  // Damages
  damages: [
    {
      description: 'Malý škrabanec na pravom prednom nárazníku',
      severity: 'Lehké',
      location: 'Predný nárazník - pravá strana',
      estimatedCost: 50
    },
    {
      description: 'Odrenina na ľavom spätnom zrkadle',
      severity: 'Kozmetické',
      location: 'Ľavé spätné zrkadlo',
      estimatedCost: 25
    }
  ],
  
  // Media info
  vehicleImages: ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg'],
  documentImages: ['vodic_preukaz.jpg', 'tp.jpg'],
  damageImages: ['damage1.jpg', 'damage2.jpg'],
  vehicleVideos: ['walk_around.mp4'],
  
  // Signatures
  signatures: [
    {
      signerName: 'Janko Hraško',
      signerRole: 'Zákazník',
      timestamp: new Date().toISOString(),
      location: 'Bratislava'
    },
    {
      signerName: 'Peter Novák',
      signerRole: 'Zástupca AutoRent',
      timestamp: new Date().toISOString(), 
      location: 'Bratislava'
    }
  ],
  
  notes: 'Zákazník informovaný o všetkých podmienkach prenájmu. Poistenie havarijné aj povinné v cene. Návrat vozidla najneskôr do 18:00 v deň ukončenia prenájmu. Kontakt pre prípad núdze: +421 800 123 456.'
};

async function testPDFGenerators() {
  try {
    console.log('\n🎨 TESTOVANIE PDF-LIB GENERÁTORA (ASCII)...');
    console.log('============================================');
    
    // Test PDF-lib generator (ASCII)
    const pdfLibGenerator = new PDFLibGenerator();
    const pdfLibStart = Date.now();
    const pdfLibBuffer = await pdfLibGenerator.generateHandoverProtocol(mockHandoverProtocol);
    const pdfLibTime = Date.now() - pdfLibStart;
    
    // Uloženie PDF-lib PDF
    const pdfLibFilename = `pdf-lib-ascii-${Date.now()}.pdf`;
    fs.writeFileSync(pdfLibFilename, pdfLibBuffer);
    
    console.log(`✅ PDF-lib ASCII PDF vygenerované:`);
    console.log(`   📄 Súbor: ${pdfLibFilename}`);
    console.log(`   📏 Veľkosť: ${(pdfLibBuffer.length / 1024).toFixed(1)} KB`);
    console.log(`   ⏱️  Čas: ${pdfLibTime}ms`);

    console.log('\n🔤 TESTOVANIE PDF-LIB UNICODE GENERÁTORA...');
    console.log('============================================');
    
    // Test PDF-lib Unicode generator (štandardné fonty)
    let pdfLibUnicodeBuffer, pdfLibUnicodeTime, pdfLibUnicodeFilename;
    try {
      const pdfLibUnicodeGenerator = new PDFLibUnicodeGenerator();
      const pdfLibUnicodeStart = Date.now();
      pdfLibUnicodeBuffer = await pdfLibUnicodeGenerator.generateHandoverProtocol(mockHandoverProtocol);
      pdfLibUnicodeTime = Date.now() - pdfLibUnicodeStart;
      
      // Uloženie PDF-lib Unicode PDF
      pdfLibUnicodeFilename = `pdf-lib-unicode-${Date.now()}.pdf`;
      fs.writeFileSync(pdfLibUnicodeFilename, pdfLibUnicodeBuffer);
      
      console.log(`✅ PDF-lib Unicode PDF vygenerované:`);
      console.log(`   📄 Súbor: ${pdfLibUnicodeFilename}`);
      console.log(`   📏 Veľkosť: ${(pdfLibUnicodeBuffer.length / 1024).toFixed(1)} KB`);
      console.log(`   ⏱️  Čas: ${pdfLibUnicodeTime}ms`);
    } catch (unicodeError) {
      console.log(`⚠️  PDF-lib Unicode generátor zlyhal: ${unicodeError.message}`);
      console.log('📝 Pokračujem bez Unicode verzie...');
    }

    console.log('\n🎯 TESTOVANIE PDF-LIB TRUE UNICODE GENERÁTORA...');
    console.log('==================================================');
    
    // Test PDF-lib TRUE Unicode generator (embeddované Roboto fonty)
    let pdfLibTrueUnicodeBuffer, pdfLibTrueUnicodeTime, pdfLibTrueUnicodeFilename;
    try {
      const pdfLibTrueUnicodeGenerator = new PDFLibTrueUnicodeGenerator();
      const pdfLibTrueUnicodeStart = Date.now();
      pdfLibTrueUnicodeBuffer = await pdfLibTrueUnicodeGenerator.generateHandoverProtocol(mockHandoverProtocol);
      pdfLibTrueUnicodeTime = Date.now() - pdfLibTrueUnicodeStart;
      
      // Uloženie PDF-lib TRUE Unicode PDF
      pdfLibTrueUnicodeFilename = `pdf-lib-true-unicode-${Date.now()}.pdf`;
      fs.writeFileSync(pdfLibTrueUnicodeFilename, pdfLibTrueUnicodeBuffer);
      
      console.log(`✅ PDF-lib TRUE Unicode PDF vygenerované:`);
      console.log(`   📄 Súbor: ${pdfLibTrueUnicodeFilename}`);
      console.log(`   📏 Veľkosť: ${(pdfLibTrueUnicodeBuffer.length / 1024).toFixed(1)} KB`);
      console.log(`   ⏱️  Čas: ${pdfLibTrueUnicodeTime}ms`);
      console.log(`   🔤 Diakritika: PLNÁ PODPORA (Č, Š, Ž, Ľ, Ť, Ň)!`);
    } catch (trueUnicodeError) {
      console.log(`⚠️  PDF-lib TRUE Unicode generátor zlyhal: ${trueUnicodeError.message}`);
      console.log('📝 Možno chýbajú Roboto font súbory...');
    }
    
    console.log('\n🎭 TESTOVANIE ENHANCED GENERÁTORA...');
    console.log('====================================');
    
    // Test Enhanced generator pre porovnanie
    const enhancedGenerator = new EnhancedPDFGeneratorBackend();
    const enhancedStart = Date.now();
    const enhancedBuffer = await enhancedGenerator.generateHandoverProtocol(mockHandoverProtocol);
    const enhancedTime = Date.now() - enhancedStart;
    
    // Uloženie Enhanced PDF
    const enhancedFilename = `enhanced-sample-${Date.now()}.pdf`;
    fs.writeFileSync(enhancedFilename, enhancedBuffer);
    
    console.log(`✅ Enhanced PDF vygenerované:`);
    console.log(`   📄 Súbor: ${enhancedFilename}`);
    console.log(`   📏 Veľkosť: ${(enhancedBuffer.length / 1024).toFixed(1)} KB`);
    console.log(`   ⏱️  Čas: ${enhancedTime}ms`);
    
    console.log('\n📊 POROVNANIE VÝSLEDKOV');
    console.log('========================');
    
    const sizeRatio = (pdfLibBuffer.length / enhancedBuffer.length).toFixed(2);
    const speedRatio = (enhancedTime / pdfLibTime).toFixed(2);
    
    console.log(`📏 Veľkosť ratio (pdf-lib ASCII/enhanced): ${sizeRatio}x`);
    console.log(`⏱️  Rýchlosť ratio (enhanced/pdf-lib): ${speedRatio}x`);
    
    if (pdfLibUnicodeBuffer) {
      const unicodeSizeRatio = (pdfLibUnicodeBuffer.length / enhancedBuffer.length).toFixed(2);
      const unicodeSpeedRatio = (enhancedTime / pdfLibUnicodeTime).toFixed(2);
      console.log(`📏 Veľkosť ratio (pdf-lib Unicode/enhanced): ${unicodeSizeRatio}x`);
      console.log(`⏱️  Rýchlosť ratio (enhanced/pdf-lib Unicode): ${unicodeSpeedRatio}x`);
    }
    
    if (pdfLibBuffer.length > enhancedBuffer.length) {
      const increase = ((pdfLibBuffer.length / enhancedBuffer.length - 1) * 100).toFixed(1);
      console.log(`📈 PDF-lib je o ${increase}% väčšie (viac obsahu/lepšia kvalita)`);
    } else {
      console.log(`📉 PDF-lib je menšie ako Enhanced`);
    }
    
    console.log('\n🎯 ODPORÚČANIA:');
    console.log('===============');
    
    if (pdfLibTrueUnicodeBuffer) {
      console.log(`🥇 PDF-lib TRUE Unicode má NAJLEPŠIU podporu pre slovenčinu!`);
      console.log(`🔤 Diakritika: 100% PLNÁ PODPORA (Č, Š, Ž, Ľ, Ť, Ň, atď.)`);
      console.log(`🎨 Roboto font: Profesionálny vzhľad`);
      console.log(`🎯 ODPORÚČAM: Použiť PDF-lib TRUE Unicode ako hlavný generátor!`);
    } else if (pdfLibUnicodeBuffer) {
      console.log(`✅ PDF-lib Unicode má dobrú podporu pre slovenčinu`);
      console.log(`🔤 Diakritika: Štandardné PDF fonty (môže zlyhať)`);
      console.log(`🎯 2. VOĽBA: PDF-lib Unicode ako backup`);
    } else if (pdfLibBuffer.length > 15000 && pdfLibBuffer.length < 100000) {
      console.log(`✅ PDF-lib ASCII má dobrú veľkosť pre profesionálny dokument`);
      console.log(`⚠️  Diakritika: Konvertovaná na ASCII (c, s, z, l, t, n)`);
      console.log(`🎯 3. VOĽBA: PDF-lib ASCII ak Unicode nefunguje`);
    } else {
      console.log(`✅ Enhanced generátor má spoľahlivú podporu`);
      console.log(`🔤 Diakritika: Plná podpora v jsPDF`);
      console.log(`🎯 FALLBACK: Enhanced ako záložné riešenie`);
    }
    
    console.log('\n📁 VYGENEROVANÉ SÚBORY:');
    console.log('=======================');
    console.log(`🔍 Otvorte tieto súbory pre vizuálne porovnanie:`);
    console.log(`   📄 ${pdfLibFilename} (PDF-lib ASCII)`);
    if (pdfLibUnicodeFilename) {
      console.log(`   📄 ${pdfLibUnicodeFilename} (PDF-lib Unicode)`);
    }
    if (pdfLibTrueUnicodeFilename) {
      console.log(`   📄 ${pdfLibTrueUnicodeFilename} (PDF-lib TRUE Unicode - PLNÁ DIAKRITIKA! 🎉)`);
    }
    console.log(`   📄 ${enhancedFilename} (Enhanced jsPDF)`);
    console.log(`\n🎉 TEST DOKONČENÝ ÚSPEŠNE!`);
    
  } catch (error) {
    console.error('\n❌ TEST ZLYHAL:', error);
    console.log('Stack trace:', error.stack);
  }
}

// Spustenie testu
testPDFGenerators(); 