const { generateHandoverPDF } = require('./dist/utils/pdf-generator');
const fs = require('fs');
const path = require('path');

async function testPDFGenerators() {
  console.log('🧪 Testujem PDF generátory...\n');
  
  // Testovací protokol
  const testProtocol = {
    id: 'TEST-PDF-001',
    location: 'Bratislava - Hlavná stanica',
    odometer: 125000,
    fuel_level: 75,
    fuel_type: 'Benzín',
    exterior_condition: 'Výborný',
    interior_condition: 'Dobrý',
    notes: 'Testovací protokol pre porovnanie PDF generátorov',
    rental_data: {
      customer: {
        name: 'Ján Testovací',
        phone: '+421 900 123 456',
        email: 'jan.testovaci@example.com'
      },
      vehicle: {
        brand: 'Škoda',
        model: 'Octavia',
        license_plate: 'BA-123-AB',
        year: 2020
      },
      start_date: '2025-01-15',
      end_date: '2025-01-22',
      total_price: 350
    },
    damages: [
      {
        description: 'Malá škrabanca na prednom nárazníku',
        location: 'Predný nárazník - pravá strana',
        severity: 'Nízka'
      }
    ]
  };

  // Test Legacy PDF Generator
  try {
    console.log('📄 1. LEGACY PDF GENERATOR (pdfkit)');
    process.env.PDF_GENERATOR_TYPE = 'legacy';
    
    const legacyPDF = await generateHandoverPDF(testProtocol);
    const legacyPath = path.join(__dirname, 'test-legacy-protocol.pdf');
    fs.writeFileSync(legacyPath, legacyPDF);
    
    console.log(`✅ Legacy PDF úspešné: ${(legacyPDF.length / 1024).toFixed(2)} KB`);
    console.log(`📁 Uložené: ${legacyPath}\n`);
  } catch (error) {
    console.error('❌ Legacy PDF chyba:', error.message, '\n');
  }

  // Test Enhanced jsPDF Generator
  try {
    console.log('📄 2. ENHANCED PDF GENERATOR (jsPDF)');
    process.env.PDF_GENERATOR_TYPE = 'jspdf';
    
    const jsPDF = await generateHandoverPDF(testProtocol);
    const jsPDFPath = path.join(__dirname, 'test-jspdf-protocol.pdf');
    fs.writeFileSync(jsPDFPath, jsPDF);
    
    console.log(`✅ jsPDF úspešné: ${(jsPDF.length / 1024).toFixed(2)} KB`);
    console.log(`📁 Uložené: ${jsPDFPath}\n`);
  } catch (error) {
    console.error('❌ jsPDF chyba:', error.message, '\n');
  }

  // Test Puppeteer Generator (pripravujem)
  try {
    console.log('📄 3. PUPPETEER PDF GENERATOR (najlepší)');
    process.env.PDF_GENERATOR_TYPE = 'puppeteer';
    
    const puppeteerPDF = await generateHandoverPDF(testProtocol);
    const puppeteerPath = path.join(__dirname, 'test-puppeteer-protocol.pdf');
    fs.writeFileSync(puppeteerPath, puppeteerPDF);
    
    console.log(`✅ Puppeteer PDF úspešné: ${(puppeteerPDF.length / 1024).toFixed(2)} KB`);
    console.log(`📁 Uložené: ${puppeteerPath}\n`);
  } catch (error) {
    console.error('❌ Puppeteer PDF chyba:', error.message, '\n');
  }

  console.log('🎯 Testovanie dokončené!');
}

testPDFGenerators();
