#!/usr/bin/env node

/**
 * 🎭 TEST PUPPETEER GENERÁTORA V RAILWAY
 * 
 * Testuje Puppeteer PDF generátor cez Railway API
 */

const fs = require('fs');
const path = require('path');

// Railway API endpoint
const RAILWAY_API = 'https://blackrent-beta-2-production.up.railway.app';

// Test data
const testHandoverData = {
  id: 'test-railway-' + Date.now(),
  location: 'Bratislava - Puppeteer Test',
  status: 'completed',
  createdAt: new Date().toISOString(),
  rentalData: {
    id: 'rental-test-123',
    orderNumber: 'BO-2025-PUPTEST',
    customer: {
      id: 'customer-1',
      name: 'Ján Tester Puppeteer',
      email: 'jan.tester@puppeteer.sk',
      phone: '+421900123456',
      address: 'Testovacia 123, Bratislava',
      driverLicense: 'SK123456789'
    },
    vehicle: {
      id: 'vehicle-1',
      brand: 'BMW',
      model: 'X5 Puppeteer Edition',
      year: 2023,
      licensePlate: 'BA-123-PP',
      vin: 'PUPPETEER123456789',
      color: 'Čierna',
      fuelType: 'Benzín',
      transmission: 'Automatická'
    },
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    totalPrice: 299.99,
    deposit: 500.00,
    currency: '€'
  },
  vehicleCondition: {
    exterior: {
      front: 'Výborný stav - Puppeteer test',
      rear: 'Výborný stav - bez škrabancov',
      left: 'Dobrý stav - malé kamienky',
      right: 'Výborný stav',
      roof: 'Výborný stav',
      hood: 'Výborný stav'
    },
    interior: {
      seats: 'Čisté, bez poškodení',
      dashboard: 'Bez škrabancov',
      carpets: 'Čisté',
      electronics: 'Všetko funkčné'
    },
    technical: {
      engine: 'Funguje perfektne',
      brakes: 'V poriadku',
      tires: 'Dobrý stav, 80% profil',
      lights: 'Všetky funkčné',
      fluids: 'Doplnené'
    },
    fuel: {
      level: 100,
      type: 'Benzín 95'
    },
    mileage: 15432
  },
  signatures: {
    customer: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    employee: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  },
  notes: 'Test protokol pre Puppeteer generátor v Railway prostredí. Slovenská diakritika: áčko, éčko, íčko, óčko, účko, ľščťžňď.'
};

async function testPuppeteerInRailway() {
  console.log('🎭 TESTOVANIE PUPPETEER GENERÁTORA V RAILWAY');
  console.log('=' .repeat(50));
  
  try {
    // 1. Test s Enhanced jsPDF (default)
    console.log('\n1️⃣ Test Enhanced jsPDF generátora...');
    const jsPdfResponse = await fetch(`${RAILWAY_API}/api/protocols/handover/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testHandoverData)
    });
    
    if (jsPdfResponse.ok) {
      const jsPdfBuffer = await jsPdfResponse.arrayBuffer();
      const jsPdfFilename = `railway-jspdf-${Date.now()}.pdf`;
      fs.writeFileSync(jsPdfFilename, Buffer.from(jsPdfBuffer));
      console.log(`✅ Enhanced jsPDF: ${jsPdfFilename} (${Math.round(jsPdfBuffer.byteLength/1024)} KB)`);
    } else {
      console.log(`❌ Enhanced jsPDF chyba: ${jsPdfResponse.status}`);
      const errorText = await jsPdfResponse.text();
      console.log('Error details:', errorText);
    }
    
    // 2. Test s Puppeteer generátorom
    console.log('\n2️⃣ Test Puppeteer generátora...');
    const puppeteerResponse = await fetch(`${RAILWAY_API}/api/protocols/handover/generate-pdf?generator=puppeteer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testHandoverData)
    });
    
    if (puppeteerResponse.ok) {
      const puppeteerBuffer = await puppeteerResponse.arrayBuffer();
      const puppeteerFilename = `railway-puppeteer-${Date.now()}.pdf`;
      fs.writeFileSync(puppeteerFilename, Buffer.from(puppeteerBuffer));
      console.log(`✅ Puppeteer: ${puppeteerFilename} (${Math.round(puppeteerBuffer.byteLength/1024)} KB)`);
    } else {
      console.log(`❌ Puppeteer chyba: ${puppeteerResponse.status}`);
      const errorText = await puppeteerResponse.text();
      console.log('Error details:', errorText);
    }
    
    console.log('\n🎯 VÝSLEDOK:');
    console.log('PDF súbory boli vygenerované a uložené lokálne.');
    console.log('Môžeš ich otvoriť príkazom: open railway-*.pdf');
    
  } catch (error) {
    console.error('❌ Chyba pri testovaní:', error);
  }
}

// Spustenie testu
testPuppeteerInRailway(); 