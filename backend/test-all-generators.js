// Nastavenie environment variables pred importom
process.env.PDF_GENERATOR_TYPE = 'legacy';

const { generateHandoverPDF } = require('./dist/utils/pdf-generator');
const fs = require('fs');
const path = require('path');

// Funkcia na reload modulu s novou environment variable
function clearRequireCache() {
  delete require.cache[require.resolve('./dist/utils/pdf-generator')];
}

async function testAllGenerators() {
  console.log('🧪 KOMPLETNÝ TEST VŠETKÝCH PDF GENERÁTOROV\n');
  
  // Testovací protokol v správnom formáte
  const testProtocol = {
    id: 'TEST-ALL-001',
    location: 'Bratislava - Hlavná stanica',
    rentalData: {
      customer: {
        name: 'Ján Testovací',
        phone: '+421 900 123 456',
        email: 'jan.testovaci@example.com'
      },
      vehicle: {
        brand: 'Škoda',
        model: 'Octavia',
        licensePlate: 'BA-123-AB',
        year: 2020
      },
      startDate: '2025-01-15',
      endDate: '2025-01-22',
      totalPrice: 350,
      currency: 'EUR'
    },
    vehicleCondition: {
      odometer: 125000,
      fuelLevel: 75,
      fuelType: 'Benzín',
      exteriorCondition: 'Výborný',
      interiorCondition: 'Dobrý',
      notes: 'Testovací protokol pre všetky PDF generátory - Legacy, Enhanced jsPDF a Puppeteer'
    },
    damages: [
      {
        description: 'Malá škrabanca na prednom nárazníku',
        location: 'Predný nárazník - pravá strana',
        severity: 'Nízka'
      }
    ]
  };

  const results = [];

  // Test 1: Legacy PDF Generator
  try {
    console.log('📄 1. LEGACY PDF GENERATOR (pdfkit)');
    process.env.PDF_GENERATOR_TYPE = 'legacy';
    clearRequireCache();
    const { generateHandoverPDF } = require('./dist/utils/pdf-generator');
    
    const start = Date.now();
    const legacyPDF = await generateHandoverPDF(testProtocol);
    const duration = Date.now() - start;
    
    const legacyPath = path.join(__dirname, 'test-legacy-final.pdf');
    fs.writeFileSync(legacyPath, legacyPDF);
    
    results.push({
      name: 'Legacy (pdfkit)',
      size: `${(legacyPDF.length / 1024).toFixed(2)} KB`,
      time: `${duration}ms`,
      status: '✅ Úspešný',
      path: legacyPath
    });
    
    console.log(`✅ Legacy PDF: ${(legacyPDF.length / 1024).toFixed(2)} KB, ${duration}ms\n`);
  } catch (error) {
    results.push({
      name: 'Legacy (pdfkit)',
      status: '❌ Chyba',
      error: error.message
    });
    console.error('❌ Legacy PDF chyba:', error.message, '\n');
  }

  // Test 2: Enhanced jsPDF Generator
  try {
    console.log('📄 2. ENHANCED PDF GENERATOR (jsPDF)');
    process.env.PDF_GENERATOR_TYPE = 'jspdf';
    clearRequireCache();
    const { generateHandoverPDF } = require('./dist/utils/pdf-generator');
    
    const start = Date.now();
    const jsPDF = await generateHandoverPDF(testProtocol);
    const duration = Date.now() - start;
    
    const jsPDFPath = path.join(__dirname, 'test-jspdf-final.pdf');
    fs.writeFileSync(jsPDFPath, jsPDF);
    
    results.push({
      name: 'Enhanced (jsPDF)',
      size: `${(jsPDF.length / 1024).toFixed(2)} KB`,
      time: `${duration}ms`,
      status: '✅ Úspešný',
      path: jsPDFPath
    });
    
    console.log(`✅ jsPDF: ${(jsPDF.length / 1024).toFixed(2)} KB, ${duration}ms\n`);
  } catch (error) {
    results.push({
      name: 'Enhanced (jsPDF)',
      status: '❌ Chyba',
      error: error.message
    });
    console.error('❌ jsPDF chyba:', error.message, '\n');
  }

  // Test 3: Puppeteer Generator
  try {
    console.log('📄 3. PUPPETEER PDF GENERATOR (najlepší)');
    process.env.PDF_GENERATOR_TYPE = 'puppeteer';
    clearRequireCache();
    const { generateHandoverPDF } = require('./dist/utils/pdf-generator');
    
    const start = Date.now();
    const puppeteerPDF = await generateHandoverPDF(testProtocol);
    const duration = Date.now() - start;
    
    const puppeteerPath = path.join(__dirname, 'test-puppeteer-final.pdf');
    fs.writeFileSync(puppeteerPath, puppeteerPDF);
    
    results.push({
      name: 'Puppeteer (HTML/CSS)',
      size: `${(puppeteerPDF.length / 1024).toFixed(2)} KB`,
      time: `${duration}ms`,
      status: '✅ Úspešný',
      path: puppeteerPath
    });
    
    console.log(`✅ Puppeteer PDF: ${(puppeteerPDF.length / 1024).toFixed(2)} KB, ${duration}ms\n`);
  } catch (error) {
    results.push({
      name: 'Puppeteer (HTML/CSS)',
      status: '❌ Chyba',
      error: error.message
    });
    console.error('❌ Puppeteer PDF chyba:', error.message, '\n');
  }

  // Výsledky
  console.log('🎯 FINÁLNE VÝSLEDKY:');
  console.log('=' .repeat(80));
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.name}: ${result.status}`);
    if (result.size) console.log(`   📊 Veľkosť: ${result.size}, Čas: ${result.time}`);
    if (result.path) console.log(`   📁 Súbor: ${path.basename(result.path)}`);
    if (result.error) console.log(`   ❌ Chyba: ${result.error}`);
    console.log('');
  });

  console.log('🎉 Testovanie dokončené!');
}

testAllGenerators();
