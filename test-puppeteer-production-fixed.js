const https = require('https');

const RAILWAY_URL = 'https://blackrent-app-production-4d6f.up.railway.app';

console.log('🧪 Testujem Puppeteer na Railway produkcii (FIXED)...');
console.log(`🌐 URL: ${RAILWAY_URL}`);

// Korektná data štruktúra pre HandoverProtocol
const testData = JSON.stringify({
  id: "test-protocol-123",
  rentalId: "rental-123",
  type: "handover",
  status: "completed",
  createdAt: new Date().toISOString(),
  location: "Railway Test Location",
  vehicleCondition: {
    exterior: {
      front: "Výborný stav",
      rear: "Výborný stav", 
      left: "Výborný stav",
      right: "Výborný stav"
    },
    interior: {
      seats: "Čisté",
      dashboard: "Bez poškodení"
    },
    fuel: {
      level: 100,
      type: "Benzín"
    },
    mileage: 15000
  },
  vehicleImages: [],
  vehicleVideos: [],
  documentImages: [],
  documentVideos: [],
  damageImages: [],
  damageVideos: [],
  damages: [],
  signatures: [],
  rentalData: {
    orderNumber: "BO-2025-RAILWAY",
    vehicle: {
      id: "vehicle-123",
      brand: "BMW",
      model: "X5 Railway Edition",
      licensePlate: "RA-TEST-PH",
      company: "Railway Test Company",
      status: "available"
    },
    customer: {
      id: "customer-123",
      name: "Railway Test Používateľ",
      email: "railway@puppeteer.sk",
      phone: "+421 900 RAILWAY",
      createdAt: new Date().toISOString()
    },
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    totalPrice: 299.99,
    deposit: 500,
    currency: "€"
  },
  createdBy: "railway-test-user",
  notes: "Railway test protokol pre Puppeteer s diakritikoy: áčko éčko íčko óčko účko ľščťžňď ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ"
});

async function testPuppeteerProduction() {
  try {
    // 1. Health check
    console.log('\n1️⃣ Health check...');
    const healthData = await makeRequest('/api/health', 'GET');
    console.log(`   ✅ Server status: ${healthData.status || healthData.success ? 'OK' : 'Error'}`);
    console.log(`   📊 Environment: ${healthData.environment || 'N/A'}`);
    console.log(`   🗄️  Database: ${healthData.database || 'N/A'}`);

    // 2. Test Puppeteer PDF generation
    console.log('\n2️⃣ Puppeteer PDF generácia...');
    
    const pdfResponse = await makeRequest('/api/protocols/handover/generate-pdf', 'POST', testData);
    
    console.log(`   📡 Response status: ${pdfResponse.statusCode}`);
    console.log(`   📋 Content-Type: ${pdfResponse.headers['content-type']}`);
    console.log(`   📄 PDF Size: ${pdfResponse.body.length} bytes`);

    if (pdfResponse.statusCode === 200 && pdfResponse.headers['content-type'] === 'application/pdf') {
      // Save PDF file
      const fs = require('fs');
      const filename = `puppeteer-railway-test-${Date.now()}.pdf`;
      fs.writeFileSync(filename, pdfResponse.body);
      
      console.log(`   ✅ PDF úspešne vygenerované: ${filename}`);
      console.log('\n🎉 PUPPETEER NA RAILWAY FUNGUJE PERFEKTNE!');
      console.log('✅ Production ready s najkvalitnejšími PDF protokolmi');
      
      return true;
    } else {
      console.log(`   ❌ Neočakávaný response: ${pdfResponse.statusCode}`);
      console.log('Response body:', pdfResponse.body.toString());
      return false;
    }

  } catch (error) {
    console.log(`   ❌ Test zlyhal: ${error.message}`);
    return false;
  }
}

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'blackrent-app-production-4d6f.up.railway.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Puppeteer-Test-Client/1.0'
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: res.headers['content-type']?.includes('application/json') 
            ? JSON.parse(body.toString()) 
            : body
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

testPuppeteerProduction()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Kritická chyba:', error.message);
    process.exit(1);
  }); 