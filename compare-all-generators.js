#!/usr/bin/env node

/**
 * 📊 POROVNANIE VŠETKÝCH PDF GENERÁTOROV
 * 
 * Vygeneruje PDF pomocou všetkých dostupných generátorov
 * a vytvorí porovnávaciu tabuľku
 */

const fs = require('fs');
const path = require('path');

// Import generátorov
const { PuppeteerPDFGeneratorV2 } = require('./backend/dist/utils/puppeteer-pdf-generator-v2');
const { EnhancedPDFGeneratorBackend } = require('./backend/dist/utils/enhanced-pdf-generator-backend');

// Test dáta - rovnaké pre všetky generátory
const testProtocol = {
  id: 'compare-test-' + Date.now(),
  rentalId: 'rental-compare-123',
  type: 'handover',
  status: 'completed',
  createdAt: new Date(),
  completedAt: new Date(),
  location: 'Bratislava Porovnanie',
  vehicleCondition: {
    odometer: 25000,
    fuelLevel: 75,
    fuelType: 'diesel',
    exteriorCondition: 'Výborný',
    interiorCondition: 'Veľmi dobrý',
    notes: 'Vozidlo s kompletnou históriou servisu. Malé opotrebenie na sedadlách vodiča. Všetky funkcie fungujú perfektne.'
  },
  vehicleImages: [
    {
      id: 'compare-img1',
      url: 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Predný+pohľad+🚗',
      type: 'vehicle',
      description: 'Predný pohľad na vozidlo',
      timestamp: new Date().toISOString()
    },
    {
      id: 'compare-img2', 
      url: 'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Zadný+pohľad+🚙',
      type: 'vehicle',
      description: 'Zadný pohľad na vozidlo',
      timestamp: new Date().toISOString()
    },
    {
      id: 'compare-img3', 
      url: 'https://via.placeholder.com/400x300/45B7D1/FFFFFF?text=Interiér+🪑',
      type: 'vehicle',
      description: 'Interiér vozidla',
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
      id: 'compare-sig1',
      signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      signerName: 'Ing. Peter Novák',
      signerRole: 'employee',
      timestamp: new Date().toISOString(),
      location: 'Bratislava Porovnanie',
      ipAddress: '192.168.1.100'
    },
    {
      id: 'compare-sig2',
      signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      signerName: 'Mgr. Anna Kováčová',
      signerRole: 'customer',
      timestamp: new Date().toISOString(),
      location: 'Bratislava Porovnanie',
      ipAddress: '192.168.1.101'
    }
  ],
  rentalData: {
    orderNumber: 'COMPARE-2025-001',
    vehicle: {
      id: 'vehicle-compare-123',
      brand: 'Mercedes-Benz',
      model: 'E-Class',
      licensePlate: 'BA456COMPARE',
      company: 'Luxury Cars Slovakia',
      pricing: [],
      commission: { type: 'percentage', value: 25 },
      status: 'rented'
    },
    customer: {
      id: 'customer-compare-123',
      name: 'Mgr. Anna Kováčová',
      email: 'anna.kovacova@example.sk',
      phone: '+421 905 123 456',
      createdAt: new Date()
    },
    startDate: new Date('2025-01-25'),
    endDate: new Date('2025-02-05'),
    totalPrice: 1250,
    deposit: 300,
    currency: 'EUR',
    allowedKilometers: 2000,
    extraKilometerRate: 0.30
  },
  notes: 'Špeciálna požiadavka zákazníka: Potrebuje vozidlo pre služobnú cestu do Viedne. Požadované zimné pneumatiky a diaľničná známka pre Rakúsko.',
  pdfUrl: null
};

async function compareAllGenerators() {
  console.log('📊 POROVNANIE VŠETKÝCH PDF GENERÁTOROV');
  console.log('=' .repeat(60));
  
  const results = [];
  
  // 1. PUPPETEER V2 GENERÁTOR
  console.log('\n🎭 1. TESTOVANIE PUPPETEER V2 GENERÁTORA...');
  try {
    const puppeteerGen = new PuppeteerPDFGeneratorV2();
    const startTime1 = Date.now();
    const puppeteerPDF = await puppeteerGen.generateHandoverProtocol(testProtocol);
    const endTime1 = Date.now();
    
    const filename1 = `compare-puppeteer-${Date.now()}.pdf`;
    fs.writeFileSync(filename1, puppeteerPDF);
    
    results.push({
      name: 'Puppeteer V2',
      size: puppeteerPDF.length,
      time: endTime1 - startTime1,
      filename: filename1,
      features: ['HTML/CSS', 'Gradienty', 'Tienky', 'Responzívny', 'Diakritika'],
      quality: 5
    });
    
    console.log(`✅ Puppeteer: ${(puppeteerPDF.length / 1024).toFixed(2)} KB, ${endTime1 - startTime1}ms`);
    
  } catch (error) {
    console.error('❌ Puppeteer chyba:', error.message);
    results.push({
      name: 'Puppeteer V2',
      size: 0,
      time: 0,
      filename: null,
      error: error.message,
      quality: 0
    });
  }
  
  // 2. ENHANCED jsPDF GENERÁTOR
  console.log('\n🎨 2. TESTOVANIE ENHANCED jsPDF GENERÁTORA...');
  try {
    const enhancedGen = new EnhancedPDFGeneratorBackend();
    const startTime2 = Date.now();
    const enhancedPDF = await enhancedGen.generateHandoverProtocol(testProtocol);
    const endTime2 = Date.now();
    
    const filename2 = `compare-enhanced-${Date.now()}.pdf`;
    fs.writeFileSync(filename2, enhancedPDF);
    
    results.push({
      name: 'Enhanced jsPDF',
      size: enhancedPDF.length,
      time: endTime2 - startTime2,
      filename: filename2,
      features: ['jsPDF', 'Farby', 'Info boxy', 'Diakritika'],
      quality: 4
    });
    
    console.log(`✅ Enhanced: ${(enhancedPDF.length / 1024).toFixed(2)} KB, ${endTime2 - startTime2}ms`);
    
  } catch (error) {
    console.error('❌ Enhanced chyba:', error.message);
    results.push({
      name: 'Enhanced jsPDF',
      size: 0,
      time: 0,
      filename: null,
      error: error.message,
      quality: 0
    });
  }
  
  // 3. VÝSLEDKY A POROVNANIE
  console.log('\n📊 DETAILNÉ POROVNANIE:');
  console.log('┌─────────────────────┬──────────────┬─────────────┬─────────────┬─────────────┐');
  console.log('│ Generátor           │ Veľkosť      │ Čas         │ Kvalita     │ Súbor       │');
  console.log('├─────────────────────┼──────────────┼─────────────┼─────────────┼─────────────┤');
  
  results.forEach(result => {
    const name = result.name.padEnd(19);
    const size = result.size > 0 ? `${(result.size / 1024).toFixed(2)} KB`.padStart(12) : 'CHYBA'.padStart(12);
    const time = result.time > 0 ? `${result.time}ms`.padStart(11) : 'CHYBA'.padStart(11);
    const quality = '⭐'.repeat(result.quality).padEnd(11);
    const filename = result.filename ? path.basename(result.filename).substring(0, 11) : 'N/A';
    
    console.log(`│ ${name} │ ${size} │ ${time} │ ${quality} │ ${filename.padEnd(11)} │`);
  });
  
  console.log('└─────────────────────┴──────────────┴─────────────┴─────────────┴─────────────┘');
  
  // 4. FUNKCIE A VLASTNOSTI
  console.log('\n🎯 FUNKCIE A VLASTNOSTI:');
  results.forEach(result => {
    if (result.features) {
      console.log(`${result.name}:`);
      console.log(`   • Funkcie: ${result.features.join(', ')}`);
      console.log(`   • Kvalita: ${result.quality}/5 ⭐`);
      if (result.error) {
        console.log(`   • Chyba: ${result.error}`);
      }
      console.log('');
    }
  });
  
  // 5. ODPORÚČANIA
  console.log('💡 ODPORÚČANIA PRE POUŽITIE:');
  console.log('');
  console.log('🎭 PUPPETEER V2:');
  console.log('   ✅ Najlepšia kvalita dizajnu');
  console.log('   ✅ Plná podpora HTML/CSS');
  console.log('   ✅ Profesionálny vzhľad');
  console.log('   ❌ Pomalšie generovanie');
  console.log('   💡 Ideálne pre: Dôležité dokumenty, prezentácie');
  console.log('');
  console.log('🎨 ENHANCED jsPDF:');
  console.log('   ✅ Rýchle generovanie');
  console.log('   ✅ Dobrá kvalita');
  console.log('   ✅ Slovenská diakritika');
  console.log('   ❌ Obmedzené dizajnové možnosti');
  console.log('   💡 Ideálne pre: Každodenné použitie, rýchle protokoly');
  console.log('');
  
  // 6. SÚBORY PRE KONTROLU
  console.log('📁 VYGENEROVANÉ SÚBORY PRE KONTROLU:');
  results.forEach(result => {
    if (result.filename) {
      console.log(`   • ${result.name}: ${result.filename}`);
    }
  });
  
  console.log('\n🎉 POROVNANIE DOKONČENÉ!');
  console.log('📄 Môžeš si teraz otvoriť PDF súbory a porovnať kvalitu.');
}

// Spustenie porovnania
if (require.main === module) {
  compareAllGenerators().catch(console.error);
}

module.exports = { compareAllGenerators }; 