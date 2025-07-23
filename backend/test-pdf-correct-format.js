// Nastavenie environment variables pred importom
process.env.PDF_GENERATOR_TYPE = 'legacy';

const { generateHandoverPDF } = require('./dist/utils/pdf-generator');
const fs = require('fs');
const path = require('path');

// Funkcia na reload modulu s novou environment variable
function clearRequireCache() {
  delete require.cache[require.resolve('./dist/utils/pdf-generator')];
}

async function testPDFGenerators() {
  console.log('🧪 Testujem PDF generátory so správnym formátom dát...\n');
  
  // Testovací protokol v správnom formáte pre Legacy generátor
  const testProtocol = {
    id: 'TEST-PDF-001',
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
      notes: 'Testovací protokol pre porovnanie PDF generátorov'
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
    clearRequireCache();
    const { generateHandoverPDF } = require('./dist/utils/pdf-generator');
    
    const legacyPDF = await generateHandoverPDF(testProtocol);
    const legacyPath = path.join(__dirname, 'test-legacy-protocol.pdf');
    fs.writeFileSync(legacyPath, legacyPDF);
    
    console.log(`✅ Legacy PDF úspešné: ${(legacyPDF.length / 1024).toFixed(2)} KB`);
    console.log(`📁 Uložené: ${legacyPath}\n`);
  } catch (error) {
    console.error('❌ Legacy PDF chyba:', error.message);
    console.error('Stack:', error.stack.split('\n')[0], '\n');
  }

  // Test Enhanced jsPDF Generator
  try {
    console.log('📄 2. ENHANCED PDF GENERATOR (jsPDF)');
    process.env.PDF_GENERATOR_TYPE = 'jspdf';
    clearRequireCache();
    const { generateHandoverPDF } = require('./dist/utils/pdf-generator');
    
    const jsPDF = await generateHandoverPDF(testProtocol);
    const jsPDFPath = path.join(__dirname, 'test-jspdf-protocol.pdf');
    fs.writeFileSync(jsPDFPath, jsPDF);
    
    console.log(`✅ jsPDF úspešné: ${(jsPDF.length / 1024).toFixed(2)} KB`);
    console.log(`�� Uložené: ${jsPDFPath}\n`);
  } catch (error) {
    console.error('❌ jsPDF chyba:', error.message);
    console.error('Stack:', error.stack.split('\n')[0], '\n');
  }

  console.log('🎯 Testovanie dokončené!');
}

testPDFGenerators();
