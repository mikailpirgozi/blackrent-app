const { generateHandoverPDF } = require('./dist/utils/pdf-generator');
const fs = require('fs');
const path = require('path');

async function testLegacyGenerator() {
  try {
    console.log('🧪 Testujem Legacy pdfkit generátor...');
    
    // Testovací protokol
    const testProtocol = {
      id: 'TEST-LEGACY-001',
      location: 'Bratislava - Hlavná stanica',
      odometer: 125000,
      fuel_level: 75,
      fuel_type: 'Benzín',
      exterior_condition: 'Výborný',
      interior_condition: 'Dobrý',
      notes: 'Testovací protokol pre Legacy PDF generátor',
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
      }
    };
    
    // Generuj PDF
    const pdfBuffer = await generateHandoverPDF(testProtocol);
    
    // Ulož PDF
    const outputPath = path.join(__dirname, 'test-legacy-protocol.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log('✅ Legacy PDF test úspešný!');
    console.log(`📄 PDF uložené: ${outputPath}`);
    console.log(`📊 Veľkosť PDF: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('❌ Chyba pri teste Legacy PDF:', error);
    process.exit(1);
  }
}

testLegacyGenerator();
