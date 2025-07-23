#!/usr/bin/env node

/**
 * 🎭 LOKÁLNY TEST PUPPETEER GENERÁTORA
 * 
 * Testuje Puppeteer PDF generátor cez lokálny backend
 */

const axios = require('axios');

const LOCAL_URL = 'http://localhost:3001';

console.log('🧪 Testujem Puppeteer na lokálnom serveri...');
console.log(`🌐 URL: ${LOCAL_URL}`);

async function testPuppeteerLocal() {
  try {
    // 1. Health check
    console.log('\n1️⃣ Health check...');
    const healthResponse = await axios.get(`${LOCAL_URL}/api/health`);
    console.log(`   ✅ Server status: ${healthResponse.data.status || healthResponse.data.success ? 'OK' : 'Error'}`);
    console.log(`   📊 Environment: ${healthResponse.data.environment || 'N/A'}`);
    console.log(`   🗄️  Database: ${healthResponse.data.database || 'N/A'}`);

    // 2. Test Puppeteer PDF generation
    console.log('\n2️⃣ Puppeteer PDF generácia...');
    
    const testData = {
      rental: {
        id: 'test-123',
        customer: {
          name: 'Test Používateľ',
          email: 'test@example.com',
          phone: '+421 123 456 789'
        },
        vehicle: {
          brand: 'Škoda',
          model: 'Octavia',
          licensePlate: 'BA-123-AB',
          vin: 'TESTVIN123456789'
        },
        startDate: '2025-07-23',
        endDate: '2025-07-25',
        totalPrice: 150,
        notes: 'Test protokol pre Puppeteer'
      },
      photos: [],
      signatures: {
        customer: null,
        company: null
      }
    };

    const pdfResponse = await axios.post(`${LOCAL_URL}/api/protocols/handover/generate-pdf`, testData, {
      timeout: 30000,
      responseType: 'arraybuffer'
    });

    console.log(`   📡 Response status: ${pdfResponse.status}`);
    console.log(`   📋 Content-Type: ${pdfResponse.headers['content-type']}`);
    console.log(`   📄 PDF Size: ${pdfResponse.data.length} bytes`);

    if (pdfResponse.status === 200 && pdfResponse.headers['content-type'] === 'application/pdf') {
      // Save PDF file
      const fs = require('fs');
      const filename = `puppeteer-test-local-${Date.now()}.pdf`;
      fs.writeFileSync(filename, pdfResponse.data);
      
      console.log(`   ✅ PDF úspešne vygenerované: ${filename}`);
      console.log('\n🎉 PUPPETEER LOKÁLNE FUNGUJE PERFEKTNE!');
      console.log('✅ Môžeme spustiť produkčný test');
      
      return true;
    } else {
      console.log(`   ❌ Neočakávaný response type: ${pdfResponse.headers['content-type']}`);
      return false;
    }

  } catch (error) {
    console.log(`   ❌ Test zlyhal: ${error.response?.status || 'Network Error'}: ${error.response?.data || error.message}`);
    return false;
  }
}

testPuppeteerLocal()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Kritická chyba:', error.message);
    process.exit(1);
  }); 