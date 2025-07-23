const { EnhancedPDFGeneratorBackend } = require('./dist/utils/enhanced-pdf-generator-backend');
const fs = require('fs');
const path = require('path');

async function testJsPDFGenerator() {
  try {
    console.log('🧪 Testujem Enhanced jsPDF generátor...');
    
    // Testovací protokol
    const testProtocol = {
      id: 'TEST-JSPDF-001',
      location: 'Bratislava - Hlavná stanica',
      odometer: 125000,
      fuel_level: 75,
      fuel_type: 'Benzín',
      exterior_condition: 'Výborný',
      interior_condition: 'Dobrý',
      notes: 'Testovací protokol pre Enhanced jsPDF generátor',
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
    const generator = new EnhancedPDFGeneratorBackend();
    const pdfBuffer = await generator.generateHandoverProtocol(testProtocol);
    
    // Ulož PDF
    const outputPath = path.join(__dirname, 'test-jspdf-protocol.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log('✅ Enhanced jsPDF test úspešný!');
    console.log(`📄 PDF uložené: ${outputPath}`);
    console.log(`📊 Veľkosť PDF: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('❌ Chyba pri teste Enhanced jsPDF:', error);
    process.exit(1);
  }
}

testJsPDFGenerator();
